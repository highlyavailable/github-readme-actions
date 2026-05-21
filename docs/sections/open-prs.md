# open_prs

All of your currently open pull requests across the repositories the token can see.

## Marker

```
<!--readme-actions:open_prs:start-->
<!--readme-actions:open_prs:end-->
```

## Output

A table with one row per open PR:

| PR | Ref | State | Comments | Updated |
|---|---|---|---|---|
| [add retry logic](https://example.invalid) | `acme/api#412` | [open] | 3 | 2h |
| [refactor: queue](https://example.invalid) | `acme/api#405` | [draft] | 0 | 1d |

State is one of `[open]` or `[draft]`. Sorted by `updated` descending. Capped at `max_rows`.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `max_rows` | `10` | Cap on rows rendered. |
| `include_drafts` | `false` | Set to `true` to include drafts. |
| `repositories` | _(all)_ | Restrict to a specific allowlist. |
| `exclude_repositories` | _(none)_ | Exclude specific repos. |

## Outputs

| Output | Description |
|---|---|
| `open_prs_count` | Number of open PRs found (pre-cap). |

## Query

```
type:pr author:<username> is:open [-draft:true] [repo:... | -repo:...]
```
