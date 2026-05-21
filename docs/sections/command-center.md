# command_center

A composite "app window" section: one marker pair, one block, but inside is a full dashboard widget with a header, KPIs, a velocity chart, and one or more drill-down tables.

Use when you want a single distinctive block at the top of your README, instead of stacking many individual sections.

## Marker

```
<!--readme-actions:command_center:start-->
<!--readme-actions:command_center:end-->
```

## Output

```
> **Command Center** — octocat · _Updated 2026-05-21 14:30 UTC_

| Period | Opened | Merged | Reviewed |
|---|---|---|---|
| Week | 7 | 2 | 5 |

#### Velocity

```mermaid
xychart-beta
    title "PRs opened per week (last 12 weeks) — avg 4.3/wk"
    ...
```

#### Open Pull Requests

| PR | Ref | State | Comments | Updated |
|---|---|---|---|---|
| [add retry logic](...) | `acme/api#412` | [open] | 3 | 2h |
| ... (5 rows max) |

#### Response Inbox

| PR | Ref | Last reply | Age |
|---|---|---|---|
| ... (5 rows max) |

#### Review Inbox

| PR | Ref | Author | Updated |
|---|---|---|---|
| ... (5 rows max) |

---
_open prs count: 7 · response inbox count: 3 · review inbox count: 1_
```

## How it works

`command_center` is a *composite* section. Internally it calls the same `render(ctx)` functions used by individual sections (`open_prs`, `response_inbox`, etc.) — the data, formatting, and configuration are all shared, so there's no duplicated logic and one config change updates both the standalone section and the composite.

Each embedded block uses a smaller `maxRows` (controlled by `command_center_rows`) so the composite stays compact.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `command_center_layout` | `kpis,velocity,open_prs,response_inbox,review_inbox` | Comma-separated list of blocks in order. |
| `command_center_rows` | `5` | Per-block row cap for embedded tables. |

## Available blocks

| Block | What it renders |
|---|---|
| `kpis` | Header line + a week-period stats table |
| `velocity` | Velocity chart (Mermaid or Unicode per `viz_style`) |
| `open_prs` | Top open PRs table |
| `stale_prs` | Stale PRs table |
| `failing_ci` | Failing CI table |
| `ready_to_merge` | Ready-to-merge table |
| `response_inbox` | Response inbox table |
| `review_inbox` | Review inbox table |

## Example layouts

**Maintainer-focused:**

```yaml
sections:
  command_center:
    layout: [kpis, ready_to_merge, failing_ci, stale_prs]
    per_block_rows: 8
```

**Activity-focused:**

```yaml
sections:
  command_center:
    layout: [kpis, velocity, response_inbox, review_inbox]
```

**Minimal:**

```yaml
sections:
  command_center:
    layout: [kpis, open_prs]
    per_block_rows: 3
```

## Outputs

Composite-level outputs aggregate the embedded sections:

| Output | Description |
|---|---|
| `command_center_open_prs_count` | Open PR count from the embedded block. |
| `command_center_response_inbox_count` | Response inbox count. |
| `command_center_review_inbox_count` | Review inbox count. |
| (per block) | One `_count` output per embedded block that produced one. |

## Cost

Same as running each embedded section individually — no extra requests. Use `command_center` instead of stacking the same sections to get the composite header, footer, and formatting consistency.
