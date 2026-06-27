const { paginateSearch } = require('../github');
const { renderSparkline, bucketByWeek, weekLabels } = require('../viz');
const { isoDaysAgo, repoScope } = require('../query');
const { emptyState } = require('../render');

function buildQuery(username, shared, weeks) {
  return [
    `type:pr`,
    `author:${username}`,
    `created:>=${isoDaysAgo(weeks * 7)}`,
    ...repoScope(shared)
  ].join(' ');
}

async function render(ctx) {
  const { octokit, username, shared, config, render: renderCfg } = ctx;
  const weeks = config?.weeks || 12;
  const items = await paginateSearch(octokit, buildQuery(username, shared, weeks), {
    sort: 'created',
    order: 'desc'
  });

  if (items.length === 0) {
    return {
      content: emptyState(renderCfg.empty_state || module.exports.defaultEmptyState),
      metadata: { count: 0, weeks }
    };
  }

  const buckets = bucketByWeek(items.map((i) => i.created_at), weeks);
  const labels = weekLabels(weeks);
  const avg = (buckets.reduce((a, b) => a + b, 0) / weeks).toFixed(1);

  const chart = renderSparkline({
    style: renderCfg.extras.viz_style,
    title: `PRs opened per week (last ${weeks} weeks) — avg ${avg}/wk`,
    labels,
    values: buckets,
    yAxisLabel: 'PRs'
  });

  return {
    content: chart,
    metadata: { count: items.length, weeks, average: avg }
  };
}

module.exports = {
  name: 'velocity_chart',
  title: 'Velocity',
  defaultStyle: 'mermaid',
  defaultColumns: null,
  defaultEmptyState: 'No PRs in the velocity window.',
  availableColumns: {},
  render
};
