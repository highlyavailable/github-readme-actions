const core = require('@actions/core');

const START_COMMENT = '<!--START_SECTION:github-readme-actions-pinned_prs-->';
const END_COMMENT = '<!--END_SECTION:github-readme-actions-pinned_prs-->';

/**
 * Parse blacklist into array of numbers
 */
function parseBlacklist(blacklist) {
  if (!blacklist) return [];
  return blacklist.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
}

/**
 * Parse repositories list
 */
function parseRepositories(repositories) {
  if (!repositories) return [];
  return repositories.split(',').map(repo => repo.trim()).filter(repo => repo.includes('/'));
}

/**
 * Check if date is within range
 */
function isDateInRange(date, startDate, endDate) {
  const prDate = new Date(date);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  if (start && prDate < start) return false;
  if (end && prDate > end) return false;
  return true;
}



/**
 * Search for all PRs by a user across GitHub using the search API
 */
async function searchAllUserPRs(octokit, username, inputs) {
  try {
    const prs = [];
    let page = 1;
    let hasMore = true;

    // Build search query
    let query = `type:pr author:${username}`;
    
    // Add state filter
    if (inputs.prState === 'merged') {
      query += ' is:merged';
    } else if (inputs.prState === 'open') {
      query += ' is:open';
    } else if (inputs.prState === 'closed') {
      query += ' is:closed is:unmerged';
    }
    
    // Add date filter if specified
    if (inputs.startDate) {
      query += ` created:>=${inputs.startDate}`;
    }
    if (inputs.endDate) {
      query += ` created:<=${inputs.endDate}`;
    }

    core.info(`Searching with query: ${query}`);

    while (hasMore && page <= 10) { // Limit to 10 pages (1000 results) to avoid rate limits
      const response = await octokit.rest.search.issuesAndPullRequests({
        q: query,
        sort: inputs.sortBy === 'created' ? 'created' : 'updated',
        order: 'desc',
        per_page: 100,
        page
      });

      // Convert search results to PR format and add repository info
      const searchPRs = response.data.items.map(item => ({
        pr: {
          ...item,
          merged_at: item.pull_request?.merged_at || null,
          state: item.state,
          draft: item.draft || false,
          user: item.user,
          created_at: item.created_at,
          updated_at: item.updated_at,
          html_url: item.html_url,
          title: item.title,
          body: item.body,
          number: item.number
        },
        repo: item.repository_url.replace('https://api.github.com/repos/', '')
      }));

      prs.push(...searchPRs);
      
      hasMore = response.data.items.length === 100 && response.data.total_count > page * 100;
      page++;
    }

    core.info(`Found ${prs.length} PRs via search API`);
    return prs;
  } catch (error) {
    core.warning(`Failed to search for PRs: ${error.message}`);
    return [];
  }
}

/**
 * Fetch pull requests for a repository
 */
async function getRepositoryPRs(octokit, owner, repo, username, inputs) {
  try {
    const prs = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await octokit.rest.pulls.list({
        owner,
        repo,
        state: inputs.prState === 'all' ? 'all' : inputs.prState,
        sort: inputs.sortBy,
        direction: 'desc',
        per_page: 100,
        page
      });

      // Filter PRs by author
      const userPRs = response.data.filter(pr => pr.user.login === username);
      prs.push(...userPRs);
      
      hasMore = response.data.length === 100;
      page++;
    }

    return prs;
  } catch (error) {
    core.warning(`Failed to fetch PRs for ${owner}/${repo}: ${error.message}`);
    return [];
  }
}

/**
 * Check if PR is merged
 */
function isPRMerged(pr) {
  return pr.merged_at !== null;
}



/**
 * Format PR for display
 */
function formatPR(pr, repoName) {
  const state = isPRMerged(pr) ? '🟢' : pr.state === 'open' ? '🟡' : '🔴';
  const draft = pr.draft ? ' (Draft)' : '';
  
  // Handle issue link - use repoName for search API results, pr.base.repo.full_name for repository API results
  let issueLink = '';
  if (pr.body && pr.body.match(/#(\d+)/)) {
    const issueNumber = pr.body.match(/#(\d+)/)[1];
    const repoFullName = pr.base?.repo?.full_name || repoName;
    issueLink = ` | [Issue #${issueNumber}](https://github.com/${repoFullName}/issues/${issueNumber})`;
  }
  
  return `- ${state} [${pr.title}${draft}](${pr.html_url}) - ${repoName}${issueLink}`;
}

/**
 * Generate PR list content
 */
function generatePRList(prs, maxLines) {
  if (prs.length === 0) {
    return '- No pinned pull requests found.';
  }
  
  const limitedPRs = prs.slice(0, maxLines);
  return limitedPRs.map(({ pr, repo }) => formatPR(pr, repo)).join('\n');
}

/**
 * Execute pinned PRs action
 */
async function executePinnedPRsAction(octokit, inputs) {
  const blacklist = parseBlacklist(inputs.blacklist);
  const targetRepos = parseRepositories(inputs.repositories);
  
  core.info(`Fetching pinned PRs for ${inputs.username}`);
  
  let allPRs = [];
  
  if (targetRepos.length > 0) {
    // Search specific repositories
    core.info(`Searching ${targetRepos.length} specific repositories`);
    const repositories = targetRepos.map(repo => {
      const [owner, name] = repo.split('/');
      return { owner, name };
    });
    
    for (const repo of repositories) {
      const prs = await getRepositoryPRs(octokit, repo.owner, repo.name, inputs.username, inputs);
      allPRs.push(...prs.map(pr => ({ pr, repo: `${repo.owner}/${repo.name}` })));
    }
  } else {
    // Search all PRs across GitHub using search API
    core.info(`Searching all PRs across GitHub for user ${inputs.username}`);
    allPRs = await searchAllUserPRs(octokit, inputs.username, inputs);
  }
  
  core.info(`Found ${allPRs.length} total PRs`);
  
  // Filter PRs (only apply additional filters not already handled by search API)
  const filteredPRs = allPRs.filter(({ pr }) => {
    // Check blacklist
    if (blacklist.includes(pr.number)) return false;
    
    // Check draft status
    if (!inputs.includeDraft && pr.draft) return false;
    
    // Date range and state filtering is already handled by search API when using searchAllUserPRs
    // But we still need to apply them when searching specific repositories
    if (targetRepos.length > 0) {
      if (!isDateInRange(pr.created_at, inputs.startDate, inputs.endDate)) return false;
      
      if (inputs.prState === 'merged' && !isPRMerged(pr)) return false;
      if (inputs.prState === 'open' && pr.state !== 'open') return false;
      if (inputs.prState === 'closed' && (pr.state !== 'closed' || isPRMerged(pr))) return false;
    }
    
    return true;
  });
  
  core.info(`${filteredPRs.length} PRs after filtering`);
  
  // Sort PRs
  filteredPRs.sort((a, b) => {
    const dateA = new Date(a.pr[inputs.sortBy === 'created' ? 'created_at' : 'updated_at']);
    const dateB = new Date(b.pr[inputs.sortBy === 'created' ? 'created_at' : 'updated_at']);
    return dateB - dateA; // Newest first
  });
  
  // Generate content
  const content = generatePRList(filteredPRs, inputs.maxLines);
  
  return {
    content,
    startComment: START_COMMENT,
    endComment: END_COMMENT,
    metadata: {
      prCount: filteredPRs.length,
      totalPRs: allPRs.length
    }
  };
}

module.exports = {
  executePinnedPRsAction,
  START_COMMENT,
  END_COMMENT
}; 