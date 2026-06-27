const { paginateSearch, repoFullName } = require('../github');
const { openPrQuery } = require('../query');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate } = require('../render');

// Each candidate costs 2 API calls (PR detail + check runs). Bound the fan-out.
const ENRICH_CAP = 40;

// On API error we return `null` ("unknown"), never an optimistic default — a PR
// whose mergeability or CI we could not verify must not be advertised as ready.
async function fetchHeadShaAndMergeable(octokit, owner, repo, number) {
  try {
    const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number: number });
    return { sha: data.head?.sha || null, mergeable: data.mergeable !== false };
  } catch (e) {
    return { sha: null, mergeable: null };
  }
}

async function fetchChecks(octokit, owner, repo, sha) {
  if (!sha) return { allGreen: null };
  try {
    const { data } = await octokit.rest.checks.listForRef({ owner, repo, ref: sha, per_page: 100 });
    if (data.total_count === 0) return { allGreen: true }; // no CI configured — approval is enough
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
    return { allGreen: null };
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
  const items = await paginateSearch(octokit, openPrQuery(username, shared, ['review:approved']), {
    sort: 'updated',
    order: 'desc'
  });

  const candidates = items
    .map((item) => {
      const [owner, repo] = repoFullName(item).split('/');
      return owner && repo ? { item, owner, repo } : null;
    })
    .filter(Boolean)
    .slice(0, ENRICH_CAP);

  const ready = (
    await Promise.all(
      candidates.map(async ({ item, owner, repo }) => {
        const { sha, mergeable } = await fetchHeadShaAndMergeable(octokit, owner, repo, item.number);
        if (mergeable !== true) return null; // false or unknown — not provably ready
        const { allGreen } = await fetchChecks(octokit, owner, repo, sha);
        if (allGreen !== true) return null; // failing or unverifiable — exclude
        return { ...item, owner, repo };
      })
    )
  ).filter(Boolean);

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
