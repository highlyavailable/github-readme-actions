const { paginateSearch, repoFullName } = require('../github');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate } = require('../render');

function buildQuery(username, shared) {
  const parts = [`type:pr`, `is:open`, `review-requested:${username}`];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  return parts.join(' ');
}

const COLUMNS = {
  pr: { header: 'PR', render: (r) => link(r.title, r.html_url) },
  ref: { header: 'Ref', render: (r) => prRef(r.owner, r.repo, r.number) },
  author: { header: 'Author', render: (r) => `@${r.user?.login || 'unknown'}` },
  updated: { header: 'Updated', render: (r, render) => render.date(r.updated_at) },
  created: { header: 'Created', render: (r, render) => render.date(r.created_at) }
};

async function render(ctx) {
  const { octokit, username, shared, render: renderCfg } = ctx;
  const prs = await paginateSearch(octokit, buildQuery(username, shared), {
    sort: 'updated',
    order: 'desc'
  });

  const rows = prs.map((pr) => {
    const full = repoFullName(pr);
    const [owner, repo] = full.split('/');
    return { ...pr, owner, repo };
  });
  const limited = rows.slice(0, shared.maxRows);

  if (limited.length === 0) {
    return { content: emptyState(renderCfg.empty_state || module.exports.defaultEmptyState || "No data."), metadata: { count: 0 } };
  }

  const tag = makeStatusTag(renderCfg.status_labels);
  const renderHelpers = { tag, date: (iso) => formatDate(iso, renderCfg.date_format) };
  const columns = renderCfg.columns || module.exports.defaultColumns;
  const headers = columns.map((c) => COLUMNS[c].header);
  const cells = limited.map((row) => columns.map((c) => COLUMNS[c].render(row, renderHelpers)));

  return {
    content: renderRows({ style: renderCfg.style, headers, rows: cells }),
    metadata: { count: prs.length }
  };
}

module.exports = {
  name: 'review_inbox',
  title: 'Review Inbox',
  defaultStyle: 'table',
  defaultColumns: ['pr', 'ref', 'author', 'updated'],
  defaultEmptyState: 'No pending review requests.',
  availableColumns: COLUMNS,
  render
};
