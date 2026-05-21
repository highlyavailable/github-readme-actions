# streak

Contribution streak counters derived from the same GraphQL `contributionsCollection` as `commit_heatmap`. If you render both sections, the data is fetched twice (acceptable: two cheap GraphQL calls per dashboard run).

## Marker

```
<!--readme-actions:streak:start-->
<!--readme-actions:streak:end-->
```

## Output

### `compact` style (default)

```
**14d** current · **47d** longest · **82%** active days · **1,247** contributions (last 12 months)
```

### `table` style

| Metric | Value |
|---|---|
| Current streak | 14 days |
| Longest streak | 47 days |
| Active days | 82% of last 12 months |
| Total contributions | 1,247 |

### `list` style

```
- **Current streak**: 14 days
- **Longest streak**: 47 days
- **Active days**: 82% of last 12 months
- **Total contributions**: 1,247
```

## Inputs

| Input | Default | Effect |
|---|---|---|
| `heatmap_months` | `12` | Months of history to scan. |
| `style` | `compact` | One of `compact`, `table`, `list`. |

## Outputs

| Output | Description |
|---|---|
| `streak_current` | Current consecutive-day streak. |
| `streak_longest` | Longest streak in the window. |
| `streak_active_percent` | % of days in the window with any contribution. |
| `streak_total` | Total contributions in the window. |
