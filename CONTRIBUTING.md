# Contributing to GitHub Pinned PR Readme

Thank you for your interest in contributing to this project! We welcome contributions from everyone.

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Git

### Setting Up the Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/github-readme-actions.git
   cd github-readme-actions
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🧪 Testing

### Running Tests Locally

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

### Testing the Action Locally

You can test the action locally by:

1. Creating a test repository with the required comments in README.md
2. Setting up environment variables:
   ```bash
   export GITHUB_TOKEN=your_github_token
   export INPUT_GH_USERNAME=your_username
   ```
3. Running the action:
   ```bash
   node index.js
   ```

## 📝 Code Style

- Use ESLint for code formatting
- Follow existing code patterns
- Add JSDoc comments for new functions
- Use meaningful variable and function names

### Pre-commit Checks

Before committing, make sure to:

1. Run the linter: `npm run lint`
2. Run tests: `npm test`
3. Build the distribution: `npm run build`

## 🔧 Building

The action uses `@vercel/ncc` to compile the Node.js code into a single file:

```bash
npm run build
```

This creates the `dist/index.js` file that GitHub Actions will execute.

## 📋 Pull Request Process

1. **Update Documentation**: If you're adding new features, update the README.md
2. **Add Tests**: Include tests for new functionality
3. **Update CHANGELOG**: Add your changes to the changelog (if applicable)
4. **Build Distribution**: Run `npm run build` to update the `dist/` directory
5. **Commit Changes**: Make sure all files are committed, including `dist/index.js`

### Pull Request Guidelines

- Use a clear and descriptive title
- Include a detailed description of changes
- Reference any related issues
- Ensure all tests pass
- Keep changes focused and atomic

## 🐛 Reporting Bugs

When reporting bugs, please include:

- A clear description of the issue
- Steps to reproduce the problem
- Expected vs actual behavior
- Your environment (OS, Node.js version, etc.)
- Any relevant logs or error messages

## 💡 Suggesting Features

We welcome feature suggestions! Please:

- Check if the feature already exists or is planned
- Open an issue with a detailed description
- Explain the use case and benefits
- Consider implementation complexity

## 📚 Documentation

Help improve our documentation by:

- Fixing typos or unclear explanations
- Adding examples for complex use cases
- Improving the README structure
- Adding inline code comments

## 🏷️ Release Process

Releases are handled by maintainers and follow semantic versioning:

- **Patch** (1.0.1): Bug fixes
- **Minor** (1.1.0): New features (backward compatible)
- **Major** (2.0.0): Breaking changes

## 🤝 Code of Conduct

Please be respectful and inclusive in all interactions. We follow the standard open source code of conduct.

## ❓ Questions

If you have questions about contributing, feel free to:

- Open an issue for discussion
- Reach out to maintainers
- Check existing issues and discussions

Thank you for contributing! 🎉 