# Customization

Every section's output is configurable. You can change the table layout, swap to a bullet list or one-line compact form, pick which columns appear, rewrite the status labels, change date formatting, and override empty-state copy.

Two ways to configure:

1. **Inline `with:` inputs** — quick switches and small overrides directly in the workflow.
2. **`.github/readme-dashboard.yml`** — the canonical place for non-trivial configuration. Pointed to via the `config_file` input (this is the default path).

Inline inputs always win over the file. The file always wins over built-in defaults.

## Config file shape

```yaml
# .github/readme-dashboard.yml

# Defaults applied to every section unless overridden.
defaults:
  theme: default                 # default (emoji icons) | minimal (plain text, no emoji)
  date_format: relative          # relative | absolute | both
  status_labels:
    merged: merged
    open: open
    draft: wip
  empty_state: "Nothing to show right now."

# Per-section configuration.
sections:
  open_prs:
    style: table                 # table | list | compact
    columns: [pr, ref, state, updated]
    sort: updated_desc           # see "Sort options" below
    empty_state: "Inbox zero."

  response_inbox:
    style: list
    columns: [pr, last_reply, age]

  review_inbox:
    style: table
    columns: [pr, ref, author, updated]

  recent_activity:
    group_by: repo               # repo | none — `none` renders flat
    show_kind: false             # hide the "(PR)" / "(issue)" tag

  merged_prs:
    style: table
    columns: [pr, ref, merged_date]

  stats:
    style: compact               # compact = "Week: 3o/2m/5r · Month: ..."

  pinned_prs:
    style: list
    columns: [state, pr, ref]
```

## Inline overrides

```yaml
- uses: highlyavailable/github-readme-actions@v2
  with:
    github_token: ${{ secrets.DASHBOARD_PAT }}
    sections: open_prs, response_inbox
    date_format: absolute
    status_labels: '{"merged":"merged","open":"open","draft":"wip"}'
```

`status_labels` accepts a JSON string. Use the YAML file for anything more complex.

## Style options

| Style | When to use | Looks like |
|---|---|---|
| `table` | Default. Best for dense data with multiple columns. | `\| PR \| Ref \| State \|` markdown table |
| `list`  | Cleaner inside a profile README, smaller surface area. | `- title — \`ref\` — [state]` |
| `compact` | One line per item, joined by `·`. Good for sidebars or stats. | `title · \`ref\` · [state]` |

## Themes

The fastest way to control the dashboard's look is the `theme` setting:

| Theme | Look |
|---|---|
| `default` | Emoji status icons everywhere — inbox pills (🟢🔴🟠🟡🔵), aging buckets, needs-attention reasons, activity-feed icons, and emoji `status_labels`. Maximum at-a-glance signal. |
| `minimal` | **No emoji anywhere.** Same information, plain text. Clean and modular — ideal if you want an effective, distraction-free profile or you're embedding the dashboard somewhere emoji render poorly. |

Set it once and every section follows:

```yaml
# inline
with:
  theme: minimal
```

```yaml
# or in the config file
defaults:
  theme: minimal
```

`minimal` swaps the emoji `status_labels` for plain words (`merged`, `open`, `failing`, …) and drops the hardcoded icons in `command_center` and `activity_feed`. You can still override any individual label on top of either theme, and a single section can opt back into the other theme:

```yaml
defaults:
  theme: minimal           # clean by default
sections:
  command_center:
    theme: default         # ...but keep the pills colorful in the hero
```

Before / after for the activity feed:

```
default:  - 🔀 Merged PR [#412 add retry logic](url) in acme/api _(2h)_
minimal:  - Merged PR [#412 add retry logic](url) in acme/api _(2h)_
```

## Status labels

Defaults are functional colored indicators (signal, not decoration). Each is a key in `status_labels`. (Switching `theme: minimal` replaces all of these with their plain-text equivalents in one move — reach for individual overrides only when you want something in between.)

