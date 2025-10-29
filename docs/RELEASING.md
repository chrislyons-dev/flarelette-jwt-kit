# Release Setup Guide

This guide explains how to set up and use the automated release process for both npm and PyPI packages.

## Overview

The project uses [release-please](https://github.com/googleapis/release-please) to automate:

- Version bumping based on Conventional Commits
- CHANGELOG generation
- GitHub Release creation
- Publishing to npm (TypeScript package)
- Publishing to PyPI (Python package)

## Prerequisites

### Required Secrets

You need to configure the following secrets in your GitHub repository:

#### 1. NPM_TOKEN (for npm publishing)

**Create an npm access token:**

```bash
# Login to npm
npm login

# Generate a token (choose "Automation" type)
npm token create

# Or via npm website: https://www.npmjs.com/settings/<your-username>/tokens
```

**Add to GitHub:**

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Your npm automation token

#### 2. PYPI_TOKEN (for PyPI publishing)

**Create a PyPI API token:**

1. Go to https://pypi.org/manage/account/token/
2. Click **Add API token**
3. Token name: `flarelette-jwt-kit-releases`
4. Scope: **Project: flarelette-jwt-py** (or "Entire account" if package doesn't exist yet)
5. Copy the token (starts with `pypi-`)

**Add to GitHub:**

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `PYPI_TOKEN`
4. Value: Your PyPI token (including `pypi-` prefix)

## How It Works

### Automatic Release Process

1. **Commits to `main`** trigger the release-please action
2. **Release-please** analyzes commits since last release using Conventional Commits:
   - `feat:` → Minor version bump (1.7.0 → 1.8.0)
   - `fix:` → Patch version bump (1.7.0 → 1.7.1)
   - `feat!:` or `BREAKING CHANGE:` → Major version bump (1.7.0 → 2.0.0)
3. **Release PR is created/updated** with:
   - Updated version numbers in `package.json` and `pyproject.toml`
   - Generated CHANGELOG entries
4. **When you merge the Release PR**:
   - GitHub Release is created with the CHANGELOG
   - TypeScript package is published to npm (if changed)
   - Python package is published to PyPI (if changed)

### Commit Message Format

Follow Conventional Commits for automatic versioning:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types that trigger releases:**

- `feat:` — New feature (minor version bump)
- `fix:` — Bug fix (patch version bump)
- `perf:` — Performance improvement (patch version bump)
- `revert:` — Revert a previous change (patch version bump)

**Breaking changes:**

- Add `!` after type: `feat!: remove legacy API`
- Or add footer: `BREAKING CHANGE: removed legacy API`
- Results in major version bump

**Types that appear in CHANGELOG but don't trigger releases:**

- `docs:` — Documentation changes
- `refactor:` — Code refactoring
- `test:` — Test changes
- `chore:` — Build/tooling changes

**Examples:**

```bash
# Patch release (1.7.0 → 1.7.1)
git commit -m "fix(ts): handle missing JWT_ISS gracefully"

# Minor release (1.7.0 → 1.8.0)
git commit -m "feat(py): add JWT thumbprint validation"

# Major release (1.7.0 → 2.0.0)
git commit -m "feat!: change API to use async by default

BREAKING CHANGE: All JWT operations are now async in both TypeScript and Python"

# Won't trigger release but appears in CHANGELOG
git commit -m "docs: update README with new examples"
```

## Release Workflow

### 1. Make Changes and Commit

```bash
# Make your changes
# ...

# Commit with conventional commit message
git commit -m "feat(ts): add JWT rotation support"

# Push to main (or merge PR to main)
git push origin main
```

### 2. Release-Please Creates/Updates PR

- A PR titled "chore: release packages" will be created or updated
- Review the PR to see:
  - Which packages will be released
  - Version numbers
  - Generated CHANGELOG entries

### 3. Merge Release PR

When you're ready to release:

1. Review the release PR
2. Merge it to `main`
3. Automated publishing happens:
   - GitHub Release is created
   - npm package published (if TypeScript changed)
   - PyPI package published (if Python changed)

### 4. Verify Release

```bash
# Check npm
npm view @chrislyons-dev/flarelette-jwt

# Check PyPI
pip index versions chrislyons-flarelette-jwt

# Check GitHub Releases
# Visit: https://github.com/<org>/<repo>/releases
```

## Package Independence

The two packages can be released independently:

- **TypeScript-only changes** (`packages/flarelette-jwt-ts/**`) → Only npm release
- **Python-only changes** (`packages/flarelette-jwt-py/**`) → Only PyPI release
- **Changes to both** → Both packages released

Release-please tracks version numbers independently in `.github/.release-please-manifest.json`.

## Manual Release (Emergency)

If automated release fails, you can publish manually:

### npm (TypeScript)

```bash
cd packages/flarelette-jwt-ts

# Update version in package.json
npm version patch  # or minor, major

# Build
npm run build

# Publish
npm publish --access public
```

### PyPI (Python)

```bash
cd packages/flarelette-jwt-py

# Update version in pyproject.toml manually
# version = "1.7.1"

# Build
python -m build

# Publish
python -m twine upload dist/*
# Enter your PyPI username and token when prompted
```

## Version Synchronization

Currently, both packages share the same version number (1.7.0). To keep them synchronized:

1. Make changes to both packages in the same commit/PR
2. Use scopes to indicate which package: `feat(ts): ...` or `feat(py): ...`
3. Release-please will bump both packages when the release PR is merged

To allow independent versioning:

- Edit `.github/.release-please-manifest.json` to set different starting versions
- Packages will then version independently based on their changes

## Troubleshooting

### Release PR Not Created

**Check:**

1. Are you pushing to the `main` branch?
2. Are commits using Conventional Commits format?
3. Check GitHub Actions logs for errors

### npm Publish Failed

**Common issues:**

- `NPM_TOKEN` secret not set or expired
- Package name already taken (use scoped name like `@flarelette/jwt-ts`)
- Package not built (`dist/` directory missing)

**Fix:**

1. Verify token: `npm whoami`
2. Update `NPM_TOKEN` secret in GitHub
3. Ensure `npm run build` succeeds locally

### PyPI Publish Failed

**Common issues:**

- `PYPI_TOKEN` secret not set or invalid
- Package name already taken
- Build artifacts missing

**Fix:**

1. Verify token has correct scope
2. Try publishing manually first to claim package name
3. Check `dist/` directory exists after `python -m build`

### Version Mismatch

If package versions get out of sync:

1. Edit `.github/.release-please-manifest.json` to correct versions
2. Commit the change
3. Next release will use corrected versions

## Configuration Files

| File                                        | Purpose                              |
| ------------------------------------------- | ------------------------------------ |
| `.github/workflows/release.yml`             | GitHub Actions workflow for releases |
| `.github/release-please-config.json`        | Release-please configuration         |
| `.github/.release-please-manifest.json`     | Current version tracking             |
| `packages/flarelette-jwt-ts/package.json`   | npm package version                  |
| `packages/flarelette-jwt-py/pyproject.toml` | PyPI package version                 |

## Best Practices

1. **Use conventional commits** — Enables automatic versioning
2. **Review release PRs** — Check CHANGELOG before merging
3. **Keep versions synchronized** (optional) — Use same version for both packages
4. **Test before release** — Merge features to `main` only when ready
5. **Use scopes** — `feat(ts):` or `feat(py):` to indicate package
6. **Document breaking changes** — Use `BREAKING CHANGE:` footer for major versions

## Additional Resources

- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [PyPI Publishing Guide](https://packaging.python.org/en/latest/tutorials/packaging-projects/)

## Next Steps

1. **Configure secrets** (`NPM_TOKEN` and `PYPI_TOKEN`)
2. **Test the workflow** by making a commit with `feat:` or `fix:`
3. **Review the release PR** that gets created
4. **Merge release PR** to publish packages
5. **Verify published packages** on npm and PyPI
