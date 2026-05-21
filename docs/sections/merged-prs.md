# merged_prs

Recently merged PRs you authored. Intended for bookkeeping (year-end reviews, quarterly summaries, contribution logs).

## Marker

```
<!--readme-actions:merged_prs:start-->
<!--readme-actions:merged_prs:end-->
```

## Output

| PR | Ref | Merged |
|---|---|---|
| [feat: index search](https://example.invalid) | `acme/api#502` | 2026-05-15 |
| [chore: drop legacy adapter](https://example.invalid) | `acme/api#499` | 2026-05-10 |

Sorted by merge date descending. Capped at `max_rows`.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `merged_window_days` | `90` | Look-back window. |
| `max_rows` | `10` | Cap on rows rendered. |
| `repositories` / `exclude_repositories` | _(all)_ | Repo scope. |

## Outputs

| Output | Description |
|---|---|
| `merged_prs_count` | Number of merged PRs in the window (pre-cap). |
| `merged_prs_window_days` | Window used. |

## Query

```
type:pr author:<username> is:merged merged:>=<since> [repo:... | -repo:...]
```
