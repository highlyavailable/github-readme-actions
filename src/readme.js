const fs = require('fs');
const core = require('@actions/core');

function markersFor(sectionName) {
  return {
    start: `<!--readme-actions:${sectionName}:start-->`,
    end: `<!--readme-actions:${sectionName}:end-->`
  };
}

// Legacy v1 markers — kept for back-compat with pinned_prs.
function legacyMarkersFor(sectionName) {
  return {
    start: `<!--START_SECTION:github-readme-actions-${sectionName}-->`,
    end: `<!--END_SECTION:github-readme-actions-${sectionName}-->`
  };
}

function findSection(source, sectionName) {
  for (const variant of [markersFor(sectionName), legacyMarkersFor(sectionName)]) {
    const startIdx = source.indexOf(variant.start);
    const endIdx = source.indexOf(variant.end);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      return { ...variant, startIdx, endIdx };
    }
  }
  return null;
}

function replaceSection(source, sectionName, content) {
  const match = findSection(source, sectionName);
  if (!match) return { source, replaced: false };
  const before = source.substring(0, match.startIdx + match.start.length);
  const after = source.substring(match.endIdx);
  const next = `${before}\n${content}\n${after}`;
  return { source: next, replaced: true };
}

function applyUpdates(originalSource, updates) {
  let working = originalSource;
  const rendered = [];
  const missing = [];
  for (const { name, content } of updates) {
    const result = replaceSection(working, name, content);
    if (result.replaced) {
      working = result.source;
      rendered.push(name);
    } else {
      missing.push(name);
    }
  }
  return { content: working, rendered, missing };
}

function writeIfChanged(targetFile, originalSource, nextSource) {
  if (originalSource === nextSource) {
    core.info(`No changes to ${targetFile}`);
    return false;
  }
  fs.writeFileSync(targetFile, nextSource);
  core.info(`Updated ${targetFile}`);
  return true;
}

function readTarget(targetFile) {
  return fs.readFileSync(targetFile, 'utf8');
}

module.exports = {
  markersFor,
  legacyMarkersFor,
  findSection,
  replaceSection,
  applyUpdates,
  readTarget,
  writeIfChanged
};
