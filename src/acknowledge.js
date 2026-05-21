// Cross-run acknowledge state for checklist-style sections.
//
// When a checkbox in the rendered README is clicked in the GitHub UI, GitHub
// commits the change as `- [x] ...`. On the next dashboard run we parse the
// current README, extract refs that the user has checked, and preserve that
// state across the re-render.
//
// We also embed a hidden fingerprint comment next to the checkbox:
//   - [x] ... <!--ack:fp=ABCD-->
// The fingerprint is a stable hash of the row's underlying "ack-worthy" data
// (e.g. last reply timestamp). If the data changed since the ack, we treat
// the row as un-acknowledged so it re-surfaces in the active list.

const ACK_LINE_REGEX = /^- \[x\][^\n]*?\[`([\w.-]+\/[\w.-]+)#(\d+)`\][^\n]*$/gm;
const FP_REGEX = /<!--ack:fp=([A-Za-z0-9_-]+)-->/;

function ackKey(owner, repo, number) {
  return `${owner}/${repo}#${number}`;
}

function fingerprint(input) {
  // Tiny non-crypto hash; we only need stability across runs for the same input.
  let h = 5381;
  const s = String(input);
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

function parseAcknowledged(sectionContent) {
  const acked = new Map();
  if (!sectionContent) return acked;
  ACK_LINE_REGEX.lastIndex = 0;
  let m;
  while ((m = ACK_LINE_REGEX.exec(sectionContent)) !== null) {
    const ref = `${m[1]}#${m[2]}`;
    const fpMatch = m[0].match(FP_REGEX);
    acked.set(ref, { fingerprint: fpMatch ? fpMatch[1] : null });
  }
  return acked;
}

function isStillAcknowledged(acked, ref, currentFingerprint) {
  const entry = acked.get(ref);
  if (!entry) return false;
  if (!entry.fingerprint) return true; // legacy ack with no fp — trust it
  return entry.fingerprint === currentFingerprint;
}

function checklistLine({ acked, body, fingerprint: fp }) {
  const box = acked ? '- [x]' : '- [ ]';
  return `${box} ${body} <!--ack:fp=${fp}-->`;
}

function renderChecklist({
  heading,
  items, // [{ ref, body, fingerprint }]
  acked, // Map<ref, {fingerprint}>
  emptyState
}) {
  const active = [];
  const ackedItems = [];
  for (const item of items) {
    const isAcked = isStillAcknowledged(acked, item.ref, item.fingerprint);
    const line = checklistLine({ acked: isAcked, body: item.body, fingerprint: item.fingerprint });
    if (isAcked) ackedItems.push(line);
    else active.push(line);
  }

  const headerCount = active.length;
  const ackedCount = ackedItems.length;
  const headerLabel = ackedCount
    ? `${heading} (${headerCount}${headerCount === 0 ? '' : ''}${ackedCount ? ` · ${ackedCount} acknowledged` : ''})`
    : `${heading} (${headerCount})`;

  const out = [`#### ${headerLabel}`, ''];

  if (active.length) {
    out.push(active.join('\n'));
  } else if (ackedCount === 0) {
    out.push(emptyState || '_All clear._');
  } else {
    out.push('_All active items acknowledged._');
  }

  if (ackedItems.length) {
    out.push('');
    out.push(`<details><summary>Acknowledged (${ackedItems.length}) — uncheck to re-surface</summary>`);
    out.push('');
    out.push(ackedItems.join('\n'));
    out.push('');
    out.push('</details>');
  }

  return out.join('\n');
}

module.exports = {
  ackKey,
  fingerprint,
  parseAcknowledged,
  isStillAcknowledged,
  renderChecklist,
  checklistLine
};
