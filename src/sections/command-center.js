const openPrs = require('./open-prs');
const responseInbox = require('./response-inbox');
const reviewInbox = require('./review-inbox');
const stalePrs = require('./stale-prs');
const failingCi = require('./failing-ci');
const readyToMerge = require('./ready-to-merge');
const { paginateSearch, repoFullName } = require('../github');
const { link, prRef, age, userLink } = require('../render');
const { unicodeSparkline, bucketByWeek } = require('../viz');
const { ackKey, fingerprint, parseAcknowledged, renderChecklist } = require('../acknowledge');

const DEFAULT_LAYOUT = [
  'hero',           // blockquote with KPIs + inline sparkline + status pills
  'needs_attention', // unified failing_ci + stale_prs + ready_to_merge
  'open_prs',
  'response_inbox',
  'review_inbox'
];

function subCtx(ctx, maxRows) {
  return { ...ctx, shared: { ...ctx.shared, maxRows } };
}

function isoDaysAgo(days, now = Date.now()) {
  return new Date(now - days * 86400000).toISOString().slice(0, 10);
}

async function fetchWeekStats(ctx) {
  const since = isoDaysAgo(7);
  const username = ctx.username;
  const scope = (ctx.shared.repositories || []).map((r) => ` repo:${r}`).join('') +
    (ctx.shared.excludeRepositories || []).map((r) => ` -repo:${r}`).join('');
  const [opened, merged, reviewed] = await Promise.all([
    ctx.octokit.rest.search.issuesAndPullRequests({
      q: `type:pr author:${username} created:>=${since}${scope}`,
      per_page: 1
    }).then((r) => r.data.total_count || 0).catch(() => 0),
    ctx.octokit.rest.search.issuesAndPullRequests({
      q: `type:pr author:${username} is:merged merged:>=${since}${scope}`,
      per_page: 1
    }).then((r) => r.data.total_count || 0).catch(() => 0),
    ctx.octokit.rest.search.issuesAndPullRequests({
      q: `type:pr reviewed-by:${username} -author:${username} updated:>=${since}${scope}`,
      per_page: 1
    }).then((r) => r.data.total_count || 0).catch(() => 0)
  ]);
  return { opened, merged, reviewed };
}

async function fetchVelocity(ctx, weeks = 12) {
  const items = await paginateSearch(
    ctx.octokit,
    `type:pr author:${ctx.username} created:>=${isoDaysAgo(weeks * 7)}`,
    { sort: 'created', order: 'desc' }
  );
  const buckets = bucketByWeek(items.map((i) => i.created_at), weeks);
  return { buckets, total: items.length, average: (buckets.reduce((a, b) => a + b, 0) / weeks).toFixed(1) };
}

function buildHero(ctx, weekStats, velocity, counts) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const userUrl = `https://github.com/${ctx.username}`;
  const heading = `### Command Center · [\`${ctx.username}\`](${userUrl})`;
  const updated = `_Updated ${now}_`;

  const spark = velocity.buckets.length ? unicodeSparkline(velocity.buckets) : '';
  const kpis = [
    `**This week** ${weekStats.opened} opened · ${weekStats.merged} merged · ${weekStats.reviewed} reviewed`,
    velocity.buckets.length ? `velocity \`${spark}\` ${velocity.average}/wk` : null
  ].filter(Boolean).join(' · ');

  const pillEntries = [
    { icon: '🟢', label: 'ready', value: counts.ready },
    { icon: '🔴', label: 'failing', value: counts.failing },
    { icon: '🟠', label: 'stale', value: counts.stale },
    { icon: '🟡', label: 'awaiting reply', value: counts.awaiting },
    { icon: '🔵', label: 'review requests', value: counts.review }
  ];
  const pills = `**Inbox** ${pillEntries.map((p) => `${p.icon} ${p.value} ${p.label}`).join(' · ')}`;

  const lines = [
    `> ${heading}`,
    `> ${updated}`,
    `>`,
    `> ${kpis}`,
    `>`,
    `> ${pills}`
  ];
  return lines.join('\n');
}

function subsectionBlock(title, count, content) {
  if (!count) return null;
  return `#### ${title} (${count})\n\n${content}`;
}

