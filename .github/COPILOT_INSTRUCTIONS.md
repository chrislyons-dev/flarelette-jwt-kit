# GitHub Copilot Instructions

## Project Overview

**Flarelette JWT** is a polyglot JWT authentication toolkit with identical APIs for TypeScript and Python. Environment-driven JWT authentication for Cloudflare Workers. Like Starlette, but for the edge.

**Key Principles:**

- Environment-driven configuration (no config files)
- Cross-language API parity (TypeScript ↔ Python)
- Secret-name indirection for Cloudflare Workers bindings
- Security-first design with explicit trade-offs

## Architecture

### Mode Detection (Automatic)

- **HS512 (default):** Used when `JWT_SECRET` or `JWT_SECRET_NAME` is set
- **EdDSA:** Used when `JWT_PRIVATE_JWK*` or `JWT_PUBLIC_JWK*` or `JWT_JWKS_URL*` is set
- **Do not add `JWT_ALG` configuration** — mode is auto-detected from environment

### Secret-Name Indirection Pattern

```typescript
// Instead of: JWT_SECRET=<actual-secret>
// Use: JWT_SECRET_NAME=FLARELETTE_JWT_SECRET
// Then: wrangler secret put FLARELETTE_JWT_SECRET
```

Applies to: `JWT_SECRET_NAME`, `JWT_PRIVATE_JWK_NAME`, `JWT_PUBLIC_JWK_NAME`, `JWT_JWKS_URL_NAME`

### Platform Compatibility

| Feature           | Node.js | CF Workers (TS) | CF Workers (Python)   |
| ----------------- | ------- | --------------- | --------------------- |
| HS512 sign/verify | ✅      | ✅              | ✅                    |
| EdDSA sign        | ✅      | ✅              | ❌ (use Node gateway) |
| EdDSA verify      | ✅      | ✅              | ✅ (inline JWK only)  |
| JWKS fetch        | ✅      | ✅              | ❌ (inline JWK only)  |

**Critical:** Python cannot sign EdDSA tokens due to WebCrypto API limitations in Pyodide.

## Code Guidelines

### When Adding Features

1. **Maintain cross-language parity:** Implement in both TypeScript and Python with identical APIs
2. **Respect platform limitations:** Python cannot sign EdDSA or fetch remote JWKS
3. **Use environment-driven config:** No configuration files or hardcoded defaults
4. **Preserve secret-name indirection:** New secrets must support `*_NAME` pattern
5. **Keep fail-silent verification:** Return `null`/`None` on errors, don't throw exceptions

### TypeScript Style

- Enable `strict` mode
- Use explicit types for public APIs
- Prefer type narrowing over type assertions
- Dependencies: Only `jose` library for cryptography

### Python Style

- Use type hints for all public functions
- Follow PEP 8
- **Zero external dependencies** (use WebCrypto via `js` module only)
- All JWT operations are `async` in Python

### Error Handling

- **Fail-silent pattern:** Verification functions return `null`/`None` on failure
- Never swallow exceptions in signing operations
- Validate inputs explicitly with runtime checks

## Security Model

### Algorithms

- **HS512:** HMAC-SHA-512 with 64-byte (512-bit) secrets — for trusted producer-consumer pairs
- **EdDSA:** Ed25519 — for public verification scenarios (asymmetric trust)

### Claims Validation

Both implementations validate:

- `iss` (issuer) — must match `JWT_ISS`
- `aud` (audience) — must match `JWT_AUD`
- `exp` (expiration) — with configurable leeway (default 90s)
- `nbf` (not before) — if present
- `iat` (issued at) — automatically set on signing

## Common Patterns

### Cloudflare Worker (TypeScript + Hono)

```typescript
import { makeKit } from '@flarelette/jwt-ts/adapters/hono'

app.use('*', async (c, next) => {
  const jwt = makeKit(c.env) // Must inject Worker env
  c.set('jwt', jwt)
  await next()
})

app.get('/secure', async c => {
  const jwt = c.get('jwt')
  const auth = await jwt.checkAuth(token, jwt.policy().rolesAny('admin').build())
  if (!auth) return c.json({ error: 'Unauthorized' }, 401)
  return c.json({ data: 'secure' })
})
```

