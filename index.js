const core = require('@actions/core');
const github = require('@actions/github');
const { updateReadme } = require('./src/utils/readme-updater');
const { executePinnedPRsAction } = require('./src/actions/pinned-prs');

/**
 * Get input parameters with defaults
 */
function getInputs() {
  return {
    githubToken: core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN,
    actionType: core.getInput('ACTION_TYPE') || 'pinned_prs',
    username: core.getInput('GH_USERNAME') || github.context.repo.owner,
    targetFile: core.getInput('TARGET_FILE') || 'README.md',
    commitMsg: core.getInput('COMMIT_MSG') || '🚀 Update README with GitHub actions',
    commitName: core.getInput('COMMIT_NAME') || 'github-actions[bot]',
    commitEmail: core.getInput('COMMIT_EMAIL') || '41898282+github-actions[bot]@users.noreply.github.com',
    
    // Pinned PRs specific inputs
    maxLines: parseInt(core.getInput('MAX_LINES') || '5'),
    prState: core.getInput('PR_STATE') || 'all',
    startDate: core.getInput('START_DATE'),
    endDate: core.getInput('END_DATE'),
    blacklist: core.getInput('BLACKLIST'),
    repositories: core.getInput('REPOSITORIES'),
    includeDraft: core.getInput('INCLUDE_DRAFT') === 'true',
    sortBy: core.getInput('SORT_BY') || 'updated'
  };
}



/**
 * Execute the appropriate action based on action type
 */
async function executeAction(octokit, inputs) {
  switch (inputs.actionType) {
    case 'pinned_prs':
      return await executePinnedPRsAction(octokit, inputs);
    
    // Future action types can be added here
    // case 'recent_commits':
    //   return await executeRecentCommitsAction(octokit, inputs);
    // case 'top_repos':
    //   return await executeTopReposAction(octokit, inputs);
    
    default:
      throw new Error(`Unknown action type: ${inputs.actionType}. Supported types: pinned_prs`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const inputs = getInputs();
    
    if (!inputs.githubToken) {
      throw new Error('GITHUB_TOKEN is required');
    }
    
    const octokit = github.getOctokit(inputs.githubToken);
    
    core.info(`Executing action: ${inputs.actionType} for user: ${inputs.username}`);
    
    // Execute the appropriate action
    const result = await executeAction(octokit, inputs);
    
    // Update README with the result
    const updated = await updateReadme(
      result.content,
      result.startComment,
      result.endComment,
      inputs.targetFile,
      inputs
    );
    
    // Set outputs
    core.setOutput('updated', updated);
    core.setOutput('action_type', inputs.actionType);
    
    // Set action-specific outputs
    if (result.metadata) {
      Object.keys(result.metadata).forEach(key => {
        core.setOutput(key, result.metadata[key]);
      });
    }
    
    core.info(`Successfully completed ${inputs.actionType} action`);
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 