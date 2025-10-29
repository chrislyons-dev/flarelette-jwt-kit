# Release Setup Checklist

Quick checklist to configure automated releases to npm and PyPI.

## ☐ Prerequisites

### GitHub Repository Secrets

1. ☐ **NPM_TOKEN** configured
   - Generate at: https://www.npmjs.com/settings/tokens
   - Type: Automation token
   - Add to: Repository Settings → Secrets → Actions

2. ☐ **PYPI_TOKEN** configured
   - Generate at: https://pypi.org/manage/account/token/
   - Scope: Project or Entire account
   - Add to: Repository Settings → Secrets → Actions

### Package Registry Setup

3. ☐ **npm package name** available
   - Current: `@chrislyons-dev/flarelette-jwt`
   - Check: `npm search @chrislyons-dev/flarelette-jwt`
   - Or claim it with first publish

4. ☐ **PyPI package name** available
   - Current: `chrislyons-flarelette-jwt`
   - Check: https://pypi.org/project/chrislyons-flarelette-jwt/
   - Or claim it with first publish

## ☐ Configuration Files

5. ☐ `.github/workflows/release.yml` created
   - Triggers on push to main
   - Publishes to npm and PyPI
   - Uses release-please for automation

6. ☐ `.github/release-please-config.json` created
   - Configures both packages
   - Uses Conventional Commits

7. ☐ `.github/.release-please-manifest.json` created
   - Tracks current versions
   - Starting at 1.7.0 for both packages

## ☐ Package Metadata

8. ☐ **TypeScript package** metadata complete
   - `packages/flarelette-jwt-ts/package.json`
   - Has: keywords, repository, homepage, bugs, author
   - Has: prepublishOnly script

9. ☐ **Python package** metadata complete
   - `packages/flarelette-jwt-py/pyproject.toml`
   - Has: keywords, classifiers, urls, authors
   - Has: README.md in same directory

10. ☐ **LICENSE** file in each package directory
    - `packages/flarelette-jwt-ts/LICENSE`
    - `packages/flarelette-jwt-py/LICENSE`

## ☐ Testing

11. ☐ **Test TypeScript build**

    ```bash
    cd packages/flarelette-jwt-ts
    npm run build
    # Should create dist/ directory
    ```

12. ☐ **Test Python build**

    ```bash
    cd packages/flarelette-jwt-py
    python -m build
    # Should create dist/ directory with .whl and .tar.gz
    ```

13. ☐ **Test local install**

    ```bash
    # TypeScript
    cd packages/flarelette-jwt-ts
    npm pack
    # Creates tarball

    # Python
    cd packages/flarelette-jwt-py
    pip install -e .
    # Should install successfully
    ```

## ☐ First Release

14. ☐ **Make a commit with conventional format**

    ```bash
    git commit -m "feat: initial public release"
    git push origin main
    ```

15. ☐ **Wait for release PR**
    - Release-please creates PR titled "chore: release packages"
    - Check GitHub Actions tab for workflow runs

16. ☐ **Review release PR**
    - Check version numbers
    - Review CHANGELOG entries
    - Verify both packages listed (if both changed)

17. ☐ **Merge release PR**
    - Automated publishing will start
    - Check GitHub Actions for publish jobs

18. ☐ **Verify published packages**

    ```bash
    # npm
    npm view @flarelette/jwt-ts

    # PyPI
    pip index versions flarelette-jwt-py
    ```

## ☐ Documentation

19. ☐ Update **CONTRIBUTING.md** to reference RELEASING.md
20. ☐ Update **README.md** with installation instructions
21. ☐ Add badges to README (optional)
    ```markdown
    [![npm version](https://badge.fury.io/js/@chrislyons-dev%2Fflarelette-jwt.svg)](https://www.npmjs.com/package/@chrislyons-dev/flarelette-jwt)
    [![PyPI version](https://badge.fury.io/py/chrislyons-flarelette-jwt.svg)](https://pypi.org/project/chrislyons-flarelette-jwt/)
    ```

## Troubleshooting

**Release PR not created?**

- Check commit uses conventional format (`feat:`, `fix:`, etc.)
- Check GitHub Actions logs
- Verify pushing to `main` branch

**npm publish failed?**

- Verify `NPM_TOKEN` secret is set
- Check token hasn't expired
- Verify package name isn't taken
- Check `dist/` directory exists

**PyPI publish failed?**

- Verify `PYPI_TOKEN` secret is set
- Check token scope includes the package
- Try manual publish first to claim name
- Check `dist/` directory has .whl and .tar.gz files

**Need help?**

- See [RELEASING.md](RELEASING.md) for detailed guide
- Check [release-please documentation](https://github.com/googleapis/release-please)

## Quick Commands

```bash
# Check current versions
npm view @chrislyons-dev/flarelette-jwt version
pip index versions chrislyons-flarelette-jwt

# Manual npm publish (emergency)
cd packages/flarelette-jwt-ts
npm run build
npm publish --access public

# Manual PyPI publish (emergency)
cd packages/flarelette-jwt-py
python -m build
python -m twine upload dist/*

# Test release-please locally
npx release-please release-pr --repo-url=<owner>/<repo> --token=$GITHUB_TOKEN
```

---

**Status:** [ ] Not Started | [ ] In Progress | [✓] Complete
