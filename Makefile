# GitHub Pinned PR Readme - Makefile
# Provides convenient commands for development, testing, and CI

.PHONY: help install test lint build clean dev check ci release-check all

# Default target
help: ## Show this help message
	@echo "GitHub Pinned PR Readme - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development setup
install: ## Install dependencies
	npm ci

install-dev: ## Install dependencies for development
	npm install

# Testing
test: ## Run tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test -- --watch

test-coverage: ## Run tests with coverage
	npm run test -- --coverage

# Code quality
lint: ## Run linter
	npm run lint

lint-fix: ## Run linter and fix issues
	npm run lint -- --fix

# Building
build: ## Build the distribution
	npm run build

clean: ## Clean build artifacts
	rm -rf dist/
	rm -rf node_modules/
	rm -rf coverage/

# Development workflow
dev: install lint test build ## Full development workflow

# CI checks
check: ## Run all checks (lint, test, build)
	@echo "🔍 Running linter..."
	@make lint
	@echo "✅ Linting passed"
	@echo ""
	@echo "🧪 Running tests..."
	@make test
	@echo "✅ Tests passed"
	@echo ""
	@echo "🏗️  Building distribution..."
	@make build
	@echo "✅ Build completed"
	@echo ""
	@echo "🔍 Checking for uncommitted changes..."
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "❌ Uncommitted changes found:"; \
		git status --porcelain; \
		echo "Please run 'make build' and commit the changes."; \
		exit 1; \
	else \
		echo "✅ No uncommitted changes"; \
	fi

# CI target
ci: check ## Run full CI pipeline

# Release preparation
release-check: ## Check if ready for release
	@echo "🔍 Checking release readiness..."
	@make check
	@echo "📋 Checking package.json version..."
	@node -e "console.log('Current version:', require('./package.json').version)"
	@echo "📋 Checking git status..."
	@git status --porcelain
	@echo "📋 Checking if on main branch..."
	@if [ "$$(git branch --show-current)" != "main" ]; then \
		echo "❌ Not on main branch"; \
		exit 1; \
	else \
		echo "✅ On main branch"; \
	fi
	@echo "✅ Ready for release!"

# Utility targets
all: clean install check ## Clean, install, and run all checks

# Version management
version-patch: ## Bump patch version
	npm version patch --no-git-tag-version
	@echo "Version bumped to: $$(node -e "console.log(require('./package.json').version)")"

version-minor: ## Bump minor version
	npm version minor --no-git-tag-version
	@echo "Version bumped to: $$(node -e "console.log(require('./package.json').version)")"

version-major: ## Bump major version
	npm version major --no-git-tag-version
	@echo "Version bumped to: $$(node -e "console.log(require('./package.json').version)")"

# Local testing
test-action: ## Test the action locally (requires GITHUB_TOKEN)
	@if [ -z "$$GITHUB_TOKEN" ]; then \
		echo "❌ GITHUB_TOKEN environment variable is required"; \
		exit 1; \
	fi
	@echo "🧪 Testing action locally..."
	@export INPUT_GH_USERNAME=highlyavailable && \
	export INPUT_MAX_LINES=3 && \
	export INPUT_PR_STATE=all && \
	node index.js

# Documentation
docs: ## Generate documentation (placeholder)
	@echo "📚 Documentation is in README.md"
	@echo "📚 Contributing guide is in CONTRIBUTING.md"

# Git helpers
git-clean: ## Clean git repository
	git clean -fd
	git reset --hard HEAD

status: ## Show project status
	@echo "📊 Project Status:"
	@echo "Version: $$(node -e "console.log(require('./package.json').version)")"
	@echo "Branch: $$(git branch --show-current)"
	@echo "Last commit: $$(git log -1 --pretty=format:'%h - %s (%cr)')"
	@echo "Git status:"
	@git status --short 