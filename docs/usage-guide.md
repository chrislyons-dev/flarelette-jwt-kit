# Usage Guide

Complete API reference for Flarelette JWT Kit with examples in TypeScript and Python.

## Overview

This guide covers all exported functions, types, and patterns for both languages. For conceptual understanding, see [Core Concepts](./core-concepts.md). For security best practices, see [Security Guide](./security-guide.md).

## Core Functions

### sign()

Low-level JWT signing function. Algorithm (HS512 or EdDSA) is automatically detected from environment.

**TypeScript:**

```typescript
import { sign } from '@chrislyons-dev/flarelette-jwt'

const token = await sign({
  sub: 'user123',
  permissions: ['read:data', 'write:data'],
  roles: ['user', 'editor'],
})
```

**Python:**

```python
from flarelette_jwt import sign

token = await sign({
    "sub": "user123",
    "permissions": ["read:data", "write:data"],
    "roles": ["user", "editor"]
})
```

**Parameters:**

- `payload` (ClaimsDict) - Custom claims to include in token. Standard claims (`iss`, `aud`, `iat`, `exp`) are added automatically from environment.

**Returns:** `Promise<string>` (TypeScript) or `str` (Python) - Signed JWT token

**Automatically added claims:**

- `iss` - From `JWT_ISS` environment variable
- `aud` - From `JWT_AUD` environment variable
- `iat` - Current Unix timestamp
- `exp` - Current timestamp + `JWT_TTL_SECONDS` (default 900)
- `jti` - Optional, if `JWT_JTI` is set

### verify()

Low-level JWT verification function. Validates signature, issuer, audience, and expiration.

**TypeScript:**

```typescript
import { verify } from '@chrislyons-dev/flarelette-jwt'

const payload = await verify(token)
if (payload) {
  console.log('Valid token for user:', payload.sub)
} else {
  console.log('Invalid or expired token')
}
```

**Python:**

```python
from flarelette_jwt import verify

payload = await verify(token)
if payload:
    print(f"Valid token for user: {payload.get('sub')}")
else:
    print("Invalid or expired token")
```

**Parameters:**

- `token` (string) - JWT token to verify
- `options` (optional) - Verification options:
  - `leeway` (number) - Clock skew tolerance in seconds (overrides `JWT_LEEWAY`)

**Returns:** `Promise<JwtPayload | null>` (TypeScript) or `JwtPayload | None` (Python)

**Fail-silent behavior:** Returns `null`/`None` on any verification failure (invalid signature, expired, wrong issuer/audience, etc.)

### parse()

Parse JWT token without verification. Useful for inspecting token contents.

**TypeScript:**

```typescript
import { parse } from '@chrislyons-dev/flarelette-jwt'

const { header, payload } = parse(token)
console.log('Algorithm:', header.alg)
console.log('Key ID:', header.kid)
console.log('Issuer:', payload.iss)
console.log('Expires:', new Date(payload.exp * 1000))
```

**Python:**

```python
from flarelette_jwt import parse

parsed = parse(token)
print(f"Algorithm: {parsed['header']['alg']}")
print(f"Key ID: {parsed['header'].get('kid')}")
print(f"Issuer: {parsed['payload']['iss']}")
print(f"Expires: {parsed['payload']['exp']}")
```

**Parameters:**

- `token` (string) - JWT token to parse

**Returns:** `ParsedJwt` - Object with `header` and `payload` fields

**Warning:** Does not validate signature or claims. Never use parsed data for authorization decisions without calling `verify()` first.

## High-Level Functions

### createToken()

High-level token creation with options. Wraps `sign()` with additional configurability.

**TypeScript:**

```typescript
import { createToken } from '@chrislyons-dev/flarelette-jwt'

const token = await createToken(
  {
    sub: 'user123',
    permissions: ['read:data'],
    email: 'user@example.com',
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
    {"sub": "user123", "permissions": ["read:data"], "email": "user@example.com"},
    ttl_seconds=600,  # Override default TTL
    aud="special-api"  # Override default audience
)
```

**Parameters:**

