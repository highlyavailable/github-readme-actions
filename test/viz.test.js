const {
  unicodeSparkline,
  mermaidLineChart,
  renderSparkline,
  unicodeHeatmap,
  bucketByWeek,
  weekLabels,
  levelFor,
  pickStyle
} = require('../src/viz');

describe('viz', () => {
  test('unicodeSparkline produces one block per value', () => {
    const out = unicodeSparkline([1, 2, 3, 4, 5]);
    expect(out).toHaveLength(5);
    expect(out[0]).not.toBe(out[4]);
  });

  test('unicodeSparkline handles empty input', () => {
    expect(unicodeSparkline([])).toBe('');
  });

  test('mermaidLineChart emits xychart-beta block', () => {
    const out = mermaidLineChart({
      title: 'Test',
      labels: ['a', 'b', 'c'],
      values: [1, 2, 3]
    });
    expect(out).toContain('```mermaid');
    expect(out).toContain('xychart-beta');
    expect(out).toContain('title "Test"');
    expect(out).toContain('x-axis ["a", "b", "c"]');
    expect(out).toContain('line [1, 2, 3]');
  });

  test('renderSparkline honors style preference', () => {
    const args = { title: 'T', labels: ['a'], values: [3] };
    expect(renderSparkline({ ...args, style: 'mermaid' })).toContain('```mermaid');
    expect(renderSparkline({ ...args, style: 'unicode' })).not.toContain('```');
    const both = renderSparkline({ ...args, style: 'both' });
    expect(both).toContain('```mermaid');
    expect(both).toContain('Fallback:');
  });

  test('pickStyle defaults to mermaid for unknown', () => {
    expect(pickStyle('foo')).toBe('mermaid');
    expect(pickStyle('unicode')).toBe('unicode');
  });

  test('unicodeHeatmap renders 7 rows', () => {
    const weeks = [
      [
        { date: '2026-05-18', count: 5, weekday: 0 },
        { date: '2026-05-19', count: 0, weekday: 1 }
      ]
    ];
    const out = unicodeHeatmap(weeks);
    expect(out).toContain('```text');
    expect(out).toContain('Legend');
    // 7 day rows
    expect(out.split('\n').filter((l) => /^[MTWFSST] /.test(l)).length).toBe(7);
  });

  test('bucketByWeek puts timestamps into 12 weekly buckets', () => {
    const now = new Date('2026-05-20T00:00:00Z').getTime();
    const oneWeekAgo = new Date(now - 7 * 86400000).toISOString();
    const sixWeeksAgo = new Date(now - 6 * 7 * 86400000).toISOString();
    const buckets = bucketByWeek([oneWeekAgo, sixWeeksAgo, oneWeekAgo], 12, now);
    expect(buckets).toHaveLength(12);
    expect(buckets.reduce((a, b) => a + b, 0)).toBe(3);
  });

  test('weekLabels produces N MM-DD labels oldest first', () => {
    const now = new Date('2026-05-20T00:00:00Z').getTime();
    const labels = weekLabels(3, now);
    expect(labels).toHaveLength(3);
    expect(labels[0] < labels[2]).toBe(true);
    expect(labels[2]).toMatch(/^\d{2}-\d{2}$/);
  });

  test('levelFor maps counts to glyphs', () => {
    expect(levelFor(0)).toBe('·');
    expect(levelFor(2)).toBe('░');
    expect(levelFor(5)).toBe('▒');
    expect(levelFor(10)).toBe('▓');
    expect(levelFor(50)).toBe('█');
  });
});