### Cloudflare Worker (Python)

```python
from flarelette_jwt import sign, verify, check_auth, policy
from flarelette_jwt.adapters import apply_env_bindings

async def on_fetch(request, env, ctx):
    apply_env_bindings(env)  # Must be first — injects env into os.environ

    # All operations are async
    token = await sign({"sub": "user123", "permissions": ["read:data"]})
    auth = await check_auth(token, **policy().roles_any('admin').build())

    if not auth:
        return Response.new('Unauthorized', status=401)
    return Response.new(f'Hello {auth["sub"]}')
```

## Documentation Standards

**Target audience:** Software architects and engineers (assume technical fluency)

**Tone:** Security-conscious, clear, and trustworthy — like a security engineer explaining best practices to a colleague

**Style:**

- Concise sections: 3–7 bullets or ≤120 words
- **Exception:** Security features may expand as needed (authentication, cryptography, key management)
- Explain "why" behind patterns, not just "how"
- Use tables and code examples for clarity
- Keep examples executable and realistic

**What to avoid:**

- Marketing speak ("Revolutionary!" "Easiest ever!")
- Vague promises without specifics
- Academic abstractions that obscure practical meaning
- Downplaying security complexity
- Apologetic or overly casual tone

## File Structure

```
flarelette-jwt-kit/
├── packages/
│   ├── flarelette-jwt-ts/src/     # TypeScript implementation
│   │   ├── index.ts               # Public API
│   │   ├── config.ts              # Mode detection, env reading
│   │   ├── sign.ts                # HS512 + EdDSA signing
│   │   ├── verify.ts              # HS512 + EdDSA verification
│   │   ├── jwks.ts                # Remote JWKS (5-min cooldown)
│   │   ├── high.ts                # createToken, checkAuth, policy
│   │   └── adapters/hono.ts       # Worker env injection
│   └── flarelette-jwt-py/         # Python implementation (zero deps)
├── examples/                       # Usage examples for both languages
├── notes/
│   ├── coding.md                  # Code quality standards
│   └── tone-of-voice.md           # Documentation voice guidelines
└── docs/
    ├── security.md                # Security baseline and threat model
    └── usage.md                   # User-facing usage guide
```

## Environment Variables Reference

**Common:**

- `JWT_ISS` — Token issuer (required)
- `JWT_AUD` — Token audience (required)
- `JWT_TTL_SECONDS` — Token lifetime (default: 900)
- `JWT_LEEWAY` — Clock skew tolerance in seconds (default: 90)

**HS512:**

- `JWT_SECRET` or `JWT_SECRET_NAME` — Symmetric secret (64+ bytes, base64url)

**EdDSA Producer:**

- `JWT_PRIVATE_JWK` or `JWT_PRIVATE_JWK_NAME` — Ed25519 private key (JSON)
- `JWT_KID` — Key ID for rotation (required)

**EdDSA Consumer:**

- `JWT_PUBLIC_JWK` or `JWT_PUBLIC_JWK_NAME` — Ed25519 public key (JSON, inline)
- `JWT_JWKS_SERVICE` or `JWT_JWKS_SERVICE_NAME` — Service binding for JWKS (TypeScript only)
- `JWT_ALLOWED_THUMBPRINTS` — Comma-separated thumbprint whitelist (optional)

## Testing

**Current state:** No test suite exists yet.

**When implementing:**

- Test both HS512 and EdDSA modes via environment injection
- Verify cross-language parity (same inputs → same outputs)
- Cover authorization policy evaluation (roles, permissions, predicates)
- Test secret-name indirection resolution
- Test JWKS caching (TypeScript only)
- Validate claim enforcement
- Test signature verification (positive and negative cases)

## Additional Resources

- **notes/coding.md** — Code quality and style standards
- **notes/tone-of-voice.md** — Documentation voice and anti-patterns
- **docs/security.md** — Security baseline and threat model
- **docs/usage.md** — User-facing usage documentation
