# response_inbox

Your open PRs where the most recent comment, review comment, or review submission came from someone other than you — i.e. the threads currently blocked on your reply.

## Marker

```
<!--readme-actions:response_inbox:start-->
<!--readme-actions:response_inbox:end-->
```

## Output

| PR | Ref | Last reply | Age |
|---|---|---|---|
| [add retry logic](https://example.invalid) | `acme/api#412` | @alice | 2d |
| [docs: fix typo](https://example.invalid) | `acme/cli#88` | @bob | 5h |

Sorted by reply recency (newest reply first). Capped at `max_rows`.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `max_rows` | `10` | Cap on rows rendered. |
| `include_drafts` | `false` | Include drafts. |
| `repositories` / `exclude_repositories` | _(all)_ | Repo scope. |

## Outputs

| Output | Description |
|---|---|
| `response_inbox_count` | Number of threads waiting on a response (pre-cap). |

## Cost

This section does an additional 3 REST calls per open PR (issue comments, review comments, reviews). At 50 open PRs that is ~150 extra calls per run — comfortable inside the 5,000/hr authenticated quota.
