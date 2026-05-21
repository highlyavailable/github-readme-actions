const section = require('../../src/sections/failing-ci');
const { searchItem, ctx } = require('../helpers');

function octokitWith({ prs, getDetails, checks }) {
  return {
    rest: {
      search: {
        issuesAndPullRequests: jest.fn(async () => ({ data: { items: prs, total_count: prs.length } }))
      },
      pulls: {
        get: jest.fn(async ({ pull_number }) => ({ data: getDetails(pull_number) }))
      },
      checks: {
        listForRef: jest.fn(async ({ ref }) => ({ data: checks(ref) }))
      }
    }
  };
}

describe('failing_ci', () => {
  test('includes only PRs with failing checks', async () => {
    const prs = [
      searchItem({ number: 1, title: 'Has failure' }),
      searchItem({ number: 2, title: 'All passing' })
    ];
    const octokit = octokitWith({
      prs,
      getDetails: (n) => ({ head: { sha: `sha-${n}` } }),
      checks: (ref) => {
        if (ref === 'sha-1') {
          return {
            total_count: 2,
            check_runs: [
              { name: 'tests', conclusion: 'failure' },
              { name: 'lint', conclusion: 'success' }
            ]
          };
        }
        return { total_count: 1, check_runs: [{ name: 'tests', conclusion: 'success' }] };
      }
    });
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(1);
    expect(content).toContain('Has failure');
    expect(content).not.toContain('All passing');
    expect(content).toContain('`tests`');
  });

  test('empty state when nothing failing', async () => {
    const octokit = octokitWith({
      prs: [searchItem({ number: 1 })],
      getDetails: () => ({ head: { sha: 'x' } }),
      checks: () => ({ total_count: 1, check_runs: [{ name: 't', conclusion: 'success' }] })
    });
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toContain('No PRs with failing CI.');
  });
});
