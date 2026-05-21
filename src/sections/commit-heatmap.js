const core = require('@actions/core');
const { unicodeHeatmap } = require('../viz');
const { emptyState } = require('../render');

// GitHub limits contributionsCollection windows to <= 1 year. Asking for the
// last 365 days without explicit bounds returns the past-year calendar.
const QUERY_FULL_YEAR = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
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

const QUERY_WINDOW = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
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
  try {
    if (months >= 12) {
      const data = await octokit.graphql(QUERY_FULL_YEAR, { login: username });
      if (!data.user) {
        core.warning(`contributionsCollection: user "${username}" not found or not visible to this token.`);
        return null;
      }
      return data.user.contributionsCollection;
    }
    const to = new Date();
    const from = new Date(to.getTime() - months * 30 * 86400 * 1000);
    const data = await octokit.graphql(QUERY_WINDOW, {
      login: username,
      from: from.toISOString(),
      to: to.toISOString()
    });
    if (!data.user) {
      core.warning(`contributionsCollection: user "${username}" not found or not visible to this token.`);
      return null;
    }
    return data.user.contributionsCollection;
  } catch (err) {
    core.warning(
      `contributionsCollection GraphQL call failed: ${err.message}. ` +
        `If using the default GITHUB_TOKEN, this query may be blocked — use a fine-grained PAT (see docs/tokens.md).`
    );
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
      content: emptyState(
        renderCfg.empty_state ||
          'Contributions unavailable. The default GITHUB_TOKEN can\'t query other users via GraphQL — add a fine-grained PAT as `github_token` (see docs/tokens.md).'
      ),
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
