# Explicit Configuration API

> **New in v1.9.0**: Pass configuration directly without environment variables

## Overview

The explicit configuration API provides a way to use flarelette-jwt-kit **without relying on environment variables or global state**. This is ideal for:

- **Development environments** where setting up `.env` files and bindings is cumbersome
- **Testing** where you need isolated, reproducible JWT configurations
- **Multi-tenant scenarios** where different tokens need different configurations
- **Debugging** when you want explicit control over every JWT parameter

## Quick Start

### HS512 (Symmetric) Example

```typescript
import {
  createHS512Config,
  createTokenWithConfig,
  verifyWithConfig,
} from '@chrislyons-dev/flarelette-jwt'

// Create configuration object (no environment variables needed!)
const config = createHS512Config('your-base64url-secret-here', {
  iss: 'https://gateway.example.com',
  aud: 'api.example.com',
  ttlSeconds: 900,
})

// Sign a token
const token = await createTokenWithConfig(
  {
    sub: 'user123',
    permissions: ['read:data'],
  },
  config
)

// Verify the token
const payload = await verifyWithConfig(token, config)
console.log('User:', payload?.sub)
```

### EdDSA (Asymmetric) Example

```typescript
import {
  createEdDSASignConfig,
  createEdDSAVerifyConfig,
  signWithConfig,
  verifyWithConfig,
} from '@chrislyons-dev/flarelette-jwt'

// Producer configuration (signs tokens)
const signConfig = createEdDSASignConfig(
  {
    kty: 'OKP',
    crv: 'Ed25519',
    d: 'private-key-d-value',
    x: 'public-key-x-value',
  },
  {
    iss: 'https://gateway.example.com',
    aud: 'api.example.com',
  },
  'ed25519-2025-01' // Key ID
)

// Consumer configuration (verifies tokens)
const verifyConfig = createEdDSAVerifyConfig(
  {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'public-key-x-value',
  },
  {
    iss: 'https://gateway.example.com',
    aud: 'api.example.com',
  }
)

// Sign and verify
const token = await signWithConfig({ sub: 'user456' }, signConfig)
const payload = await verifyWithConfig(token, verifyConfig)
```

## API Reference

### Configuration Types

#### `BaseJwtConfig`

Base configuration shared by all JWT operations:

```typescript
interface BaseJwtConfig {
  iss: string // Token issuer (iss claim)
  aud: string | string[] // Token audience (aud claim)
  ttlSeconds?: number // Token lifetime (default: 900 = 15 min)
  leeway?: number // Clock skew tolerance (default: 90 sec)
}
```

#### `HS512Config`

Symmetric (shared secret) configuration:

```typescript
interface HS512Config extends BaseJwtConfig {
  alg: 'HS512'
  secret: Uint8Array // Minimum 64 bytes (HS512 requirement)
}
```

#### `EdDSASignConfig`

Asymmetric signing configuration:

```typescript
interface EdDSASignConfig extends BaseJwtConfig {
  alg: 'EdDSA'
  privateJwk: JWK // Private Ed25519 key
  kid?: string // Key ID for rotation
}
```

#### `EdDSAVerifyConfig`

Asymmetric verification configuration:

```typescript
interface EdDSAVerifyConfig extends BaseJwtConfig {
  alg: 'EdDSA'
  publicJwk: JWK // Public Ed25519 key
}
```

### Core Functions

#### `signWithConfig(payload, config, overrides?)`

Sign a JWT token with explicit configuration.

**Parameters:**

- `payload: JwtPayload` - Claims to include in token
- `config: SignConfig` - HS512 or EdDSA sign configuration
- `overrides?: Partial<{ iss, aud, ttlSeconds }>` - Per-call overrides

**Returns:** `Promise<string>` - Signed JWT token

#### `verifyWithConfig(token, config, overrides?)`

Verify a JWT token with explicit configuration.

**Parameters:**

- `token: string` - JWT token to verify
- `config: VerifyConfig` - HS512 or EdDSA verify configuration
- `overrides?: Partial<{ iss, aud, leeway }>` - Per-call overrides

