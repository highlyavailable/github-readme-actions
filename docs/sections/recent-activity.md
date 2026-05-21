# recent_activity

Issues and PRs you have commented on in the last N days, grouped by repository.

## Marker

```
<!--readme-actions:recent_activity:start-->
<!--readme-actions:recent_activity:end-->
```

## Output

```
**`acme/api`** — 4 threads
  - [fix retry backoff](https://example.invalid) _(PR, 2h)_
  - [discussion: queue rewrite](https://example.invalid) _(issue, 1d)_

**`acme/cli`** — 2 threads
  - [docs: clarify flags](https://example.invalid) _(PR, 3d)_
```

Groups are ordered by thread count desc, items inside by update recency. The total number of threads rendered is bounded by `max_rows`.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `activity_days` | `14` | Window of comment activity to include. |
| `max_rows` | `10` | Total thread cap across all groups. |
| `repositories` / `exclude_repositories` | _(all)_ | Repo scope. |

## Outputs

| Output | Description |
|---|---|
| `recent_activity_count` | Total threads commented on in the window. |
| `recent_activity_window_days` | Window used. |

## Query

```
commenter:<username> updated:>=<since> [repo:... | -repo:...]
```
