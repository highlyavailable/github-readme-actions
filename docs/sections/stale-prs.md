# stale_prs

Your open pull requests with no activity in N days. The "this is dying" alert list.

## Marker

```
<!--readme-actions:stale_prs:start-->
<!--readme-actions:stale_prs:end-->
```

## Output

| PR | Ref | Last activity | Comments |
|---|---|---|---|
| [old refactor](https://example.invalid) | `acme/api#402` | 5w | 3 |

Sorted oldest-first (least recently updated). Capped at `max_rows`.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `stale_days` | `14` | Threshold of inactivity in days. |
| `max_rows` | `10` | Cap on rows rendered. |
| `repositories` / `exclude_repositories` | _(all)_ | Repo scope. |

## Outputs

| Output | Description |
|---|---|
| `stale_prs_count` | Number of stale PRs found. |
| `stale_prs_stale_days` | Threshold used. |

## Query

```
type:pr author:<username> is:open updated:<<since>
```
