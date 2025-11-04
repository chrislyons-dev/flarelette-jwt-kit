# Quick Start: Using Explicit Config in flarelette-demo

## Problem Solved

Previously, using flarelette-jwt in the flarelette-demo required:

1. Setting up `.dev.vars` files
2. Using `bindEnv()` middleware to set global state
3. Complex Miniflare configurations
4. Dealing with `globalThis.__FLARELETTE_ENV` pollution

With the new explicit configuration API, **none of this is required!**

## Gateway Integration

### Step 1: Create JWT Config at Startup

In `workers/gateway/src/index.ts`:

```typescript
import { createHS512Config, type HS512Config } from '@chrislyons-dev/flarelette-jwt'

// Create config once at app startup
function createJwtConfig(env: Env): HS512Config {
  return createHS512Config(env.JWT_SECRET, {
    iss: 'http://localhost:8787',
    aud: ['http://localhost:8788', 'http://localhost:8789', 'http://localhost:8790'],
    ttlSeconds: 900, // 15 minutes
  })
}

// Store config in app context
app.use('*', async (c, next) => {
  c.set('jwtConfig', createJwtConfig(c.env))
  await next()
})
```

### Step 2: Update Token Minting in auth.ts

Replace the complex environment-based code:

```typescript
// OLD - Complex environment setup
import { sign } from '@chrislyons-dev/flarelette-jwt'
import { bindEnv } from '@chrislyons-dev/flarelette-jwt/adapters'

// Required bindEnv() middleware
app.use('*', (c, next) => {
  bindEnv(c.env)
  return next()
})

// Still reads from global state
const token = await sign({ sub: 'user123' })
```

With simple, explicit code:

```typescript
// NEW - Explicit and clean
import { signWithConfig } from '@chrislyons-dev/flarelette-jwt'

export async function mintInternalToken(c: Context, claims: JwtPayload) {
  const config = c.get('jwtConfig') // Get from context
  return await signWithConfig(claims, config)
}

// Usage in endpoint
app.post('/auth/token', async c => {
  const externalToken = c.req.header('Authorization')
  const externalPayload = await verifyAuth0Token(externalToken)

  // Mint internal token with explicit config
  const token = await mintInternalToken(c, {
    sub: externalPayload.sub,
    email: externalPayload.email,
    permissions: externalPayload.permissions,
  })

  return c.json({ token })
})
```

## Backend Service Integration

### Step 3: Verify Tokens in Backend Services

In `workers/content-service/src/index.ts`:

```typescript
import { verifyWithConfig, createHS512Config } from '@chrislyons-dev/flarelette-jwt'

// Create config at startup
const jwtConfig = createHS512Config(env.JWT_SECRET, {
  iss: 'http://localhost:8787',
  aud: 'http://localhost:8788', // This service's URL
})

// Middleware to verify tokens
app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await verifyWithConfig(token, jwtConfig)

  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  c.set('user', payload)
  await next()
})
```

## Development Environment Setup

### No .dev.vars Required!

Create a shared config for all services:

```typescript
// dev-config.ts (shared across all workers)
import { type HS512Config } from '@chrislyons-dev/flarelette-jwt'

// Simple dev secret - same for all services
const DEV_SECRET = Buffer.alloc(32, 42) // 32 bytes, all set to 42

export const DEV_JWT_CONFIG: HS512Config = {
  alg: 'HS512',
  secret: DEV_SECRET,
  iss: 'http://localhost:8787',
  aud: ['http://localhost:8788', 'http://localhost:8789', 'http://localhost:8790'],
  ttlSeconds: 3600, // 1 hour for dev
}
```

Use in all services:

```typescript
import { signWithConfig, verifyWithConfig } from '@chrislyons-dev/flarelette-jwt'
import { DEV_JWT_CONFIG } from './dev-config'

// Gateway
const token = await signWithConfig(claims, DEV_JWT_CONFIG)

// Backend services
const payload = await verifyWithConfig(token, DEV_JWT_CONFIG)
```

## Testing

Write tests without any environment setup:

```typescript
import { describe, it, expect } from 'vitest'
import { signWithConfig, verifyWithConfig } from '@chrislyons-dev/flarelette-jwt'

describe('Gateway JWT minting', () => {
  const testConfig = {
    alg: 'HS512' as const,
    secret: new Uint8Array(32),
    iss: 'test-gateway',
    aud: 'test-service',
  }

  it('should mint valid token', async () => {
    const token = await signWithConfig({ sub: 'user123' }, testConfig)
    const payload = await verifyWithConfig(token, testConfig)

    expect(payload?.sub).toBe('user123')
  })
})
```

## Migration Checklist

- [ ] Update gateway to use `createHS512Config()`
- [ ] Replace `sign()` with `signWithConfig()`
- [ ] Update backend services to use `verifyWithConfig()`
- [ ] Remove `bindEnv()` middleware calls
- [ ] Simplify `.dev.vars` files (just need `JWT_SECRET` now)
- [ ] Remove custom Miniflare scripts (can use `wrangler dev` directly)
- [ ] Update tests to use explicit config
- [ ] Remove environment variable setup from tests

## Benefits for flarelette-demo

1. **Simpler development** - No complex environment setup
2. **Faster startup** - No need to configure bindings
3. **Better testing** - Isolated, reproducible tests
4. **Clearer code** - Explicit configuration is self-documenting
5. **Easier debugging** - No hidden global state
6. **Multiple configs** - Can test different scenarios easily

## Example: Complete Gateway Setup

```typescript
// workers/gateway/src/index.ts
import { Hono } from 'hono'
import {
  signWithConfig,
  createHS512Config,
  type HS512Config,
} from '@chrislyons-dev/flarelette-jwt'

type Env = {
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Env; Variables: { jwtConfig: HS512Config } }>()

// Create config middleware
app.use('*', async (c, next) => {
  const config = createHS512Config(c.env.JWT_SECRET, {
    iss: 'http://localhost:8787',
    aud: ['http://localhost:8788', 'http://localhost:8789'],
    ttlSeconds: 900,
  })
  c.set('jwtConfig', config)
  await next()
})

// Auth endpoint
app.post('/auth/token', async c => {
  const config = c.get('jwtConfig')

  // Verify external token (Auth0, etc.)
  const externalToken = c.req.header('Authorization')?.slice(7)
  const externalPayload = await verifyAuth0Token(externalToken)

  // Mint internal token
  const token = await signWithConfig(
    {
      sub: externalPayload.sub,
      email: externalPayload.email,
      permissions: externalPayload.permissions,
    },
    config
  )

  return c.json({ token })
})

export default app
```

## Next Steps

1. Install updated flarelette-jwt-kit: `npm install @chrislyons-dev/flarelette-jwt@latest`
2. Update gateway auth.ts to use explicit config
3. Update backend services to use explicit config
4. Remove bindEnv() middleware
5. Simplify development environment
6. Run tests to verify everything works

The explicit configuration API makes flarelette-jwt-kit **as simple to use as direct Web Crypto API**, but with all the benefits of the library's features (delegation, policies, EdDSA support, etc.).
