const section = require('../../src/sections/command-center');
const { searchItem, ctx } = require('../helpers');

function fullOctokit() {
  return {
    rest: {
      search: {
        issuesAndPullRequests: jest.fn(async ({ q }) => {
          // stats does count-only queries (per_page:1)
          if (q.includes('reviewed-by')) return { data: { total_count: 0, items: [] } };
          if (q.includes('is:merged')) return { data: { total_count: 2, items: [] } };
          if (q.includes('created:>=')) {
            // velocity_chart full query OR stats opened count
            return {
              data: {
                total_count: 1,
                items: [searchItem({ created_at: '2026-05-15T00:00:00Z' })]
              }
            };
          }
          // open_prs / response_inbox / review_inbox
          return {
            data: {
              total_count: 1,
              items: [searchItem({ number: 42, title: 'Live PR' })]
            }
          };
        })
      },
      issues: {
        listComments: jest.fn(async () => ({ data: [] }))
      },
      pulls: {
        listReviewComments: jest.fn(async () => ({ data: [] })),
        listReviews: jest.fn(async () => ({ data: [] }))
      }
    }
  };
}

describe('command_center', () => {
  test('renders header + multiple subsection blocks', async () => {
    const octokit = fullOctokit();
    const { content } = await section.render(
      ctx({ octokit, config: { layout: ['kpis', 'open_prs', 'review_inbox'], per_block_rows: 3 } })
    );
    expect(content).toContain('Command Center');
    expect(content).toContain('octocat');
    expect(content).toContain('#### Open Pull Requests');
    expect(content).toContain('#### Review Inbox');
    expect(content).toContain('Live PR');
  });

  test('default layout includes kpis + velocity + open_prs', async () => {
    const octokit = fullOctokit();
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toContain('Command Center');
    expect(content).toContain('#### Velocity');
    expect(content).toContain('#### Open Pull Requests');
  });

  test('per_block_rows caps the embedded tables', async () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      searchItem({ number: i + 1, title: `PR ${i + 1}` })
    );
    const octokit = {
      rest: {
        search: {
          issuesAndPullRequests: jest.fn(async () => ({
            data: { items, total_count: items.length }
          }))
        },
        issues: { listComments: jest.fn(async () => ({ data: [] })) },
        pulls: {
          listReviewComments: jest.fn(async () => ({ data: [] })),
          listReviews: jest.fn(async () => ({ data: [] }))
        }
      }
    };
    const { content } = await section.render(
      ctx({ octokit, config: { layout: ['open_prs'], per_block_rows: 2 } })
    );
    // 2 rows + header + divider in the markdown table
    expect((content.match(/\[PR \d+\]/g) || []).length).toBe(2);
  });
});
