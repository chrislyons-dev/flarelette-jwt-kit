# Testing Guide

This guide explains how to run and write tests for the Flarelette JWT Kit project.

## Overview

The project uses:

- **Vitest** for TypeScript/JavaScript tests
- **pytest** for Python tests
- Both test suites run via `npm test`
- Coverage reports available for both languages

## Running Tests

### All Tests (Both Languages)

```bash
# Run all tests (Vitest + pytest)
npm test

# Or with Make
make test
```

### Language-Specific Tests

```bash
# TypeScript/JavaScript only (Vitest)
npm run test:js

# Python only (pytest)
npm run test:py
```

### Watch Mode (Development)

```bash
# Run tests in watch mode (TypeScript only)
npm run test:watch

# Or directly with Vitest
npx vitest
```

### Coverage Reports

```bash
# Generate coverage for both languages
npm run test:coverage

# TypeScript coverage only
npm run test:js:coverage

# Python coverage only
npm run test:py:coverage
```

**Coverage reports:**

- **TypeScript:** `coverage/` directory (HTML report)
- **Python:** `htmlcov/` directory (HTML report)

## Test Structure

### TypeScript Tests (Vitest)

**Location:** `packages/flarelette-jwt-ts/tests/`

**File naming:**

- `*.test.ts` — Test files
- `*.spec.ts` — Spec files (also valid)

**Example test:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('JWT HS512', () => {
  beforeEach(() => {
    // Setup test environment
    process.env.JWT_SECRET = 'base64url-secret'
    process.env.JWT_ISS = 'https://test.example.com'
    process.env.JWT_AUD = 'test-audience'
  })

  it('should sign and verify a token', async () => {
    const { sign, verify } = await import('../src/index')

    const token = await sign({ sub: 'user123', roles: ['admin'] })
    const payload = await verify(token)

    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe('user123')
  })

  it('should fail verification with wrong secret', async () => {
    const { sign, verify } = await import('../src/index')

    const token = await sign({ sub: 'user123' })

    // Change secret
    process.env.JWT_SECRET = 'different-secret'

    const payload = await verify(token)
    expect(payload).toBeNull()
  })
})
```

### Python Tests (pytest)

**Location:** `packages/flarelette-jwt-py/tests/`

**File naming:**

- `test_*.py` — Test files
- `*_test.py` — Also valid

**Example test:**

```python
import pytest
from flarelette_jwt import sign, verify

@pytest.mark.asyncio
async def test_hs512_sign_and_verify(hs512_env):
    """Test HS512 token signing and verification."""
    # Sign a token
    token = await sign({"sub": "user123", "roles": ["admin"]})
    assert token is not None

    # Verify the token
    payload = await verify(token)
    assert payload is not None
    assert payload["sub"] == "user123"

@pytest.mark.asyncio
async def test_verification_fails_with_wrong_secret(hs512_env, monkeypatch):
    """Test that verification fails with wrong secret."""
    token = await sign({"sub": "user123"})

    # Change the secret
    monkeypatch.setenv("JWT_SECRET", "wrong-secret")

    payload = await verify(token)
    assert payload is None

@pytest.mark.skip(reason="EdDSA signing not supported in Python")
async def test_eddsa_signing():
    """This test should be skipped - EdDSA signing not available."""
    pass
```

## Test Fixtures

### Python Fixtures (conftest.py)

Pre-configured fixtures available:

```python
def test_with_hs512_env(hs512_env):
    """Use hs512_env fixture for HS512 tests."""
    # JWT_SECRET, JWT_ISS, JWT_AUD already set
    pass

def test_with_eddsa_env(eddsa_env):
    """Use eddsa_env fixture for EdDSA tests."""
    # JWT_PUBLIC_JWK, JWT_ISS, JWT_AUD already set
    pass

def test_custom_env(mock_env):
    """Use mock_env fixture for custom environments."""
    mock_env({
        "JWT_SECRET": "custom-secret",
        "JWT_ISS": "https://custom.example.com",
    })
```

### TypeScript Setup (beforeEach/afterEach)

```typescript
import { beforeEach, afterEach } from 'vitest'

describe('Test Suite', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Set test environment
    process.env.JWT_SECRET = 'test-secret'
    process.env.JWT_ISS = 'https://test.example.com'
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })
})
```

## Test Organization

### What to Test

**Core functionality:**

- ✅ HS512 signing and verification
- ✅ EdDSA signing (TypeScript) and verification (both)
- ✅ Token expiration validation
- ✅ Claims validation (iss, aud, exp, nbf)
- ✅ Authorization policies (roles, permissions, predicates)
- ✅ Secret-name indirection pattern
- ✅ JWKS handling (TypeScript only)
- ✅ Error cases (invalid tokens, expired, wrong secret)

**Platform-specific:**

- **TypeScript:** JWKS fetching, service bindings, thumbprint pinning
- **Python:** WebCrypto integration, EdDSA verification only

### Test Categories

Use markers/describe blocks to categorize tests:

**Python:**

```python
@pytest.mark.slow
async def test_slow_operation():
    pass

