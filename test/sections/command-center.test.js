const section = require('../../src/sections/command-center');
const { searchItem, ctx } = require('../helpers');

function fullOctokit() {
  return {
    rest: {
      search: {
        issuesAndPullRequests: jest.fn(async ({ q, per_page }) => {
          // count-only queries used by week-stats
          if (per_page === 1) {
            if (q.includes('reviewed-by')) return { data: { total_count: 0, items: [] } };
            if (q.includes('is:merged')) return { data: { total_count: 2, items: [] } };
            return { data: { total_count: 7, items: [] } };
          }
          // full search for velocity, open_prs etc.
          return {
            data: {
              total_count: 1,
              items: [
                searchItem({
                  number: 42,
                  title: 'Live PR',
                  created_at: '2026-05-18T00:00:00Z',
                  updated_at: '2026-05-18T00:00:00Z'
                })
              ]
            }
          };
        })
      },
      issues: { listComments: jest.fn(async () => ({ data: [] })) },
      pulls: {
        get: jest.fn(async () => ({ data: { head: { sha: 'x' }, mergeable: true } })),
        listReviewComments: jest.fn(async () => ({ data: [] })),
        listReviews: jest.fn(async () => ({ data: [] }))
      },
      checks: {
        listForRef: jest.fn(async () => ({ data: { total_count: 0, check_runs: [] } }))
      }
    }
  };
}

