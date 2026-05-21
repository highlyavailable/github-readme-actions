const section = require('../../src/sections/merged-prs');
const { mockOctokit, searchItem, ctx } = require('../helpers');

describe('merged_prs', () => {
  test('renders merged PRs sorted by merge date desc', async () => {
    const octokit = mockOctokit({
      searchItems: [
        searchItem({
          number: 1,
          title: 'Older merge',
          pull_request: { merged_at: '2026-04-01T00:00:00Z' }
        }),
        searchItem({
          number: 2,
          title: 'Newer merge',
          pull_request: { merged_at: '2026-05-15T00:00:00Z' }
        })
      ]
    });
    const { content, metadata } = await section.render(
      ctx({ octokit, config: { windowDays: 60 } })
    );
    expect(metadata.count).toBe(2);
    expect(metadata.window_days).toBe(60);
    const newerIdx = content.indexOf('Newer merge');
    const olderIdx = content.indexOf('Older merge');
    expect(newerIdx).toBeGreaterThan(-1);
    expect(newerIdx).toBeLessThan(olderIdx);
    expect(content).toContain('2026-05-15');
  });

  test('query includes is:merged and merged date filter', async () => {
    const octokit = mockOctokit();
    await section.render(ctx({ octokit, config: { windowDays: 30 } }));
    const q = octokit.rest.search.issuesAndPullRequests.mock.calls[0][0].q;
    expect(q).toContain('is:merged');
    expect(q).toMatch(/merged:>=/);
  });
});