@pytest.mark.integration
async def test_integration():
    pass

# Run only fast tests
# pytest -m "not slow"
```

**TypeScript:**

```typescript
describe.skip('Integration Tests', () => {
  // Skipped in normal runs
})

describe('Unit Tests', () => {
  // Run by default
})
```

## Configuration

### Vitest (vitest.config.ts)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
    },
  },
})
```

### pytest (pyproject.toml)

```toml
[tool.pytest.ini_options]
testpaths = ["packages/flarelette-jwt-py/tests"]
python_files = ["test_*.py"]
addopts = [
    "--strict-markers",
    "--cov-report=term-missing",
]
asyncio_mode = "auto"
```

## Continuous Integration

Tests run automatically in CI/CD:

```yaml
# .github/workflows/ci.yml
- name: Run TypeScript tests
  run: npm run test:js

- name: Run Python tests
  run: npm run test:py
```

## Writing Good Tests

### Test Naming

**TypeScript:**

```typescript
// Good: Descriptive, says what it tests
it('should reject expired tokens', () => {})
it('should validate issuer claim', () => {})

// Bad: Vague
it('works', () => {})
it('test1', () => {})
```

**Python:**

```python
# Good: Descriptive, says what it tests
def test_rejects_expired_tokens():
    pass

def test_validates_issuer_claim():
    pass

# Bad: Vague
def test_works():
    pass
```

### Test Structure (AAA Pattern)

```typescript
it('should verify valid token', async () => {
  // Arrange - Set up test data
  const payload = { sub: 'user123', roles: ['admin'] }
  const token = await sign(payload)

  // Act - Perform the action
  const result = await verify(token)

  // Assert - Check the result
  expect(result).not.toBeNull()
  expect(result?.sub).toBe('user123')
})
```

### Cross-Language Parity Tests

Ensure both implementations behave identically:

```typescript
// TypeScript
it('should return null for invalid token', async () => {
  const result = await verify('invalid-token')
  expect(result).toBeNull()
})
```

```python
# Python - Same behavior
async def test_returns_none_for_invalid_token():
    result = await verify('invalid-token')
    assert result is None
```

## Debugging Tests

### TypeScript

```bash
# Run specific test file
npx vitest packages/flarelette-jwt-ts/tests/sign.test.ts

# Run with debugging
node --inspect-brk node_modules/.bin/vitest

# Use console.log (discouraged, but works)
console.log('Debug:', payload)
```

### Python

```bash
# Run specific test file
pytest packages/flarelette-jwt-py/tests/test_sign.py

# Run specific test function
pytest packages/flarelette-jwt-py/tests/test_sign.py::test_hs512_signing

# Run with verbose output
pytest -vv

# Show print statements
pytest -s

# Drop into debugger on failure
pytest --pdb
```

## Coverage Goals

**Target:** 80%+ coverage for core functionality

**Required coverage:**

- ✅ Sign/verify functions
- ✅ Mode detection
- ✅ Claims validation
- ✅ Authorization policies
- ✅ Error handling paths

**Optional coverage:**

- CLI tools (secret generation, keygen)
- Adapters (Hono integration)
- Example code

**Check coverage:**

```bash
npm run test:coverage

# View HTML reports
# TypeScript: open coverage/index.html
# Python: open htmlcov/index.html
```

## Common Issues

### "Module not found" errors

**TypeScript:**

- Ensure package is built: `npm run build`
- Check imports use correct paths

**Python:**

- Ensure package is installed: `pip install -e ".[dev]"`
- Check PYTHONPATH includes package directory

### Async tests failing

**TypeScript:**

```typescript
// Use async/await properly
it('should work', async () => {
  await sign({ sub: 'test' })
})
```

**Python:**

```python
# Mark as async
@pytest.mark.asyncio
async def test_async_function():
    await sign({"sub": "test"})
```

### Environment variables not set

Use fixtures (Python) or beforeEach (TypeScript) to ensure environment is configured before each test.

## Next Steps

1. **Run existing tests:** `npm test`
2. **Add tests as you develop** new features
3. **Maintain cross-language parity** in test coverage
4. **Check coverage** before submitting PRs
5. **Update this guide** as testing practices evolve

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
