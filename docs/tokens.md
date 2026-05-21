# Token guide

The action talks to the GitHub REST and search APIs as the principal supplied via `github_token`. Choose the token type that matches the scope of your dashboard.

## Token comparison

| Token | Cross-repo PRs | Private repos | Setup | When to use |
|---|---|---|---|---|
| Default `GITHUB_TOKEN` | No — only the current repo | Only the current repo | None | Dashboard scoped to a single repo |
| Fine-grained PAT | Yes, on the repos you grant | Yes, on the repos you grant | Recommended | Default for personal profile READMEs |
| Classic PAT (`repo` scope) | Yes — all your repos | Yes — all your repos | Older flow | Only if a fine-grained PAT cannot express what you need |
| GitHub App installation token | Yes, on installed repos | Yes, on installed repos | Highest setup cost | Enterprise/org-wide dashboards |

## Recommended setup: fine-grained PAT

1. Visit **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Click **Generate new token**.
3. **Resource owner**: yourself (or the org you want covered).
4. **Repository access**: `All repositories`, or pick the set you want included.
5. **Repository permissions** — grant these:
   - `Contents: Read and write` (only needed if the action commits to the dashboard repo)
   - `Pull requests: Read`
   - `Metadata: Read` (auto-included)
   - `Issues: Read` (only needed if you render `recent_activity` over issue comments)
6. Expiration: pick a value that matches your rotation policy. The action will fail loudly when the token expires.
7. Save the token as a repository secret named `DASHBOARD_PAT` (or whatever you reference in the workflow).

## Permission minimums by section

| Section | Required permission |
|---|---|
| `open_prs` | `Pull requests: Read` |
| `response_inbox` | `Pull requests: Read`, `Issues: Read` |
| `review_inbox` | `Pull requests: Read` |
| `recent_activity` | `Issues: Read`, `Pull requests: Read` |
| `merged_prs` | `Pull requests: Read` |
| `stats` | `Pull requests: Read` |
| `pinned_prs` | `Pull requests: Read` |
| `stale_prs` | `Pull requests: Read` |
| `failing_ci` | `Pull requests: Read`, `Checks: Read` |
| `ready_to_merge` | `Pull requests: Read`, `Checks: Read` |
| `velocity_chart` | `Pull requests: Read` |
| `commit_heatmap` | Profile read (default) |
| `streak` | Profile read (default) |
| `command_center` | Union of the embedded blocks' requirements |

Plus `Contents: Read and write` on the dashboard repo itself, so the action can push the updated README.

## Rate limits

The action uses the authenticated search API (30 req/min) and the REST API (5,000 req/hr). A full dashboard run typically consumes:

- 1 search query per simple section (`open_prs`, `review_inbox`, `recent_activity`, `merged_prs`, `pinned_prs`)
- 3 search queries per `stats` period
- 1 search query plus 3 REST calls per open PR for `response_inbox`

For a contributor with 50 open PRs and the full dashboard, expect ~160 calls — well under the per-hour limit. The 6-hourly default schedule is comfortable.

## Security notes

- Treat the PAT as a secret. Use repository or environment secrets — never inline.
- Grant only the repositories that should appear in the dashboard.
- Rotate on the cadence your security team requires; the action surfaces 401s as warnings in the run log.
- If you operate under an org policy that disallows PATs, use a [GitHub App installation token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app) instead.
