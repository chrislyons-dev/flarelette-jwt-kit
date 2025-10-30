# Cloudflare Workers

Deploy Flarelette JWT Kit to Cloudflare Workers with proper secret management and service bindings.

## Why Cloudflare Workers?

- **Edge computing** — Run authentication logic close to users worldwide
- **Zero cold starts** — Instant response times
- **Integrated secrets** — Built-in secret management with bindings
- **Service bindings** — Direct Worker-to-Worker RPC for JWKS
- **Cost-effective** — Free tier covers most small-to-medium deployments

## Environment Differences

Workers don't provide standard environment access:

- ❌ No `process.env` (Node.js)
- ❌ `os.environ` not auto-populated (Python)
- ✅ Environment passed as `env` object to fetch handler

The kit provides adapters to inject Worker environments.

## Quick Start

### TypeScript Worker

**Install:**

```bash
npm install @chrislyons-dev/flarelette-jwt hono
```

**`src/index.ts`:**

```typescript
import { Hono } from 'hono'
import { makeKit } from '@chrislyons-dev/flarelette-jwt/adapters/hono'
import type { WorkerEnv } from '@chrislyons-dev/flarelette-jwt'

const app = new Hono<{ Bindings: WorkerEnv }>()

// Inject environment
app.use('*', async (c, next) => {
  const jwt = makeKit(c.env)
  c.set('jwt', jwt)
  await next()
})

// Protected route
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

**`wrangler.toml`:**

```toml
name = "my-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
JWT_SECRET_NAME = "API_JWT_SECRET"
JWT_ISS = "https://api.example.com"
JWT_AUD = "api.example.com"
JWT_TTL_SECONDS = "900"
```

**Deploy:**

```bash
# Store secret
wrangler secret put API_JWT_SECRET

# Deploy
wrangler deploy
```

### Python Worker

**Install:**

```bash
pip install flarelette-jwt
```

**`src/index.py`:**

```python
from flarelette_jwt.adapters import apply_env_bindings
from flarelette_jwt import check_auth, policy
from js import Response

async def on_fetch(request, env, ctx):
    # Inject environment
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

**`wrangler.toml`:**

```toml
name = "my-python-api"
main = "src/index.py"
compatibility_date = "2024-01-01"

[vars]
JWT_SECRET_NAME = "API_JWT_SECRET"
JWT_ISS = "https://api.example.com"
JWT_AUD = "api.example.com"
```

**Deploy:**

```bash
wrangler secret put API_JWT_SECRET
wrangler deploy
```

## Secret Management

### Secret Bindings

**Never commit secrets to wrangler.toml.** Use the secret-name indirection pattern:

```toml
[vars]
JWT_SECRET_NAME = "MY_SECRET"  # ✅ Reference name, not value
```

```bash
wrangler secret put MY_SECRET  # ✅ Store actual secret
```

### Multiple Environments

Configure different secrets per environment:

**`wrangler.toml` (base):**

```toml
name = "my-api"
main = "src/index.ts"

[env.dev]
vars = { JWT_SECRET_NAME = "JWT_SECRET_DEV" }

[env.staging]
vars = { JWT_SECRET_NAME = "JWT_SECRET_STAGING" }

[env.production]
vars = { JWT_SECRET_NAME = "JWT_SECRET_PROD" }
```

**Deploy secrets:**

```bash
wrangler secret put JWT_SECRET_DEV --env dev
wrangler secret put JWT_SECRET_STAGING --env staging
wrangler secret put JWT_SECRET_PROD --env production
```

### Generating Secrets

**For HS512:**

```bash
npx flarelette-jwt-secret --len=64 --dotenv
```

Copy the output and paste when running `wrangler secret put`.

**For EdDSA:**

```bash
npx flarelette-jwt-keygen --kid=ed25519-2025-01 > keys.json

# Store private key
wrangler secret put GATEWAY_PRIVATE < keys.json

# Store public key (or use service binding)
wrangler secret put GATEWAY_PUBLIC < keys.json
```

## Service Bindings for JWKS

Service bindings enable direct Worker-to-Worker RPC for key distribution. Recommended for EdDSA deployments.

### Benefits

- **No public endpoint** — JWKS served privately between Workers
- **Lower latency** — Direct RPC, no DNS/TLS overhead
- **Better security** — No internet-facing JWKS endpoint
- **Integrated routing** — Cloudflare handles service discovery

### Architecture

```
┌──────────────────────────────┐
│   JWT Gateway (Producer)     │
│                              │
│   Roles:                     │
│   1. Signs JWT tokens        │
│   2. Exposes JWKS endpoint   │
│      (/.well-known/jwks.json)│
└──────┬────────────────┬──────┘
       │                │
       │ JWT token      │ Service Binding
       │ (HTTP/auth)    │ (JWKS fetch)
       │                │
   ┌───┴────────────────┴───┐
   │                        │
   ▼                        ▼
┌──────────────────┐      ┌──────────────────┐
│  Consumer #1     │      │  Consumer #2     │
└──────────────────┘      └──────────────────┘
```

### Gateway Setup

**`wrangler.toml` (gateway):**

