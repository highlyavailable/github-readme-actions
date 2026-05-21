# failing_ci

Your open PRs with at least one check run currently failing, timed out, or cancelled. Actionable: each row needs a fix or a close.

## Marker

```
<!--readme-actions:failing_ci:start-->
<!--readme-actions:failing_ci:end-->
```

## Output

| PR | Ref | Failing checks | Updated |
|---|---|---|---|
| [add retry logic](https://example.invalid) | `acme/api#412` | `tests`, `lint` | 2h |

## Inputs

| Input | Default | Effect |
|---|---|---|
| `max_rows` | `10` | Cap on rows. |
| `repositories` / `exclude_repositories` | _(all)_ | Repo scope. |

## Available columns

`pr`, `ref`, `failed_checks`, `failed_names`, `updated`, `state`

## Outputs

| Output | Description |
|---|---|
| `failing_ci_count` | Number of PRs with red CI. |

## Cost

One `pulls.get` + one `checks.listForRef` per open PR. Token needs `checks: read` on the relevant repositories.
