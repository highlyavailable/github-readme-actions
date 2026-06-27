const { paginateSearch, repoFullName } = require('../github');
const { isoDaysAgo, repoScope } = require('../query');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate, isoDate } = require('../render');

function buildQuery(username, shared, windowDays) {
  const parts = [`type:pr`, `author:${username}`, `is:merged`];
  // windowDays === 0 means "all time" — omit the date filter entirely.
  if (windowDays > 0) parts.push(`merged:>=${isoDaysAgo(windowDays)}`);
  parts.push(...repoScope(shared));
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
  // Use ?? so that 0 (all-time) is preserved rather than coerced to the 90-day default.
  const windowDays = config?.windowDays ?? 90;
  const items = await paginateSearch(octokit, buildQuery(username, shared, windowDays), {
    sort: 'updated',
    order: 'desc'
  });

  if (items.length === 0) {
    const windowLabel = windowDays > 0 ? `in the last ${windowDays} days` : 'ever';
    return {
      content: emptyState(renderCfg.empty_state || `No merged PRs ${windowLabel}.`),
      metadata: { count: 0, window_days: windowDays || null }
    };
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
    metadata: { count: items.length, window_days: windowDays || null }
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
