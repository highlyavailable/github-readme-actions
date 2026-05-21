# command_center

A composite "app window" section: one marker pair, one block, dense by design. Output is grouped, color-coded, and deep-linked so it reads at a glance.

## Marker

```
<!--readme-actions:command_center:start-->
<!--readme-actions:command_center:end-->
```

## Output

```
> ### Command Center · [`highlyavailable`](https://github.com/highlyavailable)
> _Updated 2026-05-21 04:41 UTC_
>
> **This week** 7 opened · 2 merged · 0 reviewed · velocity `▁▁▁▁▂▁▁▁▁▁▁▇` 0.7/wk
>
> **Inbox** 🟢 0 ready · 🔴 1 failing · 🟠 3 stale · 🟡 1 awaiting reply · 🔵 0 review requests

#### Needs attention (4)

| Why | PR | Ref |
|---|---|---|
| 🔴 CI failing | [gcp: migrate Pub/Sub...](url) | [`redpanda-data/connect#4432`](url) |
| 🟠 stale 28d | [docs: refresh guide](url) | [`acme/api#380`](url) |
| 🟢 ready to merge | [feat: rate limit](url) | [`acme/api#420`](url) |

#### Open pull requests (8)

| PR | Ref | State | Comments | Updated |
|---|---|---|---|---|
| [add retry logic](url) | [`acme/api#412`](url) | 🟡 open | 3 | 2h |

#### Awaiting your reply (1)

| PR | Ref | Last reply | Age |
|---|---|---|---|
| [add retry logic](url) | [`acme/api#412`](url) | [@CLAassistant](https://github.com/CLAassistant) | 5d |
```

The hero is a single blockquote: heading, timestamp, KPI line, inbox pills. The velocity sparkline lives inline in the KPI line — no big chart, just signal. Empty subsections are dropped automatically.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `command_center_layout` | `hero,needs_attention,open_prs,response_inbox,review_inbox` | Comma-separated list of blocks in order. |
| `command_center_rows` | `5` | Per-block row cap for embedded tables. |
| `stale_days` | `14` | Threshold used by the `needs_attention` and `stale_prs` blocks. |

## Available blocks

| Block | What it renders |
|---|---|
| `hero` | Blockquote: heading, timestamp, KPI line + inline sparkline, inbox pills |
| `needs_attention` | Unified table combining failing CI + stale + ready-to-merge PRs |
| `open_prs` | Top open PRs table |
| `stale_prs` | Stale PRs table (standalone, separate from `needs_attention`) |
| `failing_ci` | Failing CI table (standalone) |
| `ready_to_merge` | Ready-to-merge table (standalone) |
| `response_inbox` | Awaiting-your-reply table |
| `review_inbox` | Pending-review-requests table |

Each subsection is automatically suppressed when its data is empty.

## Example layouts

**Default — recommended for most users:**

```yaml
sections:
  command_center:
    layout: [hero, needs_attention, open_prs, response_inbox, review_inbox]
    per_block_rows: 5
```

**Maintainer focus — only show what needs action:**

```yaml
sections:
  command_center:
    layout: [hero, needs_attention]
    per_block_rows: 10
```

**Inbox-only — drop the open-PR drilldown:**

```yaml
sections:
  command_center:
    layout: [hero, response_inbox, review_inbox]
```

## Outputs

| Output | Description |
|---|---|
| `command_center_open_prs_count` | Open PR count |
| `command_center_awaiting_reply_count` | Threads waiting on you |
| `command_center_review_requests_count` | Pending review requests |
| `command_center_ready_count` | Approved + mergeable PRs |
| `command_center_failing_count` | PRs with failing CI |
| `command_center_stale_count` | PRs untouched past `stale_days` |
| `command_center_week_opened` | PRs opened in the last 7 days |
| `command_center_week_merged` | PRs merged in the last 7 days |
| `command_center_week_reviewed` | PRs you reviewed in the last 7 days |

## How it works

The composite calls the same `render(ctx)` functions used by individual sections, but only uses them for accurate counts and the drill-down tables. The hero builds its own KPI line from cheap count-only search queries (one per metric), plus a 12-week velocity bucket for the inline sparkline. The `needs_attention` table re-queries the underlying search to keep titles + refs handy in a unified shape.

Everything runs in parallel, so total wall time is roughly `max(individual section time)` — no additive cost over running the same sections standalone.