async function fetchAwaitingReplyItems(ctx, perRows) {
  // Reuse the response_inbox fetch path, but capture the enriched items so
  // we can render them as a checklist (response_inbox.render only returns
  // markdown content).
  const username = ctx.username;
  const scope = (ctx.shared.repositories || []).map((r) => ` repo:${r}`).join('') +
    (ctx.shared.excludeRepositories || []).map((r) => ` -repo:${r}`).join('');
  const prs = await paginateSearch(
    ctx.octokit,
    `type:pr author:${username} is:open${ctx.shared.includeDrafts ? '' : ' -draft:true'}${scope}`,
    { sort: 'updated', order: 'desc' }
  ).catch(() => []);

  const enriched = [];
  for (const pr of prs) {
    const full = repoFullName(pr);
    const [owner, repo] = full.split('/');
    if (!owner || !repo) continue;
    const [issueComments, reviewComments, reviews] = await Promise.all([
      ctx.octokit.rest.issues.listComments({ owner, repo, issue_number: pr.number, per_page: 100 }).then((r) => r.data).catch(() => []),
      ctx.octokit.rest.pulls.listReviewComments({ owner, repo, pull_number: pr.number, per_page: 100 }).then((r) => r.data).catch(() => []),
      ctx.octokit.rest.pulls.listReviews({ owner, repo, pull_number: pr.number, per_page: 100 }).then((r) => r.data).catch(() => [])
    ]);
    const events = [];
    for (const c of issueComments) events.push({ user: c.user?.login, at: c.created_at });
    for (const c of reviewComments) events.push({ user: c.user?.login, at: c.created_at });
    for (const r of reviews) if (r.submitted_at) events.push({ user: r.user?.login, at: r.submitted_at });
    if (events.length === 0) continue;
    events.sort((a, b) => new Date(b.at) - new Date(a.at));
    const last = events[0];
    if (!last.user || last.user === username) continue;
    enriched.push({ pr, owner, repo, lastUser: last.user, lastAt: last.at });
  }
  enriched.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  return enriched.slice(0, perRows);
}

async function render(ctx) {
  const { config, existing } = ctx;
  const layout = config?.layout && config.layout.length ? config.layout : DEFAULT_LAYOUT;
  const perBlockRows = config?.per_block_rows || 5;
  const acked = parseAcknowledged(existing || '');

  // Fetch everything in parallel.
  const [
    weekStats,
    velocity,
    openPrsResult,
    reviewInboxResult,
    readyResult,
    failingResult,
    staleResult,
    awaitingItems
  ] = await Promise.all([
    fetchWeekStats(ctx).catch(() => ({ opened: 0, merged: 0, reviewed: 0 })),
    fetchVelocity(ctx).catch(() => ({ buckets: [], total: 0, average: '0.0' })),
    openPrs.render(subCtx(ctx, perBlockRows)).catch((e) => ({ content: `_error: ${e.message}_`, metadata: { count: 0 } })),
    reviewInbox.render(subCtx(ctx, perBlockRows)).catch((e) => ({ content: `_error: ${e.message}_`, metadata: { count: 0 } })),
    readyToMerge.render(subCtx(ctx, 20)).catch(() => ({ metadata: { count: 0 } })),
    failingCi.render(subCtx(ctx, 20)).catch(() => ({ metadata: { count: 0 } })),
    stalePrs.render(subCtx(ctx, 20)).catch(() => ({ metadata: { count: 0 } })),
    fetchAwaitingReplyItems(ctx, perBlockRows)
  ]);

  // Bridge: also call responseInbox.render so per-section metadata still works,
  // but we'll render our own checklist from awaitingItems.
  const responseInboxResult = await responseInbox.render(subCtx(ctx, perBlockRows))
    .catch((e) => ({ content: `_error: ${e.message}_`, metadata: { count: 0 } }));

  const counts = {
    ready: readyResult.metadata?.count || 0,
    failing: failingResult.metadata?.count || 0,
    stale: staleResult.metadata?.count || 0,
    awaiting: responseInboxResult.metadata?.count || 0,
    review: reviewInboxResult.metadata?.count || 0
  };

  const needsItems = await buildNeedsAttentionItems(
    ctx,
    { failingCount: counts.failing, staleCount: counts.stale, readyCount: counts.ready },
    perBlockRows
  );

  const blocks = [];

  for (const block of layout) {
    if (block === 'hero') {
      blocks.push(buildHero(ctx, weekStats, velocity, counts));
    } else if (block === 'needs_attention') {
      const na = renderNeedsAttentionChecklist(needsItems, acked, perBlockRows);
      if (na) blocks.push(na);
    } else if (block === 'open_prs') {
      const sub = subsectionBlock('Open pull requests', openPrsResult.metadata?.count, openPrsResult.content);
      if (sub) blocks.push(sub);
    } else if (block === 'response_inbox') {
      const aw = renderAwaitingReplyChecklist(awaitingItems, acked);
      if (aw) blocks.push(aw);
    } else if (block === 'review_inbox') {
      const sub = subsectionBlock('Pending review requests', counts.review, reviewInboxResult.content);
      if (sub) blocks.push(sub);
    } else if (block === 'stale_prs') {
      const sub = subsectionBlock('Stale', counts.stale, staleResult.content);
      if (sub) blocks.push(sub);
    } else if (block === 'failing_ci') {
      const sub = subsectionBlock('Failing CI', counts.failing, failingResult.content);
      if (sub) blocks.push(sub);
    } else if (block === 'ready_to_merge') {
      const sub = subsectionBlock('Ready to merge', counts.ready, readyResult.content);
      if (sub) blocks.push(sub);
    }
  }

  if (blocks.length === 0) {
    blocks.push('_No data to render._');
  }

  return {
    content: blocks.join('\n\n'),
    metadata: {
      open_prs_count: openPrsResult.metadata?.count || 0,
      awaiting_reply_count: counts.awaiting,
      review_requests_count: counts.review,
      ready_count: counts.ready,
      failing_count: counts.failing,
      stale_count: counts.stale,
      week_opened: weekStats.opened,
      week_merged: weekStats.merged,
      week_reviewed: weekStats.reviewed,
      acknowledged_count: acked.size
    }
  };
}

