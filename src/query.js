// Shared GitHub search-query helpers.
//
// Every section needs the same repo-scoping and PR-filter boilerplate. Before,
// each section file carried its own copy of `isoDaysAgo` and a hand-rolled
// `buildQuery` loop — six copies of one, ten of the other, drifting subtly
// apart. This module is the single source of truth for query construction.

function isoDaysAgo(days, now = Date.now()) {
  return new Date(now - days * 86400000).toISOString().slice(0, 10);
}

// `repo:` / `-repo:` qualifiers for the shared allow + deny lists, plus any
// section-specific excludes. Returns an array of query tokens (possibly empty).
function repoScope(shared = {}, sectionExcludes = []) {
  const parts = [];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  const excludes = [
    ...new Set([...(shared.excludeRepositories || []), ...sectionExcludes])
  ];
  for (const repo of excludes) parts.push(`-repo:${repo}`);
  return parts;
}

// The canonical "my open PRs" query, with optional extra qualifiers appended.
// Honours `shared.includeDrafts` so callers never re-implement the draft filter.
function openPrQuery(username, shared = {}, extra = []) {
  const parts = [`type:pr`, `author:${username}`, `is:open`, ...extra];
  parts.push(...repoScope(shared));
  if (!shared.includeDrafts) parts.push('-draft:true');
  return parts.join(' ');
}

module.exports = { isoDaysAgo, repoScope, openPrQuery };
