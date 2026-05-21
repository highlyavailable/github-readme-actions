const fs = require('fs');
const yaml = require('js-yaml');
const core = require('@actions/core');

const KNOWN_STYLES = ['table', 'list', 'compact'];
const KNOWN_DATE_FORMATS = ['relative', 'absolute', 'both'];

const DEFAULT_LABELS = {
  merged: '[merged]',
  open: '[open]',
  closed: '[closed]',
  draft: '[draft]',
  review_requested: '[review-requested]',
  changes_requested: '[changes-requested]',
  approved: '[approved]',
  conflicts: '[conflicts]',
  ci_failing: '[ci:failing]',
  ci_passing: '[ci:passing]',
  ci_pending: '[ci:pending]'
};

function loadFile(filePath) {
  if (!filePath) return {};
  if (!fs.existsSync(filePath)) return {};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = yaml.load(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch (err) {
    core.warning(`Failed to parse config file ${filePath}: ${err.message}`);
    return {};
  }
}

function pickKnown(value, allowed) {
  if (typeof value !== 'string') return null;
  return allowed.includes(value) ? value : null;
}

const KNOWN_VIZ_STYLES = ['mermaid', 'unicode', 'both'];

function mergeDefaults(fileConfig, inlineDefaults) {
  const file = fileConfig.defaults || {};
  return {
    date_format:
      pickKnown(inlineDefaults.date_format, KNOWN_DATE_FORMATS) ||
      pickKnown(file.date_format, KNOWN_DATE_FORMATS) ||
      'relative',
    empty_state:
      inlineDefaults.empty_state || file.empty_state || null,
    status_labels: {
      ...DEFAULT_LABELS,
      ...(file.status_labels || {}),
      ...(inlineDefaults.status_labels || {})
    },
    viz_style:
      pickKnown(inlineDefaults.viz_style, KNOWN_VIZ_STYLES) ||
      pickKnown(file.viz_style, KNOWN_VIZ_STYLES) ||
      'mermaid'
  };
}

function resolveSection(name, defaultsResolved, fileSection, inlineSection, sectionMeta) {
  const file = fileSection || {};
  const inline = inlineSection || {};
  const meta = sectionMeta || {};

  const style =
    pickKnown(inline.style, KNOWN_STYLES) ||
    pickKnown(file.style, KNOWN_STYLES) ||
    meta.defaultStyle ||
    'table';

  let columns = inline.columns || file.columns || meta.defaultColumns || null;
  if (columns && meta.availableColumns) {
    const allowed = Object.keys(meta.availableColumns);
    columns = columns.filter((c) => allowed.includes(c));
    if (columns.length === 0) columns = meta.defaultColumns;
  }

  const empty_state =
    inline.empty_state ||
    file.empty_state ||
    defaultsResolved.empty_state ||
    meta.defaultEmptyState ||
    'No data.';

  const date_format =
    pickKnown(inline.date_format, KNOWN_DATE_FORMATS) ||
    pickKnown(file.date_format, KNOWN_DATE_FORMATS) ||
    defaultsResolved.date_format;

  const status_labels = {
    ...defaultsResolved.status_labels,
    ...(file.status_labels || {}),
    ...(inline.status_labels || {})
  };

  const sort = inline.sort || file.sort || meta.defaultSort || null;

  const viz_style =
    pickKnown(inline.viz_style, KNOWN_VIZ_STYLES) ||
    pickKnown(file.viz_style, KNOWN_VIZ_STYLES) ||
    defaultsResolved.viz_style;

  return {
    style,
    columns,
    empty_state,
    date_format,
    status_labels,
    sort,
    extras: { ...file, ...inline, viz_style }
  };
}

function resolveAll({ fileConfig = {}, inline = {}, sectionMeta = {}, sectionNames }) {
  const defaultsResolved = mergeDefaults(fileConfig, inline.defaults || {});
  const out = {};
  const fileSections = fileConfig.sections || {};
  const inlineSections = inline.sections || {};
  for (const name of sectionNames) {
    out[name] = resolveSection(
      name,
      defaultsResolved,
      fileSections[name],
      inlineSections[name],
      sectionMeta[name] || {}
    );
  }
  return { defaults: defaultsResolved, sections: out };
}

module.exports = {
  KNOWN_STYLES,
  KNOWN_DATE_FORMATS,
  DEFAULT_LABELS,
  loadFile,
  resolveAll,
  resolveSection,
  mergeDefaults
};
