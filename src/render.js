const { DEFAULT_LABELS } = require('./render-config');

function link(text, url) {
  if (!url) return text;
  return `[${escapeText(text)}](${url})`;
}

function mono(text) {
  return `\`${String(text).replace(/`/g, '\\`')}\``;
}

function makeStatusTag(labels) {
  const merged = { ...DEFAULT_LABELS, ...(labels || {}) };
  return (key) => (key in merged ? merged[key] : `[${key}]`);
}

function statusTag(key) {
  return makeStatusTag()(key);
}

function escapeText(text) {
  return String(text)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function table(headers, rows) {
  if (rows.length === 0) return '';
  const head = `| ${headers.join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows
    .map((row) => `| ${row.map((cell) => cell ?? '').join(' | ')} |`)
    .join('\n');
  return [head, divider, body].join('\n');
}

function bulletList(items) {
  if (items.length === 0) return '';
  return items.map((i) => `- ${i}`).join('\n');
}

function compactList(items) {
  return items.join('\n');
}

function renderRows({ style = 'table', headers = [], rows = [] }) {
  if (rows.length === 0) return '';
  if (style === 'table') {
    return table(headers, rows);
  }
  if (style === 'list') {
    return bulletList(rows.map((row) => row.filter((c) => c !== null && c !== undefined && c !== '').join(' — ')));
  }
  if (style === 'compact') {
    return compactList(rows.map((row) => row.filter((c) => c !== null && c !== undefined && c !== '').join(' · ')));
  }
  return table(headers, rows);
}

function age(fromIso, nowMs = Date.now()) {
  const then = new Date(fromIso).getTime();
  if (!Number.isFinite(then)) return '';
  const sec = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 8) return `${wk}w`;
  const mo = Math.floor(day / 30);
  if (mo < 18) return `${mo}mo`;
  return `${Math.floor(day / 365)}y`;
}

function isoDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatDate(iso, mode = 'relative', nowMs = Date.now()) {
  if (!iso) return '';
  if (mode === 'absolute') return isoDate(iso);
  if (mode === 'both') {
    const rel = age(iso, nowMs);
    const abs = isoDate(iso);
    return rel ? `${abs} (${rel})` : abs;
  }
  return age(iso, nowMs);
}

function prRef(owner, repo, number) {
  return `[\`${owner}/${repo}#${number}\`](https://github.com/${owner}/${repo}/pull/${number})`;
}

function userLink(username) {
  if (!username) return '';
  const u = String(username).replace(/^@/, '');
  return `[@${u}](https://github.com/${u})`;
}

function repoLink(owner, repo) {
  return `[\`${owner}/${repo}\`](https://github.com/${owner}/${repo})`;
}

function emptyState(message) {
  return `_${message}_`;
}

// Prefix `text` with `icon` only when icons are enabled (default theme).
// In the minimal theme this returns the bare text — no emoji, no stray spaces.
function withIcon(icon, text, useIcons = true) {
  if (!useIcons || !icon) return text;
  return `${icon} ${text}`;
}

module.exports = {
  link,
  mono,
  statusTag,
  makeStatusTag,
  table,
  bulletList,
  compactList,
  renderRows,
  age,
  formatDate,
  isoDate,
  prRef,
  userLink,
  repoLink,
  emptyState,
  escapeText,
  withIcon
};
