# Development Setup Guide

This guide walks you through setting up the development environment for Flarelette JWT Kit with all quality gates (linting, formatting, type checking).

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Git**
- **Make** (optional, for convenience commands)

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd flarelette-jwt-kit

# Install Node.js dependencies
npm install

# Install Python development dependencies
pip install -e ".[dev]"
```

### 2. Initialize Husky (Git Hooks)

```bash
# This is done automatically by npm install via the "prepare" script
# But you can run it manually if needed:
npm run prepare
```

This sets up:

- **pre-commit hook**: Runs lint-staged (formatting, linting) on staged files
- **commit-msg hook**: Validates commit messages against Conventional Commits format

## Quality Gates

### Pre-Commit Hooks (Automatic)

When you commit, the following runs automatically on staged files:

**TypeScript/JavaScript:**

- ESLint (with auto-fix)
- Prettier (formatting)

**Python:**

- Black (formatting)
- Ruff (linting with auto-fix)

**Other files (JSON, Markdown, YAML):**

- Prettier (formatting)

### Manual Checks

You can run checks manually before committing:

```bash
# Run all checks (lint, format, typecheck for both TS and Python)
npm run check

# Or use Make commands
make check

# Individual checks
npm run lint              # Lint TypeScript/JavaScript
npm run format:check      # Check formatting
npm run typecheck         # TypeScript type check

npm run py:lint           # Lint Python
npm run py:format:check   # Check Python formatting
npm run py:typecheck      # Python type check (MyPy)
```

### Auto-Fix Issues

```bash
# Auto-fix TypeScript/JavaScript
npm run lint:fix
npm run format

# Auto-fix Python
npm run py:lint:fix
npm run py:format

# Or use Make
make lint-fix
make format
```

## Commit Message Format

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `refactor:` — Code refactoring
- `test:` — Test changes
- `chore:` — Build/tooling changes
- `style:` — Code style changes (formatting)

**Examples:**

```bash
git commit -m "feat(ts): add thumbprint pinning support"
git commit -m "fix(py): handle missing JWT_ISS environment variable"
git commit -m "docs: update CONTRIBUTING with pre-commit setup"
```

If your commit message doesn't follow this format, the commit will be rejected.

## Makefile Commands (Optional)

If you have `make` installed, you can use these convenient shortcuts:

```bash
make help           # Show all available commands
make install        # Install all dependencies
make build          # Build TypeScript packages
make clean          # Clean build artifacts

make lint           # Lint TypeScript/JavaScript
make lint-fix       # Auto-fix linting issues
make format         # Format all files
make format-check   # Check formatting
make typecheck      # Type check TypeScript

make py-format      # Format Python files
make py-lint        # Lint Python files
make py-lint-fix    # Auto-fix Python issues
make py-typecheck   # Type check Python

make check          # Run all checks
make pre-commit     # Simulate pre-commit hook
make test           # Run tests
```

## Configuration Files

The project uses these configuration files:

**TypeScript/JavaScript:**

- `eslint.config.js` — ESLint configuration (flat config format)
- `.prettierrc` — Prettier formatting rules
- `.prettierignore` — Files to ignore for Prettier
- `tsconfig.json` — TypeScript compiler configuration

**Python:**

- `pyproject.toml` — Black, Ruff, and MyPy configuration

**Git Hooks:**

- `.husky/pre-commit` — Pre-commit hook script
- `.husky/commit-msg` — Commit message validation
- `.lintstagedrc.json` — Lint-staged configuration
- `commitlint.config.js` — Commit message rules

## Troubleshooting

### Hooks Not Running

If pre-commit hooks aren't running:

```bash
# Reinitialize Husky
rm -rf .husky
npm run prepare
```

### Python Tools Not Found

If Black, Ruff, or MyPy aren't found:

```bash
# Reinstall Python dev dependencies
pip install -e ".[dev]"

# Or install globally
pip install black ruff mypy
```

### Permission Errors (Unix/Mac)

If hook scripts aren't executable:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### ESLint Errors in IDE

Ensure your IDE is using the flat config format (ESLint 9+):

**VS Code:**

```json
{
  "eslint.useFlatConfig": true
}
```

## IDE Setup

### VS Code

Recommended extensions:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Python (`ms-python.python`)
- Black Formatter (`ms-python.black-formatter`)
- Ruff (`charliermarsh.ruff`)

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.useFlatConfig": true,
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Continuous Integration

These same checks run in CI/CD pipelines:

1. **Lint check** — All files must pass linting
2. **Format check** — All files must be properly formatted
3. **Type check** — TypeScript and Python type checking must pass
4. **Tests** — All tests must pass

Make sure to run `npm run check` before pushing to avoid CI failures.

## Next Steps

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