- `claims` (ClaimsDict) - Custom claims
- `options` (optional):
  - `ttlSeconds` / `ttl_seconds` (number) - Token lifetime in seconds (overrides `JWT_TTL_SECONDS`)
  - `aud` (string) - Audience claim (overrides `JWT_AUD`)

**Returns:** `Promise<string>` (TypeScript) or `str` (Python) - Signed JWT token

### checkAuth()

Verify token and check authorization policy in one call.

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
  console.log('Full payload:', auth.payload)
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
    print(f"Full payload: {auth['payload']}")
else:
    print("Authorization failed")
```

**Parameters:**

- `token` (string) - JWT token to verify
- `authzOpts` (AuthzOpts / dict) - Authorization requirements (from `policy().build()`)

**Returns:** `Promise<AuthUser | null>` (TypeScript) or `AuthUser | None` (Python)

**AuthUser fields:**

- `sub` - Subject (user ID)
- `permissions` - List of permission strings
- `roles` - List of role strings
- `payload` - Full JWT payload

### createDelegatedToken()

Create delegated token for service-to-service authentication using RFC 8693 actor claims.

**TypeScript:**

```typescript
import { createDelegatedToken } from '@chrislyons-dev/flarelette-jwt'

// Gateway receives external token
const externalPayload = await verifyAuth0Token(externalToken)

// Create internal token for API service
const internalToken = await createDelegatedToken(
  externalPayload, // Original verified payload
  'gateway-service', // Actor service identifier
  {
    aud: 'internal-api', // Internal audience
    ttlSeconds: 300, // Short-lived (5 min)
  }
)
```

**Python:**

```python
from flarelette_jwt import create_delegated_token

# Gateway receives external token
external_payload = await verify_auth0_token(external_token)

# Create internal token for API service
internal_token = await create_delegated_token(
    external_payload,        # Original verified payload
    "gateway-service",       # Actor service identifier
    aud="internal-api",      # Internal audience
    ttl_seconds=300          # Short-lived (5 min)
)
```

**Parameters:**

- `originalPayload` / `original_payload` (JwtPayload) - Verified payload from external token
- `actorServiceId` / `actor_service_id` (string) - Service identifier for `act` claim
- `options` (optional):
  - `ttlSeconds` / `ttl_seconds` (number) - Token lifetime (default: 300 seconds)
  - `aud` (string) - Internal audience (overrides `JWT_AUD`)

**Returns:** `Promise<string>` (TypeScript) or `str` (Python) - Delegated JWT token

**Preserved claims:**

- `sub` - Original user identifier
- `permissions` - Original permissions (no escalation)
- `roles` - Original roles
- `email`, `name`, `groups`, `tid`, `org_id`, `department` - If present

**Added claims:**

- `act` - Actor claim with `sub` field containing `actorServiceId`
- New `iss`, `aud`, `iat`, `exp`, `jti` - For internal token

**Delegation chains:** If `originalPayload` already has an `act` claim, it is nested:

```json
{
  "sub": "user@example.com",
  "act": {
    "sub": "api-service",
    "act": {
      "sub": "gateway-service"
    }
  }
}
```

See [Service Delegation](./service-delegation.md) for detailed usage patterns.

### policy()

Fluent builder for authorization policies.

**TypeScript:**

```typescript
import { policy } from '@chrislyons-dev/flarelette-jwt'

// Require all listed permissions
const p1 = policy().needAll('read:data', 'write:data').build()

// Require at least one listed permission
const p2 = policy().needAny('read:data', 'admin:all').build()

// Require at least one listed role
const p3 = policy().rolesAny('admin', 'editor').build()

// Require all listed roles
const p4 = policy().rolesAll('user', 'verified').build()

// Custom predicate function
const p5 = policy()
  .predicate(payload => payload.email?.endsWith('@example.com'))
  .build()

// Combine multiple requirements
const p6 = policy()
  .needAll('read:data')
  .rolesAny('admin', 'editor')
  .predicate(payload => payload.email?.endsWith('@example.com'))
  .build()
```

**Python:**

```python
from flarelette_jwt import policy

# Require all listed permissions
p1 = policy().need_all('read:data', 'write:data').build()

