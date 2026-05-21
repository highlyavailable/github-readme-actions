const section = require('../../src/sections/velocity-chart');
const { mockOctokit, searchItem, ctx } = require('../helpers');

describe('velocity_chart', () => {
  test('renders a mermaid xychart-beta block', async () => {
    const octokit = mockOctokit({
      searchItems: [
        searchItem({ created_at: '2026-05-15T00:00:00Z' }),
        searchItem({ created_at: '2026-05-10T00:00:00Z' }),
        searchItem({ created_at: '2026-04-20T00:00:00Z' })
      ]
    });
    const { content, metadata } = await section.render(
      ctx({ octokit, config: { weeks: 12 }, render: { extras: { viz_style: 'mermaid' } } })
    );
    expect(metadata.weeks).toBe(12);
    expect(metadata.count).toBe(3);
    expect(content).toContain('```mermaid');
    expect(content).toContain('xychart-beta');
  });

  test('renders unicode sparkline when viz_style=unicode', async () => {
    const octokit = mockOctokit({
      searchItems: [searchItem({ created_at: '2026-05-15T00:00:00Z' })]
    });
    const { content } = await section.render(
      ctx({ octokit, config: { weeks: 4 }, render: { extras: { viz_style: 'unicode' } } })
    );
    expect(content).not.toContain('```mermaid');
    expect(content).toMatch(/[▁▂▃▄▅▆▇█]/);
  });

  test('empty state when no PRs', async () => {
    const octokit = mockOctokit({ searchItems: [] });
    const { content } = await section.render(ctx({ octokit, config: { weeks: 12 } }));
    expect(content).toContain('No PRs in the velocity window.');
  });
});
