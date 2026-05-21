const { paginateSearch, repoFullName, isPullRequest } = require('../github');
const { link, emptyState, formatDate, renderRows, repoLink } = require('../render');

function isoDaysAgo(days, now = Date.now()) {
  const d = new Date(now - days * 86400000);
  return d.toISOString().slice(0, 10);
}

function buildQuery(username, shared, days) {
  const parts = [`commenter:${username}`, `updated:>=${isoDaysAgo(days)}`];
  for (const repo of shared.repositories || []) parts.push(`repo:${repo}`);
  for (const repo of shared.excludeRepositories || []) parts.push(`-repo:${repo}`);
  return parts.join(' ');
}

function groupByRepo(items) {
  const groups = new Map();
  for (const item of items) {
    const repo = repoFullName(item);
    if (!groups.has(repo)) groups.set(repo, []);
    groups.get(repo).push(item);
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

function renderGrouped(items, maxRows, renderCfg) {
  const grouped = groupByRepo(items);
  const lines = [];
  let remaining = maxRows;
  const showKind = renderCfg.extras.show_kind !== false;
  for (const [repo, repoItems] of grouped) {
    if (remaining <= 0) break;
    const [rOwner, rName] = repo.split('/');
    const repoMark = rOwner && rName ? repoLink(rOwner, rName) : `\`${repo}\``;
    lines.push(`**${repoMark}** — ${repoItems.length} thread${repoItems.length === 1 ? '' : 's'}`);
    const shown = repoItems.slice(0, Math.min(5, remaining));
    for (const item of shown) {
      const kind = showKind ? (isPullRequest(item) ? 'PR' : 'issue') : null;
      const dateStr = formatDate(item.updated_at, renderCfg.date_format);
      const meta = [kind, dateStr].filter(Boolean).join(', ');
      lines.push(`  - ${link(item.title, item.html_url)}${meta ? ` _(${meta})_` : ''}`);
      remaining -= 1;
      if (remaining <= 0) break;
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function renderFlat(items, maxRows, renderCfg) {
  const headers = ['Thread', 'Repo', 'Updated'];
  const rows = items.slice(0, maxRows).map((item) => {
    const repo = repoFullName(item);
    const [rOwner, rName] = repo.split('/');
    const kind = isPullRequest(item) ? 'PR' : 'issue';
    return [
      `${link(item.title, item.html_url)} (${kind})`,
      rOwner && rName ? repoLink(rOwner, rName) : `\`${repo}\``,
      formatDate(item.updated_at, renderCfg.date_format)
    ];
  });
  return renderRows({ style: renderCfg.style, headers, rows });
}

async function render(ctx) {
  const { octokit, username, shared, config, render: renderCfg } = ctx;
  const days = config?.days || 14;
  const items = await paginateSearch(octokit, buildQuery(username, shared, days), {
    sort: 'updated',
    order: 'desc'
  });

  if (items.length === 0) {
    return {
      content: emptyState(renderCfg.empty_state || `No activity in the last ${days} days.`),
      metadata: { count: 0, window_days: days }
    };
  }

  const groupBy = renderCfg.extras.group_by;
  const content =
    groupBy === 'none' || renderCfg.style === 'table'
      ? renderFlat(items, shared.maxRows, renderCfg)
      : renderGrouped(items, shared.maxRows, renderCfg);

  return { content, metadata: { count: items.length, window_days: days } };
}

module.exports = {
  name: 'recent_activity',
  title: 'Recent Activity',
  defaultStyle: 'list',
  defaultColumns: null,
  defaultEmptyState: null,
  availableColumns: {},
  render
};
