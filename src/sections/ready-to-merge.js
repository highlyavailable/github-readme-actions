const { paginateSearch, repoFullName } = require('../github');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate } = require('../render');

function buildQuery(username, shared) {
  const parts = [`type:pr`, `author:${username}`, `is:open`, `review:approved`];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  if (!shared.includeDrafts) parts.push('-draft:true');
  return parts.join(' ');
}

async function fetchHeadShaAndMergeable(octokit, owner, repo, number) {
  try {
    const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number: number });
    return { sha: data.head?.sha || null, mergeable: data.mergeable !== false };
  } catch (e) {
    return { sha: null, mergeable: true };
  }
}

async function fetchChecks(octokit, owner, repo, sha) {
  if (!sha) return { allGreen: true };
  try {
    const { data } = await octokit.rest.checks.listForRef({ owner, repo, ref: sha, per_page: 100 });
    if (data.total_count === 0) return { allGreen: true };
    const blocking = data.check_runs.filter(
      (c) =>
        c.conclusion === 'failure' ||
        c.conclusion === 'timed_out' ||
        c.conclusion === 'cancelled' ||
        c.status === 'in_progress' ||
        c.status === 'queued'
    );
    return { allGreen: blocking.length === 0 };
  } catch (e) {
    return { allGreen: true };
  }
}

const COLUMNS = {
  pr: { header: 'PR', render: (r) => link(r.title, r.html_url) },
  ref: { header: 'Ref', render: (r) => prRef(r.owner, r.repo, r.number) },
  state: { header: 'Status', render: (r, render) => render.tag('approved') },
  approved_age: { header: 'Approved', render: (r, render) => render.date(r.updated_at) },
  comments: { header: 'Comments', render: (r) => String(r.comments || 0) }
};

async function render(ctx) {
  const { octokit, username, shared, render: renderCfg } = ctx;
  const items = await paginateSearch(octokit, buildQuery(username, shared), {
    sort: 'updated',
    order: 'desc'
  });

  const ready = [];
  for (const item of items) {
    const full = repoFullName(item);
    const [owner, repo] = full.split('/');
    if (!owner || !repo) continue;
    const { sha, mergeable } = await fetchHeadShaAndMergeable(octokit, owner, repo, item.number);
    if (!mergeable) continue;
    const { allGreen } = await fetchChecks(octokit, owner, repo, sha);
    if (!allGreen) continue;
    ready.push({ ...item, owner, repo });
  }

  if (ready.length === 0) {
    return {
      content: emptyState(renderCfg.empty_state || module.exports.defaultEmptyState),
      metadata: { count: 0 }
    };
  }

  const limited = ready.slice(0, shared.maxRows);
  const tag = makeStatusTag(renderCfg.status_labels);
  const renderHelpers = { tag, date: (iso) => formatDate(iso, renderCfg.date_format) };
  const columns = renderCfg.columns || module.exports.defaultColumns;
  const headers = columns.map((c) => COLUMNS[c].header);
  const cells = limited.map((row) => columns.map((c) => COLUMNS[c].render(row, renderHelpers)));

  return {
    content: renderRows({ style: renderCfg.style, headers, rows: cells }),
    metadata: { count: ready.length }
  };
}

module.exports = {
  name: 'ready_to_merge',
  title: 'Ready to Merge',
  defaultStyle: 'table',
  defaultColumns: ['pr', 'ref', 'state', 'comments'],
  defaultEmptyState: 'No PRs ready to merge.',
  availableColumns: COLUMNS,
  render
};
