.PHONY: help install install-dev test test-watch test-coverage lint lint-fix build clean dev check ci release-check version-patch version-minor version-major test-action all status

help: ## Show available commands
	@echo "github-readme-actions — commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## npm ci
	npm ci

install-dev: ## npm install (for development)
	npm install

test: ## Run jest
	npm test

test-watch: ## Jest in watch mode
	npm run test -- --watch

test-coverage: ## Jest with coverage
	npm run test -- --coverage

lint: ## ESLint
	npm run lint

lint-fix: ## ESLint --fix
	npm run lint -- --fix

build: ## Bundle to dist/
	npm run build

clean: ## Remove build + node_modules + coverage
	rm -rf dist/ node_modules/ coverage/

dev: install lint test build ## Full development cycle

check: ## Lint, test, build, verify clean tree
	@make lint
	@make test
	@make build
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "Uncommitted changes after build:"; \
		git status --porcelain; \
		echo "Run 'make build' and commit dist/ changes."; \
		exit 1; \
	fi

ci: check ## CI pipeline target

release-check: check ## Verify ready to release
	@if [ "$$(git branch --show-current)" != "main" ]; then \
		echo "Not on main branch."; exit 1; \
	fi
	@echo "Version: $$(node -p "require('./package.json').version")"

version-patch: ## Bump patch version
	npm version patch --no-git-tag-version

version-minor: ## Bump minor version
	npm version minor --no-git-tag-version

version-major: ## Bump major version
	npm version major --no-git-tag-version

test-action: ## Run the action locally (requires GITHUB_TOKEN + INPUT_* envs)
	@if [ -z "$$GITHUB_TOKEN" ]; then \
		echo "GITHUB_TOKEN is required."; exit 1; \
	fi
	node index.js

test-render: ## Render against the real API to a scratch file (GITHUB_TOKEN=... make test-render)
	@if [ -z "$$GITHUB_TOKEN" ]; then \
		echo "GITHUB_TOKEN is required. Use a fine-grained PAT \(docs/tokens.md\)."; exit 1; \
	fi
	./scripts/test-local.sh $${USERNAME:-highlyavailable}

all: clean install check ## Clean, install, run checks

status: ## Show project status
	@echo "Version: $$(node -p "require('./package.json').version")"
	@echo "Branch:  $$(git branch --show-current)"
	@echo "Last commit: $$(git log -1 --pretty=format:'%h %s (%cr)')"
