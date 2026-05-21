# Development

## Layout

```
github-readme-actions/
  action.yml              GitHub Action metadata + input schema
  index.js                Orchestrator: load config, render sections, write file, commit
  src/
    config.js             Input parsing + validation
    github.js             Octokit factory + shared API helpers
    render.js             Markdown rendering primitives (tables, links, status tags, age)
    readme.js             Marker-based block replacement
    git.js                Commit + push when running in CI
    sections/
      index.js            Section registry
      open-prs.js         Each section is a self-contained module with a render(ctx) fn
      response-inbox.js
      review-inbox.js
      recent-activity.js
      merged-prs.js
      stats.js
      pinned-prs.js
  test/
    helpers.js            mockOctokit + ctx test helpers
    render.test.js        Pure rendering primitives
    readme.test.js        Marker replacement
    config.test.js        Input parsing + validation
    sections/             One test file per section
  docs/                   User-facing documentation
  examples/               Copy-pasteable workflow files
  dist/                   Built bundle (committed; runs in CI)
```

## Commands

| Command | What it does |
|---|---|
| `make install` | `npm ci` |
| `make test` | Run the jest suite |
| `make test-watch` | Jest in watch mode |
| `make test-coverage` | Jest with coverage |
| `make lint` | Run eslint |
| `make lint-fix` | Run eslint with `--fix` |
| `make build` | Bundle `index.js` into `dist/` with `@vercel/ncc` |
| `make ci` | Lint, test, build, and verify there are no uncommitted changes |
| `make test-action` | Run the action locally against the real GitHub API (needs `GITHUB_TOKEN`) |

## Section contract

A section is an object with this shape:

```js
{
  name: 'open_prs',
  title: 'Open Pull Requests',
  async render(ctx) {
    return { content: '...', metadata: { count: 0 } };
  }
}
```

`ctx` is `{ octokit, username, shared, config }`:

- `octokit` — an `@actions/github` octokit instance
- `username` — the dashboard subject
- `shared` — global tuning: `maxRows`, `includeDrafts`, `repositories`, `excludeRepositories`
- `config` — section-specific config drawn from `action.yml` inputs and shaped in `src/config.js`

Return:

- `content` — the markdown body that goes between the section's markers (no headings; the user supplies those in their README)
- `metadata` — flat object surfaced as workflow outputs (`<section>_<key>`)

## Rendering rules

Use the helpers in [src/render.js](src/render.js): `link`, `mono`, `statusTag`, `table`, `bulletList`, `age`, `prRef`, `emptyState`. They handle markdown escaping and produce consistent output across sections.

## Testing

Each section has a dedicated test under `test/sections/<name>.test.js`. Use:

```js
const { mockOctokit, searchItem, ctx } = require('../helpers');
```

`mockOctokit` returns a stub with `rest.search.issuesAndPullRequests`, `rest.issues.listComments`, `rest.pulls.listReviewComments`, and `rest.pulls.listReviews`. `searchItem` builds search-API-shaped fixtures. `ctx` produces a fully-populated section context.

## Building the bundle

The action runs `dist/index.js` in GitHub-hosted runners, not your source. Run `make build` after any change to `index.js` or `src/`, and commit the regenerated `dist/`. CI fails if `dist/` is out of date.

## Local action run

```bash
export GITHUB_TOKEN=ghp_...
export INPUT_USERNAME=highlyavailable
export INPUT_SECTIONS=open_prs,review_inbox
export INPUT_TARGET_FILE=/tmp/README-test.md
make test-action
```

You'll need a `/tmp/README-test.md` with the relevant `<!--readme-actions:...-->` markers.

## Release

See [RELEASE.md](RELEASE.md).
