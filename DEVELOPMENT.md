# Development Guide

This guide covers the development workflow for the GitHub Pinned PR Readme action.

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm
- Git
- Make (usually pre-installed on macOS/Linux)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/highlyavailable/github-readme-actions.git
cd github-readme-actions

# Install dependencies
make install

# Run development workflow
make dev
```

## 📋 Available Commands

### Quick Reference

```bash
make help           # Show all available commands
make dev            # Full development workflow (install, lint, test, build)
make ci             # Run CI pipeline
make check          # Run all checks (lint, test, build, git status)
make status         # Show project status
```

### Development Commands

```bash
make install        # Install dependencies (npm ci)
make install-dev    # Install dependencies for development (npm install)
make clean          # Clean build artifacts and node_modules
```

### Testing Commands

```bash
make test           # Run tests
make test-watch     # Run tests in watch mode
make test-coverage  # Run tests with coverage report
make test-action    # Test the action locally (requires GITHUB_TOKEN)
```

### Code Quality Commands

```bash
make lint           # Run ESLint
make lint-fix       # Run ESLint and fix issues automatically
```

### Build Commands

```bash
make build          # Build the distribution (creates dist/index.js)
```

### Release Commands

```bash
make version-patch  # Bump patch version (1.0.0 -> 1.0.1)
make version-minor  # Bump minor version (1.0.0 -> 1.1.0)  
make version-major  # Bump major version (1.0.0 -> 2.0.0)
make release-check  # Check if ready for release
```

### Utility Commands

```bash
make all            # Clean, install, and run all checks
make git-clean      # Clean git repository (reset to HEAD)
make docs           # Show documentation info
```

## 🔄 Development Workflow

### Daily Development

```bash
# Start development
make dev

# Make changes to code
# ...

# Test changes
make test

# Check everything before committing
make check
```

### Before Committing

```bash
# Run full checks
make check

# If checks pass, commit your changes
git add .
git commit -m "Your commit message"
```

### Testing Locally

```bash
# Set up environment
export GITHUB_TOKEN=your_github_token

# Test the action
make test-action
```

## 🏗️ Build Process

The build process uses `@vercel/ncc` to compile the Node.js code into a single file:

```bash
make build
```

This creates:

- `dist/index.js` - Main compiled file
- `dist/index.js.map` - Source map
- `dist/licenses.txt` - License information

## 📦 Release Process

### Automated Release (Recommended)

```bash
# 1. Prepare release
make release-check

# 2. Bump version
make version-patch  # or version-minor/version-major

# 3. Commit changes
git add .
git commit -m "Release v$(node -e "console.log(require('./package.json').version)")"
git push origin main

# 4. Create release via GitHub Actions UI
# Go to Actions -> Release -> Run workflow
```

### Manual Release

```bash
# Create and push tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will handle the rest
```

## 🔍 Debugging

### Common Issues

1. **Build Failures**

   ```bash
   make clean
   make install
   make build
   ```

2. **Test Failures**

   ```bash
   make test-coverage  # See detailed coverage
   npm run test -- --verbose  # Verbose test output
   ```

3. **Lint Errors**

   ```bash
   make lint-fix  # Auto-fix issues
   ```

### Local Action Testing

```bash
# Test with minimal setup
export GITHUB_TOKEN=your_token
export INPUT_GH_USERNAME=your_username
export INPUT_MAX_LINES=3
node index.js
```

## 📁 Project Structure

```
github-readme-actions/
├── 📄 index.js              # Main action logic
├── 📄 action.yml            # GitHub Action metadata
├── 📄 package.json          # Dependencies and scripts
├── 📄 Makefile              # Development commands
├── 📁 .github/workflows/    # CI/CD workflows
├── 📁 test/                 # Test files
├── 📁 dist/                 # Built distribution (auto-generated)
├── 📁 examples/             # Usage examples
└── 📚 Documentation files
```

## 📞 Getting Help

- Check `make help` for available commands
- Review error messages carefully
- Check GitHub Actions logs for CI issues
- Open issues for bugs or questions

## 🎉 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

Quick contribution workflow:

```bash
# 1. Fork and clone
# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Develop with Makefile
make dev

# 4. Test thoroughly
make check

# 5. Submit PR
```
