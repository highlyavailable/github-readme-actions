const section = require('../../src/sections/review-inbox');
const { mockOctokit, searchItem, ctx } = require('../helpers');

describe('review_inbox', () => {
  test('renders PRs awaiting review with author', async () => {
    const octokit = mockOctokit({
      searchItems: [
        searchItem({
          number: 7,
          title: 'Please review',
          user: { login: 'alice' },
          updated_at: '2026-05-19T00:00:00Z'
        })
      ]
    });
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(1);
    expect(content).toContain('Please review');
    expect(content).toContain('@alice');
  });

  test('search query targets review-requested:user', async () => {
    const octokit = mockOctokit();
    await section.render(ctx({ octokit }));
    const q = octokit.rest.search.issuesAndPullRequests.mock.calls[0][0].q;
    expect(q).toContain('review-requested:octocat');
    expect(q).toContain('is:open');
  });

  test('empty state when no review requests', async () => {
    const octokit = mockOctokit({ searchItems: [] });
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toContain('No pending review requests.');
  });
});
