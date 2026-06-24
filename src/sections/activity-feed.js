const { age, link, repoLink, emptyState, withIcon } = require('../render');

// A chronological feed of public GitHub activity (the Events API), rendered as a
// timeline of "what you did, where, and when". Answers "how active is this
// person" at a glance — comments, reviews, PRs opened/merged, issues, pushes,
// releases — each with a relative timestamp.
//
// Note: the Events API does NOT surface reactions (they are not events), so this
// feed intentionally does not include them. It also only exposes *public*
// activity and is capped by GitHub at ~300 events / ~90 days per user.

// Event types we render by default. Low-signal types (starring, forking, wiki
// edits, membership) are excluded unless explicitly requested via config.types.
const DEFAULT_TYPES = [
  'PullRequestEvent',
  'PullRequestReviewEvent',
  'PullRequestReviewCommentEvent',
  'IssueCommentEvent',
  'IssuesEvent',
  'PushEvent',
  'CommitCommentEvent',
  'ReleaseEvent',
  'CreateEvent'
];

function isoDaysAgo(days, now = Date.now()) {
  return new Date(now - days * 86400000).toISOString();
}

function repoMark(fullName) {
  const [owner, name] = (fullName || '').split('/');
  if (owner && name) return repoLink(owner, name);
  return fullName ? `\`${fullName}\`` : '';
}

function reviewVerb(state) {
  const s = (state || '').toLowerCase();
  if (s === 'approved') return { icon: '✅', verb: 'Approved' };
  if (s === 'changes_requested') return { icon: '🔴', verb: 'Requested changes on' };
  return { icon: '👀', verb: 'Reviewed' };
}

// Translate one raw event into a timeline entry, or null to skip it.
// Returns { icon, verb, target?: {text, url}, repo, at }.
function describe(event) {
  const repo = event.repo?.name || '';
  const at = event.created_at;
  const p = event.payload || {};

  switch (event.type) {
    case 'PullRequestEvent': {
      const pr = p.pull_request || {};
      const ref = `#${p.number ?? pr.number ?? '?'}`;
      let icon = '📤';
      let verb = 'Opened PR';
      if (p.action === 'closed') {
        if (pr.merged) { icon = '🔀'; verb = 'Merged PR'; }
        else { icon = '🚫'; verb = 'Closed PR'; }
      } else if (p.action === 'reopened') {
        icon = '♻️'; verb = 'Reopened PR';
      } else if (p.action !== 'opened') {
        return null; // assigned/labeled/etc. — noise
      }
      return { icon, verb, target: { text: `${ref} ${pr.title || ''}`.trim(), url: pr.html_url }, repo, at };
    }
    case 'PullRequestReviewEvent': {
      const pr = p.pull_request || {};
      const { icon, verb } = reviewVerb(p.review?.state);
      const ref = `#${pr.number ?? '?'}`;
      return { icon, verb, target: { text: `${ref} ${pr.title || ''}`.trim(), url: p.review?.html_url || pr.html_url }, repo, at };
    }
    case 'PullRequestReviewCommentEvent': {
      const pr = p.pull_request || {};
      const ref = `#${pr.number ?? '?'}`;
      return { icon: '💬', verb: 'Commented on PR', target: { text: `${ref} ${pr.title || ''}`.trim(), url: p.comment?.html_url || pr.html_url }, repo, at };
    }
    case 'IssueCommentEvent': {
      if (p.action && p.action !== 'created') return null;
      const issue = p.issue || {};
      const isPr = Boolean(issue.pull_request);
      const ref = `#${issue.number ?? '?'}`;
      return { icon: '💬', verb: `Commented on ${isPr ? 'PR' : 'issue'}`, target: { text: `${ref} ${issue.title || ''}`.trim(), url: p.comment?.html_url || issue.html_url }, repo, at };
    }
    case 'IssuesEvent': {
      const issue = p.issue || {};
      const ref = `#${issue.number ?? '?'}`;
      let icon = '🐛';
      let verb = 'Opened issue';
      if (p.action === 'closed') { icon = '✔️'; verb = 'Closed issue'; }
      else if (p.action === 'reopened') { icon = '♻️'; verb = 'Reopened issue'; }
      else if (p.action !== 'opened') return null;
      return { icon, verb, target: { text: `${ref} ${issue.title || ''}`.trim(), url: issue.html_url }, repo, at };
    }
    case 'PushEvent': {
      const n = p.distinct_size ?? (p.commits ? p.commits.length : (p.size || 0));
      const branch = (p.ref || '').replace('refs/heads/', '');
      const where = branch ? ` to \`${branch}\`` : '';
      return { icon: '⬆️', verb: `Pushed ${n} commit${n === 1 ? '' : 's'}${where}`, repo, at };
    }
    case 'CommitCommentEvent':
      return { icon: '💬', verb: 'Commented on a commit', target: { text: 'commit', url: p.comment?.html_url }, repo, at };
    case 'ReleaseEvent': {
      if (p.action && p.action !== 'published') return null;
      const rel = p.release || {};
      return { icon: '🚀', verb: 'Published release', target: { text: rel.name || rel.tag_name || 'release', url: rel.html_url }, repo, at };
    }
    case 'CreateEvent': {
      const t = p.ref_type; // branch | tag | repository
      if (t === 'repository') return { icon: '✨', verb: 'Created repository', repo, at };
      if (t === 'tag') return { icon: '🏷️', verb: `Created tag \`${p.ref}\``, repo, at };
      return null; // branch creation is low-signal
    }
    case 'ForkEvent':
      return { icon: '🍴', verb: 'Forked', repo, at };
    case 'WatchEvent':
      return { icon: '⭐', verb: 'Starred', repo, at };
    default:
      return null;
  }
}

