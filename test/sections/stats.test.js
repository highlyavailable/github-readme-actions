const section = require('../../src/sections/stats');
const { ctx } = require('../helpers');

function octokitWithCounts(perQueryCount) {
  const calls = [];
  return {
    calls,
    rest: {
      search: {
        issuesAndPullRequests: jest.fn(async ({ q }) => {
          calls.push(q);
          return { data: { total_count: perQueryCount(q) || 0, items: [] } };
        })
      }
    }
  };
}

describe('stats', () => {
  test('emits row per requested period', async () => {
    const o = octokitWithCounts((q) => {
      if (q.includes('is:merged')) return 4;
      if (q.includes('reviewed-by')) return 2;
      return 5;
    });
    const { content } = await section.render(
      ctx({ octokit: o, config: { periods: ['week', 'month'] } })
    );
    expect(content).toContain('| Week | 5 | 4 | 2 |');
    expect(content).toContain('| Month | 5 | 4 | 2 |');
  });

  test('filters unknown periods', async () => {
    const o = octokitWithCounts(() => 1);
    const { content, metadata } = await section.render(
      ctx({ octokit: o, config: { periods: ['week', 'decade'] } })
    );
    expect(metadata.periods).toBe('week');
    expect(content).toContain('Week');
    expect(content).not.toContain('Decade');
  });
});
