const section = require('../../src/sections/open-prs');
const { mockOctokit, searchItem, ctx } = require('../helpers');

describe('open_prs', () => {
  test('renders a table of open PRs', async () => {
    const octokit = mockOctokit({
      searchItems: [
        searchItem({
          number: 101,
          title: 'Add retry logic',
          html_url: 'https://github.com/acme/widgets/pull/101',
          updated_at: '2026-05-19T12:00:00Z',
          comments: 3
        }),
        searchItem({
          number: 102,
          title: 'Refactor queue',
          html_url: 'https://github.com/acme/widgets/pull/102',
          draft: true,
          updated_at: '2026-05-18T12:00:00Z'
        })
      ]
    });
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(2);
    expect(content).toContain('[Add retry logic](https://github.com/acme/widgets/pull/101)');
    expect(content).toContain('`acme/widgets#101`');
    expect(content).toContain('[draft]');
    expect(content).toContain('[open]');
  });

  test('shows empty state when no open PRs', async () => {
    const octokit = mockOctokit({ searchItems: [] });
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(0);
    expect(content).toContain('No open pull requests.');
  });

  test('respects maxRows cap', async () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      searchItem({ number: i + 1, title: `PR ${i + 1}` })
    );
    const octokit = mockOctokit({ searchItems: items });
    const { content } = await section.render(ctx({ octokit, shared: { maxRows: 3 } }));
    expect((content.match(/\[PR \d+\]/g) || []).length).toBe(3);
  });

  test('honors style=list override', async () => {
    const octokit = mockOctokit({
      searchItems: [searchItem({ number: 1, title: 'Add retry logic' })]
    });
    const { content } = await section.render(ctx({ octokit, render: { style: 'list' } }));
    expect(content.startsWith('- ')).toBe(true);
    expect(content).not.toContain('| PR |');
  });

  test('honors columns subset override', async () => {
    const octokit = mockOctokit({
      searchItems: [searchItem({ number: 1, title: 'Add retry logic' })]
    });
    const { content } = await section.render(
      ctx({ octokit, render: { style: 'table', columns: ['pr', 'state'] } })
    );
    expect(content).toContain('| PR | State |');
    expect(content).not.toContain('Comments');
    expect(content).not.toContain('Updated');
  });

  test('honors status_labels override', async () => {
    const octokit = mockOctokit({
      searchItems: [
        searchItem({ number: 1, title: 'Open feature' }),
        searchItem({ number: 2, title: 'Drafty', draft: true })
      ]
    });
    const { content } = await section.render(
      ctx({ octokit, render: { status_labels: { open: 'OPEN', draft: 'WIP' } } })
    );
    expect(content).toContain('OPEN');
    expect(content).toContain('WIP');
    expect(content).not.toContain('[open]');
    expect(content).not.toContain('[draft]');
  });

  test('honors date_format=absolute', async () => {
    const octokit = mockOctokit({
      searchItems: [searchItem({ number: 1, title: 'Add retry logic', updated_at: '2026-05-15T00:00:00Z' })]
    });
    const { content } = await section.render(
      ctx({ octokit, render: { date_format: 'absolute' } })
    );
    expect(content).toContain('2026-05-15');
  });

  test('honors empty_state override', async () => {
    const octokit = mockOctokit({ searchItems: [] });
    const { content } = await section.render(
      ctx({ octokit, render: { empty_state: 'Inbox zero. Nice.' } })
    );
    expect(content).toContain('Inbox zero. Nice.');
  });

  test('query includes repo scope and draft exclusion', async () => {
    const octokit = mockOctokit();
    await section.render(
      ctx({
        octokit,
        shared: { repositories: ['acme/widgets'], excludeRepositories: ['acme/legacy'] }
      })
    );
    const callArgs = octokit.rest.search.issuesAndPullRequests.mock.calls[0][0];
    expect(callArgs.q).toContain('repo:acme/widgets');
    expect(callArgs.q).toContain('-repo:acme/legacy');
    expect(callArgs.q).toContain('-draft:true');
  });
});
