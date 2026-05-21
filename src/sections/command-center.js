const core = require('@actions/core');
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
  'hero',
  'needs_attention',
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

function buildScope(ctx, extraScope = '') {
  const parts = [];
  for (const r of ctx.shared.repositories || []) parts.push(`repo:${r}`);
  for (const r of ctx.shared.excludeRepositories || []) parts.push(`-repo:${r}`);
  if (extraScope) parts.push(extraScope);
  return parts.length ? ' ' + parts.join(' ') : '';
}

// ---- Token / PAT detection ---------------------------------------------------

async function detectTokenAuthor(ctx) {
  try {
    const { data } = await ctx.octokit.rest.users.getAuthenticated();
    return data?.login || null;
  } catch (e) {
    return null;
  }
}

function buildPatBanner(authLogin, targetLogin) {
  if (!authLogin) return null;
  const isBot = authLogin.endsWith('[bot]') || authLogin === 'github-actions[bot]';
  if (!isBot && authLogin === targetLogin) return null;
  if (!isBot && authLogin !== targetLogin) return null; // PAT belongs to different user, that's OK if intentional
  // Bot token detected.
  return [
    '> [!WARNING]',
    `> Running under \`${authLogin}\` (default \`GITHUB_TOKEN\`). Cross-repo sections will be empty.`,
    '> Provide a fine-grained PAT as `github_token` — see [docs/tokens.md](https://github.com/highlyavailable/github-readme-actions/blob/main/docs/tokens.md).'
  ].join('\n');
}

// ---- KPI fetches -------------------------------------------------------------

async function fetchPeriodStats(ctx, sinceISO, untilISO, extraScope = '') {
  const username = ctx.username;
  const scope = buildScope(ctx, extraScope);
  const range = untilISO ? `${sinceISO}..${untilISO}` : `>=${sinceISO}`;
  const [opened, merged, reviewed] = await Promise.all([
    ctx.octokit.rest.search.issuesAndPullRequests({
      q: `type:pr author:${username} created:${range}${scope}`,
      per_page: 1
    }).then((r) => r.data.total_count || 0).catch(() => 0),
    ctx.octokit.rest.search.issuesAndPullRequests({
      q: `type:pr author:${username} is:merged merged:${range}${scope}`,
      per_page: 1
    }).then((r) => r.data.total_count || 0).catch(() => 0),
    ctx.octokit.rest.search.issuesAndPullRequests({
      q: `type:pr reviewed-by:${username} -author:${username} updated:${range}${scope}`,
      per_page: 1
    }).then((r) => r.data.total_count || 0).catch(() => 0)
  ]);
  return { opened, merged, reviewed };
}

async function fetchVelocity(ctx, weeks = 12, extraScope = '') {
  const items = await paginateSearch(
    ctx.octokit,
    `type:pr author:${ctx.username} created:>=${isoDaysAgo(weeks * 7)}${buildScope(ctx, extraScope)}`,
    { sort: 'created', order: 'desc' }
  );
  const buckets = bucketByWeek(items.map((i) => i.created_at), weeks);
  return {
    buckets,
    total: items.length,
    average: (buckets.reduce((a, b) => a + b, 0) / weeks).toFixed(1),
    items
  };
}

// ---- Today's diff ------------------------------------------------------------

const KPI_PARSE_REGEX =
  /\*\*This week\*\* (\d+) opened · (\d+) merged · (\d+) reviewed/;
const UPDATED_PARSE_REGEX = /_Updated (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) UTC_/;
const INBOX_PARSE_REGEX =
  /🟢 (\d+) ready · 🔴 (\d+) failing · 🟠 (\d+) stale · 🟡 (\d+) awaiting reply · 🔵 (\d+) review/;

function parseExistingSnapshot(existing) {
  if (!existing) return null;
  const kpi = existing.match(KPI_PARSE_REGEX);
  const upd = existing.match(UPDATED_PARSE_REGEX);
  const inbox = existing.match(INBOX_PARSE_REGEX);
  if (!kpi && !inbox) return null;
  return {
    opened: kpi ? +kpi[1] : null,
    merged: kpi ? +kpi[2] : null,
    reviewed: kpi ? +kpi[3] : null,
    ready: inbox ? +inbox[1] : null,
    failing: inbox ? +inbox[2] : null,
    stale: inbox ? +inbox[3] : null,
    awaiting: inbox ? +inbox[4] : null,
    review: inbox ? +inbox[5] : null,
    updatedAt: upd ? new Date(upd[1] + ':00Z').getTime() : null
  };
}

