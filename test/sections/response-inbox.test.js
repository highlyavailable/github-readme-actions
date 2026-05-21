const section = require('../../src/sections/response-inbox');
const { searchItem, ctx } = require('../helpers');

function octokitFor(prs, commentsByPr) {
  return {
    rest: {
      search: {
        issuesAndPullRequests: jest.fn(async () => ({ data: { items: prs, total_count: prs.length } }))
      },
      issues: {
        listComments: jest.fn(async ({ issue_number }) => ({
          data: (commentsByPr[issue_number] || []).filter((c) => c._kind === 'issue')
        }))
      },
      pulls: {
        listReviewComments: jest.fn(async ({ pull_number }) => ({
          data: (commentsByPr[pull_number] || []).filter((c) => c._kind === 'review')
        })),
        listReviews: jest.fn(async ({ pull_number }) => ({
          data: (commentsByPr[pull_number] || []).filter((c) => c._kind === 'review-submitted')
        }))
      }
    }
  };
}

describe('response_inbox', () => {
  test('includes PRs where last reply was someone else', async () => {
    const prs = [
      searchItem({ number: 1, title: 'Waiting on me' }),
      searchItem({ number: 2, title: 'I replied last' })
    ];
    const octokit = octokitFor(prs, {
      1: [
        { _kind: 'issue', user: { login: 'octocat' }, created_at: '2026-05-10T00:00:00Z' },
        { _kind: 'issue', user: { login: 'alice' }, created_at: '2026-05-18T00:00:00Z' }
      ],
      2: [
        { _kind: 'issue', user: { login: 'bob' }, created_at: '2026-05-10T00:00:00Z' },
        { _kind: 'issue', user: { login: 'octocat' }, created_at: '2026-05-19T00:00:00Z' }
      ]
    });
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(1);
    expect(content).toContain('Waiting on me');
    expect(content).not.toContain('I replied last');
    expect(content).toContain('@alice');
  });

  test('renders empty state when nothing is waiting', async () => {
    const octokit = octokitFor([searchItem({ number: 5 })], {
      5: [{ _kind: 'issue', user: { login: 'octocat' }, created_at: '2026-05-19T00:00:00Z' }]
    });
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(0);
    expect(content).toContain('No threads waiting on a response.');
  });
});
