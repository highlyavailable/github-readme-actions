# stats

Numeric KPIs: PRs opened, PRs merged, and PRs reviewed by you, one row per period.

## Marker

```
<!--readme-actions:stats:start-->
<!--readme-actions:stats:end-->
```

## Output

| Period | Opened | Merged | Reviewed |
|---|---|---|---|
| Week | 3 | 2 | 5 |
| Month | 12 | 9 | 18 |
| Year | 84 | 71 | 142 |

## Inputs

| Input | Default | Effect |
|---|---|---|
| `stats_periods` | `week,month,year` | Subset of `week`, `month`, `quarter`, `year`. |
| `repositories` / `exclude_repositories` | _(all)_ | Repo scope. |

## Outputs

| Output | Description |
|---|---|
| `stats_periods` | Periods that actually rendered (some inputs are dropped if unknown). |

## Queries

For each period the action runs three count-only search queries:

```
type:pr author:<u>     created:>=<since>           -> Opened
type:pr author:<u>     is:merged merged:>=<since>  -> Merged
type:pr reviewed-by:<u> -author:<u> updated:>=<since> -> Reviewed
```
