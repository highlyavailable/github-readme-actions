const section = require('../../src/sections/stale-prs');
const { mockOctokit, searchItem, ctx } = require('../helpers');

describe('stale_prs', () => {
  test('renders open PRs older than N days', async () => {
    const octokit = mockOctokit({
      searchItems: [
        searchItem({
          number: 1,
          title: 'Old PR',
          updated_at: '2026-04-01T00:00:00Z'
        })
      ]
    });
    const { content, metadata } = await section.render(
      ctx({ octokit, config: { staleDays: 14 } })
    );
    expect(metadata.count).toBe(1);
    expect(metadata.stale_days).toBe(14);
    expect(content).toContain('Old PR');
  });

  test('query uses updated:< filter', async () => {
    const octokit = mockOctokit({ searchItems: [] });
    await section.render(ctx({ octokit, config: { staleDays: 30 } }));
    const q = octokit.rest.search.issuesAndPullRequests.mock.calls[0][0].q;
    expect(q).toContain('updated:<');
    expect(q).toContain('is:open');
  });

  test('empty state when nothing stale', async () => {
    const octokit = mockOctokit({ searchItems: [] });
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toContain('No stale pull requests.');
  });
});
