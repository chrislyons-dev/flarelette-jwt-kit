# Flarelette JWT Kit

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

**Python:**

```bash
pip install flarelette-jwt
```

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
