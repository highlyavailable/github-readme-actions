# commit_heatmap

A GitHub-style 7-row contribution heatmap, rendered with Unicode block characters for portability. Reads the same data as your GitHub profile contribution graph.

## Marker

```
<!--readme-actions:commit_heatmap:start-->
<!--readme-actions:commit_heatmap:end-->
```

## Output

```
**1,247 contributions** in the last 12 months

```text
M ░░▒▓███▓▒░░▒▓██▓▒░░▒▓████▓▒░░▒▓██▓▒░░▒▓████▓▒░░▒▓██▒
T ░░▒▒▓███▓▒░░▒▓██▓▒░░▒▒▓███▓▒░░▒▒▓██▓▒░░▒▒▓████▒░░░▒▓
W ··▒▓███▓▒░░▒▓██▓▒░░░▒▓███▓▒░░░▒▓██▓▒░░░▒▓████▓░░░░▒▓
...
```

_Legend: `·` 0 · `░` 1–2 · `▒` 3–5 · `▓` 6–10 · `█` 10+_
```

## Inputs

| Input | Default | Effect |
|---|---|---|
| `heatmap_months` | `12` | Months of history to include (also used by `streak`). |

## Outputs

| Output | Description |
|---|---|
| `commit_heatmap_count` | Total contributions across the window. |
| `commit_heatmap_months` | Months plotted. |

## Token requirements

This section uses GitHub's GraphQL `contributionsCollection`. A fine-grained PAT with default profile-read access is sufficient — no extra repository scopes needed.

## Why Unicode and not Mermaid?

Mermaid doesn't have a calendar-heatmap primitive that approximates the GitHub contribution grid. A Unicode 7×52 grid renders consistently in any markdown renderer.
