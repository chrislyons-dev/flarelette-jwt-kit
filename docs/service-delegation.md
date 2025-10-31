# Service Delegation

Zero-trust service-to-service authentication using RFC 8693 actor claims.

## The Problem

In a zero-trust microservices architecture, external tokens (like Auth0 JWTs) should not propagate beyond the edge. Instead, the gateway mints short-lived internal tokens for service-to-service communication.

**Challenge:** How do internal services know which service is acting on behalf of the original user?

**Solution:** RFC 8693 actor claims — tokens declare "I'm `<service>` acting on behalf of `<user>`".

## Actor Claims (RFC 8693)

The `act` (actor) claim identifies a service acting on behalf of another principal.

**Structure:**

```json
{
  "sub": "user@example.com", // Original end user
  "permissions": ["read:data"], // Original permissions (no escalation)
  "act": {
    "sub": "gateway-service" // Service acting on behalf of user
  }
}
```

**For delegation chains** (service calling another service):

```json
{
  "sub": "user@example.com",
  "permissions": ["read:data"],
  "act": {
    "sub": "api-service", // Current actor
    "act": {
      "sub": "gateway-service" // Previous actor (nested)
    }
  }
}
```

## Creating Delegated Tokens

Use `createDelegatedToken()` to mint tokens for internal service communication.

### TypeScript

```typescript
import { createDelegatedToken } from '@chrislyons-dev/flarelette-jwt'

// Gateway receives external token (e.g., from Auth0)
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

// Pass internal token to downstream service
const response = await fetch('https://api.internal', {
  headers: { Authorization: `Bearer ${internalToken}` },
})
```

### Python

```python
from flarelette_jwt import create_delegated_token

# Gateway receives external token
external_payload = await verify_auth0_token(external_token)

# Create internal token for API service
internal_token = await create_delegated_token(
    external_payload,         # Original verified payload
    "gateway-service",        # Actor service identifier
    aud="internal-api",       # Internal audience
    ttl_seconds=300           # Short-lived (5 min)
)

# Pass internal token to downstream service
response = await fetch("https://api.internal", {
    "headers": {"Authorization": f"Bearer {internal_token}"}
})
```

## What Gets Preserved

`createDelegatedToken()` automatically preserves identity and authorization context:

**Always copied:**

- `sub` — Original user identifier
- `permissions` — Original permission list (no escalation)
- `roles` — Original role list

**Conditionally copied** (if present):

- `email` — User email address
- `name` — User display name
- `groups` — Group memberships
- `tid` — Tenant ID (multi-tenant apps)
- `org_id` — Organization ID
- `department` — Department/division

**Never copied:**

- External token fields (`exp`, `iat`, `nbf`, `jti`) — New values generated
- Provider-specific fields — Not relevant for internal tokens

## Permission Preservation

Critical security property: **no permission escalation**.

```typescript
// External Auth0 token
{
  "sub": "user@example.com",
  "permissions": ["read:data"]  // Limited scope
}

// Internal delegated token
{
  "sub": "user@example.com",
  "permissions": ["read:data"],  // ✅ Same permissions, no escalation
  "act": { "sub": "gateway-service" }
}

// ❌ WRONG — Never do this
const badToken = await sign({
  "sub": "user@example.com",
  "permissions": ["read:data", "admin:all"],  // ❌ Escalation!
  "act": { "sub": "gateway-service" }
})
```

**Why it matters:**

- External auth providers control original permissions
- Internal services cannot grant additional permissions
- Prevents compromised services from escalating privileges

## Delegation Chains

When services call other services, the `act` claim nests.

### Example: Three-Service Chain

1. **Gateway** receives Auth0 token for `user@example.com`
2. **Gateway** → **API Service** with delegated token
3. **API Service** → **Data Service** with further delegated token

**Token at step 2** (Gateway → API):

```json
{
  "sub": "user@example.com",
  "permissions": ["read:data"],
  "act": {
    "sub": "gateway-service"
  }
}
```

**Token at step 3** (API → Data):

```typescript
import { createDelegatedToken } from '@chrislyons-dev/flarelette-jwt'

// API service receives token from gateway
const gatewayPayload = await verify(gatewayToken)

// API creates new token for data service
const dataToken = await createDelegatedToken(
  gatewayPayload,
  'api-service', // Current actor
  { aud: 'data-service' }
)
```

**Resulting token:**

```json
{
  "sub": "user@example.com",
  "permissions": ["read:data"],
  "act": {
    "sub": "api-service", // Current actor
    "act": {
      "sub": "gateway-service" // Previous actor (nested)
    }
  }
}
```

**Audit trail:**

- Original user: `user@example.com`
- Request path: Gateway → API → Data
- Each service identified in nested `act` claims

## Verification and Authorization

Services receiving delegated tokens verify them normally.

```typescript
import { checkAuth, policy } from '@chrislyons-dev/flarelette-jwt'

// Verify token and check permissions
const auth = await checkAuth(token, policy().needAll('read:data').build())

if (!auth) {
  return new Response('Unauthorized', { status: 401 })
}

// Access original user and actor
console.log('User:', auth.sub) // user@example.com
console.log('Actor:', auth.payload.act?.sub) // gateway-service
console.log('Permissions:', auth.permissions) // ["read:data"]
```