function renderLine(entry, dateFn, useIcons = true) {
  const parts = [withIcon(entry.icon, entry.verb, useIcons)];
  if (entry.target && entry.target.url) {
    parts.push(link(entry.target.text || 'link', entry.target.url));
  } else if (entry.target && entry.target.text) {
    parts.push(entry.target.text);
  }
  const repo = repoMark(entry.repo);
  if (repo) parts.push(`in ${repo}`);
  const ts = dateFn(entry.at);
  return `- ${parts.join(' ')}${ts ? ` _(${ts})_` : ''}`;
}

async function fetchEvents(octokit, username, maxPages = 3) {
  const events = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const { data } = await octokit.rest.activity.listPublicEventsForUser({
      username,
      per_page: 100,
      page
    });
    if (!data || !data.length) break;
    events.push(...data);
    if (data.length < 100) break;
  }
  return events;
}

function summarize(entries) {
  const s = { commits: 0, comments: 0, reviews: 0, prs: 0, issues: 0 };
  for (const e of entries) {
    if (e.verb.startsWith('Pushed')) s.commits += e.commits || 1;
    else if (e.verb.includes('Commented')) s.comments += 1;
    else if (/Approved|Reviewed|Requested changes/.test(e.verb)) s.reviews += 1;
    else if (e.verb.includes('PR')) s.prs += 1;
    else if (e.verb.includes('issue')) s.issues += 1;
  }
  return s;
}

async function render(ctx) {
  const { octokit, username, shared, config, render: renderCfg } = ctx;
  const days = config?.days || null;
  const includeTypes = config?.types && config.types.length ? config.types : DEFAULT_TYPES;
  const cutoff = days ? isoDaysAgo(days) : null;

  let raw;
  try {
    raw = await fetchEvents(octokit, username);
  } catch (e) {
    return {
      content: emptyState(renderCfg.empty_state || `Could not load activity (${e.message}).`),
      metadata: { count: 0 }
    };
  }

  const entries = raw
    .filter((ev) => includeTypes.includes(ev.type))
    .filter((ev) => !cutoff || ev.created_at >= cutoff)
    .map(describe)
    .filter(Boolean)
    .sort((a, b) => new Date(b.at) - new Date(a.at));

  if (entries.length === 0) {
    const windowLabel = days ? ` in the last ${days} days` : '';
    return {
      content: emptyState(renderCfg.empty_state || `No public activity${windowLabel}.`),
      metadata: { count: 0, window_days: days }
    };
  }

  const dateFn = (iso) => age(iso);
  const useIcons = renderCfg.theme !== 'minimal';
  const limited = entries.slice(0, shared.maxRows);
  const lines = limited.map((e) => renderLine(e, dateFn, useIcons));

  const summary = summarize(entries);
  return {
    content: lines.join('\n'),
    metadata: {
      count: entries.length,
      shown: limited.length,
      window_days: days,
      commits: summary.commits,
      comments: summary.comments,
      reviews: summary.reviews,
      prs: summary.prs,
      issues: summary.issues
    }
  };
}

module.exports = {
  name: 'activity_feed',
  title: 'Activity Feed',
  defaultStyle: 'list',
  defaultColumns: null,
  defaultEmptyState: 'No public activity.',
  availableColumns: {},
  render,
  // exported for tests
  describe,
  summarize,
  DEFAULT_TYPES
};
