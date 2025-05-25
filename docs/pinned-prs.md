# 📌 Pinned Pull Requests Action

Automatically showcase your most important pull requests across repositories in your GitHub README.

## 🚀 Quick Start

### 1. Add Comments to Your README

Add the following comments to your `README.md` where you want the content to appear:

```markdown
## 📌 Pinned Pull Requests

<!--START_SECTION:github-readme-actions-pinned_prs-->
<!--END_SECTION:github-readme-actions-pinned_prs-->
```

### 2. Create Workflow File

Create `.github/workflows/update-readme.yml`:

```yaml
name: Update README

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  update-readme:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    
    steps:
      - uses: actions/checkout@v4
      - uses: highlyavailable/github-readme-actions@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          ACTION_TYPE: 'pinned_prs'
```

## 📋 Configuration Options

### Core Inputs

| Input         | Description                                                     | Default                                                 | Required |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------- | -------- |
| GITHUB\_TOKEN | GitHub token for API access (can be provided via with: or env:) | \-                                                      | ✅        |
| GH\_USERNAME  | GitHub username to fetch data for                               | Repository owner                                        | ❌        |
| TARGET\_FILE  | File to update                                                  | README.md                                               | ❌        |
| COMMIT\_MSG   | Commit message                                                  | 🚀 Update README with GitHub actions                    | ❌        |
| COMMIT\_NAME  | Committer name                                                  | github-actions\[bot\]                                   | ❌        |
| COMMIT\_EMAIL | Committer email                                                 | 41898282+github-actions\[bot\]@users.noreply.github.com | ❌        |

### Pinned PRs Specific Inputs

| Input          | Description                                    | Default                        | Required |
| -------------- | ---------------------------------------------- | ------------------------------ | -------- |
| MAX\_LINES     | Maximum number of PRs to display               | 5                              | ❌        |
| PR\_STATE      | Filter by PR state (open, closed, merged, all) | all                            | ❌        |
| START\_DATE    | Start date for filtering (YYYY-MM-DD)          | \-                             | ❌        |
| END\_DATE      | End date for filtering (YYYY-MM-DD)            | \-                             | ❌        |
| BLACKLIST      | Comma-separated PR numbers to exclude          | \-                             | ❌        |
| REPOSITORIES   | Comma-separated list of repos (owner/repo)     | Searches all PRs across GitHub | ❌        |
| INCLUDE\_DRAFT | Include draft PRs                              | false                          | ❌        |
| SORT\_BY       | Sort PRs by (created, updated, popularity)     | updated                        | ❌        |

## 🎨 Example Configurations

### Basic Pinned PRs

```yaml
# Option 1: Token via environment (recommended)
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'pinned_prs'

# Option 2: Token via inputs
- uses: highlyavailable/github-readme-actions@main
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    ACTION_TYPE: 'pinned_prs'
```

### Advanced Configuration

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'pinned_prs'
    MAX_LINES: 10
    PR_STATE: 'merged'
    START_DATE: '2024-01-01'
    INCLUDE_DRAFT: 'true'
    SORT_BY: 'created'
    BLACKLIST: '123,456,789'
    REPOSITORIES: 'owner/repo1,owner/repo2'
    COMMIT_MSG: '🚀 Updated pinned PRs showcase'
```

### Filter by Date Range

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'pinned_prs'
    START_DATE: '2024-01-01'
    END_DATE: '2024-12-31'
    PR_STATE: 'merged'
    MAX_LINES: 15
```

## 📊 Output Format

The action generates a clean, formatted list of your PRs:

```markdown
- 🟢 [Add new feature for user authentication](https://github.com/owner/repo/pull/123) - owner/repo | [Issue #45](https://github.com/owner/repo/issues/45)
- 🟡 [Fix bug in payment processing](https://github.com/owner/repo/pull/124) - owner/repo
- 🔴 [Update documentation for API endpoints](https://github.com/owner/repo/pull/125) - owner/repo
```

### Status Indicators

* 🟢 **Merged** \- PR has been successfully merged
* 🟡 **Open** \- PR is currently open and under review
* 🔴 **Closed** \- PR was closed without merging

## 🔧 Advanced Usage

### Filtering Specific Repositories

```yaml
with:
  ACTION_TYPE: 'pinned_prs'
  REPOSITORIES: 'microsoft/vscode,facebook/react,google/tensorflow'
```

### Hiding Specific PRs

```yaml
with:
  ACTION_TYPE: 'pinned_prs'
  BLACKLIST: '123,456,789'  # Hide PRs #123, #456, and #789
```

## 📚 Examples

- [Basic Usage](../examples/basic-pinned-prs.yml) - Simple setup with default settings
- [Advanced Configuration](../examples/advanced-pinned-prs.yml) - Custom filtering and sorting
- [General Usage](../examples/basic-usage.yml) - Multiple actions in one workflow 