# Python Worker Testing

## Current Testing Approach

The Python package (`flarelette-jwt-py`) is designed for Cloudflare Workers with Pyodide. Testing is split into two approaches:

### 1. Unit Tests (Current - 44.74% coverage)

**Location**: `tests/test_sign_verify.py`

These tests run in standard Python and test the `env.py` module (configuration and mode detection logic) without requiring the Workers runtime.

```bash
npm run test:py
# or
pytest packages/flarelette-jwt-py
```

**Coverage**: Tests the environment configuration functions that don't depend on WebCrypto/Pyodide:

- Mode detection (HS512 vs EdDSA)
- Environment variable reading
- Configuration defaults
- Name indirection logic

### 2. Integration Tests (Manual - via wrangler)

**Location**: `example_worker.py` (sample Worker for manual testing)

Full sign/verify functionality requires the Cloudflare Workers runtime with Pyodide and WebCrypto APIs.

#### Local Testing with Wrangler

```bash
# Start local dev server
cd packages/flarelette-jwt-py
npx wrangler dev example_worker.py

# In another terminal, test endpoints:
curl http://localhost:8787/sign
curl http://localhost:8787/verify -H "Authorization: Bearer <token>"
curl http://localhost:8787/create
```

#### Deployment Testing

```bash
# Deploy to Cloudflare Workers
npx wrangler deploy example_worker.py --name flarelette-jwt-test

# Test live endpoints
curl https://flarelette-jwt-test.<your-subdomain>.workers.dev/sign
```

## Why Not Miniflare?

Miniflare v3 (current version) doesn't support Python Workers. Python Workers require:

- Pyodide runtime (Python compiled to WebAssembly)
- Workers-specific `js` module for interacting with JavaScript/WebCrypto
- Python-specific bindings and environment

These features are only available in the actual Cloudflare Workers runtime via `wrangler dev` or deployed Workers.

## Testing Strategy

Given the architectural constraints:

1. **Unit tests** cover configuration logic (current: 44.74% of testable code)
2. **Integration tests** via `wrangler dev` validate actual sign/verify in Workers environment
3. **TypeScript package** provides comprehensive test coverage (80.28%) for equivalent functionality

The TypeScript and Python packages share the same logic and configuration patterns, so TypeScript test coverage provides confidence in the overall approach.

## Future Improvements

When Miniflare or similar tools add Python Workers support, we can:

- Create automated integration tests
- Increase Python coverage significantly
- Test Pyodide-specific functionality locally
