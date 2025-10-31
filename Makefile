# Makefile for flarelette-jwt-kit
# Provides convenient commands for both TypeScript and Python development

.PHONY: help install build clean lint format typecheck test check

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies (Node.js and Python)
	npm install
	pip install -e ".[dev]"

build: ## Build TypeScript packages
	npm run build

clean: ## Clean build artifacts
	rm -rf dist build *.egg-info
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	find . -type f -name ".coverage" -delete

# Combined checks (both JS/TS and Python)
lint: ## Lint all code (TS/JS + Python)
	npm run lint

lint-fix: ## Auto-fix all linting issues (TS/JS + Python)
	npm run lint:fix

format: ## Format all code (Prettier + Black)
	npm run format

format-check: ## Check all formatting (TS/JS + Python)
	npm run format:check

typecheck: ## Type check all code (TypeScript + MyPy)
	npm run typecheck

test: ## Run all tests (Vitest + pytest)
	npm test

test-watch: ## Run tests in watch mode (Vitest only)
	npm run test:watch

test-coverage: ## Run tests with coverage reports
	npm run test:coverage

check: ## Run all checks (lint, format, typecheck, test)
	npm run check

# Pre-commit simulation
pre-commit: ## Simulate pre-commit hooks locally
	npx lint-staged
