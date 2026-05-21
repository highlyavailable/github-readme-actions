# Migrating from v1 to v2

v2 is a clean break. The action moved from a single-purpose pinned-PR generator to a multi-section contributor dashboard. Input names, marker format, and the action's identity all changed.

## What changed

| Area | v1 | v2 |
|---|---|---|
| Action ref | `highlyavailable/github-readme-actions@v1` | `highlyavailable/github-readme-actions@v2` |
| Input names | `SCREAMING_SNAKE_CASE` | `lowercase_snake_case` |
| Action selector | `ACTION_TYPE: pinned_prs` | `sections: pinned_prs[, ...]` |
| Markers | `<!--START_SECTION:github-readme-actions-pinned_prs-->` | `<!--readme-actions:<name>:start-->` |
| Token via env | `env: GITHUB_TOKEN: ...` | Same, plus `with: github_token: ...` |
| Commit message default | `🚀 Update README with GitHub actions` | `chore: update readme dashboard` |

## Step-by-step

### 1. Bump the action ref

```diff
- - uses: highlyavailable/github-readme-actions@v1
+ - uses: highlyavailable/github-readme-actions@v2
```

### 2. Rename inputs

Use the [configuration reference](docs/configuration.md) as the canonical map. Common renames for v1 `pinned_prs` users:

| v1 input | v2 input |
|---|---|
| `ACTION_TYPE` | _(replaced by `sections`)_ |
| `GH_USERNAME` | `username` |
| `TARGET_FILE` | `target_file` |
| `COMMIT_MSG` | `commit_message` |
| `COMMIT_NAME` | `commit_name` |
| `COMMIT_EMAIL` | `commit_email` |
| `MAX_LINES` | `max_rows` |
| `PR_STATE` | `pinned_prs_state` |
| `START_DATE` | `pinned_prs_start_date` |
| `END_DATE` | `pinned_prs_end_date` |
| `BLACKLIST` | `pinned_prs_blacklist` |
| `REPOSITORIES` | `repositories` |
| `INCLUDE_DRAFT` | `include_drafts` |
| `SORT_BY` | `pinned_prs_sort_by` |

### 3. Replace `ACTION_TYPE` with `sections`

```diff
- with:
-   ACTION_TYPE: pinned_prs
+ with:
+   sections: pinned_prs
```

### 4. Markers — leave them alone (or upgrade)

The v1 markers still work for `pinned_prs`. If you want to use the new namespaced format, swap to:

```diff
- <!--START_SECTION:github-readme-actions-pinned_prs-->
- <!--END_SECTION:github-readme-actions-pinned_prs-->
+ <!--readme-actions:pinned_prs:start-->
+ <!--readme-actions:pinned_prs:end-->
```

All new sections (`open_prs`, `response_inbox`, etc.) must use the new format.

### 5. Provision a fine-grained PAT

v1 worked acceptably with the default `GITHUB_TOKEN` because pinned-PR usage was already limited. v2's dashboard sections rely on cross-repo search. Issue a fine-grained PAT — full guide in [docs/tokens.md](docs/tokens.md) — and store it as `DASHBOARD_PAT`:

```diff
- env:
-   GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+ with:
+   github_token: ${{ secrets.DASHBOARD_PAT }}
```

## Before / after

**v1 workflow:**

```yaml
- uses: highlyavailable/github-readme-actions@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: pinned_prs
    MAX_LINES: 5
    PR_STATE: merged
```

**v2 equivalent (pinned-only):**

```yaml
- uses: highlyavailable/github-readme-actions@v2
  with:
    github_token: ${{ secrets.DASHBOARD_PAT }}
    sections: pinned_prs
    max_rows: 5
    pinned_prs_state: merged
```

**v2, upgraded to the full dashboard:**

```yaml
- uses: highlyavailable/github-readme-actions@v2
  with:
    github_token: ${{ secrets.DASHBOARD_PAT }}
    sections: open_prs, response_inbox, review_inbox, recent_activity, merged_prs
    max_rows: 10
```

## Rollback

v1 is still tagged and reachable at `highlyavailable/github-readme-actions@v1`. The two versions can coexist in separate workflow files if you want to test v2 incrementally.
