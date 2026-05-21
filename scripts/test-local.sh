#!/usr/bin/env bash
# Local dry-run for the dashboard action.
# Renders against the real GitHub API and writes to a scratch file in /tmp,
# so your real README is never touched.
#
# Usage:
#   GITHUB_TOKEN=ghp_... ./scripts/test-local.sh [username]
#
# Optional environment overrides:
#   SECTIONS=open_prs,response_inbox    # which sections to render
#   MAX_ROWS=5
#   ACTIVITY_DAYS=14
#   CONFIG_FILE=.github/readme-dashboard.yml

set -euo pipefail

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN is required. Use a fine-grained PAT — see docs/tokens.md."
  exit 1
fi

USERNAME="${1:-${USER:-octocat}}"
SECTIONS="${SECTIONS:-command_center,commit_heatmap,streak,velocity_chart,open_prs,response_inbox,review_inbox,recent_activity,merged_prs,stats,stale_prs,failing_ci,ready_to_merge}"
MAX_ROWS="${MAX_ROWS:-5}"
ACTIVITY_DAYS="${ACTIVITY_DAYS:-14}"
CONFIG_FILE="${CONFIG_FILE:-.github/readme-dashboard.yml}"
TARGET="${TARGET:-/tmp/readme-dashboard-test.md}"

# Build a scratch README with every marker pair.
cat > "$TARGET" <<MARKER
# Local test render for $USERNAME

## Command center
<!--readme-actions:command_center:start-->
<!--readme-actions:command_center:end-->

## Contribution heatmap
<!--readme-actions:commit_heatmap:start-->
<!--readme-actions:commit_heatmap:end-->

## Streak
<!--readme-actions:streak:start-->
<!--readme-actions:streak:end-->

## Velocity
<!--readme-actions:velocity_chart:start-->
<!--readme-actions:velocity_chart:end-->

## Stats
<!--readme-actions:stats:start-->
<!--readme-actions:stats:end-->

## Open PRs
<!--readme-actions:open_prs:start-->
<!--readme-actions:open_prs:end-->

## Stale PRs
<!--readme-actions:stale_prs:start-->
<!--readme-actions:stale_prs:end-->

## Failing CI
<!--readme-actions:failing_ci:start-->
<!--readme-actions:failing_ci:end-->

## Ready to merge
<!--readme-actions:ready_to_merge:start-->
<!--readme-actions:ready_to_merge:end-->

## Response inbox
<!--readme-actions:response_inbox:start-->
<!--readme-actions:response_inbox:end-->

## Review inbox
<!--readme-actions:review_inbox:start-->
<!--readme-actions:review_inbox:end-->

## Recent activity
<!--readme-actions:recent_activity:start-->
<!--readme-actions:recent_activity:end-->

## Recently merged
<!--readme-actions:merged_prs:start-->
<!--readme-actions:merged_prs:end-->
MARKER

echo "Rendering for $USERNAME -> $TARGET"
echo "Sections: $SECTIONS"
echo

INPUT_GITHUB_TOKEN="$GITHUB_TOKEN" \
INPUT_USERNAME="$USERNAME" \
INPUT_SECTIONS="$SECTIONS" \
INPUT_TARGET_FILE="$TARGET" \
INPUT_MAX_ROWS="$MAX_ROWS" \
INPUT_ACTIVITY_DAYS="$ACTIVITY_DAYS" \
INPUT_CONFIG_FILE="$CONFIG_FILE" \
INPUT_STALE_DAYS="${STALE_DAYS:-21}" \
INPUT_VIZ_STYLE="${VIZ_STYLE:-mermaid}" \
INPUT_COMMIT=false \
node index.js

echo
echo "----- rendered output -----"
cat "$TARGET"
echo "----- end -----"
echo
echo "Saved to: $TARGET"
