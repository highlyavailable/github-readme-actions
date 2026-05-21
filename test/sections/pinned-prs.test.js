const section = require('../../src/sections/pinned-prs');
const { mockOctokit, searchItem, ctx } = require('../helpers');

describe('pinned_prs', () => {
  test('renders bullet list with status tags', async () => {
    const octokit = mockOctokit({
      searchItems: [
        searchItem({
          number: 1,
          title: 'Merged feature',
          pull_request: { merged_at: '2026-05-01T00:00:00Z' }
        }),
        searchItem({ number: 2, title: 'Open feature' }),
        searchItem({ number: 3, title: 'Drafty', draft: true })
      ]
    });
    const { content, metadata } = await section.render(
      ctx({ octokit, shared: { maxRows: 10, includeDrafts: true, repositories: [], excludeRepositories: [] }, config: {} })
    );
    expect(metadata.count).toBe(3);
    expect(content).toContain('[merged]');
    expect(content).toContain('[open]');
    expect(content).toContain('[draft]');
    expect(content).toContain('`acme/widgets#1`');
  });

  test('respects blacklist', async () => {
    const octokit = mockOctokit({
      searchItems: [
        searchItem({ number: 1, title: 'Keep' }),
        searchItem({ number: 99, title: 'Blocked' })
      ]
    });
    const { content, metadata } = await section.render(
      ctx({ octokit, config: { blacklist: [99] } })
    );
    expect(metadata.count).toBe(1);
    expect(content).toContain('Keep');
    expect(content).not.toContain('Blocked');
  });

  test('empty state', async () => {
    const octokit = mockOctokit({ searchItems: [] });
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toContain('No pinned pull requests.');
  });
});
