const fs = require('fs');
const core = require('@actions/core');

/**
 * Update README file with new content between specified comments
 */
async function updateReadme(content, startComment, endComment, targetFile, inputs) {
  const readmeContent = fs.readFileSync(targetFile, 'utf8');
  
  const startIndex = readmeContent.indexOf(startComment);
  const endIndex = readmeContent.indexOf(endComment);
  
  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Could not find ${startComment} and ${endComment} comments in ${targetFile}`);
  }
  
  const before = readmeContent.substring(0, startIndex + startComment.length);
  const after = readmeContent.substring(endIndex);
  
  const newContent = `${before}\n${content}\n${after}`;
  
  // Only update if content has changed
  if (newContent !== readmeContent) {
    fs.writeFileSync(targetFile, newContent);
    
    // Commit changes if in GitHub Actions environment
    if (process.env.GITHUB_ACTIONS) {
      const { execSync } = require('child_process');
      
      execSync(`git config --local user.email "${inputs.commitEmail}"`);
      execSync(`git config --local user.name "${inputs.commitName}"`);
      execSync(`git add ${targetFile}`);
      execSync(`git commit -m "${inputs.commitMsg}" || exit 0`);
      execSync('git push || exit 0');
    }
    
    core.info(`Updated ${targetFile} with new content`);
    return true;
  } else {
    core.info('No changes to commit');
    return false;
  }
}

module.exports = {
  updateReadme
}; 