# Require at least one listed permission
p2 = policy().need_any('read:data', 'admin:all').build()

# Require at least one listed role
p3 = policy().roles_any('admin', 'editor').build()

# Require all listed roles
p4 = policy().roles_all('user', 'verified').build()

# Custom predicate function
p5 = policy().predicate(lambda payload: payload.get("email", "").endswith("@example.com")).build()

# Combine multiple requirements
p6 = (
    policy()
    .need_all('read:data')
    .roles_any('admin', 'editor')
    .predicate(lambda payload: payload.get("email", "").endswith("@example.com"))
    .build()
)
```

**Builder methods:**

- `needAll(...perms)` / `need_all(...perms)` - Require all listed permissions
- `needAny(...perms)` / `need_any(...perms)` - Require at least one listed permission
- `rolesAll(...roles)` / `roles_all(...roles)` - Require all listed roles
- `rolesAny(...roles)` / `roles_any(...roles)` - Require at least one listed role
- `predicate(fn)` - Add custom validation function
- `build()` - Return authorization options object

**Predicates:** Functions that receive `JwtPayload` and return boolean. Multiple predicates are AND-ed together.

## Configuration Functions

### envMode() / mode()

Detect which algorithm mode is active based on environment variables.

**TypeScript:**

```typescript
import { envMode } from '@chrislyons-dev/flarelette-jwt'

const producerMode = envMode('producer')
console.log('Producer mode:', producerMode) // "HS512" or "EdDSA"

const consumerMode = envMode('consumer')
console.log('Consumer mode:', consumerMode) // "HS512" or "EdDSA"
```

**Python:**

```python
from flarelette_jwt import mode

producer_mode = mode('producer')
print(f'Producer mode: {producer_mode}')  # "HS512" or "EdDSA"

consumer_mode = mode('consumer')
print(f'Consumer mode: {consumer_mode}')  # "HS512" or "EdDSA"
```

**Parameters:**

- `role` - Either `"producer"` (signing) or `"consumer"` (verification)

**Returns:** `"HS512"` or `"EdDSA"`

**Detection logic:**

- **Producer**: If `JWT_PRIVATE_JWK_NAME` or `JWT_PRIVATE_JWK` exists → `"EdDSA"`, otherwise `"HS512"`
- **Consumer**: If `JWT_PUBLIC_JWK_NAME` or `JWT_PUBLIC_JWK` or `JWT_JWKS_SERVICE_NAME` exists → `"EdDSA"`, otherwise `"HS512"`

### getProfile() / profile()

Get complete JWT configuration profile for current mode.

**TypeScript:**

```typescript
import { getProfile } from '@chrislyons-dev/flarelette-jwt'

const producerProfile = getProfile('producer')
console.log('Producer algorithm:', producerProfile.alg)
console.log('Has secret:', !!producerProfile.secret)
console.log('Has private key:', !!producerProfile.privateJwk)

const consumerProfile = getProfile('consumer')
console.log('Consumer algorithm:', consumerProfile.alg)
console.log('Has JWKS service:', !!consumerProfile.jwksService)
```

**Python:**

```python
from flarelette_jwt import profile

producer_profile = profile('producer')
print(f'Producer algorithm: {producer_profile["alg"]}')
print(f'Has secret: {bool(producer_profile.get("secret"))}')

consumer_profile = profile('consumer')
print(f'Consumer algorithm: {consumer_profile["alg"]}')
```

**Parameters:**

- `role` - Either `"producer"` or `"consumer"`

**Returns:** `JwtProfile` object with fields:

- `alg` - Algorithm: `"HS512"` or `"EdDSA"`
- `secret` - Base64url-encoded secret (HS512 only)
- `privateJwk` - Private JWK string (EdDSA producer only)
- `publicJwk` - Public JWK string (EdDSA consumer with inline key only)
- `jwksService` - Fetcher service binding (EdDSA consumer with service binding only, TypeScript only)
- `kid` - Key ID (EdDSA producer only)
- `allowedThumbprints` - List of allowed JWK thumbprints (EdDSA consumer only)

### getCommon() / common()

Get common configuration shared by producer and consumer.

**TypeScript:**

```typescript
import { getCommon } from '@chrislyons-dev/flarelette-jwt'