| Key | Default | Where it shows up |
|---|---|---|
| `merged` | `🟢 merged` | pinned_prs |
| `open` | `🟡 open` | open_prs, pinned_prs |
| `closed` | `🔴 closed` | pinned_prs |
| `draft` | `⚪ draft` | open_prs, pinned_prs |
| `review_requested` | `🔵 review-requested` | command_center inbox pills |
| `changes_requested` | `🟠 changes-requested` | (future) |
| `approved` | `🟢 approved` | ready_to_merge |
| `conflicts` | `🔴 conflicts` | (future) |
| `ci_failing` | `🔴 failing` | failing_ci |
| `ci_passing` | `🟢 passing` | (future) |
| `ci_pending` | `🟡 pending` | (future) |
| `stale` | `🟠 stale` | command_center needs attention |
| `ready` | `🟢 ready` | command_center inbox pills |

Override individual keys; unspecified keys keep their defaults. Prefer plain text? Set `merged: "[merged]"`. Want all-caps? Set `open: "OPEN"`. Use whatever palette your README needs.

To go fully monochrome:

```yaml
defaults:
  status_labels:
    merged: "[merged]"
    open: "[open]"
    closed: "[closed]"
    draft: "[draft]"
    approved: "[approved]"
    ci_failing: "[ci:failing]"
    stale: "[stale]"
    ready: "[ready]"
```

## Date format

| Mode | Example |
|---|---|
| `relative` (default) | `2h`, `3d`, `5w` |
| `absolute` | `2026-05-20` |
| `both` | `2026-05-20 (5d)` |

## Available columns

### open_prs
| Column | Content |
|---|---|
| `pr` | Linked PR title |
| `ref` | `owner/repo#number` in monospace |
| `state` | `[open]` or `[draft]` (subject to `status_labels`) |
| `comments` | Comment count |
| `updated` | When the PR last changed (subject to `date_format`) |
| `created` | When the PR was opened |

Sort options: `updated_desc`, `created_desc`, `comments_desc`.

### response_inbox
| Column | Content |
|---|---|
| `pr` | Linked PR title |
| `ref` | `owner/repo#number` |
| `last_reply` | `@username` of the last replier |
| `age` | Age of the last reply (relative or absolute per `date_format`) |
| `updated` | When the PR last changed |

### review_inbox
| Column | Content |
|---|---|
| `pr` | Linked PR title |
| `ref` | `owner/repo#number` |
| `author` | `@username` of the PR author |
| `updated` | When the PR last changed |
| `created` | When the PR was opened |

### merged_prs
| Column | Content |
|---|---|
| `pr` | Linked PR title |
| `ref` | `owner/repo#number` |
| `merged_date` | Absolute `YYYY-MM-DD` of the merge |
| `merged` | Subject to `date_format` (relative shows the age of the merge) |
| `created` | When the PR was opened |

### pinned_prs
| Column | Content |
|---|---|
| `state` | Status tag |
| `pr` | Linked PR title |
| `ref` | `owner/repo#number` |
| `updated` | When the PR last changed |
| `created` | When the PR was opened |

### recent_activity
This section does not use the column model. Tunables:

| Key | Values |
|---|---|
| `group_by` | `repo` (default) or `none` |
| `show_kind` | `true` (default) or `false` — toggles the `(PR)` / `(issue)` tag |
| `style` | `table` forces flat output regardless of `group_by` |

### stats
This section does not use the column model. Tunables:

| Key | Values |
|---|---|
| `style` | `table` (default), `list`, or `compact` |

## Worked examples

### Bring emojis back

```yaml
defaults:
  status_labels:
    merged: "🟢"
    open: "🟡"
    closed: "🔴"
    draft: "📝"
```

### Single-line compact dashboard

```yaml
sections:
  open_prs:
    style: compact
    columns: [pr, state]
  response_inbox:
    style: compact
    columns: [pr, last_reply]
  stats:
    style: compact
```

### Enterprise / monochrome look

```yaml
defaults:
  date_format: absolute
  status_labels:
    merged: "MERGED"
    open: "OPEN"
    closed: "CLOSED"
    draft: "DRAFT"
  empty_state: "No items in scope."

sections:
  open_prs:
    style: table
    columns: [pr, ref, state, updated]
  merged_prs:
    style: table
    columns: [pr, ref, merged_date]
```