describe('command_center', () => {
  test('renders compact hero with KPI line and inbox pills', async () => {
    const octokit = fullOctokit();
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(content).toContain('### Standup');
    expect(content).toContain('[`octocat`](https://github.com/octocat)');
    expect(content).toMatch(/\*\*Last 30 days\*\* 7 opened.*2 merged.*0 reviewed/);
    expect(content).toContain('velocity');
    expect(content).toContain('**Inbox**');
    expect(content).toContain('awaiting reply');
    expect(metadata.last30_opened).toBe(7);
  });

  test('minimal theme strips emoji from hero pills and aging line', async () => {
    const octokit = fullOctokit();
    const { content } = await section.render(ctx({ octokit, render: { theme: 'minimal' } }));
    expect(content).toContain('**Inbox**');
    expect(content).toContain('awaiting reply');
    // No colored-circle status icons anywhere in the rendered dashboard.
    expect(content).not.toMatch(/[🟢🟡🔴🟠🔵⚪]/u);
  });

  test('hero includes inline sparkline characters', async () => {
    const octokit = fullOctokit();
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toMatch(/`[▁▂▃▄▅▆▇█]+`/);
  });

  test('renders Open pull requests subsection with count', async () => {
    const octokit = fullOctokit();
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toContain('#### Open pull requests (1)');
    expect(content).toContain('Live PR');
  });

  test('suppresses empty subsections', async () => {
    const octokit = fullOctokit();
    // review_inbox count will be 1 in fullOctokit since search returns items;
    // override to zero so it's empty.
    octokit.rest.search.issuesAndPullRequests = jest.fn(async ({ q, per_page }) => {
      if (per_page === 1) return { data: { total_count: 0, items: [] } };
      if (q.includes('review-requested')) return { data: { total_count: 0, items: [] } };
      return { data: { total_count: 1, items: [searchItem({ number: 1, title: 'Open one' })] } };
    });
    const { content } = await section.render(ctx({ octokit }));
    expect(content).not.toContain('Pending review requests');
  });

  test('honors custom layout', async () => {
    const octokit = fullOctokit();
    const { content } = await section.render(
      ctx({ octokit, config: { layout: ['hero', 'open_prs'], per_block_rows: 3 } })
    );
    expect(content).toContain('### Standup');
    expect(content).toContain('Open pull requests');
    expect(content).not.toContain('Awaiting your reply');
  });

  test('needs_attention is rendered as checklist with checkboxes', async () => {
    const octokit = {
      rest: {
        search: {
          issuesAndPullRequests: jest.fn(async ({ per_page }) => {
            if (per_page === 1) {
              return { data: { total_count: 0, items: [] } };
            }
            // failing_ci & stale_prs & ready_to_merge all search open PRs
            return {
              data: {
                total_count: 1,
                items: [
                  searchItem({
                    number: 7,
                    title: 'Broken PR',
                    repository_url: 'https://api.github.com/repos/acme/api'
                  })
                ]
              }
            };
          })
        },
        issues: { listComments: jest.fn(async () => ({ data: [] })) },
        pulls: {
          get: jest.fn(async () => ({ data: { head: { sha: 'x' }, mergeable: true } })),
          listReviewComments: jest.fn(async () => ({ data: [] })),
          listReviews: jest.fn(async () => ({ data: [] }))
        },
        checks: {
          listForRef: jest.fn(async () => ({
            data: { total_count: 1, check_runs: [{ name: 'tests', conclusion: 'failure' }] }
          }))
        }
      }
    };
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toContain('#### Needs attention');
    expect(content).toMatch(/- \[ \] .*Broken PR/);
    expect(content).toContain('<!--ack:fp=');
  });

  test('parseExistingSnapshot reads KPIs even when week-over-week arrows are present', () => {
    // Regression: the hero emits arrows like "0 opened (↓1)", and the parser
    // must still recover the counts from its own previous output.
    const snapshot = [
      '> ### Standup · [`octocat`](https://github.com/octocat)',
      '> _Updated 2026-06-24 01:55 UTC_',
      '>',
      '> **Last 30 days** 5 opened (↑2) · 3 merged (=) · 1 reviewed (↓1) · velocity `▁█` 0.7/wk',
      '>',
      '> **Inbox** 🟢 0 ready · 🔴 1 failing · 🟠 2 stale · 🟡 1 awaiting reply · 🔵 0 review requests'
    ].join('\n');
    const parsed = section.parseExistingSnapshot(snapshot);
    expect(parsed.opened).toBe(5);
    expect(parsed.merged).toBe(3);
    expect(parsed.reviewed).toBe(1);
    expect(parsed.failing).toBe(1);
    expect(parsed.stale).toBe(2);
    expect(parsed.updatedAt).not.toBeNull();
  });

  test('acknowledged items persist when fingerprint matches', async () => {
    const octokit = {
      rest: {
        search: {
          issuesAndPullRequests: jest.fn(async ({ per_page }) => {
            if (per_page === 1) return { data: { total_count: 0, items: [] } };
            return {
              data: {
                total_count: 1,
                items: [
                  searchItem({
                    number: 7,
                    title: 'Stable PR',
                    updated_at: '2026-05-10T00:00:00Z',
                    repository_url: 'https://api.github.com/repos/acme/api'
                  })
                ]
              }
            };
          })
        },
        issues: { listComments: jest.fn(async () => ({ data: [] })) },
        pulls: {
          get: jest.fn(async () => ({ data: { head: { sha: 'x' }, mergeable: true } })),
          listReviewComments: jest.fn(async () => ({ data: [] })),
          listReviews: jest.fn(async () => ({ data: [] }))
        },
        checks: {
          listForRef: jest.fn(async () => ({
            data: { total_count: 1, check_runs: [{ name: 'tests', conclusion: 'failure' }] }
          }))
        }
      }
    };

    // First render to compute the fingerprint
    const first = await section.render(ctx({ octokit }));
    const fpMatch = first.content.match(/<!--ack:fp=([A-Za-z0-9_-]+)-->/);
    expect(fpMatch).not.toBeNull();

    // Now simulate the user having checked the box (existing content has [x])
    const existingContent = first.content.replace(
      /- \[ \] (.*<!--ack:fp=[A-Za-z0-9_-]+-->)/,
      '- [x] $1'
    );
    const second = await section.render(ctx({ octokit, existing: existingContent }));
    expect(second.content).toContain(`- [x] `);
    expect(second.content).toContain('<details><summary>Acknowledged');
    expect(second.metadata.acknowledged_count).toBeGreaterThan(0);
  });
});
