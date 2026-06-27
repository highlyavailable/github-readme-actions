const section = require('../../src/sections/streak');
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

function makeWeeks(dailyCounts) {
  // dailyCounts: array of integers, oldest first
  const days = dailyCounts.map((count, i) => ({
    contributionCount: count,
    date: new Date(Date.now() - (dailyCounts.length - 1 - i) * 86400000).toISOString().slice(0, 10),
    weekday: i % 7
  }));
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push({ contributionDays: days.slice(i, i + 7) });
  }
  return weeks;
}

describe('streak', () => {
  test('computes current and longest streak', async () => {
    // last 14 days: 7 zeros, then 5 active, 0, 1 active (= current 1)
    const counts = [0, 0, 0, 0, 0, 0, 0, 3, 1, 2, 4, 5, 0, 1];
    const octokit = octokitWithContributions(makeWeeks(counts), counts.reduce((a, b) => a + b, 0));
    const { content, metadata } = await section.render(
      ctx({ octokit, config: { months: 1 }, render: { style: 'compact' } })
    );
    expect(metadata.current).toBe(1);
    expect(metadata.longest).toBe(5);
    expect(content).toContain('**1d** current');
    expect(content).toContain('**5d** longest');
  });

  test('a not-yet-active today does not reset the current streak', async () => {
    // Last day is today with 0 contributions; the three days before are active.
    const counts = [1, 1, 1, 0];
    const octokit = octokitWithContributions(makeWeeks(counts), 3);
    const { metadata } = await section.render(
      ctx({ octokit, config: { months: 1 }, render: { style: 'compact' } })
    );
    expect(metadata.current).toBe(3);
  });

  test('table style renders four rows', async () => {
    const counts = [1, 1, 1];
    const octokit = octokitWithContributions(makeWeeks(counts), 3);
    const { content } = await section.render(
      ctx({ octokit, render: { style: 'table' } })
    );
    expect(content).toContain('| Metric | Value |');
    expect(content).toContain('Current streak');
    expect(content).toContain('Longest streak');
  });

  test('renders empty state when graphql fails', async () => {
    const octokit = { graphql: jest.fn(async () => { throw new Error('forbidden'); }) };
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(content).toContain('Streak unavailable');
    expect(metadata.current).toBe(0);
  });
});
