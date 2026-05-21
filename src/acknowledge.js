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
const SNOOZE_REGEX = /<!--snooze:until=(\d{4}-\d{2}-\d{2})-->/;

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
    const snoozeMatch = m[0].match(SNOOZE_REGEX);
    acked.set(ref, {
      fingerprint: fpMatch ? fpMatch[1] : null,
      snoozeUntil: snoozeMatch ? snoozeMatch[1] : null
    });
  }
  return acked;
}

function isSnoozeActive(entry, today = new Date().toISOString().slice(0, 10)) {
  if (!entry || !entry.snoozeUntil) return false;
  return today < entry.snoozeUntil;
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
  acked, // Map<ref, {fingerprint, snoozeUntil}>
  emptyState,
  today = new Date().toISOString().slice(0, 10)
}) {
  const active = [];
  const ackedItems = [];
  const snoozedItems = [];

  for (const item of items) {
    const entry = acked.get(item.ref);
    const isAcked = isStillAcknowledged(acked, item.ref, item.fingerprint);
    const isSnoozed = isAcked && isSnoozeActive(entry, today);

    if (isSnoozed) {
      const body = `${item.body} _(until ${entry.snoozeUntil})_`;
      snoozedItems.push(
        `- [x] ${body} <!--ack:fp=${item.fingerprint}--><!--snooze:until=${entry.snoozeUntil}-->`
      );
    } else if (isAcked) {
      ackedItems.push(checklistLine({ acked: true, body: item.body, fingerprint: item.fingerprint }));
    } else {
      active.push(checklistLine({ acked: false, body: item.body, fingerprint: item.fingerprint }));
    }
  }

  const headerCount = active.length;
  const ackedCount = ackedItems.length;
  const snoozedCount = snoozedItems.length;
  const sub = [];
  if (ackedCount) sub.push(`${ackedCount} acknowledged`);
  if (snoozedCount) sub.push(`${snoozedCount} snoozed`);
  const headerLabel = sub.length ? `${heading} (${headerCount} · ${sub.join(' · ')})` : `${heading} (${headerCount})`;

  const out = [`#### ${headerLabel}`, ''];

  if (active.length) {
    out.push(active.join('\n'));
  } else if (ackedCount === 0 && snoozedCount === 0) {
    out.push(emptyState || '_All clear._');
  } else {
    out.push('_All active items handled._');
  }

  if (snoozedItems.length) {
    out.push('');
    out.push(`<details><summary>Snoozed (${snoozedItems.length}) — auto-resurfaces on the date shown</summary>`);
    out.push('');
    out.push(snoozedItems.join('\n'));
    out.push('');
    out.push('</details>');
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
  isSnoozeActive,
  renderChecklist,
  checklistLine
};
