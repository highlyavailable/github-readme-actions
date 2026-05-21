function searchItem(overrides = {}) {
  return {
    number: 1,
    title: 'Default PR title',
    html_url: 'https://github.com/acme/widgets/pull/1',
    repository_url: 'https://api.github.com/repos/acme/widgets',
    state: 'open',
    draft: false,
    user: { login: 'octocat' },
    created_at: '2026-04-01T12:00:00Z',
    updated_at: '2026-05-15T12:00:00Z',
    comments: 0,
    pull_request: {},
    ...overrides
  };
}

function mockSearch(items, totalCount) {
  return jest.fn(async () => ({
    data: {
      items,
      total_count: totalCount ?? items.length
    }
  }));
}

function mockOctokit({ searchItems = [], totalCount } = {}) {
  return {
    rest: {
      search: {
        issuesAndPullRequests: mockSearch(searchItems, totalCount)
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

const NOW = new Date('2026-05-20T12:00:00Z').getTime();

// Plain bracket labels for tests; the production defaults are colored icons,
// but tests assert on stable, easy-to-grep strings.
const PLAIN_LABELS = {
  merged: '[merged]',
  open: '[open]',
  closed: '[closed]',
  draft: '[draft]',
  review_requested: '[review-requested]',
  changes_requested: '[changes-requested]',
  approved: '[approved]',
  conflicts: '[conflicts]',
  ci_failing: '[ci:failing]',
  ci_passing: '[ci:passing]',
  ci_pending: '[ci:pending]',
  stale: '[stale]',
  ready: '[ready]'
};

function renderCfg(overrides = {}) {
  return {
    style: overrides.style || 'table',
    columns: overrides.columns || null,
    empty_state: overrides.empty_state || null,
    date_format: overrides.date_format || 'relative',
    status_labels: { ...PLAIN_LABELS, ...(overrides.status_labels || {}) },
    sort: overrides.sort || null,
    extras: { viz_style: 'mermaid', ...(overrides.extras || {}) }
  };
}

function ctx(overrides = {}) {
  return {
    octokit: overrides.octokit || mockOctokit(),
    username: 'octocat',
    shared: {
      maxRows: 10,
      includeDrafts: false,
      repositories: [],
      excludeRepositories: [],
      ...(overrides.shared || {})
    },
    config: overrides.config || {},
    render: renderCfg(overrides.render || {})
  };
}

module.exports = { searchItem, mockOctokit, ctx, renderCfg, NOW };
