const { paginateSearch, repoFullName } = require('../github');
const { link, prRef, renderRows, emptyState, makeStatusTag, formatDate, userLink } = require('../render');

function buildQuery(username, shared) {
  const parts = [`type:pr`, `author:${username}`, `is:open`];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  if (!shared.includeDrafts) parts.push('-draft:true');
  return parts.join(' ');
}

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
  const prs = await paginateSearch(octokit, buildQuery(username, shared), {
    sort: 'updated',
    order: 'desc'
  });

  const enriched = [];
  for (const pr of prs) {
    const full = repoFullName(pr);
    const [owner, repo] = full.split('/');
    if (!owner || !repo) continue;
    const activity = await lastActivity(octokit, owner, repo, pr.number, username);
    if (!activity || !activity.waitingOnUser) continue;
    enriched.push({ ...pr, owner, repo, lastUser: activity.last.user, lastAt: activity.last.at });
  }
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
