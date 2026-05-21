const section = require('../../src/sections/commit-heatmap');
const { ctx } = require('../helpers');

function octokitWithContributions(weeks, total) {
  return {
    graphql: jest.fn(async () => ({
      user: {
        contributionsCollection: {
          totalContributions: total,
          contributionCalendar: { weeks }
        }
      }
    }))
  };
}

describe('commit_heatmap', () => {
  test('renders heatmap text block with total', async () => {
    const weeks = [
      {
        contributionDays: [
          { contributionCount: 5, date: '2026-05-18', weekday: 1 },
          { contributionCount: 0, date: '2026-05-19', weekday: 2 }
        ]
      }
    ];
    const octokit = octokitWithContributions(weeks, 100);
    const { content, metadata } = await section.render(
      ctx({ octokit, config: { months: 3 } })
    );
    expect(metadata.count).toBe(100);
    expect(metadata.months).toBe(3);
    expect(content).toContain('100 contributions');
    expect(content).toContain('```text');
    expect(content).toContain('Legend');
  });

  test('graceful fallback when graphql returns null', async () => {
    const octokit = { graphql: jest.fn(async () => ({ user: null })) };
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toContain('Contributions data unavailable');
  });
});
