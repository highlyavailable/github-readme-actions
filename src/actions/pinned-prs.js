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
 * Get all repositories for a user
 */
async function getUserRepositories(octokit, username) {
  try {
    const repos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await octokit.rest.repos.listForUser({
        username,
        type: 'all',
        sort: 'updated',
        per_page: 100,
        page
      });

      repos.push(...response.data);
      hasMore = response.data.length === 100;
      page++;
    }

    return repos.map(repo => ({ owner: repo.owner.login, name: repo.name }));
  } catch (error) {
    core.warning(`Failed to fetch repositories for ${username}: ${error.message}`);
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
 * Filter PRs based on criteria
 */
function filterPRs(prs, inputs, blacklist) {
  return prs.filter(pr => {
    // Check blacklist
    if (blacklist.includes(pr.number)) return false;
    
    // Check draft status
    if (!inputs.includeDraft && pr.draft) return false;
    
    // Check date range
    if (!isDateInRange(pr.created_at, inputs.startDate, inputs.endDate)) return false;
    
    // Check state filter
    if (inputs.prState === 'merged' && !isPRMerged(pr)) return false;
    if (inputs.prState === 'open' && pr.state !== 'open') return false;
    if (inputs.prState === 'closed' && (pr.state !== 'closed' || isPRMerged(pr))) return false;
    
    return true;
  });
}

/**
 * Format PR for display
 */
function formatPR(pr, repoName) {
  const state = isPRMerged(pr) ? '🟢' : pr.state === 'open' ? '🟡' : '🔴';
  const draft = pr.draft ? ' (Draft)' : '';
  const issueLink = pr.body && pr.body.match(/#(\d+)/) ? 
    ` | [Issue #${pr.body.match(/#(\d+)/)[1]}](https://github.com/${pr.base.repo.full_name}/issues/${pr.body.match(/#(\d+)/)[1]})` : '';
  
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
  
  // Get repositories to search
  let repositories;
  if (targetRepos.length > 0) {
    repositories = targetRepos.map(repo => {
      const [owner, name] = repo.split('/');
      return { owner, name };
    });
  } else {
    repositories = await getUserRepositories(octokit, inputs.username);
  }
  
  core.info(`Searching ${repositories.length} repositories`);
  
  // Fetch PRs from all repositories
  const allPRs = [];
  for (const repo of repositories) {
    const prs = await getRepositoryPRs(octokit, repo.owner, repo.name, inputs.username, inputs);
    allPRs.push(...prs.map(pr => ({ pr, repo: `${repo.owner}/${repo.name}` })));
  }
  
  core.info(`Found ${allPRs.length} total PRs`);
  
  // Filter PRs
  const filteredPRs = allPRs.filter(({ pr }) => filterPRs([pr], inputs, blacklist).length > 0);
  
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