const { applyUpdates, findSection, replaceSection } = require('../src/readme');

const SOURCE = `# My README

## Open PRs
<!--readme-actions:open_prs:start-->
old content
<!--readme-actions:open_prs:end-->

## Pinned
<!--readme-actions:pinned_prs:start-->
old pinned
<!--readme-actions:pinned_prs:end-->
`;

describe('readme markers', () => {
  test('findSection locates markers', () => {
    const match = findSection(SOURCE, 'open_prs');
    expect(match).not.toBeNull();
    expect(match.start).toBe('<!--readme-actions:open_prs:start-->');
  });

  test('findSection returns null when markers missing', () => {
    expect(findSection(SOURCE, 'review_inbox')).toBeNull();
  });

  test('replaceSection swaps content between markers', () => {
    const { source, replaced } = replaceSection(SOURCE, 'open_prs', 'NEW BODY');
    expect(replaced).toBe(true);
    expect(source).toContain('<!--readme-actions:open_prs:start-->\nNEW BODY\n<!--readme-actions:open_prs:end-->');
    expect(source).not.toContain('old content');
  });

  test('applyUpdates handles multiple sections and reports missing', () => {
    const { content, rendered, missing } = applyUpdates(SOURCE, [
      { name: 'open_prs', content: 'A' },
      { name: 'pinned_prs', content: 'B' },
      { name: 'review_inbox', content: 'C' }
    ]);
    expect(rendered).toEqual(['open_prs', 'pinned_prs']);
    expect(missing).toEqual(['review_inbox']);
    expect(content).toContain('\nA\n');
    expect(content).toContain('\nB\n');
  });
});
