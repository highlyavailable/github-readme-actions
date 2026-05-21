const {
  link,
  mono,
  statusTag,
  makeStatusTag,
  table,
  bulletList,
  renderRows,
  age,
  formatDate,
  isoDate,
  prRef,
  emptyState
} = require('../src/render');

const NOW = new Date('2026-05-20T12:00:00Z').getTime();

describe('render helpers', () => {
  test('link escapes pipes', () => {
    expect(link('a|b', 'https://x.test')).toBe('[a\\|b](https://x.test)');
  });

  test('link returns plain text when no url', () => {
    expect(link('hello', null)).toBe('hello');
  });

  test('mono wraps in backticks and escapes embedded backticks', () => {
    expect(mono('foo')).toBe('`foo`');
    expect(mono('a`b')).toBe('`a\\`b`');
  });

  test('statusTag known and unknown values', () => {
    expect(statusTag('merged')).toBe('[merged]');
    expect(statusTag('mystery')).toBe('[mystery]');
  });

  test('table builds markdown', () => {
    expect(table(['A', 'B'], [['1', '2']])).toBe('| A | B |\n| --- | --- |\n| 1 | 2 |');
  });

  test('table returns empty string for no rows', () => {
    expect(table(['A'], [])).toBe('');
  });

  test('bulletList builds list', () => {
    expect(bulletList(['a', 'b'])).toBe('- a\n- b');
  });

  test('age formats deltas', () => {
    expect(age('2026-05-20T11:59:30Z', NOW)).toBe('30s');
    expect(age('2026-05-20T11:00:00Z', NOW)).toBe('1h');
    expect(age('2026-05-15T12:00:00Z', NOW)).toBe('5d');
    expect(age('2026-04-20T12:00:00Z', NOW)).toBe('4w');
    expect(age('2025-05-20T12:00:00Z', NOW)).toBe('12mo');
    expect(age('2024-05-20T12:00:00Z', NOW)).toBe('2y');
  });

  test('prRef formats owner/repo#num', () => {
    expect(prRef('acme', 'widgets', 42)).toBe('`acme/widgets#42`');
  });

  test('emptyState wraps in italics', () => {
    expect(emptyState('nothing')).toBe('_nothing_');
  });

  test('makeStatusTag honors overrides and falls back to defaults', () => {
    const tag = makeStatusTag({ merged: 'merged!', custom: 'CUSTOM' });
    expect(tag('merged')).toBe('merged!');
    expect(tag('open')).toBe('[open]');
    expect(tag('custom')).toBe('CUSTOM');
    expect(tag('unknown')).toBe('[unknown]');
  });

  test('formatDate honors mode', () => {
    expect(formatDate('2026-05-20T11:00:00Z', 'relative', NOW)).toBe('1h');
    expect(formatDate('2026-05-20T11:00:00Z', 'absolute', NOW)).toBe('2026-05-20');
    expect(formatDate('2026-05-20T11:00:00Z', 'both', NOW)).toBe('2026-05-20 (1h)');
  });

  test('isoDate handles invalid input', () => {
    expect(isoDate('')).toBe('');
    expect(isoDate('not-a-date')).toBe('');
    expect(isoDate('2026-01-15T00:00:00Z')).toBe('2026-01-15');
  });

  test('renderRows: table style produces markdown table', () => {
    const out = renderRows({ style: 'table', headers: ['A', 'B'], rows: [['1', '2']] });
    expect(out).toContain('| A | B |');
    expect(out).toContain('| 1 | 2 |');
  });

  test('renderRows: list style produces bullet list joined with em-dash', () => {
    const out = renderRows({ style: 'list', headers: [], rows: [['x', 'y'], ['a', 'b']] });
    expect(out).toBe('- x — y\n- a — b');
  });

  test('renderRows: compact style produces interpunct-joined lines', () => {
    const out = renderRows({ style: 'compact', headers: [], rows: [['x', 'y']] });
    expect(out).toBe('x · y');
  });

  test('renderRows: empty rows yields empty string', () => {
    expect(renderRows({ style: 'table', headers: ['A'], rows: [] })).toBe('');
  });
});
