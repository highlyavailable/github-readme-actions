# ready_to_merge

Your open PRs that are approved, mergeable, and have all-green CI. The satisfying "ship it" list.

## Marker

```
<!--readme-actions:ready_to_merge:start-->
<!--readme-actions:ready_to_merge:end-->
```

## Output

| PR | Ref | Status | Comments |
|---|---|---|---|
| [feat: rate limit](https://example.invalid) | `acme/api#420` | [approved] | 4 |

## Inputs

| Input | Default | Effect |
|---|---|---|
| `max_rows` | `10` | Cap on rows. |
| `repositories` / `exclude_repositories` | _(all)_ | Repo scope. |

## Available columns

`pr`, `ref`, `state`, `approved_age`, `comments`

## Outputs

| Output | Description |
|---|---|
| `ready_to_merge_count` | Number of PRs ready to ship. |

## Cost

One `pulls.get` + one `checks.listForRef` per approved PR. Token needs `checks: read` on the relevant repositories.

## Query

```
type:pr author:<username> is:open review:approved
```
Then client-side filtered for `mergeable: true` and no failing/in-progress checks.
