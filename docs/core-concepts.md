# Core Concepts

Understanding how Flarelette JWT Kit makes cryptographic and architectural decisions.

## Algorithm Selection

The kit supports exactly two JWT algorithms by design. No configuration required — the mode is detected automatically from your environment.

### HS512 (Symmetric)

**HMAC-SHA-512** with 64-byte shared secrets.

**Use when:**

- Producer and consumer both trust each other
- Both services can securely share a secret
- Simplest deployment with no key distribution needed

**Security properties:**

- ~256-bit security with 64-byte keys
- Symmetric: same secret signs and verifies
- Fast signing and verification
- No key rotation complexity

**Environment detection:**

```bash
JWT_SECRET_NAME=MY_SECRET    # Points to secret binding
# OR
JWT_SECRET=<base64url-secret>  # Direct secret (not recommended for production)
```

### EdDSA (Asymmetric)

**Ed25519** digital signatures with JSON Web Keys.

**Use when:**

- Public verification required (consumers don't need signing capability)
- Key rotation needed (multiple active keys via JWKS)
- One-way trust: gateway signs, services verify
- Zero-trust architecture with distributed services

**Security properties:**

- Strong asymmetric signatures with 32-byte private keys
- Public key can be distributed safely
- Supports key rotation via `kid` header
- Slightly slower than HS512 but still fast

**Environment detection (producer):**

```bash
JWT_PRIVATE_JWK_NAME=GATEWAY_PRIVATE  # Points to private key binding
JWT_KID=ed25519-2025-01               # Key ID for rotation
```

**Environment detection (consumer):**

```bash
# Option 1: Inline public key (single key, no rotation)
JWT_PUBLIC_JWK_NAME=GATEWAY_PUBLIC

# Option 2: Service binding for JWKS (supports rotation)
JWT_JWKS_SERVICE_NAME=GATEWAY_BINDING
```

### Why Only Two Algorithms?

**Reduced attack surface:** Fewer algorithms means less code to audit and fewer potential vulnerabilities.

**Simplified key management:** HS512 for simple deployments, EdDSA for complex ones. No need to choose between RSA key sizes, ECDSA curves, or other variants.

**Clear trade-offs:** Each algorithm has an obvious use case. No analysis paralysis.

## Mode Detection

The kit automatically detects which algorithm to use based on environment variables. No manual configuration needed.

**Detection logic:**

```
Producer (signing):
  If JWT_PRIVATE_JWK* exists → EdDSA mode
  Otherwise → HS512 mode

Consumer (verification):
  If JWT_PUBLIC_JWK* or JWT_JWKS_SERVICE* exists → EdDSA mode
  Otherwise → HS512 mode
```

**Verification in code:**

**TypeScript:**

```typescript
import { envMode } from '@chrislyons-dev/flarelette-jwt'

const mode = envMode('producer') // or 'consumer'
console.log('Detected mode:', mode) // "HS512" or "EdDSA"
```

**Python:**

```python
from flarelette_jwt import mode

detected = mode('producer')  # or 'consumer'
print(f'Detected mode: {detected}')  # "HS512" or "EdDSA"
```

## Secret-Name Indirection

Instead of storing secrets directly in environment variables, reference the binding name. This enables proper secret management in Cloudflare Workers.

### The Pattern

**Without indirection (insecure):**

```bash
# wrangler.toml - DON'T DO THIS
[vars]
JWT_SECRET = "actual-secret-value-exposed"  # ❌ Secret in version control
```

**With indirection (secure):**

```toml
# wrangler.toml - Safe to commit
[vars]
JWT_SECRET_NAME = "MY_JWT_SECRET"  # ✅ References binding, not value
JWT_ISS = "https://gateway.example.com"
```

```bash
# Deploy secret separately
wrangler secret put MY_JWT_SECRET
# Paste secret when prompted
```

### How It Works

**Resolution order:**

1. Check if `JWT_SECRET_NAME` is set (e.g., `"MY_JWT_SECRET"`)
2. If set, look up that environment variable (`env.MY_JWT_SECRET` or `os.environ['MY_JWT_SECRET']`)
3. If not set, fall back to `JWT_SECRET` directly

**Applies to all secrets:**

- `JWT_SECRET_NAME` → `JWT_SECRET`
- `JWT_PRIVATE_JWK_NAME` → `JWT_PRIVATE_JWK`
- `JWT_PUBLIC_JWK_NAME` → `JWT_PUBLIC_JWK`
- `JWT_JWKS_SERVICE_NAME` → `JWT_JWKS_SERVICE`

**Benefits:**

- Secrets never appear in configuration files
- Same code works across environments (dev/stage/prod use different binding names)
- Supports Cloudflare's secret rotation workflows

## Environment Injection

Cloudflare Workers don't expose `process.env` (Node.js) or populate `os.environ` (Python) automatically. The kit provides adapters to inject the Worker environment.

### TypeScript Adapter

```typescript
import { makeKit } from '@chrislyons-dev/flarelette-jwt/adapters/hono'

export default {
  async fetch(req, env) {
    const jwt = makeKit(env) // Injects Worker env globally

    const token = await jwt.sign({ sub: 'user123' })
    const verified = await jwt.verify(token)

    return new Response(JSON.stringify(verified))
  },
}
```

**What it does:**

1. Extracts string variables and Fetcher service bindings from `env`
2. Stores vars in `globalThis.__FLARELETTE_ENV`
3. Stores services in `globalThis.__FLARELETTE_SERVICES`
4. All kit functions read from these globals

### Python Adapter

```python
from flarelette_jwt.adapters import apply_env_bindings
from flarelette_jwt import sign, verify

async def on_fetch(request, env, ctx):
    apply_env_bindings(env)  # Copy Worker env to os.environ

    token = await sign({"sub": "user123"})
    verified = await verify(token)

    return Response.new(str(verified))
```

**What it does:**

1. Iterates over Worker `env` mapping
2. Copies string values to `os.environ`
3. All kit functions read from `os.environ`

**Note:** Python Workers don't support Fetcher service bindings for JWKS. Use inline `JWT_PUBLIC_JWK` instead.

## Token Structure

### Header

```json
{
  "alg": "EdDSA", // or "HS512"
  "typ": "JWT",
  "kid": "ed25519-2025-01" // Key ID (EdDSA only, for rotation)
}
```

### Payload (Standard Claims)

```json
{
  "iss": "https://gateway.example.com", // Issuer
  "aud": "api.example.com", // Audience
  "sub": "user123", // Subject (user ID)
  "iat": 1704067200, // Issued at (Unix timestamp)
  "exp": 1704068100, // Expiration (Unix timestamp)
  "jti": "a1b2c3d4" // JWT ID (optional, for replay prevention)
}
```

### Payload (Custom Claims)

```json
{
  // Standard claims above, plus:
  "permissions": ["read:data", "write:data"],
  "roles": ["user", "editor"],
  "email": "user@example.com",
  "tid": "tenant-123", // Tenant ID (multi-tenant apps)
  "act": {
    // Actor claim (service delegation, RFC 8693)
    "sub": "gateway-service"
  }
}
```

## Verification Process

When you call `verify()` or `checkAuth()`, the kit performs these checks in order:

1. **Signature verification** — Validates cryptographic signature using detected algorithm
2. **Issuer check** — `iss` claim must match `JWT_ISS`
3. **Audience check** — `aud` claim must match `JWT_AUD` (or be in list if multiple)
4. **Expiration check** — Token must not be expired (`exp` > current time - leeway)
5. **Not before check** — If `nbf` claim present, token must be valid (`nbf` < current time + leeway)
6. **Authorization checks** — If using `checkAuth()`, validates permissions and roles

**Fail-silent behavior:**

- Returns `null` (TypeScript) or `None` (Python) on any verification failure
- Never throws exceptions
- Simplifies error handling in request handlers

**Clock skew tolerance:**

- Default 90 seconds leeway via `JWT_LEEWAY`
- Applied to `exp`, `nbf`, and `iat` checks
- Accounts for time sync differences between services

## Cross-Language Parity

TypeScript and Python implementations are kept in sync:

| Feature                 | TypeScript | Python                |
| ----------------------- | ---------- | --------------------- |
| HS512 signing           | ✅         | ✅                    |
| HS512 verification      | ✅         | ✅                    |
| EdDSA signing           | ✅         | ❌ (use Node gateway) |
| EdDSA verification      | ✅         | ✅ (inline JWK only)  |
| JWKS fetch              | ✅         | ❌ (inline JWK only)  |
| Service bindings        | ✅         | ❌                    |
| Secret-name indirection | ✅         | ✅                    |
| Policy builder          | ✅         | ✅                    |
| CLI tools               | ✅         | ✅                    |

**Why Python limitations?**

- **EdDSA signing:** WebCrypto API in Pyodide doesn't support Ed25519 private key operations
- **JWKS fetch:** No Fetcher service binding support in Workers Python runtime
- **Recommended pattern:** Use Node.js gateway for EdDSA signing, Python workers for verification

## Architecture Patterns

### Pattern 1: HS512 Internal Services

```
┌─────────────┐  HS512    ┌─────────────┐
│  Service A  │ ←────────→│  Service B  │
│  (signs)    │  shared   │  (verifies) │
└─────────────┘  secret   └─────────────┘
```

**Use when:** All services trust each other and can share a secret.

### Pattern 2: EdDSA Gateway + Services

```
┌─────────────┐  EdDSA    ┌─────────────┐
│  Gateway    │  signed   │  Service 1  │
│  (Node.js)  │  tokens   │  (TS/Py)    │
│             │ ─────────→│             │
│  Signs with │           │  Verifies   │
│  private    │           │  with       │
│  key        │           │  public key │
└─────────────┘           └─────────────┘
       │                         │
       └────────────┬────────────┘
                    ↓
              ┌─────────────┐
              │  Service 2  │
              │  (TS/Py)    │
              │             │
              │  Verifies   │
              │  with       │
              │  public key │
              └─────────────┘
```

**Use when:** Gateway handles external auth, internal services only verify.

### Pattern 3: Service Binding JWKS

```
┌──────────────────────────────┐
│   JWT Gateway (Producer)     │
│                              │
│   - Signs tokens             │
│   - Exposes JWKS endpoint    │
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
│  (Worker)        │      │  (Worker)        │
│                  │      │                  │
│  - Receives JWT  │      │  - Receives JWT  │
│  - Fetches JWKS  │      │  - Fetches JWKS  │
│  - Verifies      │      │  - Verifies      │
└──────────────────┘      └──────────────────┘
```

**Use when:** Key rotation needed, multiple active keys, or zero-trust architecture.

## Next Topics

- **[Usage Guide](./usage-guide.md)** — Complete API reference
- **[Service Delegation](./service-delegation.md)** — RFC 8693 actor claims
- **[Cloudflare Workers](./cloudflare-workers.md)** — Workers deployment guide
- **[Security Guide](./security-guide.md)** — Cryptographic profiles and best practices