const config = getCommon()
console.log('Issuer:', config.iss)
console.log('Audience:', config.aud)
console.log('TTL:', config.ttlSeconds, 'seconds')
console.log('Leeway:', config.leeway, 'seconds')
```

**Python:**

```python
from flarelette_jwt import common

config = common()
print(f'Issuer: {config["iss"]}')
print(f'Audience: {config["aud"]}')
print(f'TTL: {config["ttl_seconds"]} seconds')
print(f'Leeway: {config["leeway"]} seconds')
```

**Returns:** `JwtCommonConfig` object with fields:

- `iss` - Token issuer (from `JWT_ISS`)
- `aud` - Token audience (from `JWT_AUD`)
- `ttlSeconds` / `ttl_seconds` - Token lifetime in seconds (from `JWT_TTL_SECONDS`, default 900)
- `leeway` - Clock skew tolerance in seconds (from `JWT_LEEWAY`, default 90)

## Utility Functions

### isExpiringSoon() / is_expiring_soon()

Check if token is expiring within a threshold.

**TypeScript:**

```typescript
import { isExpiringSoon, verify } from '@chrislyons-dev/flarelette-jwt'

const payload = await verify(token)
if (payload && isExpiringSoon(payload, 300)) {
  console.log('Token expires within 5 minutes, consider refreshing')
}
```

**Python:**

```python
from flarelette_jwt import is_expiring_soon, verify

payload = await verify(token)
if payload and is_expiring_soon(payload, 300):
    print("Token expires within 5 minutes, consider refreshing")
```

**Parameters:**

- `payload` (JwtPayload) - Verified JWT payload
- `thresholdSeconds` / `threshold_seconds` (number) - Time window in seconds (default: 300)

**Returns:** `boolean` - `true` if token expires within threshold

### generateSecret() / generate_secret()

Generate cryptographically random HS512 secret.

**TypeScript:**

```typescript
import { generateSecret } from '@chrislyons-dev/flarelette-jwt'

const secret = generateSecret(64) // 64 bytes
console.log('JWT_SECRET=' + secret)
```

**Python:**

```python
from flarelette_jwt import generate_secret

secret = generate_secret(64)  # 64 bytes
print(f"JWT_SECRET={secret}")
```

**Parameters:**

- `length` (number) - Secret length in bytes (default: 64)

**Returns:** `string` - Base64url-encoded secret

**Usage:** For HS512, use minimum 64 bytes (512 bits) for ~256-bit security.

## Adapters

### TypeScript: makeKit()

Inject Cloudflare Worker environment for use in Workers runtime.

```typescript
import { makeKit } from '@chrislyons-dev/flarelette-jwt/adapters/hono'
import { Hono } from 'hono'
import type { WorkerEnv } from '@chrislyons-dev/flarelette-jwt'

const app = new Hono<{ Bindings: WorkerEnv }>()

// Inject environment middleware
app.use('*', async (c, next) => {
  const jwt = makeKit(c.env)
  c.set('jwt', jwt)
  await next()
})

// Use in routes
app.get('/secure', async c => {
  const jwt = c.get('jwt')
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  const auth = await jwt.checkAuth(token, jwt.policy().build())
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({ data: 'secure', user: auth.sub })
})

export default app
```

**What it does:**

1. Extracts string variables from Worker `env` object
2. Extracts Fetcher service bindings (for JWKS)
3. Stores in `globalThis.__FLARELETTE_ENV` and `globalThis.__FLARELETTE_SERVICES`
4. Returns object with all JWT functions bound to environment

**Returns:** Object with all JWT functions pre-configured for Worker environment

### Python: apply_env_bindings()

Copy Worker environment to `os.environ` for use in Python Workers.

```python
from flarelette_jwt.adapters import apply_env_bindings
from flarelette_jwt import check_auth, policy
from js import Response