function diffArrow(prev, curr) {
  if (prev === null || prev === undefined) return '';
  const delta = curr - prev;
  if (delta === 0) return ' (=)';
  if (delta > 0) return ` (↑${delta})`;
  return ` (↓${Math.abs(delta)})`;
}

function buildDiffLine(existing, currentStats, currentCounts) {
  const prev = parseExistingSnapshot(existing);
  if (!prev) return null;
  const parts = [];
  if (prev.updatedAt) {
    const dt = age(new Date(prev.updatedAt).toISOString());
    parts.push(`Since last update (${dt} ago)`);
  } else {
    parts.push('Since last update');
  }
  const sub = [];
  const fields = [
    ['opened', currentStats.opened, prev.opened],
    ['merged', currentStats.merged, prev.merged],
    ['awaiting', currentCounts.awaiting, prev.awaiting],
    ['failing', currentCounts.failing, prev.failing]
  ];
  for (const [name, c, p] of fields) {
    if (p === null || p === undefined) continue;
    const d = c - p;
    if (d === 0) continue;
    const arrow = d > 0 ? `+${d}` : `${d}`;
    sub.push(`${arrow} ${name}`);
  }
  if (sub.length === 0) return null;
  return `_${parts.join(' ')}: ${sub.join(', ')}._`;
}

// ---- Aging buckets ----------------------------------------------------------

function computeAging(items) {
  const buckets = { '0–3d': 0, '3–7d': 0, '1–2w': 0, '2w+': 0 };
  const now = Date.now();
  for (const i of items) {
    const ageDays = (now - new Date(i.created_at).getTime()) / 86400000;
    if (ageDays < 3) buckets['0–3d'] += 1;
    else if (ageDays < 7) buckets['3–7d'] += 1;
    else if (ageDays < 14) buckets['1–2w'] += 1;
    else buckets['2w+'] += 1;
  }
  return buckets;
}

function buildAgingLine(items) {
  if (!items.length) return null;
  const b = computeAging(items);
  return `**Aging** 🟢 ${b['0–3d']} 0–3d · 🟡 ${b['3–7d']} 3–7d · 🟠 ${b['1–2w']} 1–2w · 🔴 ${b['2w+']} 2w+`;
}

// ---- Hero --------------------------------------------------------------------

function buildHero({ ctx, weekStats, prevWeekStats, velocity, counts, aging, diffLine, patBanner, orgLabel }) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const userUrl = `https://github.com/${ctx.username}`;
  const tag = orgLabel ? ` · ${orgLabel}` : '';
  const heading = `### Command Center · [\`${ctx.username}\`](${userUrl})${tag}`;
  const updated = `_Updated ${now}_`;

  const spark = velocity.buckets.length ? unicodeSparkline(velocity.buckets) : '';
  const wwOpen = prevWeekStats ? diffArrow(prevWeekStats.opened, weekStats.opened) : '';
  const wwMerge = prevWeekStats ? diffArrow(prevWeekStats.merged, weekStats.merged) : '';
  const wwReview = prevWeekStats ? diffArrow(prevWeekStats.reviewed, weekStats.reviewed) : '';

  const kpis = [
    `**This week** ${weekStats.opened} opened${wwOpen} · ${weekStats.merged} merged${wwMerge} · ${weekStats.reviewed} reviewed${wwReview}`,
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

  const lines = [];
  if (patBanner) {
    lines.push(patBanner, '');
  }
  lines.push(`> ${heading}`, `> ${updated}`, `>`, `> ${kpis}`, `>`, `> ${pills}`);
  if (aging) {
    lines.push(`>`, `> ${aging}`);
  }
  if (diffLine) {
    lines.push(`>`, `> ${diffLine}`);
  }
  return lines.join('\n');
}

// ---- Footer ------------------------------------------------------------------

