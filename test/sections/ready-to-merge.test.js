const section = require('../../src/sections/ready-to-merge');
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

describe('ready_to_merge', () => {
  test('includes approved + mergeable + green CI', async () => {
    const prs = [
      searchItem({ number: 1, title: 'Ready' }),
      searchItem({ number: 2, title: 'Has conflicts' }),
      searchItem({ number: 3, title: 'Still in CI' })
    ];
    const octokit = octokitWith({
      prs,
      getDetails: (n) => {
        if (n === 2) return { head: { sha: 'sha-2' }, mergeable: false };
        return { head: { sha: `sha-${n}` }, mergeable: true };
      },
      checks: (ref) => {
        if (ref === 'sha-3') {
          return { total_count: 1, check_runs: [{ name: 'tests', status: 'in_progress' }] };
        }
        return { total_count: 1, check_runs: [{ name: 'tests', conclusion: 'success' }] };
      }
    });
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(1);
    expect(content).toContain('Ready');
    expect(content).not.toContain('Has conflicts');
    expect(content).not.toContain('Still in CI');
  });

  test('query filters review:approved', async () => {
    const octokit = octokitWith({
      prs: [],
      getDetails: () => ({}),
      checks: () => ({ total_count: 0, check_runs: [] })
    });
    await section.render(ctx({ octokit }));
    const q = octokit.rest.search.issuesAndPullRequests.mock.calls[0][0].q;
    expect(q).toContain('review:approved');
    expect(q).toContain('is:open');
  });
});
