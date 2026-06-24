# activity_feed

A chronological timeline of your **public** GitHub activity — PRs opened/merged/closed, reviews, issue and PR comments, issues opened/closed, pushes, releases, tags — each with a relative timestamp. Answers "how active is this person right now" at a glance.

Built from GitHub's [Events API](https://docs.github.com/en/rest/activity/events). Two constraints follow from that:

- **No reactions.** Reactions (👍 etc.) are not events, so the Events API never returns them. This section intentionally omits them.
- **Public + recent only.** The Events API exposes public activity, capped by GitHub at roughly the last 300 events / 90 days per user. Older or private activity will not appear.

## Marker

```
<!--readme-actions:activity_feed:start-->
<!--readme-actions:activity_feed:end-->
```

## Output

```
- 🔀 Merged PR [#412 add retry logic](url) in acme/api _(2h)_
- 💬 Commented on PR [#418 queue rewrite](url) in acme/api _(5h)_
- ✅ Approved [#77 docs: clarify flags](url) in acme/cli _(1d)_
- 🐛 Opened issue [#9 flaky test on CI](url) in acme/api _(2d)_
- ⬆️ Pushed 3 commits to `main` in acme/api _(2d)_
- 🚀 Published release [v2.3](url) in acme/widgets _(4d)_
```

Newest first, bounded by `max_rows`.

## Default event types

Rendered by default (high-signal contribution activity):
`PullRequestEvent`, `PullRequestReviewEvent`, `PullRequestReviewCommentEvent`, `IssueCommentEvent`, `IssuesEvent`, `PushEvent`, `CommitCommentEvent`, `ReleaseEvent`, `CreateEvent` (tags/repos).

Excluded by default (low-signal): starring (`WatchEvent`), forking (`ForkEvent`), branch creation, membership, wiki edits. Add any of them back with `activity_feed_types`.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `activity_feed_days` | `0` | Optional look-back window in days. `0` shows the most recent events regardless of age. |
| `activity_feed_types` | _(default set)_ | Comma-separated event types to include. Overrides the default set entirely. |
| `max_rows` | `10` | Number of timeline entries to render. |

## Outputs

| Output | Description |
|---|---|
| `activity_feed_count` | Qualifying events in the window. |
| `activity_feed_shown` | Entries actually rendered (`<= max_rows`). |
| `activity_feed_commits` | Commits pushed (summed). |
| `activity_feed_comments` | Comment events. |
| `activity_feed_reviews` | Review events. |
| `activity_feed_prs` | PR open/merge/close events. |
| `activity_feed_issues` | Issue events. |

## Query

```
GET /users/<username>/events/public  (paginated)
```
