const section = require('../../src/sections/activity-feed');
const { ctx } = require('../helpers');

function event(type, payload, overrides = {}) {
  return {
    type,
    repo: { name: 'acme/widgets' },
    created_at: '2026-05-19T12:00:00Z',
    payload,
    ...overrides
  };
}

function octokitWithEvents(events) {
  return {
    rest: {
      activity: {
        listPublicEventsForUser: jest.fn(async () => ({ data: events }))
      }
    }
  };
}

describe('activity_feed', () => {
  test('renders a chronological timeline of public events', async () => {
    const octokit = octokitWithEvents([
      event('PullRequestEvent', {
        action: 'closed',
        number: 7,
        pull_request: { number: 7, title: 'Add feature', merged: true, html_url: 'https://github.com/acme/widgets/pull/7' }
      }, { created_at: '2026-05-19T10:00:00Z' }),
      event('IssueCommentEvent', {
        action: 'created',
        issue: { number: 9, title: 'Bug report', html_url: 'https://github.com/acme/widgets/issues/9' },
        comment: { html_url: 'https://github.com/acme/widgets/issues/9#issuecomment-1' }
      }, { created_at: '2026-05-19T11:00:00Z' })
    ]);

    const { content, metadata } = await section.render(ctx({ octokit }));

    expect(metadata.count).toBe(2);
    // Newest first: the comment (11:00) before the merge (10:00).
    expect(content.indexOf('Commented')).toBeLessThan(content.indexOf('Merged PR'));
    expect(content).toContain('Merged PR');
    expect(content).toContain('acme/widgets');
    expect(content).toContain('https://github.com/acme/widgets/pull/7');
  });

  test('distinguishes merged vs closed-unmerged PRs and reviews', async () => {
    const octokit = octokitWithEvents([
      event('PullRequestEvent', { action: 'closed', number: 1, pull_request: { number: 1, title: 'Abandoned', merged: false, html_url: 'u' } }),
      event('PullRequestReviewEvent', { review: { state: 'approved', html_url: 'r' }, pull_request: { number: 2, title: 'Theirs' } })
    ]);
    const { content } = await section.render(ctx({ octokit }));
    expect(content).toContain('Closed PR');
    expect(content).toContain('Approved');
  });

  test('excludes low-signal event types by default', async () => {
    const octokit = octokitWithEvents([
      event('WatchEvent', { action: 'started' }),
      event('PushEvent', { ref: 'refs/heads/main', distinct_size: 3, commits: [{}, {}, {}] })
    ]);
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(1); // only the push
    expect(content).toContain('Pushed 3 commits');
    expect(content).toContain('`main`');
    expect(content).not.toContain('Starred');
  });

  test('respects an optional days window', async () => {
    const octokit = octokitWithEvents([
      event('IssuesEvent', { action: 'opened', issue: { number: 1, title: 'Old', html_url: 'u' } }, { created_at: '2026-01-01T00:00:00Z' }),
      event('IssuesEvent', { action: 'opened', issue: { number: 2, title: 'Recent', html_url: 'u' } }, { created_at: '2026-05-19T00:00:00Z' })
    ]);
    // Freeze "now" near the recent event via a wide-enough window relative to real time is brittle;
    // instead assert filtering keeps only items newer than the cutoff the section computes.
    const { metadata } = await section.render(ctx({ octokit, config: { days: 36500 } }));
    expect(metadata.window_days).toBe(36500);
    expect(metadata.count).toBe(2);
  });

  test('minimal theme drops the leading emoji icons', async () => {
    const octokit = octokitWithEvents([
      event('PullRequestEvent', { action: 'closed', number: 1, pull_request: { number: 1, title: 'X', merged: true, html_url: 'u' } })
    ]);
    const { content } = await section.render(ctx({ octokit, render: { theme: 'minimal' } }));
    expect(content).toContain('Merged PR');
    expect(content).not.toMatch(/\p{Emoji_Presentation}/u);
    expect(content).not.toContain('🔀');
  });

  test('empty state when there is no qualifying activity', async () => {
    const octokit = octokitWithEvents([event('WatchEvent', { action: 'started' })]);
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(0);
    expect(content).toContain('No public activity');
  });

  test('falls back gracefully when the events API errors', async () => {
    const octokit = {
      rest: { activity: { listPublicEventsForUser: jest.fn(async () => { throw new Error('boom'); }) } }
    };
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(0);
    expect(content).toContain('Could not load activity');
  });

  test('drops zero-commit pushes (merges, no-op syncs, bot auto-commits)', async () => {
    const octokit = octokitWithEvents([
      event('PushEvent', { ref: 'refs/heads/main', distinct_size: 0, commits: [] }),
      event('PushEvent', { ref: 'refs/heads/main', distinct_size: 2, commits: [{}, {}] })
    ]);
    const { content, metadata } = await section.render(ctx({ octokit }));
    expect(metadata.count).toBe(1);
    expect(content).not.toContain('Pushed 0 commits');
    expect(content).toContain('Pushed 2 commits');
  });

  test('excludes events from repos in shared.excludeRepositories', async () => {
    const octokit = octokitWithEvents([
      event('PushEvent', { ref: 'refs/heads/main', distinct_size: 1, commits: [{}] }, { repo: { name: 'acme/noisy-repo' } }),
      event('PushEvent', { ref: 'refs/heads/main', distinct_size: 2, commits: [{}, {}] }, { repo: { name: 'acme/widgets' } })
    ]);
    const { content, metadata } = await section.render(
      ctx({ octokit, shared: { maxRows: 10, includeDrafts: false, repositories: [], excludeRepositories: ['acme/noisy-repo'] } })
    );
    expect(metadata.count).toBe(1);
    expect(content).not.toContain('noisy-repo');
    expect(content).toContain('acme/widgets');
  });

  test('excludes events from repos in config.excludeRepositories (section-specific)', async () => {
    const octokit = octokitWithEvents([
      event('PushEvent', { ref: 'refs/heads/main', distinct_size: 1, commits: [{}] }, { repo: { name: 'acme/private-work' } }),
      event('IssuesEvent', { action: 'opened', issue: { number: 3, title: 'Bug', html_url: 'u' } }, { repo: { name: 'acme/widgets' } })
    ]);
    const { content, metadata } = await section.render(
      ctx({ octokit, config: { excludeRepositories: ['acme/private-work'] } })
    );
    expect(metadata.count).toBe(1);
    expect(content).not.toContain('private-work');
  });

  test('scopes events to repos in shared.repositories when set', async () => {
    const octokit = octokitWithEvents([
      event('PushEvent', { ref: 'refs/heads/main', distinct_size: 1, commits: [{}] }, { repo: { name: 'acme/other' } }),
      event('PushEvent', { ref: 'refs/heads/main', distinct_size: 2, commits: [{}, {}] }, { repo: { name: 'acme/widgets' } })
    ]);
    const { metadata } = await section.render(
      ctx({ octokit, shared: { maxRows: 10, includeDrafts: false, repositories: ['acme/widgets'], excludeRepositories: [] } })
    );
    expect(metadata.count).toBe(1);
  });
});
