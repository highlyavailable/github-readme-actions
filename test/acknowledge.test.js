const {
  parseAcknowledged,
  isStillAcknowledged,
  renderChecklist,
  fingerprint,
  ackKey
} = require('../src/acknowledge');

describe('acknowledge', () => {
  test('parseAcknowledged extracts checked refs with fingerprints', () => {
    const content = `
#### Needs attention (1)

- [ ] 🔴 CI failing — [foo](url) — [\`acme/api#100\`](url) <!--ack:fp=abc-->
- [x] 🟠 stale — [bar](url) — [\`acme/api#200\`](url) <!--ack:fp=def-->
- [x] 🟢 ready — [baz](url) — [\`acme/cli#42\`](url)
`;
    const acked = parseAcknowledged(content);
    expect(acked.size).toBe(2);
    expect(acked.get('acme/api#200')).toEqual({ fingerprint: 'def', snoozeUntil: null });
    expect(acked.get('acme/cli#42')).toEqual({ fingerprint: null, snoozeUntil: null });
    expect(acked.has('acme/api#100')).toBe(false);
  });

  test('parseAcknowledged returns empty map for empty input', () => {
    expect(parseAcknowledged('').size).toBe(0);
    expect(parseAcknowledged(null).size).toBe(0);
  });

  test('isStillAcknowledged uses fingerprint comparison', () => {
    const acked = new Map([
      ['a/b#1', { fingerprint: 'xyz' }],
      ['a/b#2', { fingerprint: null }]
    ]);
    expect(isStillAcknowledged(acked, 'a/b#1', 'xyz')).toBe(true);
    expect(isStillAcknowledged(acked, 'a/b#1', 'different')).toBe(false);
    expect(isStillAcknowledged(acked, 'a/b#2', 'anything')).toBe(true);
    expect(isStillAcknowledged(acked, 'a/b#999', 'xyz')).toBe(false);
  });

  test('renderChecklist groups active vs acknowledged with details', () => {
    const items = [
      { ref: 'a/b#1', fingerprint: 'fp1', body: 'first' },
      { ref: 'a/b#2', fingerprint: 'fp2', body: 'second' }
    ];
    const acked = new Map([['a/b#2', { fingerprint: 'fp2' }]]);
    const out = renderChecklist({ heading: 'Test', items, acked, emptyState: '_none_' });
    expect(out).toContain('#### Test (1 · 1 acknowledged)');
    expect(out).toContain('- [ ] first <!--ack:fp=fp1-->');
    expect(out).toContain('<details><summary>Acknowledged (1)');
    expect(out).toContain('- [x] second <!--ack:fp=fp2-->');
  });

  test('renderChecklist surfaces re-activated items when fingerprint changed', () => {
    const items = [{ ref: 'a/b#1', fingerprint: 'NEW', body: 'changed' }];
    const acked = new Map([['a/b#1', { fingerprint: 'OLD' }]]);
    const out = renderChecklist({ heading: 'Test', items, acked, emptyState: '_none_' });
    expect(out).toContain('- [ ] changed');
    expect(out).not.toContain('<details>');
  });

  test('fingerprint is stable and string-shaped', () => {
    expect(fingerprint('hello')).toBe(fingerprint('hello'));
    expect(fingerprint('a')).not.toBe(fingerprint('b'));
    expect(typeof fingerprint('x')).toBe('string');
  });

  test('ackKey formats consistently', () => {
    expect(ackKey('acme', 'api', 42)).toBe('acme/api#42');
  });

  test('renderChecklist all-acknowledged shows neutral active message', () => {
    const items = [{ ref: 'a/b#1', fingerprint: 'fp', body: 'done' }];
    const acked = new Map([['a/b#1', { fingerprint: 'fp' }]]);
    const out = renderChecklist({ heading: 'Test', items, acked, emptyState: '_none_' });
    expect(out).toContain('_All active items handled._');
  });

  test('renderChecklist empty + nothing acknowledged uses emptyState', () => {
    const out = renderChecklist({ heading: 'Test', items: [], acked: new Map(), emptyState: '_nada_' });
    expect(out).toContain('_nada_');
  });
});
