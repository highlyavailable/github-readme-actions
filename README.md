# GitHub README Actions

[![GitHub release](https://img.shields.io/github/release/highlyavailable/github-readme-actions.svg)](https://github.com/highlyavailable/github-readme-actions/releases)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-github--readme--actions-blue?logo=github)](https://github.com/marketplace/actions/github-readme-actions)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A collection of GitHub Actions to automatically update your README with dynamic content. Perfect for showcasing your GitHub activity and contributions in your profile!

## ✨ Available Actions

### 🎯 Pinned Pull Requests
Automatically showcase your most important pull requests across repositories.


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

### 3. Trigger the Action

The action will run automatically based on your schedule, or you can trigger it manually from the Actions tab.

## 📋 Configuration Options

### Core Inputs

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `GITHUB_TOKEN` | GitHub token for API access | - | ✅ |
| `ACTION_TYPE` | Type of action (`pinned_prs`, more coming soon) | `pinned_prs` | ❌ |
| `GH_USERNAME` | GitHub username to fetch data for | Repository owner | ❌ |
| `TARGET_FILE` | File to update | `README.md` | ❌ |
| `COMMIT_MSG` | Commit message | `🚀 Update README with GitHub actions` | ❌ |
| `COMMIT_NAME` | Committer name | `github-actions[bot]` | ❌ |
| `COMMIT_EMAIL` | Committer email | `41898282+github-actions[bot]@users.noreply.github.com` | ❌ |

### Pinned PRs Specific Inputs

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `MAX_LINES` | Maximum number of PRs to display | `5` | ❌ |
| `PR_STATE` | Filter by PR state (`open`, `closed`, `merged`, `all`) | `all` | ❌ |
| `START_DATE` | Start date for filtering (YYYY-MM-DD) | - | ❌ |
| `END_DATE` | End date for filtering (YYYY-MM-DD) | - | ❌ |
| `BLACKLIST` | Comma-separated PR numbers to exclude | - | ❌ |
| `REPOSITORIES` | Comma-separated list of repos (owner/repo) | All user repos | ❌ |
| `INCLUDE_DRAFT` | Include draft PRs | `false` | ❌ |
| `SORT_BY` | Sort PRs by (`created`, `updated`, `popularity`) | `updated` | ❌ |

## 🎨 Example Configurations

### Basic Pinned PRs

```yaml
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'pinned_prs'
```

### Advanced Pinned PRs Configuration

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

### Pinned Pull Requests

The action generates a clean, formatted list of your PRs:

```markdown
- 🟢 [Add new feature for user authentication](https://github.com/owner/repo/pull/123) - owner/repo | [Issue #45](https://github.com/owner/repo/issues/45)
- 🟡 [Fix bug in payment processing](https://github.com/owner/repo/pull/124) - owner/repo
- 🔴 [Update documentation for API endpoints](https://github.com/owner/repo/pull/125) - owner/repo
```

#### Status Indicators

- 🟢 **Merged** - PR has been successfully merged
- 🟡 **Open** - PR is currently open and under review
- 🔴 **Closed** - PR was closed without merging

## 🔧 Advanced Usage

### Multiple Actions in One Workflow

```yaml
steps:
  - uses: actions/checkout@v4
  
  # Update pinned PRs
  - uses: highlyavailable/github-readme-actions@main
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    with:
      ACTION_TYPE: 'pinned_prs'
      MAX_LINES: 5
  
  # Future: Add more actions
  # - uses: highlyavailable/github-readme-actions@main
  #   env:
  #     GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  #   with:
  #     ACTION_TYPE: 'new_action'
```

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

## 📚 Documentation

### For Users

- **[Quick Start Guide](#-quick-start)** - Get up and running in minutes
- **[Configuration Options](#-configuration-options)** - Complete reference for all inputs
- **[Example Configurations](#-example-configurations)** - Common usage patterns
- **[Examples](examples/)** - Ready-to-use workflow files

### For Contributors & Developers

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to this project
- **[Development Guide](DEVELOPMENT.md)** - Local development setup and workflow
- **[Release Guide](RELEASE.md)** - Release process and versioning

### Quick Commands

If you're developing locally, use our Makefile for common tasks:

```bash
make help          # Show all available commands
make dev           # Full development workflow
make test          # Run tests
make ci            # Run CI pipeline
```

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md).

**Quick contribution steps:**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/NewFeature`)
3. Follow the [Development Guide](DEVELOPMENT.md) for local setup
4. Run `make check` to ensure your changes pass all tests
5. Commit your changes (`git commit -m 'Add some NewFeature'`)
6. Push to the branch (`git push origin feature/NewFeature`)
7. Open a Pull Request


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [jamesgeorge007/github-activity-readme](https://github.com/jamesgeorge007/github-activity-readme)
- Built using GitHub Actions

## 📞 Support

If you have any questions or run into issues, please [open an issue](https://github.com/highlyavailable/github-readme-actions/issues) on GitHub.

---

⭐ If you find this action helpful, please consider giving it a star!
