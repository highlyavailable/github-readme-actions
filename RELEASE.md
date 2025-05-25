# Release Guide

This document outlines the process for releasing new versions of the GitHub Pinned PR Readme action.

## 🚀 Release Process

### Automated Release (Recommended)

1. **Prepare for Release**
   ```bash
   # Run full CI checks
   make release-check
   
   # Bump version (choose one)
   make version-patch  # 1.0.0 -> 1.0.1
   make version-minor  # 1.0.0 -> 1.1.0
   make version-major  # 1.0.0 -> 2.0.0
   ```

2. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "Bump version to $(node -e "console.log(require('./package.json').version)")"
   git push origin main
   ```

3. **Create Release via GitHub Actions**
   - Go to the Actions tab in your GitHub repository
   - Select the "Release" workflow
   - Click "Run workflow"
   - Enter the version (e.g., `v1.0.0`)
   - Click "Run workflow"

### Manual Release

1. **Create and Push Tag**
   ```bash
   # Create tag
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **GitHub Actions will automatically:**
   - Run CI tests
   - Create GitHub release
   - Publish to GitHub Actions Marketplace
   - Update major version tag (v1)

## 📋 Pre-Release Checklist

- [ ] All tests pass (`make test`)
- [ ] Linting passes (`make lint`)
- [ ] Build succeeds (`make build`)
- [ ] No uncommitted changes
- [ ] On main branch
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated (if applicable)
- [ ] Documentation updated

## 🏷️ Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version: Breaking changes
- **MINOR** version: New features (backward compatible)
- **PATCH** version: Bug fixes (backward compatible)

### Examples:
- `v1.0.0` → `v1.0.1` (bug fix)
- `v1.0.0` → `v1.1.0` (new feature)
- `v1.0.0` → `v2.0.0` (breaking change)

## 🤖 Automated Workflows

### CI Workflow (`.github/workflows/ci.yml`)
- Runs on every push and PR
- Executes: lint, test, build
- Ensures code quality

### Release Workflow (`.github/workflows/release.yml`)
- Triggers on tag push or manual dispatch
- Creates GitHub release
- Publishes to GitHub Actions Marketplace
- Updates major version tags

## 📦 GitHub Actions Marketplace

The action is automatically published to the GitHub Actions Marketplace when a new tag is created. The marketplace listing includes:

- Action metadata from `action.yml`
- README.md as description
- Automatic version management

## 🔧 Major Version Tags

We maintain major version tags (e.g., `v1`, `v2`) that always point to the latest release in that major version. This allows users to:

```yaml
# Always get latest v1.x.x
- uses: highlyavailable/github-readme-actions@v1

# Pin to specific version
- uses: highlyavailable/github-readme-actions@v1.2.3
```

## 🐛 Hotfix Process

For critical bug fixes:

1. Create hotfix branch from main
2. Make minimal fix
3. Test thoroughly
4. Bump patch version
5. Create release
6. Merge back to main

## 📝 Release Notes

Release notes are automatically generated from commit messages between tags. To improve release notes:

- Use conventional commit messages
- Include clear, descriptive commit messages
- Reference issues/PRs in commits

## 🔍 Testing Releases

Before releasing:

1. **Local Testing**
   ```bash
   # Test the action locally
   export GITHUB_TOKEN=your_token
   make test-action
   ```

2. **Integration Testing**
   - Test in a real repository
   - Verify all input parameters work
   - Check output formatting

## 📞 Support

If you encounter issues with the release process:

1. Check GitHub Actions logs
2. Verify all prerequisites are met
3. Open an issue with detailed information

## 🎯 Quick Commands

```bash
# Check if ready for release
make release-check

# Bump version and prepare release
make version-patch && git add . && git commit -m "Release v$(node -e "console.log(require('./package.json').version)")"

# View current status
make status

# Run full CI pipeline
make ci
``` 