async def on_fetch(request, env, ctx):
    # Inject environment (call once per request)
    apply_env_bindings(env)

    # Get token
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.removeprefix('Bearer ')

    # Verify and authorize
    auth = await check_auth(token, **policy().build())
    if not auth:
        return Response.new('{"error": "Unauthorized"}', status=401)

    return Response.new(f'{{"data": "secure", "user": "{auth["sub"]}"}}')
```

**What it does:**

1. Iterates over Worker `env` mapping
2. Copies string values to `os.environ`
3. All JWT functions read from `os.environ`

**Note:** Python Workers don't support Fetcher service bindings. Use inline `JWT_PUBLIC_JWK` for EdDSA verification.

## Types and Interfaces

### TypeScript Types

**AlgType** - JWT algorithm:

```typescript
type AlgType = 'HS512' | 'EdDSA'
```

**ClaimsDict** - Custom token claims:

```typescript
interface ClaimsDict {
  sub?: string // Subject (user ID)
  permissions?: string[] // Permission strings
  roles?: string[] // Role strings
  email?: string // User email
  name?: string // Display name
  [key: string]: JwtValue // Additional custom claims
}
```

**JwtValue** - Allowed claim value types:

```typescript
type JwtValue =
  | string
  | number
  | boolean
  | null
  | JwtValue[]
  | { [key: string]: JwtValue }
```

**JwtHeader** - JWT header:

```typescript
interface JwtHeader {
  alg: AlgType
  typ: 'JWT'
  kid?: string // Key ID (EdDSA only)
}
```

**JwtPayload** - JWT payload:

```typescript
interface JwtPayload {
  iss: string // Issuer
  aud: string // Audience
  sub: string // Subject
  iat: number // Issued at (Unix timestamp)
  exp: number // Expiration (Unix timestamp)
  nbf?: number // Not before (Unix timestamp)
  jti?: string // JWT ID
  permissions?: string[] // Permission strings
  roles?: string[] // Role strings
  act?: ActorClaim // Actor claim for delegation
  [key: string]: JwtValue // Additional claims
}
```

**ActorClaim** - RFC 8693 actor claim:

```typescript
interface ActorClaim {
  sub: string // Actor service identifier
  act?: ActorClaim // Nested actor (delegation chain)
}
```

**AuthUser** - Authorized user result:

```typescript
interface AuthUser {
  sub: string // Subject (user ID)
  permissions: string[] // Permission strings
  roles: string[] // Role strings
  payload: JwtPayload // Full JWT payload
}
```

**ParsedJwt** - Parsed token:

```typescript
interface ParsedJwt {
  header: JwtHeader
  payload: JwtPayload
}
```

**WorkerEnv** - Cloudflare Worker environment:

```typescript
interface WorkerEnv {
  [key: string]: string | Fetcher
}
```

**Fetcher** - Service binding:

```typescript
interface Fetcher {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>
}
```

### Python Types

Python uses TypedDicts for type hints:

**AlgType** - JWT algorithm:

```python
AlgType = Literal["HS512", "EdDSA"]
```

**ClaimsDict** - Custom token claims:

```python
class ClaimsDict(TypedDict, total=False):
    sub: str
    permissions: list[str]
    roles: list[str]
    email: str
    name: str
    # Additional fields allowed via NotRequired
```

**JwtHeader** - JWT header:

```python
class JwtHeader(TypedDict):
    alg: AlgType
    typ: Literal["JWT"]
    kid: NotRequired[str]
```

**JwtPayload** - JWT payload:

```python
class JwtPayload(TypedDict):
    iss: str
    aud: str
    sub: str
    iat: int
    exp: int
    nbf: NotRequired[int]
    jti: NotRequired[str]
    permissions: NotRequired[list[str]]
    roles: NotRequired[list[str]]
    act: NotRequired[ActorClaim]
```

**ActorClaim** - RFC 8693 actor claim:

```python
class ActorClaim(TypedDict):
    sub: str
    act: NotRequired[ActorClaim]
```

**AuthUser** - Authorized user result:

```python
class AuthUser(TypedDict):
    sub: str
    permissions: list[str]
    roles: list[str]
    payload: JwtPayload
