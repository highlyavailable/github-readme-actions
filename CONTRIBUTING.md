# Contributing

Thanks for your interest in improving this action.

## Prerequisites

- Node.js 18 or newer
- npm
- Git
- Make (preinstalled on macOS and Linux)

## Setup

```bash
git clone https://github.com/highlyavailable/github-readme-actions.git
cd github-readme-actions
make install
```

## Workflow

```bash
make test           # jest
make lint           # eslint
make build          # rebuild dist/
make ci             # lint + test + build, then verify dist/ is up to date
```

CI runs `make ci`. If you change code in `index.js` or `src/`, rebuild `dist/` and commit it — GitHub Actions runs the bundled `dist/index.js`, not your source.

## Adding a new section

Sections live in [src/sections/](../src/sections/) and follow a small contract:

```js
module.exports = {
  name: 'my_section',
  title: 'My Section',
  async render(ctx) {
    // ctx = { octokit, username, shared, config }
    return {
      content: '...markdown body...',
      metadata: { count: rows.length }
    };
  }
};
```

To wire it up:

1. Add the file under `src/sections/`.
2. Register it in [src/sections/index.js](../src/sections/index.js).
3. Add inputs to [action.yml](../action.yml) if your section needs new tuning knobs, and wire them through [src/config.js](../src/config.js).
4. Add tests under `test/sections/<name>.test.js` using the `mockOctokit` and `ctx` helpers in [test/helpers.js](../test/helpers.js).
5. Document it under `docs/sections/<name>.md` and add a row to the README table.

## Pull requests

- Keep changes focused. One section, one fix, one refactor per PR.
- Include or update tests.
- Run `make ci` locally before pushing.
- Describe the user-visible change in the PR body.

## Reporting issues

Include:

- A minimal reproduction (workflow YAML + the relevant README markers)
- Action run logs (with secrets redacted)
- What you expected, what you got
- Environment info (`actions/checkout` version, runner OS if non-default)

## Releases

Maintainers cut releases. See [RELEASE.md](RELEASE.md) for the process.
