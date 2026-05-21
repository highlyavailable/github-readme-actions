# review_inbox

Open PRs where you are a requested reviewer.

## Marker

```
<!--readme-actions:review_inbox:start-->
<!--readme-actions:review_inbox:end-->
```

## Output

| PR | Ref | Author | Updated |
|---|---|---|---|
| [feat: signed URLs](https://example.invalid) | `acme/api#510` | @alice | 4h |
| [tests: flaky retries](https://example.invalid) | `acme/cli#90` | @bob | 1d |

Sorted by update recency. Capped at `max_rows`.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `max_rows` | `10` | Cap on rows rendered. |
| `repositories` / `exclude_repositories` | _(all)_ | Repo scope. |

## Outputs

| Output | Description |
|---|---|
| `review_inbox_count` | Number of PRs awaiting your review (pre-cap). |

## Query

```
type:pr is:open review-requested:<username> [repo:... | -repo:...]
```
