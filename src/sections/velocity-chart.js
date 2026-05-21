const { paginateSearch } = require('../github');
const { renderSparkline } = require('../viz');
const { emptyState } = require('../render');

function isoDaysAgo(days, now = Date.now()) {
  return new Date(now - days * 86400000).toISOString().slice(0, 10);
}

function buildQuery(username, shared, weeks) {
  const parts = [`type:pr`, `author:${username}`, `created:>=${isoDaysAgo(weeks * 7)}`];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  return parts.join(' ');
}

function bucketWeeks(items, weeks, nowMs = Date.now()) {
  const buckets = new Array(weeks).fill(0);
  const weekMs = 7 * 86400 * 1000;
  const startMs = nowMs - weeks * weekMs;
  for (const item of items) {
    const t = new Date(item.created_at).getTime();
    if (!Number.isFinite(t) || t < startMs || t > nowMs) continue;
    const idx = Math.min(weeks - 1, Math.floor((t - startMs) / weekMs));
    buckets[idx] += 1;
  }
  return buckets;
}

function weekLabels(weeks, nowMs = Date.now()) {
  const out = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const d = new Date(nowMs - i * 7 * 86400 * 1000);
    out.push(d.toISOString().slice(5, 10));
  }
  return out;
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

  const buckets = bucketWeeks(items, weeks);
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