// Lightweight search-based fetch for the unified Needs Attention table.
// Reuses the same queries as failing_ci / stale_prs / ready_to_merge but
// returns only enough fields to render the row. We accept some duplicate
// work for a much tighter rendering surface.
async function buildNeedsAttentionItems(ctx, { failingCount, staleCount, readyCount }, perRows) {
  const items = [];

  // We use the section results above for counts; here we re-query for titles
  // and refs to build a single unified table. Cheap relative to per-PR checks.
  const username = ctx.username;
  const scope = (ctx.shared.repositories || []).map((r) => ` repo:${r}`).join('') +
    (ctx.shared.excludeRepositories || []).map((r) => ` -repo:${r}`).join('');

  const queries = [];
  if (readyCount > 0) {
    queries.push({
      tag: 'ready',
      q: `type:pr author:${username} is:open review:approved${scope}`
    });
  }
  if (staleCount > 0) {
    queries.push({
      tag: 'stale',
      q: `type:pr author:${username} is:open updated:<${isoDaysAgo(ctx.config?.stale_days || 14)}${scope}`
    });
  }
  // For failing CI, we re-search the same open-PR set; the why text is generic.
  if (failingCount > 0) {
    queries.push({
      tag: 'failing',
      q: `type:pr author:${username} is:open${scope}`
    });
  }

  const results = await Promise.all(
    queries.map((q) =>
      ctx.octokit.rest.search.issuesAndPullRequests({
        q: q.q,
        sort: q.tag === 'stale' ? 'updated' : 'updated',
        order: q.tag === 'stale' ? 'asc' : 'desc',
        per_page: perRows
      }).then((r) => ({ tag: q.tag, items: r.data.items || [] })).catch(() => ({ tag: q.tag, items: [] }))
    )
  );

  for (const r of results) {
    for (const item of r.items.slice(0, perRows)) {
      const full = repoFullName(item);
      const [owner, repo] = full.split('/');
      items.push({
        tag: r.tag,
        title: item.title,
        url: item.html_url,
        owner,
        repo,
        number: item.number,
        updated_at: item.updated_at
      });
    }
  }
  return items;
}

function renderNeedsAttentionChecklist(items, acked, perRows) {
  if (!items.length) return null;
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const key = ackKey(item.owner, item.repo, item.number);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  const why = (tag, item) => {
    if (tag === 'failing') return `🔴 CI failing`;
    if (tag === 'stale') return `🟠 stale ${age(item.updated_at)}`;
    if (tag === 'ready') return `🟢 ready to merge`;
    return tag;
  };

  const checklistItems = deduped.slice(0, perRows).map((item) => ({
    ref: ackKey(item.owner, item.repo, item.number),
    fingerprint: fingerprint(`${item.tag}|${item.updated_at}`),
    body: `${why(item.tag, item)} — ${link(item.title, item.url)} — ${prRef(item.owner, item.repo, item.number)}`
  }));

  return renderChecklist({
    heading: 'Needs attention',
    items: checklistItems,
    acked,
    emptyState: '_Nothing needs attention._'
  });
}

function renderAwaitingReplyChecklist(items, acked) {
  if (!items.length) return null;
  const checklistItems = items.map(({ pr, owner, repo, lastUser, lastAt }) => ({
    ref: ackKey(owner, repo, pr.number),
    fingerprint: fingerprint(`${lastUser}|${lastAt}`),
    body: `${link(pr.title, pr.html_url)} — ${prRef(owner, repo, pr.number)} — last reply ${userLink(lastUser)} ${age(lastAt)}`
  }));

  return renderChecklist({
    heading: 'Awaiting your reply',
    items: checklistItems,
    acked,
    emptyState: '_No threads waiting on you._'
  });
}

module.exports = {
  name: 'command_center',
  title: 'Command Center',
  defaultStyle: 'composite',
  defaultColumns: null,
  defaultEmptyState: 'No data available.',
  availableColumns: {},
  defaultLayout: DEFAULT_LAYOUT,
  render
};
