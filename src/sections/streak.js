const { fetchContributions } = require('./commit-heatmap');
const { emptyState, table } = require('../render');

function flattenDays(calendar) {
  const days = [];
  for (const week of calendar.weeks) {
    for (const d of week.contributionDays) {
      days.push({ date: d.date, count: d.contributionCount });
    }
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

function computeCurrentStreak(days, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const d = days[i];
    if (d.date > today) continue;
    if (d.count > 0) {
      streak += 1;
      continue;
    }
    // A zero on *today* doesn't break the run — the day isn't over yet. Any
    // earlier zero ends the streak.
    if (d.date === today) continue;
    break;
  }
  return streak;
}

function computeLongestStreak(days) {
  let longest = 0;
  let current = 0;
  for (const d of days) {
    if (d.count > 0) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest;
}

function activePercent(days) {
  if (days.length === 0) return 0;
  const active = days.filter((d) => d.count > 0).length;
  return Math.round((active / days.length) * 100);
}

async function render(ctx) {
  const { octokit, username, config, render: renderCfg } = ctx;
  const months = config?.months || 12;
  const contributions = await fetchContributions(octokit, username, months);

  if (!contributions || !contributions.contributionCalendar) {
    return {
      content: emptyState(
        renderCfg.empty_state ||
          'Streak unavailable. Needs GraphQL access — supply a fine-grained PAT as `github_token` (see docs/tokens.md).'
      ),
      metadata: { current: 0, longest: 0 }
    };
  }

  const days = flattenDays(contributions.contributionCalendar);
  const current = computeCurrentStreak(days);
  const longest = computeLongestStreak(days);
  const pct = activePercent(days);
  const total = contributions.totalContributions;

  const style = renderCfg.style || 'compact';
  let content;
  if (style === 'table') {
    content = table(
      ['Metric', 'Value'],
      [
        ['Current streak', `${current} day${current === 1 ? '' : 's'}`],
        ['Longest streak', `${longest} day${longest === 1 ? '' : 's'}`],
        ['Active days', `${pct}% of last ${months} months`],
        ['Total contributions', total.toLocaleString()]
      ]
    );
  } else if (style === 'list') {
    content = [
      `- **Current streak**: ${current} day${current === 1 ? '' : 's'}`,
      `- **Longest streak**: ${longest} day${longest === 1 ? '' : 's'}`,
      `- **Active days**: ${pct}% of last ${months} months`,
      `- **Total contributions**: ${total.toLocaleString()}`
    ].join('\n');
  } else {
    content = `**${current}d** current · **${longest}d** longest · **${pct}%** active days · **${total.toLocaleString()}** contributions (last ${months} months)`;
  }

  return {
    content,
    metadata: { current, longest, active_percent: pct, total }
  };
}

module.exports = {
  name: 'streak',
  title: 'Contribution Streak',
  defaultStyle: 'compact',
  defaultColumns: null,
  defaultEmptyState: 'No streak data.',
  availableColumns: {},
  render
};
