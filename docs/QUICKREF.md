# Development Quick Reference

## Common Commands

### Quality Checks (Both TS/JS and Python)

```bash
npm run check          # Run all checks (lint, format, typecheck - both languages)
npm run lint           # Lint both TS/JS and Python
npm run lint:fix       # Auto-fix both TS/JS and Python
npm run typecheck      # Type check both TypeScript and Python
npm run format         # Format both TS/JS and Python files
npm run format:check   # Check formatting for both languages
```

### Language-Specific Commands

```bash
# TypeScript/JavaScript only
npm run lint:js        # Lint TS/JS only
npm run lint:js:fix    # Auto-fix TS/JS only
npm run typecheck:js   # Type check TypeScript only
npm run format:js      # Format TS/JS only
npm run format:js:check # Check TS/JS formatting only

# Python only
npm run lint:py        # Lint Python only
npm run lint:py:fix    # Auto-fix Python only
npm run typecheck:py   # Type check Python only
npm run format:py      # Format Python only
npm run format:py:check # Check Python formatting only
```

### Build & Test

```bash
npm run build          # Build TypeScript packages
npm test               # Run all tests (Vitest + pytest)
npm run test:js        # Run TypeScript tests only (Vitest)
npm run test:py        # Run Python tests only (pytest)
npm run test:watch     # Run tests in watch mode (Vitest)
npm run test:coverage  # Run tests with coverage reports
```

### Git Hooks

```bash
npm run prepare        # Setup/reinitialize Husky hooks
npx lint-staged        # Run lint-staged manually
```

### Make Commands (if available)

```bash
make help              # Show all available commands
make check             # Run all checks (both languages)
make lint              # Lint all code (both languages)
make lint-fix          # Auto-fix all code (both languages)
make format            # Format all code (both languages)
make format-check      # Check all formatting (both languages)
make typecheck         # Type check all code (both languages)
make pre-commit        # Simulate pre-commit hook
make clean             # Clean build artifacts
```

## Pre-Commit Hook Behavior

When you run `git commit`, the following happens automatically:

**On staged TypeScript/JavaScript files (_.ts, _.js, \*.mjs):**

1. ESLint runs with auto-fix
2. Prettier formats the code
3. Changes are staged automatically

**On staged Python files (\*.py):**

1. Black formats the code
2. Ruff lints with auto-fix
3. Changes are staged automatically

**On staged JSON/Markdown/YAML files:**

1. Prettier formats the files
2. Changes are staged automatically

**On commit message:**

1. Commitlint validates the message format
2. Commit is rejected if format is invalid

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Valid types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`

**Examples:**

```bash
git commit -m "feat(ts): add JWT thumbprint validation"
git commit -m "fix(py): correct signature verification for EdDSA"
git commit -m "docs: update CONTRIBUTING with pre-commit setup"
git commit -m "chore: update dependencies"
```

## Configuration Files

| File                                 | Purpose                      |
| ------------------------------------ | ---------------------------- |
| `.eslintrc.js` or `eslint.config.js` | ESLint rules for TS/JS       |
| `.prettierrc`                        | Prettier formatting config   |
| `.prettierignore`                    | Files to ignore for Prettier |
| `pyproject.toml`                     | Black, Ruff, MyPy config     |
| `.lintstagedrc.json`                 | Lint-staged configuration    |
| `commitlint.config.js`               | Commit message rules         |
| `.husky/pre-commit`                  | Pre-commit hook              |
| `.husky/commit-msg`                  | Commit message hook          |

## Troubleshooting

**Hooks not running?**

```bash
npm run prepare
```

**Python tools not found?**

```bash
pip install -e ".[dev]"
```

**Want to skip hooks temporarily?** (Use sparingly!)

```bash
git commit --no-verify -m "your message"
```

**ESLint errors in IDE?**

- Ensure ESLint extension is installed
- VS Code: Set `"eslint.useFlatConfig": true` for ESLint 9+

**Python formatting conflicts?**

- Black and Ruff are configured to work together
- Black handles formatting, Ruff handles linting
- Line length is 88 characters for both

## IDE Integration

### VS Code Extensions

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Python (`ms-python.python`)
- Black Formatter (`ms-python.black-formatter`)
- Ruff (`charliermarsh.ruff`)

### Recommended VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.useFlatConfig": true,
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Python Tools Configuration

### Black (Formatter)

- Line length: 88
- Target: Python 3.11+
- Configured in `pyproject.toml`

### Ruff (Linter)

- Line length: 88 (matches Black)
- Enables: pycodestyle, pyflakes, isort, flake8-bugbear, etc.
- Auto-fixes many issues
- Configured in `pyproject.toml`

### MyPy (Type Checker)

- Strict mode enabled
- Targets Python 3.11+
- Checks `packages/flarelette-jwt-py`
- Configured in `pyproject.toml`

## TypeScript Tools Configuration

### ESLint

- Uses flat config format (ESLint 9+)
- TypeScript ESLint plugins enabled
- Stricter rules for `src/` directory
- Relaxed rules for test files
- Configured in `eslint.config.js`

### Prettier

- No semicolons
- Single quotes
- Trailing commas (ES5)
- Tab width: 2
- Print width: 88 (matches Python)
- Configured in `.prettierrc`

### TypeScript Compiler

- Strict mode enabled
- Configured per package in `tsconfig.json`

## Next Steps

- See [SETUP.md](SETUP.md) for detailed setup
- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- See [docs/CODING_STANDARDS.md](./CODING_STANDARDS.md) for coding standards
