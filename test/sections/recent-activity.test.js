const section = require('../../src/sections/recent-activity');
const { mockOctokit, searchItem, ctx } = require('../helpers');

describe('recent_activity', () => {
  test('groups items by repo and links them', async () => {
    const octokit = mockOctokit({
      searchItems: [
        searchItem({
          number: 1,
          title: 'Fix in widgets',
          repository_url: 'https://api.github.com/repos/acme/widgets',
          html_url: 'https://github.com/acme/widgets/issues/1',
          pull_request: undefined
        }),
        searchItem({
          number: 2,
          title: 'Another widgets thread',
          repository_url: 'https://api.github.com/repos/acme/widgets',
          html_url: 'https://github.com/acme/widgets/pull/2'
        }),
        searchItem({
          number: 5,
          title: 'Cogs PR',
          repository_url: 'https://api.github.com/repos/acme/cogs',
          html_url: 'https://github.com/acme/cogs/pull/5'
        })
      ]
    });
    const { content, metadata } = await section.render(ctx({ octokit, config: { days: 21 } }));
    expect(metadata.count).toBe(3);
    expect(metadata.window_days).toBe(21);
    expect(content).toContain('`acme/widgets`');
    expect(content).toContain('`acme/cogs`');
    expect(content).toContain('Fix in widgets');
    expect(content).toContain('Cogs PR');
  });

  test('empty state when no activity', async () => {
    const octokit = mockOctokit({ searchItems: [] });
    const { content } = await section.render(ctx({ octokit, config: { days: 14 } }));
    expect(content).toContain('No activity in the last 14 days.');
  });
});