**Authorization still checks original permissions**, not the actor service. The actor claim provides audit context, not additional authority.

## Architecture Pattern

### Recommended: EdDSA Gateway + Service Bindings

```
┌──────────────────────────────────┐
│   External Auth Provider         │
│   (Auth0, Okta, etc.)            │
└───────────────┬──────────────────┘
                │ External token
                ↓
┌──────────────────────────────────┐
│   Gateway (Node.js + EdDSA)      │
│                                  │
│   1. Verify external token       │
│   2. Create delegated token      │
│   3. Pass to internal services   │
└───────────────┬──────────────────┘
                │ Internal token (short TTL)
                │
        ┌───────┴────────┐
        ↓                ↓
┌──────────────┐   ┌──────────────┐
│ API Service  │   │ Data Service │
│ (TS/Python)  │   │ (TS/Python)  │
│              │   │              │
│ Verify token │   │ Verify token │
│ Check perms  │   │ Check perms  │
└──────────────┘   └──────────────┘
```

**Benefits:**

- External tokens never enter internal network
- Short-lived internal tokens (5-15 min)
- Full audit trail via nested `act` claims
- No permission escalation possible

### Configuration

**Gateway (Producer):**

```toml
# wrangler.toml
[vars]
JWT_PRIVATE_JWK_NAME = "GATEWAY_PRIVATE"
JWT_KID = "ed25519-2025-01"
JWT_ISS = "https://gateway.internal"
JWT_AUD = "internal-services"
JWT_TTL_SECONDS = "300"  # 5 minutes
```

**Internal Services (Consumers):**

```toml
# wrangler.toml
[vars]
JWT_JWKS_SERVICE_NAME = "GATEWAY_BINDING"
JWT_ISS = "https://gateway.internal"
JWT_AUD = "internal-services"

# Service binding to gateway
[[services]]
binding = "GATEWAY_BINDING"
service = "gateway"
environment = "production"
```

## Security Considerations

### Token Lifetime

**External tokens:** Long-lived (hours), managed by external provider

**Delegated tokens:** Short-lived (5-15 minutes)

- Reduces blast radius if token leaked
- Forces services to re-verify frequently
- Limits time window for replay attacks

```typescript
// Short TTL for internal tokens
const token = await createDelegatedToken(
  externalPayload,
  'gateway-service',
  { ttlSeconds: 300 } // ✅ 5 minutes
)
```

### Audience Scoping

Use specific audiences for each internal service.

```typescript
// ✅ GOOD — Specific audience per service
await createDelegatedToken(payload, 'gateway', { aud: 'data-api' })
await createDelegatedToken(payload, 'gateway', { aud: 'billing-api' })

// ❌ BAD — Generic audience
await createDelegatedToken(payload, 'gateway', { aud: 'all-services' })
```

**Why:** Prevents token meant for one service from being used by another.

### Actor Verification

Downstream services can verify which service created the token.

```typescript
const auth = await checkAuth(token, policy().build())

if (auth?.payload.act?.sub !== 'gateway-service') {
  return new Response('Invalid actor', { status: 403 })
}
```

**Use when:** Only specific services should be able to call your API.

### Permission Auditing

Log actor claims for audit trails.

```typescript
const auth = await checkAuth(token, policy().build())

console.log({
  user: auth.sub,
  actor: auth.payload.act?.sub,
  permissions: auth.permissions,
  timestamp: new Date().toISOString(),
})
```

## Complete Example

### Gateway Service

```typescript
import { Hono } from 'hono'
import { createDelegatedToken } from '@chrislyons-dev/flarelette-jwt'
import { makeKit } from '@chrislyons-dev/flarelette-jwt/adapters/hono'

const app = new Hono<{ Bindings: WorkerEnv }>()

app.use('*', async (c, next) => {
  const jwt = makeKit(c.env)
  c.set('jwt', jwt)
  await next()
})

app.post('/internal-auth', async c => {
  // Get external token from request
  const externalToken = c.req.header('Authorization')?.replace('Bearer ', '')

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

### Internal API Service

```typescript
import { Hono } from 'hono'
import { checkAuth, policy } from '@chrislyons-dev/flarelette-jwt'
import { makeKit } from '@chrislyons-dev/flarelette-jwt/adapters/hono'

const app = new Hono<{ Bindings: WorkerEnv }>()

app.use('*', async (c, next) => {
  const jwt = makeKit(c.env)
  c.set('jwt', jwt)
  await next()
})

app.get('/data', async c => {
  const jwt = c.get('jwt')
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  // Verify and authorize
  const auth = await jwt.checkAuth(token, policy().needAll('read:data').build())

  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Log for audit
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

## References

- **[RFC 8693: OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693.html)** — Actor claim specification
- **[Core Concepts](./core-concepts.md)** — Algorithm selection and architecture
- **[Security Guide](./security-guide.md)** — Cryptographic profiles and best practices
- **[Cloudflare Workers](./cloudflare-workers.md)** — Deployment and configuration
