const { unicodeHeatmap } = require('../viz');
const { emptyState } = require('../render');

const QUERY = `
  query($login: String!, $from: DateTime, $to: DateTime) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalContributions
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
              weekday
            }
          }
        }
      }
    }
  }
`;

async function fetchContributions(octokit, username, months) {
  const to = new Date();
  const from = new Date(to.getTime() - months * 30 * 86400 * 1000);
  try {
    const data = await octokit.graphql(QUERY, {
      login: username,
      from: from.toISOString(),
      to: to.toISOString()
    });
    return data.user?.contributionsCollection || null;
  } catch (err) {
    return null;
  }
}

function toWeeks(calendar) {
  return calendar.weeks.map((week) =>
    week.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      // GitHub returns weekday 0=Sun..6=Sat; convert to 0=Mon..6=Sun for nicer layout.
      weekday: (d.weekday + 6) % 7
    }))
  );
}

async function render(ctx) {
  const { octokit, username, config, render: renderCfg } = ctx;
  const months = config?.months || 12;
  const contributions = await fetchContributions(octokit, username, months);

  if (!contributions || !contributions.contributionCalendar) {
    return {
      content: emptyState(renderCfg.empty_state || 'Contributions data unavailable. Token may lack GraphQL permission.'),
      metadata: { count: 0 }
    };
  }

  const weeks = toWeeks(contributions.contributionCalendar);
  const total = contributions.totalContributions;
  const heatmap = unicodeHeatmap(weeks);

  const content = [
    `**${total.toLocaleString()} contributions** in the last ${months} months`,
    '',
    heatmap
  ].join('\n');

  return {
    content,
    metadata: { count: total, months }
  };
}

module.exports = {
  name: 'commit_heatmap',
  title: 'Contribution Heatmap',
  defaultStyle: 'unicode',
  defaultColumns: null,
  defaultEmptyState: 'No contributions data.',
  availableColumns: {},
  render,
  // exposed for streak.js to reuse the same fetch
  fetchContributions
};
