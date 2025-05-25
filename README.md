# GitHub README Actions

[![GitHub release](https://img.shields.io/github/release/highlyavailable/github-readme-actions.svg)](https://github.com/highlyavailable/github-readme-actions/releases)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-github--readme--actions-blue?logo=github)](https://github.com/marketplace/actions/github-readme-actions)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A collection of GitHub Actions to automatically update your README with dynamic content. Perfect for showcasing your GitHub activity, education, and contributions in your profile!

## ✨ Available Actions

### 🎯 Pinned Pull Requests

Automatically showcase your most important pull requests across repositories.

**[📖 Full Documentation](docs/pinned-prs.md)** | **[📚 Examples](examples/)**

### 🎓 Course List

Display your educational background with a clean, organized table of college courses and institutions.

**[📖 Full Documentation](docs/course-list.md)** | **[📚 Examples](examples/)**

## 🚀 Quick Start

### 1. Add Comments to Your README

Add the following comments to your `README.md` where you want the content to appear:

```markdown
## Your Section Title

<!--START_SECTION:github-readme-actions-<action_type>-->
<!--END_SECTION:github-readme-actions-<action_type>-->
```

Replace `<action_type>` with one of: `pinned_prs`, `course_list`

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
          ACTION_TYPE: '<action_type>'  # pinned_prs, course_list, etc.
```

### 3. Trigger the Action

The action will run automatically based on your schedule, or you can trigger it manually from the Actions tab.

## 📋 Configuration Options

### Core Inputs

| Input         | Description                                                     | Default                                                 | Required |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------- | -------- |
| GITHUB\_TOKEN | GitHub token for API access (can be provided via with: or env:) | \-                                                      | ✅        |
| ACTION\_TYPE  | Type of action (pinned\_prs, course\_list)                      | pinned\_prs                                             | ❌        |
| GH\_USERNAME  | GitHub username to fetch data for                               | Repository owner                                        | ❌        |
| TARGET\_FILE  | File to update                                                  | README.md                                               | ❌        |
| COMMIT\_MSG   | Commit message                                                  | 🚀 Update README with GitHub actions                    | ❌        |
| COMMIT\_NAME  | Committer name                                                  | github-actions\[bot\]                                   | ❌        |
| COMMIT\_EMAIL | Committer email                                                 | 41898282+github-actions\[bot\]@users.noreply.github.com | ❌        |

For action-specific configuration options, see the detailed documentation:
- **[Pinned PRs Configuration](docs/pinned-prs.md#-configuration-options)**
- **[Course List Configuration](docs/course-list.md#-configuration-options)**

## 🎨 Example Configurations

### Basic Usage

```yaml
# Pinned PRs
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'pinned_prs'

# Course List
- uses: highlyavailable/github-readme-actions@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    ACTION_TYPE: 'course_list'
```

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
  
  # Update course list
  - uses: highlyavailable/github-readme-actions@main
    env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    with:
      ACTION_TYPE: 'course_list'
```

## 📚 Documentation

### For Users

* **[Pinned PRs Guide](docs/pinned-prs.md)** \- Complete guide for showcasing pull requests
* **[Course List Guide](docs/course-list.md)** \- Complete guide for displaying education
* **[Example Workflows](examples/)** \- Ready-to-use workflow files

### For Contributors & Developers

* **[Contributing Guide](CONTRIBUTING.md)** \- How to contribute to this project
* **[Development Guide](DEVELOPMENT.md)** \- Local development setup and workflow
* **[Release Guide](RELEASE.md)** \- Release process and versioning

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

* Inspired by [jamesgeorge007/github-activity-readme](https://github.com/jamesgeorge007/github-activity-readme)
* Built using GitHub Actions

## 📞 Support

If you have any questions or run into issues, please [open an issue](https://github.com/highlyavailable/github-readme-actions/issues) on GitHub.

---

⭐ If you find this action helpful, please consider giving it a star!
