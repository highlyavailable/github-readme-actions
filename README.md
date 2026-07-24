# GitHub README Dashboard

[![Release](https://img.shields.io/github/v/release/highlyavailable/github-readme-actions?label=release&color=2563eb)](https://github.com/highlyavailable/github-readme-actions/releases)
[![Marketplace](https://img.shields.io/badge/marketplace-readme--dashboard-2563eb?logo=github)](https://github.com/marketplace/actions/github-readme-actions)
[![CI](https://img.shields.io/github/actions/workflow/status/highlyavailable/github-readme-actions/ci.yml?branch=main&label=ci)](https://github.com/highlyavailable/github-readme-actions/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A GitHub Action that keeps a **live contributor dashboard** in any markdown file: open PRs, recently merged PRs, threads awaiting your response, pending review requests, a timestamped activity timeline, and contribution stats — refreshed on a schedule, scoped to your account, configurable per section, and committed back to the repo.

It's a single place to see what needs your attention and what you've shipped across every repo you work in.

---

## What it produces

Each section is a self-contained markdown block, addressed by a comment marker pair. You compose your README out of the blocks you want; the action keeps them in sync. The headline block is `standup` — a single marker pair with the whole dashboard inside. Example:

```
<!--readme-actions:response_inbox:start-->
| PR | Ref | Last reply | Age |
| --- | --- | --- | --- |
| [Run concurrent dev server starts as parallel subtests](https://github.com/temporalio/cli/pull/1026) | [`temporalio/cli#1026`](https://github.com/temporalio/cli/pull/1026) | [@CLAassistant](https://github.com/CLAassistant) | 5d |
<!--readme-actions:response_inbox:end-->
```

## Live demo

This README dogfoods the action. The block below is a single `standup` section — one marker pair, full dashboard inside. Regenerated every 6 hours by [.github/workflows/readme-dashboard.yml](.github/workflows/readme-dashboard.yml).

<!--readme-actions:standup:start-->
> ### Standup · [`highlyavailable`](https://github.com/highlyavailable)
> _Updated 2026-07-24 08:19 UTC_
>
> **Last 30 days** 3 opened (↑2) · 0 merged (↓2) · 0 reviewed (=) · velocity `▁▁█▁▁▂▁▁▁▁▄▁` 0.9/wk
>
> **Inbox** 🟢 0 ready · 🔴 1 failing · 🟠 0 stale · 🟡 0 awaiting reply · 🔵 0 review requests
>
> **Aging** 🟢 0 0–3d · 🟡 0 3–7d · 🟠 3 1–2w · 🔴 8 2w+

#### Needs attention (4)

- [ ] 🔴 CI failing — [gcp: migrate Pub/Sub input and output to the pubsub/v2 SDK](https://github.com/redpanda-data/connect/pull/4432) — [`redpanda-data/connect#4432`](https://github.com/redpanda-data/connect/pull/4432) <!--ack:fp=1nghy9p-->
- [ ] 🔴 CI failing — [esti: test lakectl fs upload of files over 5GiB](https://github.com/treeverse/lakeFS/pull/10478) — [`treeverse/lakeFS#10478`](https://github.com/treeverse/lakeFS/pull/10478) <!--ack:fp=4vaek9-->
- [ ] 🔴 CI failing — [ffi: use correct glibc SONAME libc.so.6 in processor example](https://github.com/redpanda-data/connect/pull/4597) — [`redpanda-data/connect#4597`](https://github.com/redpanda-data/connect/pull/4597) <!--ack:fp=4sgq9f-->
- [ ] 🔴 CI failing — [opensearch: support the create action in the output](https://github.com/redpanda-data/connect/pull/4598) — [`redpanda-data/connect#4598`](https://github.com/redpanda-data/connect/pull/4598) <!--ack:fp=dntm7a-->

#### Open pull requests (4)

| PR | Ref | State | Comments | Updated |
| --- | --- | --- | --- | --- |
| [gcp: migrate Pub/Sub input and output to the pubsub/v2 SDK](https://github.com/redpanda-data/connect/pull/4432) | [`redpanda-data/connect#4432`](https://github.com/redpanda-data/connect/pull/4432) | 🟡 open | 6 | 3d |
| [esti: test lakectl fs upload of files over 5GiB](https://github.com/treeverse/lakeFS/pull/10478) | [`treeverse/lakeFS#10478`](https://github.com/treeverse/lakeFS/pull/10478) | 🟡 open | 0 | 11d |
| [ffi: use correct glibc SONAME libc.so.6 in processor example](https://github.com/redpanda-data/connect/pull/4597) | [`redpanda-data/connect#4597`](https://github.com/redpanda-data/connect/pull/4597) | 🟡 open | 0 | 11d |
| [opensearch: support the create action in the output](https://github.com/redpanda-data/connect/pull/4598) | [`redpanda-data/connect#4598`](https://github.com/redpanda-data/connect/pull/4598) | 🟡 open | 0 | 11d |

#### Recently merged (4)

| PR | Ref | Merged |
| --- | --- | --- |
| [Support per-node callbacks via string import paths](https://github.com/astronomer/astronomer-cosmos/pull/2781) | [`astronomer/astronomer-cosmos#2781`](https://github.com/astronomer/astronomer-cosmos/pull/2781) | 2026-06-11 |
| [feat(inputs.directory_monitor): Allow to preserve timestamps when moving file](https://github.com/influxdata/telegraf/pull/18921) | [`influxdata/telegraf#18921`](https://github.com/influxdata/telegraf/pull/18921) | 2026-05-28 |
| [fix: declare opentelemetry-semantic-conventions for aio-pika, logging, pika and system-metrics](https://github.com/open-telemetry/opentelemetry-python-contrib/pull/4594) | [`open-telemetry/opentelemetry-python-contrib#4594`](https://github.com/open-telemetry/opentelemetry-python-contrib/pull/4594) | 2026-05-19 |
| [fix(confluent-kafka): declare opentelemetry-semantic-conventions as a direct dependency](https://github.com/open-telemetry/opentelemetry-python-contrib/pull/4590) | [`open-telemetry/opentelemetry-python-contrib#4590`](https://github.com/open-telemetry/opentelemetry-python-contrib/pull/4590) | 2026-05-18 |

#### Recent activity (5)

- 💬 Commented on PR [#4432 gcp: migrate Pub/Sub input and output to the pubsub/v2 SDK](https://github.com/redpanda-data/connect/pull/4432#issuecomment-5027380168) in [`redpanda-data/connect`](https://github.com/redpanda-data/connect) _(3d)_
- 📤 Opened PR #10478 in [`treeverse/lakeFS`](https://github.com/treeverse/lakeFS) _(11d)_
- 📤 Opened PR #4598 in [`redpanda-data/connect`](https://github.com/redpanda-data/connect) _(11d)_
- 📤 Opened PR #4597 in [`redpanda-data/connect`](https://github.com/redpanda-data/connect) _(11d)_
- 💬 Commented on PR [#4432 gcp: migrate Pub/Sub input and output to the pubsub/v2 SDK](https://github.com/redpanda-data/connect/pull/4432#issuecomment-4819241493) in [`redpanda-data/connect`](https://github.com/redpanda-data/connect) _(3w)_

---
_[View open PRs on GitHub](https://github.com/issues?q=type%3Apr+author%3Ahighlyavailable+is%3Aopen) · [Review requests](https://github.com/issues?q=type%3Apr+review-requested%3Ahighlyavailable+is%3Aopen) · [Customize this dashboard](https://github.com/highlyavailable/github-readme-actions/blob/main/docs/customization.md)_
<!--readme-actions:standup:end-->

### Full merged-PR history

Standalone `merged_prs` block — every accepted PR in the window (`merged_window_days`), up to `max_rows`.

<!--readme-actions:merged_prs:start-->
| PR | Ref | Merged |
| --- | --- | --- |
| [Support per-node callbacks via string import paths](https://github.com/astronomer/astronomer-cosmos/pull/2781) | [`astronomer/astronomer-cosmos#2781`](https://github.com/astronomer/astronomer-cosmos/pull/2781) | 2026-06-11 |
| [feat(inputs.directory_monitor): Allow to preserve timestamps when moving file](https://github.com/influxdata/telegraf/pull/18921) | [`influxdata/telegraf#18921`](https://github.com/influxdata/telegraf/pull/18921) | 2026-05-28 |
| [fix: declare opentelemetry-semantic-conventions for aio-pika, logging, pika and system-metrics](https://github.com/open-telemetry/opentelemetry-python-contrib/pull/4594) | [`open-telemetry/opentelemetry-python-contrib#4594`](https://github.com/open-telemetry/opentelemetry-python-contrib/pull/4594) | 2026-05-19 |
| [fix(confluent-kafka): declare opentelemetry-semantic-conventions as a direct dependency](https://github.com/open-telemetry/opentelemetry-python-contrib/pull/4590) | [`open-telemetry/opentelemetry-python-contrib#4590`](https://github.com/open-telemetry/opentelemetry-python-contrib/pull/4590) | 2026-05-18 |
| [prometheus: validate exponential histogram scale range (#6779)](https://github.com/open-telemetry/opentelemetry-go/pull/6822) | [`open-telemetry/opentelemetry-go#6822`](https://github.com/open-telemetry/opentelemetry-go/pull/6822) | 2025-06-16 |
| [fix: reduce API test memory consumption from 8.26GB to 1.57GB (#8263)](https://github.com/treeverse/lakeFS/pull/9097) | [`treeverse/lakeFS#9097`](https://github.com/treeverse/lakeFS/pull/9097) | 2025-06-08 |
| [Separate configurations for colorized and json logs in Task SDK / Celery Executor](https://github.com/apache/airflow/pull/51082) | [`apache/airflow#51082`](https://github.com/apache/airflow/pull/51082) | 2025-06-03 |
| [Fix/issue 6560 install trace bridge test](https://github.com/open-telemetry/opentelemetry-go/pull/6814) | [`open-telemetry/opentelemetry-go#6814`](https://github.com/open-telemetry/opentelemetry-go/pull/6814) | 2025-05-26 |
| [bridge/opencensus: add test for OTelSpanContextToOC function](https://github.com/open-telemetry/opentelemetry-go/pull/6813) | [`open-telemetry/opentelemetry-go#6813`](https://github.com/open-telemetry/opentelemetry-go/pull/6813) | 2025-05-23 |
| [Create RateMyProfessors.com-Selenium-Scraper.yml](https://github.com/up-for-grabs/up-for-grabs.net/pull/3744) | [`up-for-grabs/up-for-grabs.net#3744`](https://github.com/up-for-grabs/up-for-grabs.net/pull/3744) | 2023-02-10 |
<!--readme-actions:merged_prs:end-->

### Extended activity timeline

Standalone `activity_feed` block — a longer slice of the public-events timeline than the compact preview in the dashboard above.

<!--readme-actions:activity_feed:start-->
- 💬 Commented on PR [#4432 gcp: migrate Pub/Sub input and output to the pubsub/v2 SDK](https://github.com/redpanda-data/connect/pull/4432#issuecomment-5027380168) in [`redpanda-data/connect`](https://github.com/redpanda-data/connect) _(3d)_
- 📤 Opened PR #10478 in [`treeverse/lakeFS`](https://github.com/treeverse/lakeFS) _(11d)_
- 📤 Opened PR #4598 in [`redpanda-data/connect`](https://github.com/redpanda-data/connect) _(11d)_
- 📤 Opened PR #4597 in [`redpanda-data/connect`](https://github.com/redpanda-data/connect) _(11d)_
- 💬 Commented on PR [#4432 gcp: migrate Pub/Sub input and output to the pubsub/v2 SDK](https://github.com/redpanda-data/connect/pull/4432#issuecomment-4819241493) in [`redpanda-data/connect`](https://github.com/redpanda-data/connect) _(3w)_
<!--readme-actions:activity_feed:end-->

## Quickstart

**1. Add markers to your README** for each section you want:

```markdown
## Open pull requests
<!--readme-actions:open_prs:start-->
<!--readme-actions:open_prs:end-->

## Response inbox
<!--readme-actions:response_inbox:start-->
<!--readme-actions:response_inbox:end-->
```

**2. Add a workflow** at `.github/workflows/readme-dashboard.yml`:

```yaml
name: Readme dashboard
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: highlyavailable/github-readme-actions@v2
        with:
          github_token: ${{ secrets.DASHBOARD_PAT }}
          sections: open_prs, response_inbox, review_inbox, recent_activity
```

**3. Provision a token.** `GITHUB_TOKEN` only sees the current repository. For a real dashboard you need a fine-grained PAT with `Pull requests: Read` and `Metadata: Read` on the repositories you want included. Store it as `DASHBOARD_PAT`. Full matrix in [docs/tokens.md](docs/tokens.md).

That's it. The action runs on the schedule, regenerates each block, and commits if anything changed.

## Available sections

### Composite

| Section | Description | Docs |
|---|---|---|
| `standup` | A single block containing the full dashboard: KPIs, velocity sparkline, a "needs attention" checklist, and embedded tables for open PRs / recently merged / response inbox / review inbox. | [docs](docs/sections/standup.md) |

### Inbox / activity (tables and lists)

| Section | Description | Docs |
|---|---|---|
| `open_prs` | All your open PRs across repos, with state and age | [docs](docs/sections/open-prs.md) |
| `response_inbox` | Your PRs where the last reply is from someone else | [docs](docs/sections/response-inbox.md) |
| `review_inbox` | PRs where you are a requested reviewer | [docs](docs/sections/review-inbox.md) |
| `stale_prs` | Your open PRs with no activity in N days | [docs](docs/sections/stale-prs.md) |
| `failing_ci` | Your open PRs with currently red CI | [docs](docs/sections/failing-ci.md) |
| `ready_to_merge` | Your PRs approved + mergeable + green | [docs](docs/sections/ready-to-merge.md) |
| `recent_activity` | Issues/PRs you've commented on recently, grouped by repo | [docs](docs/sections/recent-activity.md) |
| `merged_prs` | Recently merged PRs for bookkeeping | [docs](docs/sections/merged-prs.md) |
| `pinned_prs` | Curated showcase list of PRs, filtered by state/date with an explicit blacklist | [docs](docs/sections/pinned-prs.md) |

### Visualizations

| Section | Description | Docs |
|---|---|---|
| `velocity_chart` | 12-week PRs-per-week chart (Mermaid `xychart-beta`, Unicode fallback) | [docs](docs/sections/velocity-chart.md) |
| `commit_heatmap` | GitHub-style 7×52 contribution heatmap in Unicode | [docs](docs/sections/commit-heatmap.md) |
| `streak` | Current + longest streak, active-day %, total contributions | [docs](docs/sections/streak.md) |
| `stats` | Opened / merged / reviewed counts per period | [docs](docs/sections/stats.md) |

## Configuration

Every section's output is configurable: style (table / list / compact), columns, status labels, date format, and empty-state copy — via inline `with:` inputs or a `.github/readme-dashboard.yml` file. Full guide: [docs/customization.md](docs/customization.md).

All inputs are documented in [docs/configuration.md](docs/configuration.md). The most common ones:

| Input | Default | Description |
|---|---|---|
| `github_token` | _(required)_ | Token with cross-repo read access |
| `username` | repo owner | GitHub login to build the dashboard for |
| `sections` | `open_prs,response_inbox,review_inbox,recent_activity` | Sections to render |
| `target_file` | `README.md` | File to update |
| `max_rows` | `10` | Default per-section row cap |
| `include_drafts` | `false` | Include draft PRs |
| `repositories` | _(all)_ | Comma-separated `owner/repo` allowlist |
| `exclude_repositories` | _(none)_ | Comma-separated `owner/repo` blocklist |
| `commit` | `true` | Set to `false` to skip the auto-commit and handle it yourself |
| `config_file` | `.github/readme-dashboard.yml` | YAML file with per-section render config |
| `date_format` | `relative` | `relative`, `absolute`, or `both` |
| `status_labels` | _(defaults)_ | JSON object overriding status tag text |
| `viz_style` | `mermaid` | Visualization style: `mermaid`, `unicode`, or `both` |
| `stale_days` | `14` | Inactivity threshold for `stale_prs` |
| `velocity_weeks` | `12` | Weeks plotted by `velocity_chart` |
| `heatmap_months` | `12` | Months covered by `commit_heatmap` and `streak` |
| `standup_layout` | `hero,needs_attention,open_prs,recently_merged,response_inbox,review_inbox,activity_feed` | Blocks inside `standup` |
| `standup_rows` | `5` | Per-block row cap inside `standup` |

Section-specific knobs (`activity_days`, `merged_window_days`, `stats_periods`, etc.) are listed in [docs/configuration.md](docs/configuration.md).

## Examples

Ready-to-copy workflow files live in [examples/](examples/):

- [examples/minimal.yml](examples/minimal.yml) — single section, default config
- [examples/full-dashboard.yml](examples/full-dashboard.yml) — every section enabled
- [examples/scoped.yml](examples/scoped.yml) — restrict to a specific set of repositories
- [examples/no-commit.yml](examples/no-commit.yml) — render only, commit handled by your own step
- [examples/readme-dashboard.yml](examples/readme-dashboard.yml) — drop-in `.github/readme-dashboard.yml` showing every customization knob
- [examples/standup.yml](examples/standup.yml) — single composite `standup` section + visualizations

## Outputs

| Output | Description |
|---|---|
| `updated` | `true` if the target file changed |
| `sections_rendered` | Comma-separated list of sections that rendered successfully |
| `sections_failed` | Comma-separated list of sections that errored or had no marker |
| `<section>_count` | Row count rendered for that section |

## Development

```bash
make install      # install deps
make test         # run jest suite (no network)
make ci           # lint, test, build, verify dist/ is fresh
make build        # rebuild dist/
```

### Try it against real data

```bash
export GITHUB_TOKEN=ghp_yourFineGrainedPAT
make test-render                    # renders for highlyavailable
USERNAME=octocat make test-render   # render for a different user
```

`test-render` invokes [scripts/test-local.sh](scripts/test-local.sh), which writes a scratch file under `/tmp/` (never your real README) and prints the rendered markdown. Set `SECTIONS`, `MAX_ROWS`, `ACTIVITY_DAYS`, or `CONFIG_FILE` to override.

Pull requests are also smoke-tested by [.github/workflows/action-smoke-test.yml](.github/workflows/action-smoke-test.yml), which runs the action end-to-end with `GITHUB_TOKEN`.

Architecture, section authoring guide, and release process: [DEVELOPMENT.md](DEVELOPMENT.md).
Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
