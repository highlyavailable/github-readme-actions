const github = require('@actions/github');

function createClient(token) {
  return github.getOctokit(token);
}

async function paginateSearch(octokit, query, { sort = 'updated', order = 'desc', maxPages = 10 } = {}) {
  const items = [];
  let page = 1;
  while (page <= maxPages) {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: query,
      sort,
      order,
      per_page: 100,
      page
    });
    items.push(...data.items);
    if (data.items.length < 100) break;
    if (page * 100 >= (data.total_count || 0)) break;
    page += 1;
  }
  return items;
}

function repoFullName(item) {
  if (item.base && item.base.repo && item.base.repo.full_name) {
    return item.base.repo.full_name;
  }
  if (item.repository_url) {
    return item.repository_url.replace('https://api.github.com/repos/', '');
  }
  if (item.repository && item.repository.full_name) {
    return item.repository.full_name;
  }
  return '';
}

function isPullRequest(item) {
  return Boolean(item.pull_request || item.html_url?.includes('/pull/'));
}

function isMerged(item) {
  return Boolean(item.pull_request?.merged_at || item.merged_at);
}

module.exports = {
  createClient,
  paginateSearch,
  repoFullName,
  isPullRequest,
  isMerged
};
