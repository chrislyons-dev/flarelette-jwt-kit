# Getting Started

This guide walks you through installing Flarelette JWT Kit and creating your first authenticated token.

## Installation

### TypeScript/JavaScript

```bash
npm install @chrislyons-dev/flarelette-jwt
```

**Requirements:**

- Node.js 18+ or Cloudflare Workers runtime
- TypeScript 5.0+ (if using TypeScript)

### Python

```bash
pip install flarelette-jwt
```

**Requirements:**

- Cloudflare Workers Python runtime (Pyodide)
- Python 3.11+ (Pyodide-based)

!!! warning "Cloudflare Workers Only"
The Python package is designed exclusively for Cloudflare Workers Python runtime (Pyodide). It uses the `js` module to access WebCrypto APIs, which is not available in standard Python environments.

## Your First Token

### Step 1: Configure Environment

Create a `.env` file or configure your runtime environment:

```bash
# Required configuration
JWT_ISS=https://your-service.example.com
JWT_AUD=your-api-audience
JWT_SECRET_NAME=MY_JWT_SECRET

# Optional (shown with defaults)
JWT_TTL_SECONDS=900  # 15 minutes
JWT_LEEWAY=90        # 90 seconds clock skew tolerance
```

### Step 2: Generate a Secret

**For development:**

```bash
npx flarelette-jwt-secret --len=64 --dotenv
```

This outputs a secure base64url-encoded secret:

```
JWT_SECRET=<64-byte-base64url-string>
```

**For production (Cloudflare Workers):**

```bash
# Store secret in Cloudflare
wrangler secret put MY_JWT_SECRET

# Configure wrangler.toml to reference it
[vars]
JWT_SECRET_NAME = "MY_JWT_SECRET"
JWT_ISS = "https://gateway.example.com"
JWT_AUD = "api.example.com"
```

### Step 3: Sign Your First Token

**TypeScript:**

```typescript
import { sign, verify } from '@chrislyons-dev/flarelette-jwt'

async function example() {
  // Create a token
  const token = await sign({
    sub: 'user123',
    permissions: ['read:data', 'write:data'],
    roles: ['user'],
  })

  console.log('Token:', token)

  // Verify the token
  const payload = await verify(token)
  if (payload) {
    console.log('Valid token for user:', payload.sub)
    console.log('Permissions:', payload.permissions)
  } else {
    console.log('Invalid token')
  }
}
```

**Python:**

```python
from flarelette_jwt import sign, verify
import asyncio

async def example():
    # Create a token
    token = await sign({
        "sub": "user123",
        "permissions": ["read:data", "write:data"],
        "roles": ["user"]
    })

    print(f"Token: {token}")

    # Verify the token
    payload = await verify(token)
    if payload:
        print(f"Valid token for user: {payload.get('sub')}")
        print(f"Permissions: {payload.get('permissions')}")
    else:
        print("Invalid token")

asyncio.run(example())
```

## Using High-Level Helpers

The kit provides high-level functions for common patterns.

### Creating Tokens with Options

**TypeScript:**

```typescript
import { createToken } from '@chrislyons-dev/flarelette-jwt'

const token = await createToken(
  {
    sub: 'user123',
    permissions: ['read:data'],
  },
  {
    ttlSeconds: 600, // Override default TTL
    aud: 'special-api', // Override default audience
  }
)
```

**Python:**

```python
from flarelette_jwt import create_token

token = await create_token(
    {"sub": "user123", "permissions": ["read:data"]},
    ttl_seconds=600,  # Override default TTL
    aud="special-api"  # Override default audience
)
```

### Authorization with Policies

**TypeScript:**

```typescript
import { checkAuth, policy } from '@chrislyons-dev/flarelette-jwt'

const authPolicy = policy()
  .needAll('read:data', 'write:data')
  .rolesAny('admin', 'editor')
  .build()

const auth = await checkAuth(token, authPolicy)
if (auth) {
  console.log('Authorized user:', auth.sub)
  console.log('Permissions:', auth.permissions)
} else {
  console.log('Authorization failed')
}
```

**Python:**

```python
from flarelette_jwt import check_auth, policy

auth_policy = (
    policy()
    .need_all('read:data', 'write:data')
    .roles_any('admin', 'editor')
    .build()
)

auth = await check_auth(token, **auth_policy)
if auth:
    print(f"Authorized user: {auth['sub']}")
    print(f"Permissions: {auth['permissions']}")
else:
    print("Authorization failed")
```

## Explicit Configuration (No Environment Variables)

> **New in v1.9.0**: Pass configuration directly without environment setup

For development, testing, or scenarios where environment variables are inconvenient, use the explicit configuration API:

**TypeScript:**

```typescript
import {
  createHS512Config,
  createTokenWithConfig,
  verifyWithConfig,
} from '@chrislyons-dev/flarelette-jwt'

// Create config object (no environment variables needed)
const config = createHS512Config('your-base64url-secret-here', {
  iss: 'https://gateway.example.com',
  aud: 'api.example.com',
  ttlSeconds: 900,
})

// Sign and verify
const token = await createTokenWithConfig(
  {
    sub: 'user123',
    permissions: ['read:data'],
  },
  config
)

const payload = await verifyWithConfig(token, config)
console.log('User:', payload?.sub)
```

**When to use:**

- Development environments (skip .env setup)
- Testing (isolated configs per test)
- Multi-tenant apps (different configs per tenant)

**Full documentation:** [Explicit Configuration API](./explicit-config.md)

## Next Steps

- **[Core Concepts](./core-concepts.md)** — Understand algorithms, modes, and architecture
- **[Usage Guide](./usage-guide.md)** — Explore the complete API
- **[Cloudflare Workers](./cloudflare-workers.md)** — Deploy to Workers with proper secret management
- **[Security Guide](./security-guide.md)** — Learn cryptographic profiles and best practices

## Common Issues

### "JWT secret missing" Error

**Cause:** Environment variable not set or secret-name indirection not resolving.

**Solution:**

1. Verify `JWT_SECRET_NAME` points to an actual environment variable
2. For Workers, ensure you ran `wrangler secret put <NAME>`
3. Check your wrangler.toml has the correct `JWT_SECRET_NAME` value

### Algorithm Mismatch

**Cause:** Token was signed with one algorithm but consumer expects another.

**Solution:**

- Verify both producer and consumer use the same environment configuration
- Check which mode is active using the `envMode()` function (TypeScript) or `mode()` function (Python)
- See [Core Concepts](./core-concepts.md) for mode detection rules

### Token Always Returns Null

**Cause:** Verification failure due to mismatched claims or expired token.

**Solution:**

1. Check `JWT_ISS` and `JWT_AUD` match between producer and consumer
2. Verify token hasn't expired (default 15 min TTL)
3. Use `parse()` to inspect token contents without verification:
   ```typescript
   import { parse } from '@chrislyons-dev/flarelette-jwt'
   const { header, payload } = parse(token)
   console.log('Algorithm:', header.alg)
   console.log('Issuer:', payload.iss)
   console.log('Expires:', new Date(payload.exp * 1000))
   ```