**Returns:** `Promise<JwtPayload | null>` - Payload if valid, null if invalid

### High-Level Functions

#### `createTokenWithConfig(claims, config, overrides?)`

Convenience wrapper around `signWithConfig()`.

#### `createDelegatedTokenWithConfig(originalPayload, actorService, config, overrides?)`

Create an RFC 8693 delegated token for service-to-service authentication.

**Example:**

```typescript
// Gateway receives Auth0 token
const auth0Payload = await verifyAuth0Token(externalToken)

// Create delegated token for internal API
const internalToken = await createDelegatedTokenWithConfig(
  auth0Payload,
  'gateway-service', // Actor identifier
  config
)

// Result includes:
// - sub: original user
// - act: { sub: 'gateway-service' }
// - permissions: original permissions (no escalation)
```

#### `checkAuthWithConfig(token, config, authzOpts?, verifyOverrides?)`

Verify and authorize a token with policy enforcement.

**Example:**

```typescript
const user = await checkAuthWithConfig(token, config, {
  require_all_permissions: ['read:data', 'write:data'],
  require_any_permission: ['admin', 'editor'],
  require_roles_all: ['user'],
  predicates: [payload => payload.email?.endsWith('@example.com')],
})

if (user) {
  console.log('Authorized:', user.sub, user.permissions)
}
```

### Helper Functions

#### `createHS512Config(secret, baseConfig)`

Create HS512 configuration from base64url-encoded secret.

**Parameters:**

- `secret: string` - Base64url-encoded secret (generates with `npx flarelette-jwt-secret`)
- `baseConfig: Omit<BaseJwtConfig, 'ttlSeconds' | 'leeway'> & Partial<...>` - Base configuration

**Returns:** `HS512Config`

#### `createEdDSASignConfig(privateJwk, baseConfig, kid?)`

Create EdDSA signing configuration from private JWK.

**Parameters:**

- `privateJwk: JWK | string` - Private JWK object or JSON string
- `baseConfig` - Base configuration
- `kid?: string` - Key ID

**Returns:** `EdDSASignConfig`

#### `createEdDSAVerifyConfig(publicJwk, baseConfig)`

Create EdDSA verification configuration from public JWK.

**Parameters:**

- `publicJwk: JWK | string` - Public JWK object or JSON string
- `baseConfig` - Base configuration

**Returns:** `EdDSAVerifyConfig`

## Use Cases

### Development Environment

**Problem:** Setting up `.env` files and Cloudflare bindings for local development is complex.

**Solution:** Create config objects directly:

```typescript
// No .env files needed
const devConfig = {
  alg: 'HS512' as const,
  secret: new Uint8Array(64), // 64-byte dev secret
  iss: 'http://localhost:3000',
  aud: ['http://localhost:3001', 'http://localhost:3002'],
  ttlSeconds: 3600, // 1 hour
}

// All services use the same config
const token = await createTokenWithConfig({ sub: 'dev-user' }, devConfig)
```

### Testing

**Problem:** Tests need isolated JWT configurations without environment pollution.

**Solution:** Each test gets its own config:

```typescript
describe('JWT authentication', () => {
  const testConfig = {
    alg: 'HS512' as const,
    secret: new Uint8Array(64),
    iss: 'test-issuer',
    aud: 'test-audience',
  }

  it('should verify valid tokens', async () => {
    const token = await createTokenWithConfig({ sub: 'test' }, testConfig)
    const payload = await verifyWithConfig(token, testConfig)
    expect(payload?.sub).toBe('test')
  })
})
```

### Multi-Tenant Applications

**Problem:** Different tenants need different JWT configurations.

**Solution:** Store configurations per tenant:

```typescript
const tenantConfigs = new Map<string, HS512Config>()

tenantConfigs.set('tenant-a', createHS512Config(secretA, { ... }))
tenantConfigs.set('tenant-b', createHS512Config(secretB, { ... }))

// Use tenant-specific config
const config = tenantConfigs.get(tenantId)
const token = await createTokenWithConfig(claims, config)
```