function buildFooter(ctx) {
  const u = ctx.username;
  const openUrl = `https://github.com/issues?q=type%3Apr+author%3A${u}+is%3Aopen`;
  const reviewUrl = `https://github.com/issues?q=type%3Apr+review-requested%3A${u}+is%3Aopen`;
  return [
    '---',
    `_[View open PRs on GitHub](${openUrl}) · ` +
      `[Review requests](${reviewUrl}) · ` +
      '[Customize this dashboard](https://github.com/highlyavailable/github-readme-actions/blob/main/docs/customization.md)_'
  ].join('\n');
}

// ---- Awaiting reply (with conversation preview) ------------------------------

function trimPreview(body, max = 100) {
  if (!body) return '';
  const flat = String(body).replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max - 1).trimEnd() + '…';
}

async function fetchAwaitingReplyItems(ctx, perRows, extraScope = '') {
  const username = ctx.username;
  const prs = await paginateSearch(
    ctx.octokit,
    `type:pr author:${username} is:open${ctx.shared.includeDrafts ? '' : ' -draft:true'}${buildScope(ctx, extraScope)}`,
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
    for (const c of issueComments) events.push({ user: c.user?.login, at: c.created_at, body: c.body });
    for (const c of reviewComments) events.push({ user: c.user?.login, at: c.created_at, body: c.body });
    for (const r of reviews) if (r.submitted_at) events.push({ user: r.user?.login, at: r.submitted_at, body: r.body });
    if (events.length === 0) continue;
    events.sort((a, b) => new Date(b.at) - new Date(a.at));
    const last = events[0];
    if (!last.user || last.user === username) continue;
    enriched.push({ pr, owner, repo, lastUser: last.user, lastAt: last.at, lastBody: last.body });
  }
  enriched.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  return enriched.slice(0, perRows);
}

// ---- Needs attention --------------------------------------------------------

