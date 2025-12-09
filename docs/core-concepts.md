# Core Concepts

Understanding how Flarelette JWT Kit makes cryptographic and architectural decisions.

## Algorithm Selection

The kit supports **two signing algorithms** (HS512, EdDSA) and **three verification profiles** (HS512, EdDSA, RSA). No configuration required — the mode is detected automatically from your environment.

**Signing:** HS512 for symmetric trust, EdDSA for asymmetric trust.

**Verification:** HS512 and EdDSA for internal tokens, RSA for external OIDC providers.

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

# Option 3: HTTP JWKS URL for external OIDC providers (TypeScript only)
JWT_JWKS_URL=https://tenant.auth0.com/.well-known/jwks.json
```

### RSA (External OIDC Verification)

**RS256, RS384, RS512** verification for external OIDC providers.

**Use when:**

- Verifying tokens from Auth0, Okta, Google, Azure AD, or Cloudflare Access
- Gateway integrates with external identity providers
- Tokens are signed externally, only verification is needed

**Security properties:**

- Verification-only (no signing capability)
- Supports key rotation via JWKS
- HTTPS-only URL fetching with caching
- TypeScript only (Python pending Cloudflare runtime improvements)

**Environment detection (consumer):**

```bash
JWT_JWKS_URL=https://tenant.auth0.com/.well-known/jwks.json
JWT_JWKS_CACHE_TTL_SECONDS=300  # Optional: default 5 minutes
```

**Supported OIDC providers:**

- **Auth0**: `https://tenant.auth0.com/.well-known/jwks.json`
- **Okta**: `https://domain.okta.com/oauth2/default/v1/keys`
- **Google**: `https://www.googleapis.com/oauth2/v3/certs`
- **Azure AD**: `https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys`
- **Cloudflare Access**: `https://team.cloudflareaccess.com/cdn-cgi/access/certs`

### Algorithm Design Philosophy

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
  If JWT_PUBLIC_JWK* or JWT_JWKS_SERVICE* or JWT_JWKS_URL exists → EdDSA/RSA mode
  Otherwise → HS512 mode
```

**Note:** EdDSA/RSA mode supports both EdDSA (Ed25519) and RSA (RS256/384/512) verification. The actual algorithm is auto-detected from the JWK structure or token header.

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

## JWKS Resolution Strategies

When verifying EdDSA or RSA tokens, the kit supports four strategies for obtaining the verification key. Each strategy has different trade-offs for security, performance, and operational complexity.

### Strategy 1: HS512 Shared Secret

**Use case:** Simplest configuration for trusted producer-consumer pairs.

**Configuration:**

```bash
JWT_SECRET_NAME=MY_JWT_SECRET
```

**Characteristics:**

- Single secret shared between producer and consumer
- No key distribution complexity
- Fastest verification (symmetric)
- Requires mutual trust between services

**When to use:** Internal services where both producer and consumer are under your control.

### Strategy 2: Inline Public JWK

**Use case:** Single EdDSA verification key, no rotation needed.

**Configuration:**

```bash
JWT_PUBLIC_JWK_NAME=GATEWAY_PUBLIC
```

**Characteristics:**

- Public key embedded in environment
- No network calls during verification
- No key rotation support (requires redeployment to update key)
- Works in both TypeScript and Python

**When to use:** Internal services with infrequent key rotation, or Python Workers verifying EdDSA tokens.

### Strategy 3: Service Binding JWKS

**Use case:** Internal key rotation with Worker-to-Worker RPC.

**Configuration:**

```toml
# Consumer wrangler.toml
[[services]]
binding = "GATEWAY_BINDING"
service = "jwt-gateway"

[vars]
JWT_JWKS_SERVICE_NAME = "GATEWAY_BINDING"
```

**Characteristics:**

- Keys fetched from internal JWKS endpoint via Worker-to-Worker RPC
- Supports multiple active keys (key rotation)
- No public HTTP endpoint required
- Cached for 5 minutes
- TypeScript only

**When to use:** Internal service mesh with key rotation requirements and no external OIDC provider.

### Strategy 4: HTTP JWKS URL

**Use case:** External OIDC provider verification (Auth0, Okta, Google, Azure AD).

**Configuration:**

```bash
JWT_JWKS_URL=https://tenant.auth0.com/.well-known/jwks.json
JWT_JWKS_CACHE_TTL_SECONDS=300  # Optional: default 5 minutes
```

**Characteristics:**

- Keys fetched from public HTTPS endpoint
- Supports multiple active keys (key rotation)
- HTTPS-only (except localhost for testing)
- Cached with configurable TTL
- TypeScript only
- 5-second timeout, 100KB size limit

**When to use:** Verifying tokens from external OIDC providers like Auth0, Okta, Google Workspace, Azure AD, or Cloudflare Access.

### Comparison Table

| Strategy          | Key Rotation | Network Calls | Python Support | Use Case                    |
| ----------------- | ------------ | ------------- | -------------- | --------------------------- |
| HS512 Shared      | ❌           | ❌            | ✅             | Trusted internal services   |
| Inline Public JWK | ❌           | ❌            | ✅             | Single key, no rotation     |
| Service Binding   | ✅           | ✅ (internal) | ❌             | Internal mesh with rotation |
| HTTP JWKS URL     | ✅           | ✅ (external) | ❌             | External OIDC providers     |

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
| RSA verification        | ✅         | ❌                    |
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
