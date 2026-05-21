const { paginateSearch, repoFullName } = require('../github');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate, isoDate } = require('../render');

function isoDaysAgo(days, now = Date.now()) {
  const d = new Date(now - days * 86400000);
  return d.toISOString().slice(0, 10);
}

function buildQuery(username, shared, windowDays) {
  const parts = [
    `type:pr`,
    `author:${username}`,
    `is:merged`,
    `merged:>=${isoDaysAgo(windowDays)}`
  ];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  return parts.join(' ');
}

const COLUMNS = {
  pr: { header: 'PR', render: (r) => link(r.title, r.html_url) },
  ref: { header: 'Ref', render: (r) => prRef(r.owner, r.repo, r.number) },
  merged: { header: 'Merged', render: (r, render) => render.date(r.mergedAt) || isoDate(r.mergedAt) },
  merged_date: { header: 'Merged', render: (r) => isoDate(r.mergedAt) },
  created: { header: 'Created', render: (r, render) => render.date(r.created_at) }
};

async function render(ctx) {
  const { octokit, username, shared, config, render: renderCfg } = ctx;
  const windowDays = config?.windowDays || 90;
  const items = await paginateSearch(octokit, buildQuery(username, shared, windowDays), {
    sort: 'updated',
    order: 'desc'
  });

  if (items.length === 0) {
    return { content: emptyState(renderCfg.empty_state || module.exports.defaultEmptyState || "No data."), metadata: { count: 0, window_days: windowDays } };
  }

  const sorted = items
    .map((i) => {
      const full = repoFullName(i);
      const [owner, repo] = full.split('/');
      return { ...i, owner, repo, mergedAt: i.pull_request?.merged_at || i.closed_at };
    })
    .sort((a, b) => new Date(b.mergedAt) - new Date(a.mergedAt));

  const limited = sorted.slice(0, shared.maxRows);
  const tag = makeStatusTag(renderCfg.status_labels);
  const renderHelpers = { tag, date: (iso) => formatDate(iso, renderCfg.date_format) };
  const columns = renderCfg.columns || module.exports.defaultColumns;
  const headers = columns.map((c) => COLUMNS[c].header);
  const cells = limited.map((row) => columns.map((c) => COLUMNS[c].render(row, renderHelpers)));

  return {
    content: renderRows({ style: renderCfg.style, headers, rows: cells }),
    metadata: { count: items.length, window_days: windowDays }
  };
}

module.exports = {
  name: 'merged_prs',
  title: 'Recently Merged',
  defaultStyle: 'table',
  defaultColumns: ['pr', 'ref', 'merged_date'],
  defaultEmptyState: 'No merged PRs in the window.',
  availableColumns: COLUMNS,
  render
};