## Comparison: Environment-Based vs Explicit

### Environment-Based API (Original)

```typescript
// Requires environment variables:
// JWT_SECRET_NAME=MY_JWT_SECRET
// JWT_ISS=https://gateway.example.com
// JWT_AUD=api.example.com

import { sign, verify } from '@chrislyons-dev/flarelette-jwt'

// Reads from environment automatically
const token = await sign({ sub: 'user123' })
const payload = await verify(token)
```

**Pros:**

- Zero configuration code
- Works great in production with Cloudflare bindings
- Automatic algorithm detection

**Cons:**

- Requires `.env` setup for development
- Global state makes testing harder
- Cannot use multiple configurations simultaneously

### Explicit Configuration API (New)

```typescript
// No environment variables required
import {
  signWithConfig,
  verifyWithConfig,
  createHS512Config,
} from '@chrislyons-dev/flarelette-jwt'

const config = createHS512Config(secret, {
  iss: 'https://gateway.example.com',
  aud: 'api.example.com',
})

const token = await signWithConfig({ sub: 'user123' }, config)
const payload = await verifyWithConfig(token, config)
```

**Pros:**

- No environment setup required
- Explicit and testable
- Multiple configurations in same process
- No global state

**Cons:**

- More verbose
- Must manage configuration objects

## Migration Guide

### From Environment-Based to Explicit

**Before:**

```typescript
import { sign, verify } from '@chrislyons-dev/flarelette-jwt'

// .env file required:
// JWT_SECRET_NAME=MY_JWT_SECRET
// JWT_ISS=https://gateway.example.com
// JWT_AUD=api.example.com

const token = await sign({ sub: 'user' })
const payload = await verify(token)
```

**After:**

```typescript
import {
  signWithConfig,
  verifyWithConfig,
  createHS512Config,
} from '@chrislyons-dev/flarelette-jwt'

const config = createHS512Config(process.env.MY_JWT_SECRET!, {
  iss: 'https://gateway.example.com',
  aud: 'api.example.com',
})

const token = await signWithConfig({ sub: 'user' }, config)
const payload = await verifyWithConfig(token, config)
```

### Gradual Migration

You can use both APIs in the same project:

```typescript
// Production: environment-based
import { sign, verify } from '@chrislyons-dev/flarelette-jwt'

// Development: explicit config
import { signWithConfig, createHS512Config } from '@chrislyons-dev/flarelette-jwt'

const config =
  process.env.NODE_ENV === 'production'
    ? null // Use environment-based API
    : createHS512Config('dev-secret', { iss: '...', aud: '...' })

const token = config ? await signWithConfig(claims, config) : await sign(claims)
```

## Best Practices

1. **Use explicit API for development and testing** - Simplifies setup
2. **Use environment-based API for production** - Leverages Cloudflare bindings
3. **Store secrets securely** - Never hardcode secrets in source code
4. **Validate configurations** - Check secret length, issuer/audience values
5. **Reuse config objects** - Create once, use many times
6. **Consider a config factory** - Abstract configuration creation

```typescript
// Example: Config factory
function createJwtConfig(env: 'dev' | 'prod'): HS512Config {
  if (env === 'dev') {
    return {
      alg: 'HS512',
      secret: new Uint8Array(64), // 64-byte dev secret
      iss: 'http://localhost:3000',
      aud: 'http://localhost:3001',
      ttlSeconds: 3600,
    }
  }

  return createHS512Config(process.env.JWT_SECRET!, {
    iss: process.env.JWT_ISS!,
    aud: process.env.JWT_AUD!,
  })
}
```

## See Also

- [Getting Started Guide](./getting-started.md) - Basic JWT usage
- [Security Guide](./security-guide.md) - Cryptographic best practices
- [Service Delegation](./service-delegation.md) - RFC 8693 patterns
- [Cloudflare Workers](./cloudflare-workers.md) - Production deployment
