const { execSync } = require('child_process');
const core = require('@actions/core');

function shouldCommit(cfg) {
  return cfg.commit && process.env.GITHUB_ACTIONS === 'true';
}

function commitAndPush(cfg, targetFile) {
  if (!shouldCommit(cfg)) {
    if (cfg.commit) core.info('Skipping commit (not running under GitHub Actions).');
    return;
  }
  try {
    execSync(`git config --local user.email "${cfg.commitEmail}"`);
    execSync(`git config --local user.name "${cfg.commitName}"`);
    execSync(`git add ${JSON.stringify(targetFile)}`);
    execSync(`git diff --cached --quiet || git commit -m ${JSON.stringify(cfg.commitMessage)}`);
    execSync('git push');
    core.info('Pushed dashboard update.');
  } catch (err) {
    core.warning(`Commit/push failed: ${err.message}`);
  }
}

module.exports = { commitAndPush };
