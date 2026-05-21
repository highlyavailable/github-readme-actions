const { paginateSearch, repoFullName } = require('../github');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate } = require('../render');

function isoDaysAgo(days, now = Date.now()) {
  return new Date(now - days * 86400000).toISOString().slice(0, 10);
}

function buildQuery(username, shared, staleDays) {
  const parts = [
    `type:pr`,
    `author:${username}`,
    `is:open`,
    `updated:<${isoDaysAgo(staleDays)}`
  ];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  if (!shared.includeDrafts) parts.push('-draft:true');
  return parts.join(' ');
}

const COLUMNS = {
  pr: { header: 'PR', render: (r) => link(r.title, r.html_url) },
  ref: { header: 'Ref', render: (r) => prRef(r.owner, r.repo, r.number) },
  state: {
    header: 'State',
    render: (r, render) => (r.draft ? render.tag('draft') : render.tag('open'))
  },
  updated: { header: 'Last activity', render: (r, render) => render.date(r.updated_at) },
  comments: { header: 'Comments', render: (r) => String(r.comments || 0) },
  created: { header: 'Opened', render: (r, render) => render.date(r.created_at) }
};

async function render(ctx) {
  const { octokit, username, shared, config, render: renderCfg } = ctx;
  const staleDays = config?.staleDays || 14;
  const items = await paginateSearch(octokit, buildQuery(username, shared, staleDays), {
    sort: 'updated',
    order: 'asc'
  });

  if (items.length === 0) {
    return {
      content: emptyState(renderCfg.empty_state || module.exports.defaultEmptyState),
      metadata: { count: 0, stale_days: staleDays }
    };
  }

  const rows = items.slice(0, shared.maxRows).map((item) => {
    const full = repoFullName(item);
    const [owner, repo] = full.split('/');
    return { ...item, owner, repo };
  });

  const tag = makeStatusTag(renderCfg.status_labels);
  const renderHelpers = { tag, date: (iso) => formatDate(iso, renderCfg.date_format) };
  const columns = renderCfg.columns || module.exports.defaultColumns;
  const headers = columns.map((c) => COLUMNS[c].header);
  const cells = rows.map((row) => columns.map((c) => COLUMNS[c].render(row, renderHelpers)));

  return {
    content: renderRows({ style: renderCfg.style, headers, rows: cells }),
    metadata: { count: items.length, stale_days: staleDays }
  };
}

module.exports = {
  name: 'stale_prs',
  title: 'Stale Pull Requests',
  defaultStyle: 'table',
  defaultColumns: ['pr', 'ref', 'updated', 'comments'],
  defaultEmptyState: 'No stale pull requests.',
  availableColumns: COLUMNS,
  render
};