async function buildNeedsAttentionItems(ctx, { failingCount, staleCount, readyCount }, perRows, extraScope = '') {
  const items = [];
  const username = ctx.username;
  const scope = buildScope(ctx, extraScope);

  const queries = [];
  if (readyCount > 0) {
    queries.push({ tag: 'ready', q: `type:pr author:${username} is:open review:approved${scope}` });
  }
  if (staleCount > 0) {
    queries.push({
      tag: 'stale',
      q: `type:pr author:${username} is:open updated:<${isoDaysAgo(ctx.config?.stale_days || 14)}${scope}`
    });
  }
  if (failingCount > 0) {
    queries.push({ tag: 'failing', q: `type:pr author:${username} is:open${scope}` });
  }

  const results = await Promise.all(
    queries.map((q) =>
      ctx.octokit.rest.search.issuesAndPullRequests({
        q: q.q,
        sort: 'updated',
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
        tag: r.tag, title: item.title, url: item.html_url,
        owner, repo, number: item.number, updated_at: item.updated_at
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
  const checklistItems = items.map(({ pr, owner, repo, lastUser, lastAt, lastBody }) => {
    const preview = trimPreview(lastBody, 100);
    const previewLine = preview ? `<br>&nbsp;&nbsp;_> ${preview}_` : '';
    return {
      ref: ackKey(owner, repo, pr.number),
      fingerprint: fingerprint(`${lastUser}|${lastAt}`),
      body: `${link(pr.title, pr.html_url)} — ${prRef(owner, repo, pr.number)} — ${userLink(lastUser)} ${age(lastAt)}${previewLine}`
    };
  });
  return renderChecklist({
    heading: 'Awaiting your reply',
    items: checklistItems,
    acked,
    emptyState: '_No threads waiting on you._'
  });
}

function subsectionBlock(title, count, content) {
  if (!count) return null;
  return `#### ${title} (${count})\n\n${content}`;
}

// ---- Single command-center group (one user, optional org filter) -----------

async function renderGroup(ctx, { acked, perBlockRows, layout, orgLabel, extraScope, patBanner, prevWeekStats, existing }) {
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
    fetchPeriodStats(ctx, isoDaysAgo(7), null, extraScope).catch(() => ({ opened: 0, merged: 0, reviewed: 0 })),
    fetchVelocity(ctx, 12, extraScope).catch(() => ({ buckets: [], total: 0, average: '0.0', items: [] })),
    openPrs.render(subCtx(ctx, perBlockRows)).catch((e) => ({ content: `_error: ${e.message}_`, metadata: { count: 0 } })),
    reviewInbox.render(subCtx(ctx, perBlockRows)).catch((e) => ({ content: `_error: ${e.message}_`, metadata: { count: 0 } })),
    readyToMerge.render(subCtx(ctx, 20)).catch(() => ({ metadata: { count: 0 } })),
    failingCi.render(subCtx(ctx, 20)).catch(() => ({ metadata: { count: 0 } })),
    stalePrs.render(subCtx(ctx, 20)).catch(() => ({ metadata: { count: 0 } })),
    fetchAwaitingReplyItems(ctx, perBlockRows, extraScope)
  ]);

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
    perBlockRows,
    extraScope
  );

  const aging = velocity.items && velocity.items.length ? buildAgingLine(velocity.items) : null;
  const diffLine = orgLabel ? null : buildDiffLine(existing, weekStats, counts);

  const blocks = [];
  for (const block of layout) {
    if (block === 'hero') {
      blocks.push(buildHero({ ctx, weekStats, prevWeekStats, velocity, counts, aging, diffLine, patBanner, orgLabel }));
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

  return { blocks, counts, weekStats };
}

// ---- Top-level orchestrator -------------------------------------------------

async function render(ctx) {
  const { config, existing } = ctx;
  const layout = config?.layout && config.layout.length ? config.layout : DEFAULT_LAYOUT;
  const perBlockRows = config?.per_block_rows || 5;
  const orgs = config?.orgs || [];
  const acked = parseAcknowledged(existing || '');

  // PAT detection — run once and reuse across org groups.
  let patBanner = null;
  if (!config?.disable_pat_warning) {
    const authLogin = await detectTokenAuthor(ctx);
    patBanner = buildPatBanner(authLogin, ctx.username);
    if (patBanner) core.info(`PAT banner active (token user = ${authLogin}).`);
  }

  // Week-over-week needs the prior week stats.
  const prevWeekStats = await fetchPeriodStats(ctx, isoDaysAgo(14), isoDaysAgo(7)).catch(() => null);

  const allBlocks = [];
  const aggregateMeta = {};

  if (orgs.length === 0) {
    const { blocks, counts, weekStats } = await renderGroup(ctx, {
      acked, perBlockRows, layout, orgLabel: null, extraScope: '',
      patBanner, prevWeekStats, existing
    });
    allBlocks.push(...blocks);
    Object.assign(aggregateMeta, {
      open_prs_count: 0, // populated below by individual sub-fetches if needed
      awaiting_reply_count: counts.awaiting,
      review_requests_count: counts.review,
      ready_count: counts.ready,
      failing_count: counts.failing,
      stale_count: counts.stale,
      week_opened: weekStats.opened,
      week_merged: weekStats.merged,
      week_reviewed: weekStats.reviewed
    });
  } else {
    let firstOrg = true;
    for (const org of orgs) {
      const { blocks, counts } = await renderGroup(ctx, {
        acked, perBlockRows, layout,
        orgLabel: `org [\`${org}\`](https://github.com/${org})`,
        extraScope: `org:${org}`,
        patBanner: firstOrg ? patBanner : null,
        prevWeekStats: null,
        existing
      });
      if (blocks.length) allBlocks.push(...blocks);
      aggregateMeta[`${org}_failing_count`] = counts.failing;
      aggregateMeta[`${org}_stale_count`] = counts.stale;
      aggregateMeta[`${org}_ready_count`] = counts.ready;
      aggregateMeta[`${org}_awaiting_count`] = counts.awaiting;
      firstOrg = false;
    }
  }

  // Always append footer at the very end.
  allBlocks.push(buildFooter(ctx));

  if (allBlocks.length === 1) {
    // Only the footer — nothing rendered.
    allBlocks.unshift('_No data to render._');
  }

  aggregateMeta.acknowledged_count = acked.size;

  return {
    content: allBlocks.join('\n\n'),
    metadata: aggregateMeta
  };
}

module.exports = {
  name: 'command_center',
  title: 'Command Center',
  defaultStyle: 'composite',
  defaultColumns: null,
  defaultEmptyState: 'No data available.',
  availableColumns: {},
  defaultLayout: DEFAULT_LAYOUT,
  render,
  // exported for tests
  parseExistingSnapshot,
  buildDiffLine,
  computeAging,
  trimPreview
};
