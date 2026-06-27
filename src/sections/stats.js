const { isoDaysAgo, repoScope } = require('../query');
const { table, emptyState } = require('../render');

const PERIOD_DAYS = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365
};

async function countQuery(octokit, q) {
  const { data } = await octokit.rest.search.issuesAndPullRequests({
    q,
    per_page: 1
  });
  return data.total_count || 0;
}

async function statsForPeriod(octokit, username, shared, period) {
  const days = PERIOD_DAYS[period];
  if (!days) return null;
  const since = isoDaysAgo(days);
  const scope = repoScope(shared).length ? ' ' + repoScope(shared).join(' ') : '';
  const [opened, merged, reviewed] = await Promise.all([
    countQuery(octokit, `type:pr author:${username} created:>=${since}${scope}`),
    countQuery(octokit, `type:pr author:${username} is:merged merged:>=${since}${scope}`),
    countQuery(octokit, `type:pr reviewed-by:${username} -author:${username} updated:>=${since}${scope}`)
  ]);
  return { period, opened, merged, reviewed };
}

function renderTable(stats) {
  const rows = stats.map((s) => [
    s.period.charAt(0).toUpperCase() + s.period.slice(1),
    String(s.opened),
    String(s.merged),
    String(s.reviewed)
  ]);
  return table(['Period', 'Opened', 'Merged', 'Reviewed'], rows);
}

function renderCompact(stats) {
  return stats
    .map((s) => `**${s.period}**: ${s.opened} opened · ${s.merged} merged · ${s.reviewed} reviewed`)
    .join('  \n');
}

function renderList(stats) {
  return stats
    .map((s) => `- **${s.period}**: ${s.opened} opened, ${s.merged} merged, ${s.reviewed} reviewed`)
    .join('\n');
}

async function render(ctx) {
  const { octokit, username, shared, config, render: renderCfg } = ctx;
  const periods = (config?.periods || ['week', 'month', 'year']).filter((p) => PERIOD_DAYS[p]);

  const stats = (
    await Promise.all(periods.map((period) => statsForPeriod(octokit, username, shared, period)))
  ).filter(Boolean);

  // If every period is all-zero there is no signal — a grid of zeros reads as
  // "broken", so render a single empty-state line instead.
  const hasSignal = stats.some((s) => s.opened || s.merged || s.reviewed);
  if (!hasSignal) {
    return {
      content: emptyState(renderCfg.empty_state || module.exports.defaultEmptyState || 'No activity yet.'),
      metadata: { periods: periods.join(','), empty: true }
    };
  }

  const style = renderCfg.style || 'table';
  let content;
  if (style === 'compact') content = renderCompact(stats);
  else if (style === 'list') content = renderList(stats);
  else content = renderTable(stats);

  return { content, metadata: { periods: periods.join(',') } };
}

module.exports = {
  name: 'stats',
  title: 'Activity Stats',
  defaultStyle: 'table',
  defaultColumns: null,
  defaultEmptyState: 'No activity data.',
  availableColumns: {},
  render
};