```toml
name = "jwt-gateway"
main = "src/gateway.ts"

[vars]
JWT_PRIVATE_JWK_NAME = "GATEWAY_PRIVATE"
JWT_PUBLIC_JWK_NAME = "GATEWAY_PUBLIC"
JWT_KID = "ed25519-2025-01"
JWT_ISS = "https://gateway.internal"
JWT_AUD = "internal-api"
```

**`src/gateway.ts`:**

```typescript
import { Hono } from 'hono'
import { makeKit } from '@chrislyons-dev/flarelette-jwt/adapters/hono'

const app = new Hono()

app.use('*', async (c, next) => {
  c.set('jwt', makeKit(c.env))
  await next()
})

// JWKS endpoint
app.get('/.well-known/jwks.json', async c => {
  const publicJwk = JSON.parse(c.env.GATEWAY_PUBLIC)
  return c.json({ keys: [publicJwk] })
})

// Sign tokens
app.post('/sign', async c => {
  const jwt = c.get('jwt')
  const body = await c.req.json()
  const token = await jwt.sign(body)
  return c.json({ token })
})

export default app
```

**Deploy:**

```bash
# Generate keypair
npx flarelette-jwt-keygen --kid=ed25519-2025-01 > keys.json

# Store private key
wrangler secret put GATEWAY_PRIVATE --config wrangler.gateway.toml
# Paste privateJwk from keys.json

# Store public key
wrangler secret put GATEWAY_PUBLIC --config wrangler.gateway.toml
# Paste publicJwk from keys.json

# Deploy
wrangler deploy --config wrangler.gateway.toml
```

### Consumer Setup

**`wrangler.toml` (consumer):**

```toml
name = "consumer-api"
main = "src/consumer.ts"

[vars]
JWT_JWKS_SERVICE_NAME = "GATEWAY_BINDING"
JWT_ISS = "https://gateway.internal"
JWT_AUD = "internal-api"

# Service binding to gateway
[[services]]
binding = "GATEWAY_BINDING"
service = "jwt-gateway"
environment = "production"
```

**`src/consumer.ts`:**

```typescript
import { Hono } from 'hono'
import { makeKit } from '@chrislyons-dev/flarelette-jwt/adapters/hono'

const app = new Hono()

app.use('*', async (c, next) => {
  c.set('jwt', makeKit(c.env)) // Automatically detects service binding
  await next()
})

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

**Deploy:**

```bash
wrangler deploy --config wrangler.consumer.toml
```

## Testing Locally

**With Wrangler:**

```bash
wrangler dev
```

**Set secrets for local development:**

```bash
# Create .dev.vars file (gitignored)
JWT_SECRET_NAME=MY_SECRET
MY_SECRET=<generated-secret>
JWT_ISS=https://localhost:8787
JWT_AUD=localhost
```

**Test with curl:**

```bash
# Get a token (if you have a /sign endpoint)
TOKEN=$(curl http://localhost:8787/sign -d '{"sub":"test"}' | jq -r .token)

# Use the token
curl -H "Authorization: Bearer $TOKEN" http://localhost:8787/secure
```

## Performance Considerations

### JWKS Caching

The kit caches JWKS responses for 5 minutes by default. This reduces load on the gateway and improves verification performance.

**Cache behavior:**

- First verification: Fetches JWKS from service binding
- Subsequent verifications: Uses cached keys (5 min)
- After 5 min: Refetches JWKS

**No configuration needed** — caching is automatic.

### Token Size

Keep tokens under 8KB for optimal performance:

- Headers limited to 16KB total
- Smaller tokens = faster transmission
- Less parsing overhead

**Monitor token size:**

```typescript
const token = await sign({ sub: 'user123', permissions: [...] })
console.log(`Token size: ${token.length} bytes`)
```

## Monitoring and Debugging

### Wrangler Tail

Stream logs from deployed Workers:

```bash
wrangler tail
```

### Log JWT Verification

**Safe logging pattern:**

```typescript
const auth = await checkAuth(token, policy().build())

console.log({
  timestamp: new Date().toISOString(),
  jti: auth?.payload.jti,
  sub: auth?.sub,
  success: !!auth,
})
```

### Common Issues

**"JWT secret missing":**

- Verify `wrangler secret list` shows your secret
- Check `JWT_SECRET_NAME` matches secret binding name
- Ensure `makeKit(c.env)` or `apply_env_bindings(env)` called

**"EdDSA verification fails":**

- For service bindings: Verify `[[services]]` config correct
- For inline JWK: Check `JWT_PUBLIC_JWK_NAME` resolves
- Verify gateway JWKS endpoint accessible

**Mode detection wrong:**

- Check environment variables with `wrangler tail`
- Verify no conflicting `JWT_*` variables
- Use `envMode('consumer')` to debug detection

## References

- **[Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)**
- **[Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)**
- **[Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)**
- **[Secrets Management](https://developers.cloudflare.com/workers/configuration/secrets/)**
- **[Core Concepts](./core-concepts.md)** — Algorithm selection and architecture
- **[Security Guide](./security-guide.md)** — Best practices and threat model
