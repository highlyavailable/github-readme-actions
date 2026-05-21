const { paginateSearch, repoFullName } = require('../github');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate } = require('../render');

function buildQuery(username, shared) {
  const parts = [`type:pr`, `author:${username}`, `is:open`];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  if (!shared.includeDrafts) parts.push('-draft:true');
  return parts.join(' ');
}

function ciTag(ciStatus, render) {
  if (ciStatus === 'failing') return render.tag('ci_failing');
  if (ciStatus === 'passing') return render.tag('ci_passing');
  if (ciStatus === 'pending') return render.tag('ci_pending');
  return '';
}

const COLUMNS = {
  pr: { header: 'PR', render: (r) => link(r.title, r.html_url) },
  ref: { header: 'Ref', render: (r) => prRef(r.owner, r.repo, r.number) },
  state: {
    header: 'State',
    render: (r, render) => {
      const base = r.draft ? render.tag('draft') : render.tag('open');
      if (r.ciStatus) return `${base} · ${ciTag(r.ciStatus, render)}`;
      return base;
    }
  },
  comments: { header: 'Comments', render: (r) => String(r.comments || 0) },
  updated: { header: 'Updated', render: (r, render) => render.date(r.updated_at) },
  created: { header: 'Created', render: (r, render) => render.date(r.created_at) }
};

async function fetchCiStatus(octokit, owner, repo, number) {
  try {
    const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: number });
    if (!pr.head?.sha) return null;
    const { data: checks } = await octokit.rest.checks.listForRef({
      owner, repo, ref: pr.head.sha, per_page: 100
    });
    if (!checks.total_count) return null;
    const runs = checks.check_runs;
    if (runs.some((c) => c.conclusion === 'failure' || c.conclusion === 'timed_out' || c.conclusion === 'cancelled')) {
      return 'failing';
    }
    if (runs.some((c) => c.status === 'in_progress' || c.status === 'queued')) return 'pending';
    return 'passing';
  } catch (e) {
    return null;
  }
}

const SORTS = {
  updated_desc: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  comments_desc: (a, b) => (b.comments || 0) - (a.comments || 0)
};

async function render(ctx) {
  const { octokit, username, shared, config, render: renderCfg } = ctx;
  const items = await paginateSearch(octokit, buildQuery(username, shared), {
    sort: 'updated',
    order: 'desc'
  });

  const rows = items.map((item) => {
    const full = repoFullName(item);
    const [owner, repo] = full.split('/');
    return { ...item, owner, repo };
  });

  const sort = SORTS[renderCfg.sort] || SORTS.updated_desc;
  rows.sort(sort);

  const limited = rows.slice(0, shared.maxRows);

  // Optional: fetch CI status per PR (opt-in via config.show_ci).
  if (config?.show_ci) {
    await Promise.all(
      limited.map(async (row) => {
        row.ciStatus = await fetchCiStatus(octokit, row.owner, row.repo, row.number);
      })
    );
  }
  if (limited.length === 0) {
    return { content: emptyState(renderCfg.empty_state || module.exports.defaultEmptyState || "No data."), metadata: { count: 0 } };
  }

  const tag = makeStatusTag(renderCfg.status_labels);
  const renderHelpers = {
    tag,
    date: (iso) => formatDate(iso, renderCfg.date_format)
  };
  const columns = renderCfg.columns || module.exports.defaultColumns;
  const headers = columns.map((c) => COLUMNS[c].header);
  const cells = limited.map((row) => columns.map((c) => COLUMNS[c].render(row, renderHelpers)));

  return {
    content: renderRows({ style: renderCfg.style, headers, rows: cells }),
    metadata: { count: items.length }
  };
}

module.exports = {
  name: 'open_prs',
  title: 'Open Pull Requests',
  defaultStyle: 'table',
  defaultColumns: ['pr', 'ref', 'state', 'comments', 'updated'],
  defaultEmptyState: 'No open pull requests.',
  defaultSort: 'updated_desc',
  availableColumns: COLUMNS,
  render
};
