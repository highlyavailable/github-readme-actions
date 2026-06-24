# Configuration reference

All inputs are passed via the `with:` block of the action step. Names are lowercase snake_case.

## Core

| Input | Type | Default | Description |
|---|---|---|---|
| `github_token` | string | _(required)_ | A token with read access to the repositories you want included. See [tokens.md](tokens.md). |
| `username` | string | repo owner | GitHub login the dashboard is built for. |
| `sections` | csv | `open_prs,response_inbox,review_inbox,recent_activity` | Comma-separated list of sections to render. |
| `target_file` | string | `README.md` | File to update. Must contain the relevant marker pairs. |
| `commit_message` | string | `chore: update readme dashboard` | Commit subject when changes are pushed. |
| `commit_name` | string | `github-actions[bot]` | Committer name. |
| `commit_email` | string | `41898282+github-actions[bot]@users.noreply.github.com` | Committer email. |
| `commit` | bool | `true` | If `false`, the action writes the file but does not commit or push. |
| `config_file` | string | `.github/readme-dashboard.yml` | YAML file with per-section rendering config. Missing file is treated as empty. See [customization.md](customization.md). |
| `date_format` | enum | `relative` | One of `relative` / `absolute` / `both`. Applies to every section unless overridden in the config file. |
| `theme` | enum | `default` | `default` shows emoji status icons; `minimal` strips all emoji for a clean, plain-text dashboard. Per-section override and custom `status_labels` still win. |
| `status_labels` | JSON | _(defaults)_ | JSON object overriding status tag text. Wins over the same key in the config file. |

## Shared section tuning

These apply to every section that renders rows or filters by repository.

| Input | Type | Default | Description |
|---|---|---|---|
| `max_rows` | int | `10` | Maximum rows rendered per section. |
| `include_drafts` | bool | `false` | Include draft PRs in PR-based sections. |
| `repositories` | csv | _(all)_ | `owner/repo` allowlist. Empty means all repos the token can see. |
| `exclude_repositories` | csv | _(none)_ | `owner/repo` blocklist. Applied after the allowlist. |

## Section-specific

| Input | Used by | Default | Description |
|---|---|---|---|
| `activity_days` | `recent_activity` | `14` | Window of comment activity to include. |
| `activity_feed_days` | `activity_feed` | `0` | Optional days window for the public activity timeline. `0` = most recent regardless of age. |
| `activity_feed_types` | `activity_feed` | _(default set)_ | Comma-separated event types to include; overrides the default set. |
| `merged_window_days` | `merged_prs` | `90` | Look-back window for merged PRs. |
| `stats_periods` | `stats` | `week,month,year` | Any of `week`, `month`, `quarter`, `year`. |
| `pinned_prs_state` | `pinned_prs` | `all` | Filter PRs by `open`, `closed`, `merged`, or `all`. |
| `pinned_prs_start_date` | `pinned_prs` | _(none)_ | `YYYY-MM-DD` lower bound on `created`. |
| `pinned_prs_end_date` | `pinned_prs` | _(none)_ | `YYYY-MM-DD` upper bound on `created`. |
| `pinned_prs_blacklist` | `pinned_prs` | _(none)_ | Comma-separated PR numbers to exclude. |
| `pinned_prs_sort_by` | `pinned_prs` | `updated` | One of `created`, `updated`, `popularity`. |
| `stale_days` | `stale_prs` | `14` | Inactivity threshold in days. |
| `velocity_weeks` | `velocity_chart` | `12` | Weeks plotted. |
| `heatmap_months` | `commit_heatmap`, `streak` | `12` | Months of GraphQL contribution history. |
| `command_center_layout` | `command_center` | _(see docs)_ | Comma-separated list of blocks inside the composite. |
| `command_center_rows` | `command_center` | `5` | Per-block row cap inside the composite. |
| `viz_style` | global | `mermaid` | Visualization style for chart sections: `mermaid`, `unicode`, `both`. |

## Markers

Each section is identified in your target file by a comment marker pair:

```
<!--readme-actions:<section>:start-->
<!--readme-actions:<section>:end-->
```

Anything between the two markers is replaced on every run. Anything outside is preserved verbatim.

Legacy v1 markers for `pinned_prs` are still recognized:

```
<!--START_SECTION:github-readme-actions-pinned_prs-->
<!--END_SECTION:github-readme-actions-pinned_prs-->
```

## Outputs

| Output | Description |
|---|---|
| `updated` | `true` if the target file was modified. |
| `sections_rendered` | Comma-separated list of sections that wrote successfully. |
| `sections_failed` | Comma-separated list of sections that errored or whose markers were missing. |
| `<section>_<key>` | Per-section metadata (typically `<section>_count`). |
