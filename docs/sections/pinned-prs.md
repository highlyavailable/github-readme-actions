# pinned_prs

Curated showcase list of pull requests, with filtering by state, date, and an explicit blacklist.

## Marker

```
<!--readme-actions:pinned_prs:start-->
<!--readme-actions:pinned_prs:end-->
```

## Output

A bullet list:

```
- [merged] [feat: indexed search](https://example.invalid) — `acme/api#502`
- [open]   [refactor: queue](https://example.invalid)     — `acme/api#510`
- [draft]  [docs: api guide](https://example.invalid)     — `acme/api#511`
```

## Inputs

| Input | Default | Effect |
|---|---|---|
| `pinned_prs_state` | `all` | Filter to `open`, `closed`, `merged`, or `all`. |
| `pinned_prs_start_date` | _(none)_ | `YYYY-MM-DD` lower bound on creation date. |
| `pinned_prs_end_date` | _(none)_ | `YYYY-MM-DD` upper bound on creation date. |
| `pinned_prs_blacklist` | _(none)_ | Comma-separated PR numbers to exclude. |
| `pinned_prs_sort_by` | `updated` | One of `created`, `updated`, `popularity`. |
| `max_rows` | `10` | Cap on rows. |
| `include_drafts` | `false` | Include drafts. |
| `repositories` / `exclude_repositories` | _(all)_ | Repo scope. |

## Outputs

| Output | Description |
|---|---|
| `pinned_prs_count` | Number of PRs rendered after blacklist filtering. |
| `pinned_prs_total` | Number of PRs returned by the underlying query. |
