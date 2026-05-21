const { paginateSearch, repoFullName, isMerged } = require('../github');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate } = require('../render');

function buildQuery(username, shared, cfg) {
  const parts = [`type:pr`, `author:${username}`];
  if (cfg.state === 'merged') parts.push('is:merged');
  else if (cfg.state === 'open') parts.push('is:open');
  else if (cfg.state === 'closed') parts.push('is:closed', 'is:unmerged');
  if (cfg.startDate) parts.push(`created:>=${cfg.startDate}`);
  if (cfg.endDate) parts.push(`created:<=${cfg.endDate}`);
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  if (!shared.includeDrafts) parts.push('-draft:true');
  return parts.join(' ');
}

function stateKey(pr) {
  if (isMerged(pr)) return 'merged';
  if (pr.draft) return 'draft';
  if (pr.state === 'open') return 'open';
  return 'closed';
}

const COLUMNS = {
  state: { header: 'State', render: (r, render) => render.tag(r.stateKey) },
  pr: { header: 'PR', render: (r) => link(r.title, r.html_url) },
  ref: { header: 'Ref', render: (r) => prRef(r.owner, r.repo, r.number) },
  updated: { header: 'Updated', render: (r, render) => render.date(r.updated_at) },
  created: { header: 'Created', render: (r, render) => render.date(r.created_at) }
};

async function render(ctx) {
  const { octokit, username, shared, config, render: renderCfg } = ctx;
  const cfg = config || {};
  const sortBy = cfg.sortBy === 'created' ? 'created' : 'updated';
  const items = await paginateSearch(octokit, buildQuery(username, shared, cfg), {
    sort: sortBy,
    order: 'desc'
  });

  const blacklist = new Set(cfg.blacklist || []);
  const filtered = items.filter((pr) => !blacklist.has(pr.number));

  if (filtered.length === 0) {
    return { content: emptyState(renderCfg.empty_state || module.exports.defaultEmptyState || "No data."), metadata: { count: 0, total: items.length } };
  }

  const rows = filtered.slice(0, shared.maxRows).map((pr) => {
    const full = repoFullName(pr);
    const [owner, repo] = full.split('/');
    return { ...pr, owner, repo, stateKey: stateKey(pr) };
  });

  const tag = makeStatusTag(renderCfg.status_labels);
  const renderHelpers = { tag, date: (iso) => formatDate(iso, renderCfg.date_format) };
  const columns = renderCfg.columns || module.exports.defaultColumns;
  const headers = columns.map((c) => COLUMNS[c].header);
  const cells = rows.map((row) => columns.map((c) => COLUMNS[c].render(row, renderHelpers)));

  return {
    content: renderRows({ style: renderCfg.style, headers, rows: cells }),
    metadata: { count: filtered.length, total: items.length }
  };
}

module.exports = {
  name: 'pinned_prs',
  title: 'Pinned Pull Requests',
  defaultStyle: 'list',
  defaultColumns: ['state', 'pr', 'ref'],
  defaultEmptyState: 'No pinned pull requests.',
  availableColumns: COLUMNS,
  render
};
