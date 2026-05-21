const core = require('@actions/core');

const { loadConfig, validate } = require('./src/config');
const { createClient } = require('./src/github');
const { get: getSection, REGISTRY } = require('./src/sections');
const { readTarget, applyUpdates, writeIfChanged, extractSectionContent } = require('./src/readme');
const { commitAndPush } = require('./src/git');
const { loadFile, resolveAll } = require('./src/render-config');

function buildSectionMeta(names) {
  const meta = {};
  for (const name of names) {
    const section = REGISTRY[name];
    if (!section) continue;
    meta[name] = {
      defaultStyle: section.defaultStyle,
      defaultColumns: section.defaultColumns,
      defaultEmptyState: section.defaultEmptyState,
      defaultSort: section.defaultSort,
      availableColumns: section.availableColumns
    };
  }
  return meta;
}

async function renderSections(cfg, octokit, originalSource) {
  const updates = [];
  const failed = [];
  const fileConfig = loadFile(cfg.configFile);
  const resolved = resolveAll({
    fileConfig,
    inline: cfg.inlineRender,
    sectionMeta: buildSectionMeta(cfg.sections),
    sectionNames: cfg.sections
  });

  for (const name of cfg.sections) {
    const section = getSection(name);
    if (!section) {
      failed.push(name);
      continue;
    }
    try {
      core.info(`Rendering ${name}`);
      const ctx = {
        octokit,
        username: cfg.username,
        shared: cfg.shared,
        config: cfg.sectionConfig[name] || {},
        render: resolved.sections[name],
        existing: extractSectionContent(originalSource, name)
      };
      const result = await section.render(ctx);
      updates.push({ name, content: result.content, metadata: result.metadata });
      if (result.metadata) {
        for (const [k, v] of Object.entries(result.metadata)) {
          core.setOutput(`${name}_${k}`, v);
        }
      }
    } catch (err) {
      core.warning(`Section ${name} failed: ${err.message}`);
      failed.push(name);
    }
  }
  return { updates, failed };
}

async function main() {
  try {
    const cfg = loadConfig();
    validate(cfg);

    const octokit = createClient(cfg.githubToken);
    core.info(`Building dashboard for ${cfg.username} — sections: ${cfg.sections.join(', ')}`);

    const original = readTarget(cfg.targetFile);
    const { updates, failed } = await renderSections(cfg, octokit, original);

    const { content, rendered, missing } = applyUpdates(original, updates);

    if (missing.length) {
      core.warning(
        `Missing markers in ${cfg.targetFile} for: ${missing.join(', ')}. ` +
          `Add <!--readme-actions:<name>:start--><!--readme-actions:<name>:end--> pairs.`
      );
    }

    const updated = writeIfChanged(cfg.targetFile, original, content);
    core.setOutput('updated', String(updated));
    core.setOutput('sections_rendered', rendered.join(','));
    core.setOutput('sections_failed', failed.concat(missing).join(','));

    if (updated) commitAndPush(cfg, cfg.targetFile);
  } catch (err) {
    core.setFailed(err.message);
  }
}

if (require.main === module) main();

module.exports = { main };
