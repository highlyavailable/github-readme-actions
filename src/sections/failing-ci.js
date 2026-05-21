const { paginateSearch, repoFullName } = require('../github');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate } = require('../render');

function buildQuery(username, shared) {
  const parts = [`type:pr`, `author:${username}`, `is:open`];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  if (!shared.includeDrafts) parts.push('-draft:true');
  return parts.join(' ');
}

async function fetchHeadSha(octokit, owner, repo, number) {
  try {
    const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number: number });
    return data.head?.sha || null;
  } catch (e) {
    return null;
  }
}

async function fetchChecks(octokit, owner, repo, sha) {
  if (!sha) return { failing: false, failed: [], total: 0 };
  try {
    const { data } = await octokit.rest.checks.listForRef({ owner, repo, ref: sha, per_page: 100 });
    const failed = data.check_runs.filter((c) => c.conclusion === 'failure' || c.conclusion === 'timed_out' || c.conclusion === 'cancelled');
    return { failing: failed.length > 0, failed, total: data.total_count };
  } catch (e) {
    return { failing: false, failed: [], total: 0 };
  }
}

const COLUMNS = {
  pr: { header: 'PR', render: (r) => link(r.title, r.html_url) },
  ref: { header: 'Ref', render: (r) => prRef(r.owner, r.repo, r.number) },
  failed_checks: { header: 'Failing', render: (r) => `${r.failed.length} check${r.failed.length === 1 ? '' : 's'}` },
  failed_names: {
    header: 'Failing checks',
    render: (r) => r.failed.slice(0, 3).map((c) => `\`${c.name}\``).join(', ') + (r.failed.length > 3 ? ` +${r.failed.length - 3}` : '')
  },
  updated: { header: 'Updated', render: (r, render) => render.date(r.updated_at) },
  state: { header: 'State', render: (r, render) => render.tag('ci_failing') }
};

async function render(ctx) {
  const { octokit, username, shared, render: renderCfg } = ctx;
  const items = await paginateSearch(octokit, buildQuery(username, shared), {
    sort: 'updated',
    order: 'desc'
  });

  const enriched = [];
  for (const item of items) {
    const full = repoFullName(item);
    const [owner, repo] = full.split('/');
    if (!owner || !repo) continue;
    const sha = await fetchHeadSha(octokit, owner, repo, item.number);
    const checks = await fetchChecks(octokit, owner, repo, sha);
    if (!checks.failing) continue;
    enriched.push({ ...item, owner, repo, failed: checks.failed });
  }

  if (enriched.length === 0) {
    return {
      content: emptyState(renderCfg.empty_state || module.exports.defaultEmptyState),
      metadata: { count: 0 }
    };
  }

  const limited = enriched.slice(0, shared.maxRows);
  const tag = makeStatusTag(renderCfg.status_labels);
  const renderHelpers = { tag, date: (iso) => formatDate(iso, renderCfg.date_format) };
  const columns = renderCfg.columns || module.exports.defaultColumns;
  const headers = columns.map((c) => COLUMNS[c].header);
  const cells = limited.map((row) => columns.map((c) => COLUMNS[c].render(row, renderHelpers)));

  return {
    content: renderRows({ style: renderCfg.style, headers, rows: cells }),
    metadata: { count: enriched.length }
  };
}

module.exports = {
  name: 'failing_ci',
  title: 'Failing CI',
  defaultStyle: 'table',
  defaultColumns: ['pr', 'ref', 'failed_names', 'updated'],
  defaultEmptyState: 'No PRs with failing CI.',
  availableColumns: COLUMNS,
  render
};
