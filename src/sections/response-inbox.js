const { paginateSearch, repoFullName } = require('../github');
const { openPrQuery } = require('../query');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate, userLink } = require('../render');

// Cap how many candidate PRs we enrich with per-PR comment/review lookups.
// Each candidate costs 3 API calls, so without a bound a user with dozens of
// open PRs would fire hundreds of requests per run only to discard most.
const ENRICH_CAP = 40;

async function lastActivity(octokit, owner, repo, number, username) {
  const [issueComments, reviewComments, reviews] = await Promise.all([
    octokit.rest.issues
      .listComments({ owner, repo, issue_number: number, per_page: 100 })
      .then((r) => r.data)
      .catch(() => []),
    octokit.rest.pulls
      .listReviewComments({ owner, repo, pull_number: number, per_page: 100 })
      .then((r) => r.data)
      .catch(() => []),
    octokit.rest.pulls
      .listReviews({ owner, repo, pull_number: number, per_page: 100 })
      .then((r) => r.data)
      .catch(() => [])
  ]);

  const events = [];
  for (const c of issueComments) events.push({ user: c.user?.login, at: c.created_at });
  for (const c of reviewComments) events.push({ user: c.user?.login, at: c.created_at });
  for (const r of reviews) {
    if (r.submitted_at) events.push({ user: r.user?.login, at: r.submitted_at });
  }
  if (events.length === 0) return null;
  events.sort((a, b) => new Date(b.at) - new Date(a.at));
  const last = events[0];
  return { last, waitingOnUser: last.user && last.user !== username };
}

const COLUMNS = {
  pr: { header: 'PR', render: (r) => link(r.title, r.html_url) },
  ref: { header: 'Ref', render: (r) => prRef(r.owner, r.repo, r.number) },
  last_reply: { header: 'Last reply', render: (r) => userLink(r.lastUser) },
  age: { header: 'Age', render: (r, render) => render.date(r.lastAt) },
  updated: { header: 'Updated', render: (r, render) => render.date(r.updated_at) }
};

async function render(ctx) {
  const { octokit, username, shared, render: renderCfg } = ctx;
  const prs = await paginateSearch(octokit, openPrQuery(username, shared), {
    sort: 'updated',
    order: 'desc'
  });

  // Search already returns most-recently-updated first, so the freshest
  // candidates are at the front — bound the enrichment to the top ENRICH_CAP.
  const candidates = prs
    .map((pr) => {
      const [owner, repo] = repoFullName(pr).split('/');
      return owner && repo ? { pr, owner, repo } : null;
    })
    .filter(Boolean)
    .slice(0, ENRICH_CAP);

  const enriched = (
    await Promise.all(
      candidates.map(async ({ pr, owner, repo }) => {
        const activity = await lastActivity(octokit, owner, repo, pr.number, username);
        if (!activity || !activity.waitingOnUser) return null;
        return { ...pr, owner, repo, lastUser: activity.last.user, lastAt: activity.last.at };
      })
    )
  ).filter(Boolean);

  enriched.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  const limited = enriched.slice(0, shared.maxRows);

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
    metadata: { count: enriched.length }
  };
}

module.exports = {
  name: 'response_inbox',
  title: 'Response Inbox',
  defaultStyle: 'table',
  defaultColumns: ['pr', 'ref', 'last_reply', 'age'],
  defaultEmptyState: 'No threads waiting on a response.',
  availableColumns: COLUMNS,
  render
};