```

**ParsedJwt** - Parsed token:

```python
class ParsedJwt(TypedDict):
    header: JwtHeader
    payload: JwtPayload
```

## Common Patterns

### Pattern: Cloudflare Worker (TypeScript with Hono)

```typescript
import { Hono } from 'hono'
import { makeKit } from '@chrislyons-dev/flarelette-jwt/adapters/hono'
import type { WorkerEnv } from '@chrislyons-dev/flarelette-jwt'

const app = new Hono<{ Bindings: WorkerEnv }>()

// Environment injection middleware
app.use('*', async (c, next) => {
  const jwt = makeKit(c.env)
  c.set('jwt', jwt)
  await next()
})

// Public route
app.get('/health', c => c.json({ ok: true }))

// Protected route with policy
app.get('/secure', async c => {
  const jwt = c.get('jwt')
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  const auth = await jwt.checkAuth(
    token,
    jwt.policy().rolesAny('admin', 'editor').needAll('read:data').build()
  )

  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    message: 'Authorized',
    user: auth.sub,
    permissions: auth.permissions,
  })
})

export default app
```

### Pattern: Cloudflare Worker (Python)

```python
from flarelette_jwt.adapters import apply_env_bindings
from flarelette_jwt import check_auth, policy
from js import Response

async def on_fetch(request, env, ctx):
    # Inject environment
    apply_env_bindings(env)

    # Parse authorization header
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.removeprefix('Bearer ')

    # Public endpoint
    if request.url.endswith('/health'):
        return Response.new('{"ok": true}', status=200)

    # Protected endpoint
    auth = await check_auth(
        token,
        **policy()
            .roles_any('admin', 'editor')
            .need_all('read:data')
            .build()
    )

    if not auth:
        return Response.new('{"error": "Unauthorized"}', status=401)

    return Response.new(
        f'{{"message": "Authorized", "user": "{auth["sub"]}"}}',
        status=200
    )
```

### Pattern: Service Delegation (Gateway)

```typescript
import { Hono } from 'hono'
import { makeKit, createDelegatedToken } from '@chrislyons-dev/flarelette-jwt'

const app = new Hono()

app.use('*', async (c, next) => {
  c.set('jwt', makeKit(c.env))
  await next()
})

app.post('/internal-auth', async c => {
  const jwt = c.get('jwt')

  // Get external token from request
  const externalToken = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!externalToken) {
    return c.json({ error: 'No token provided' }, 401)
  }

  // Verify external token (Auth0, Okta, etc.)
  const externalPayload = await verifyExternalToken(externalToken)
  if (!externalPayload) {
    return c.json({ error: 'Invalid external token' }, 401)
  }

  // Create delegated token for internal use
  const internalToken = await createDelegatedToken(externalPayload, 'gateway-service', {
    aud: 'internal-api',
    ttlSeconds: 300, // 5 minutes
  })

  return c.json({ token: internalToken })
})

export default app
```

### Pattern: Service Consumer

```typescript
import { Hono } from 'hono'
import { makeKit } from '@chrislyons-dev/flarelette-jwt'

const app = new Hono()

app.use('*', async (c, next) => {
  c.set('jwt', makeKit(c.env))
  await next()
})

app.get('/data', async c => {
  const jwt = c.get('jwt')
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  // Verify delegated token
  const auth = await jwt.checkAuth(token, jwt.policy().needAll('read:data').build())

  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Log actor for audit
  console.log({
    user: auth.sub,
    actor: auth.payload.act?.sub,
    action: 'read:data',
    timestamp: new Date().toISOString(),
  })

  return c.json({ data: 'sensitive information', user: auth.sub })
})

export default app
```

## Next Topics

- **[Getting Started](./getting-started.md)** — Installation and first token
- **[Core Concepts](./core-concepts.md)** — Algorithms, modes, and architecture
- **[Service Delegation](./service-delegation.md)** — RFC 8693 actor claims for zero-trust
- **[Security Guide](./security-guide.md)** — Cryptographic profiles and best practices
- **[Cloudflare Workers](./cloudflare-workers.md)** — Workers deployment and configuration
