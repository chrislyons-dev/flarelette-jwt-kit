<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/flarelette-dark-mode-128.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/flarelette-logo-light-mode.png">
    <img alt="Flarelette JWT Kit" src="docs/images/flarelette-light-mode-128.png">
  </picture>
</p>

# Flarelette JWT Kit

[![npm version](https://img.shields.io/npm/v/@chrislyons-dev/flarelette-jwt.svg?style=flat-square&logo=npm&label=npm)](https://www.npmjs.com/package/@chrislyons-dev/flarelette-jwt)
[![PyPI version](https://img.shields.io/pypi/v/flarelette-jwt.svg?style=flat-square&logo=pypi&label=pypi)](https://pypi.org/project/flarelette-jwt/)
[![npm downloads](https://img.shields.io/npm/dm/@chrislyons-dev/flarelette-jwt.svg?style=flat-square&label=npm%20downloads)](https://www.npmjs.com/package/@chrislyons-dev/flarelette-jwt)
[![PyPI downloads](https://img.shields.io/pypi/dm/flarelette-jwt.svg?style=flat-square&label=pypi%20downloads)](https://pypi.org/project/flarelette-jwt/)
[![CI Status](https://img.shields.io/github/actions/workflow/status/chrislyons-dev/flarelette-jwt-kit/ci.yml?branch=main&style=flat-square&logo=github&label=ci)](https://github.com/chrislyons-dev/flarelette-jwt-kit/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/chrislyons-dev/flarelette-jwt-kit.svg?style=flat-square&label=license)](https://github.com/chrislyons-dev/flarelette-jwt-kit/blob/main/LICENSE)
[![Documentation](https://img.shields.io/badge/docs-github%20pages-blue?style=flat-square&logo=readme)](https://chrislyons-dev.github.io/flarelette-jwt-kit/)

**Environment-driven JWT authentication for Cloudflare Workers. Like Starlette, but for the edge.**

Cross-language JWT toolkit (TypeScript + Python) with identical APIs. Automatically selects HS512 or EdDSA based on environment configuration, loads secrets via Cloudflare bindings, and works across Workers, Node.js, and Python runtimes.

## Part of the Flarelette Ecosystem

Flarelette JWT Kit provides the core cryptographic operations for the **Flarelette** authentication stack. It's framework-neutral by design — use it directly for low-level JWT operations or through higher-level adapters like `flarelette-hono` for route guards and middleware integration.

**Stack layers:**

- **Your services** → Use JWT auth in APIs and UIs
- **`flarelette` / `flarelette-hono`** → Framework middleware and route guards
- **`flarelette-jwt-kit` (this package)** → Core JWT signing, verification, and key management
- **Platform secrets** → Cloudflare bindings, environment variables

## Quick Start

### Installation

**TypeScript/JavaScript:**

```bash
npm install @chrislyons-dev/flarelette-jwt
```

**Python (Cloudflare Workers only):**

```bash
pip install flarelette-jwt
```

> **Note:** The Python package requires Cloudflare Workers Python runtime (Pyodide). For standard Python environments, use the TypeScript package via Node.js.

### Basic Example

**TypeScript:**

```typescript
import { sign, verify } from '@chrislyons-dev/flarelette-jwt'

// Sign a token (algorithm chosen from environment)
const token = await sign({ sub: 'user123', permissions: ['read:data'] })

// Verify a token
const payload = await verify(token)
if (payload) {
  console.log('Valid token:', payload.sub)
}
```

**Python:**

```python
from flarelette_jwt import sign, verify

# Sign a token (algorithm chosen from environment)
token = await sign({"sub": "user123", "permissions": ["read:data"]})

# Verify a token
payload = await verify(token)
if payload:
    print(f"Valid token: {payload.get('sub')}")
```

## Key Features

- **Algorithm auto-detection** — Chooses HS512 or EdDSA based on environment variables
- **Secret-name indirection** — References Cloudflare secret bindings instead of raw values
- **Identical TypeScript + Python APIs** — Same function names and behavior across languages
- **Service bindings for JWKS** — Direct Worker-to-Worker RPC for key distribution
- **Zero-trust delegation** — RFC 8693 actor claims for service-to-service authentication
- **Policy-based authorization** — Fluent API for composing permission and role requirements

## Configuration

Configuration is entirely environment-driven. No config files required.

**Common environment variables:**

```bash
JWT_ISS=https://gateway.example.com    # Token issuer
JWT_AUD=api.example.com                 # Token audience
JWT_TTL_SECONDS=900                     # Token lifetime (default: 15 min)
JWT_LEEWAY=90                           # Clock skew tolerance (default: 90 sec)
```

**HS512 mode** (symmetric, shared secret):

```bash
JWT_SECRET_NAME=MY_JWT_SECRET           # Reference to secret binding
```

**EdDSA mode** (asymmetric, Ed25519):

```bash
# Producer (signs tokens):
JWT_PRIVATE_JWK_NAME=GATEWAY_PRIVATE_KEY
JWT_KID=ed25519-2025-01

# Consumer (verifies tokens):
JWT_PUBLIC_JWK_NAME=GATEWAY_PUBLIC_KEY
# OR for key rotation:
JWT_JWKS_SERVICE_NAME=GATEWAY_BINDING
```

## Documentation

- **[Getting Started](./docs/getting-started.md)** — Installation, first token, and basic setup
- **[Core Concepts](./docs/core-concepts.md)** — Algorithms, modes, and architecture
- **[Usage Guide](./docs/usage-guide.md)** — Complete API reference for TypeScript and Python
- **[Service Delegation](./docs/service-delegation.md)** — RFC 8693 actor claims for zero-trust
- **[Security Guide](./docs/security-guide.md)** — Cryptographic profiles, key management, and best practices
- **[Cloudflare Workers](./docs/cloudflare-workers.md)** — Workers-specific configuration and deployment

## CLI Tools

**Generate HS512 secrets:**

```bash
npx flarelette-jwt-secret --len=64 --dotenv
```

**Generate EdDSA keypairs:**

```bash
npx flarelette-jwt-keygen --kid=ed25519-2025-01
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, coding standards, and release procedures.

## License

MIT — see [LICENSE](./LICENSE) for details.

## Security

For security concerns or vulnerability reports, see [docs/security-guide.md](./docs/security-guide.md) or open a security issue.
