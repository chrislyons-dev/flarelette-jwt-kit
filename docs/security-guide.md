# Security Guide

Comprehensive security baseline for Flarelette JWT Kit across HS512 and EdDSA profiles.

## Cryptographic Profiles

The kit supports exactly two JWT algorithms by design. Each has specific security properties and use cases.

### HS512 (Symmetric)

| Property         | Value                                        |
| ---------------- | -------------------------------------------- |
| Algorithm        | HMAC-SHA-512                                 |
| Key material     | 64-byte base64url secret                     |
| Security level   | ~256-bit                                     |
| Key distribution | Shared secret between producer and consumer  |
| Use case         | Internal trusted services with shared secret |

**Security properties:**

- Fast signing and verification
- Simple key management (single shared secret)
- No public key distribution needed
- Requires mutual trust between producer and consumer

**When to use:**

- Both producer and consumer are trusted services
- Services can securely share a secret
- Simplest deployment with no key rotation requirements

### EdDSA (Ed25519)

| Property         | Value                                            |
| ---------------- | ------------------------------------------------ |
| Algorithm        | Ed25519 digital signature                        |
| Key material     | 32-byte private key + public key (JSON Web Keys) |
| Security level   | ~128-bit (quantum-safe path exists)              |
| Key distribution | Public key distributed via JWKS or inline        |
| Use case         | One-way trust, public verification, key rotation |

**Security properties:**

- Asymmetric: private key signs, public key verifies
- Public key can be distributed safely
- Supports key rotation via `kid` header
- Resistant to timing attacks

**When to use:**

- Gateway signs, multiple services verify
- Key rotation required (multiple active keys)
- Zero-trust architecture with distributed services
- Public verification needed (consumers don't need signing capability)

## Key Generation

### HS512 Secrets

**Requirements:**

- Minimum 64 bytes (512 bits)
- Cryptographically random
- Base64url-encoded for safe storage

**Generate with CLI:**

```bash
npx flarelette-jwt-secret --len=64 --dotenv
```

**Output:**

```bash
JWT_SECRET=<64-byte-base64url-string>
```

**Generate programmatically:**

**TypeScript:**

```typescript
import { generateSecret } from '@chrislyons-dev/flarelette-jwt'

const secret = generateSecret(64)
console.log(`JWT_SECRET=${secret}`)
```

**Python:**

```python
from flarelette_jwt import generate_secret

secret = generate_secret(64)
print(f"JWT_SECRET={secret}")
```

### EdDSA Keypairs

**Generate with CLI:**

```bash
npx flarelette-jwt-keygen --kid=ed25519-2025-01
```

**Output:**

```json
{
  "kid": "ed25519-2025-01",
  "publicJwk": {
    "kty": "OKP",
    "crv": "Ed25519",
    "x": "<base64url-public-key>",
    "kid": "ed25519-2025-01"
  },
  "privateJwk": {
    "kty": "OKP",
    "crv": "Ed25519",
    "x": "<base64url-public-key>",
    "d": "<base64url-private-key>",
    "kid": "ed25519-2025-01"
  }
}
```

**Best practice for production:**

- Generate keys during deployment CI (ephemeral keys no human ever sees)
- Store private key in secret binding immediately
- Distribute public key via JWKS or environment binding

## Secret Storage

### Never Commit Secrets

**❌ Never do this:**

```toml
# wrangler.toml - DON'T COMMIT THIS
[vars]
JWT_SECRET = "actual-secret-value"  # ❌ Exposed in version control
```

**✅ Use secret-name indirection:**

```toml
# wrangler.toml - Safe to commit
[vars]
JWT_SECRET_NAME = "MY_JWT_SECRET"  # References binding, not value
JWT_ISS = "https://gateway.example.com"
JWT_AUD = "api.example.com"
```

```bash
# Deploy secret separately
wrangler secret put MY_JWT_SECRET
# Paste secret when prompted
```

### Environment Scoping

Use different secret bindings for each environment.

```toml
# wrangler.dev.toml
[vars]
JWT_SECRET_NAME = "JWT_SECRET_DEV"

# wrangler.staging.toml
[vars]
JWT_SECRET_NAME = "JWT_SECRET_STAGING"

# wrangler.production.toml
[vars]
JWT_SECRET_NAME = "JWT_SECRET_PROD"
```

Deploy secrets to each environment:

```bash
wrangler secret put JWT_SECRET_DEV --env dev
wrangler secret put JWT_SECRET_STAGING --env staging
wrangler secret put JWT_SECRET_PROD --env production
```

### EdDSA Key Distribution

**Production (Service Binding - Recommended):**

1. Deploy JWT gateway with JWKS endpoint and public key
2. Configure consumer workers with service binding
3. Keys fetched via direct Worker-to-Worker RPC (private, low-latency)

**Benefits:**

- No public HTTP endpoint required
- Lower latency (direct RPC, no DNS/TLS overhead)
- Better security (private Worker communication only)
- Integrated with Cloudflare routing

**Development/Offline (Inline JWK):**

1. Deploy public key directly to consumer environment
2. Configure `JWT_PUBLIC_JWK_NAME` pointing to secret binding
3. Note: Requires redeployment for key rotation, no JWKS support

**Optional: Thumbprint Pinning**

For additional security, pin trusted key thumbprints:

```bash
JWT_ALLOWED_THUMBPRINTS=abc123def456,789ghi012jkl
```

Only keys matching these thumbprints will be accepted for verification.

## Key Rotation

### HS512 Rotation

**Process:**

1. Generate new secret
2. Deploy new secret to producer and all consumers
3. Start signing with new secret
4. Wait for maximum token TTL (default 15 min)
5. Remove old secret

**Downtime:** None (if consumers support both secrets during transition)

**Frequency:** Rotate at least every 90 days or immediately on suspicion of compromise.

### EdDSA Rotation

**Process:**

1. Generate new keypair with new `kid`
2. Publish new JWKS including both old and new public keys
3. Update producer to sign with new key
4. Allow dual verification during TTL window
5. After TTL expires, remove old key from JWKS

**Example:**

**Before rotation (JWKS):**

```json
{
  "keys": [
    { "kid": "ed25519-2025-01", "kty": "OKP", ... }
  ]
}
```

**During rotation (both keys active):**

```json
{
  "keys": [
    { "kid": "ed25519-2025-01", "kty": "OKP", ... },
    { "kid": "ed25519-2025-02", "kty": "OKP", ... }
  ]
}
```

**After rotation (old key removed):**

```json
{
  "keys": [
    { "kid": "ed25519-2025-02", "kty": "OKP", ... }
  ]
}
```

**Benefits:**

- Zero downtime
- Consumers automatically fetch new keys
- No consumer redeployment needed
- Full audit trail via `kid` header

## Token Issuance

### Automatic Claims

These claims are automatically populated:

- `iss` — Token issuer (from `JWT_ISS`)
- `aud` — Token audience (from `JWT_AUD`)
- `iat` — Issued at (current timestamp)
- `exp` — Expiration (current timestamp + TTL)
- `jti` — JWT ID (optional, for replay prevention)

### Manual Claims

Add custom claims with user identity and authorization:

```typescript
const token = await sign({
  sub: 'user123', // Subject (user ID)
  permissions: ['read:data'], // Permission strings
  roles: ['user', 'editor'], // Role strings
  email: 'user@example.com', // OIDC standard claim
  tid: 'tenant-123', // Multi-tenant apps
})
```

### Minimal Claims Principle

Only include claims necessary for authorization decisions. **Never include:**

- Passwords or password hashes
- Credit card numbers or payment information
- Social security numbers or national IDs
- Full medical records
- Large datasets (keep tokens < 8KB)

**Why:** Tokens are transmitted with every request and logged in various places. Treat them as semi-public.

### Token Lifetime

**Default:** 900 seconds (15 minutes)

**Recommendation:**

- External-facing APIs: 15-60 minutes
- Internal service tokens: 5-15 minutes
- Delegated tokens: 5 minutes

**Configure via:**

```bash
JWT_TTL_SECONDS=300  # 5 minutes
```

Or override per-token:

```typescript
const token = await createToken({ sub: 'user123' }, { ttlSeconds: 300 })
```

## Token Validation

### Automatic Verification

When calling `verify()` or `checkAuth()`, these checks are performed:

1. **Signature verification** — Cryptographic signature valid for detected algorithm
2. **Issuer check** — `iss` matches `JWT_ISS`
3. **Audience check** — `aud` matches `JWT_AUD`
4. **Expiration check** — Token not expired (`exp` > now - leeway)
5. **Not before check** — If `nbf` present, token is valid (`nbf` < now + leeway)

### Clock Skew Tolerance

**Default leeway:** 90 seconds

Accounts for:

- Time sync differences between services
- Network latency
- Clock drift

**Configure via:**

```bash
JWT_LEEWAY=120  # 2 minutes
```

Or override per-verification:

```typescript
const payload = await verify(token, { leeway: 120 })
```

**Security consideration:** Keep leeway ≤ 90 seconds to avoid excessive expiry drift.

### Algorithm Verification

The kit rejects tokens with unexpected `alg` headers. This prevents algorithm substitution attacks.

**Example:** If environment detects HS512 mode, EdDSA tokens are rejected (and vice versa).

### Replay Prevention (Optional)

For APIs requiring replay prevention, store `jti` in a short-TTL key-value store.

```typescript
import { checkAuth } from '@chrislyons-dev/flarelette-jwt'

const auth = await checkAuth(token, policy().build())
if (!auth) {
  return new Response('Unauthorized', { status: 401 })
}

// Check if token was already used
const jti = auth.payload.jti
if (await kv.get(`used:${jti}`)) {
  return new Response('Token already used', { status: 403 })
}

// Mark token as used (expires with token TTL)
await kv.put(`used:${jti}`, 'true', {
  expirationTtl: auth.payload.exp - Date.now() / 1000,
})
```

## Transport Security

### TLS Everywhere

**Never transmit tokens over plaintext HTTP.** Always use HTTPS/TLS for:

- External API requests
- Internal service-to-service communication
- JWKS endpoint (if not using service bindings)

### Authorization Header

**✅ Correct:**

```
Authorization: Bearer <jwt-token>
```

**❌ Never:**

- Query parameters: `?token=<jwt>` (logged in access logs, proxy logs, browser history)
- Request body: `{"token": "<jwt>"}` (unnecessarily verbose)
- Cookies: (unless specifically designed for cookie-based auth with CSRF protection)

### Logging Practices

**Never log entire tokens.** Log only non-sensitive parts:

**✅ Safe to log:**

```typescript
console.log({
  jti: payload.jti, // JWT ID
  sub: payload.sub, // Subject (user ID)
  iss: payload.iss, // Issuer
  aud: payload.aud, // Audience
  exp: payload.exp, // Expiration
  action: 'read:data', // Action performed
})
```

**❌ Never log:**

```typescript
console.log(`Token: ${token}`) // ❌ Full token exposed
console.log(`Bearer ${token}`) // ❌ Full token exposed
```

**Redact in APM and telemetry:**

- Configure log redaction rules for `Authorization` headers
- Use allowlists for logged fields (never log entire objects containing tokens)

## Time and Clock Skew

### Time Synchronization

Depend on platform time sync:

- **Cloudflare Workers:** NTP-backed, reliable
- **Node.js/Python:** Ensure host has NTP configured

### Leeway Configuration

Keep leeway ≤ 90 seconds to prevent excessive expiry drift while accounting for:

- Network latency (typically < 1 second)
- Clock drift (NTP keeps this minimal)
- Service restart time skew

**Balance:**

- Too low: Legitimate tokens rejected due to minor clock differences
- Too high: Expired tokens accepted for too long

## Dependency Security

### TypeScript Dependencies

- **`jose` library:** Pinned version for cryptographic operations
- **Review changelogs** before upgrading
- **Run `npm audit`** regularly

### Python Dependencies

- **Zero external crypto dependencies** — uses WebCrypto API directly
- **Stdlib only** — reduces supply chain risk

### Lockfile Management

**Commit lockfiles:**

- `package-lock.json` (npm)
- `yarn.lock` (Yarn)
- `pyproject.toml` (Python)

**Benefits:**

- Reproducible builds
- Security scanning can detect vulnerable versions
- Prevents unexpected dependency changes

### Automated Updates

Use Dependabot or Renovate for automated dependency updates:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'

  - package-ecosystem: 'pip'
    directory: '/packages/flarelette-jwt-py'
    schedule:
      interval: 'weekly'
```

## Testing and CI/CD

### Required Test Coverage

Unit tests must cover:

- **Signature verification** (positive and negative cases)
- **Claim validation** (`iss`, `aud`, `exp`, `nbf` with leeway)
- **Authorization logic** (permissions, roles, predicates)
- **Mode detection** (HS512 vs EdDSA based on environment)
- **Secret-name indirection** (resolution and fallback)

### Static Analysis

Run these checks in CI:

- **ESLint** (TypeScript/JavaScript)
- **Ruff** (Python linting)
- **mypy** (Python type checking)
- **TypeScript compiler** (type checking)

### Secret Scanning

Enable secret scanning to prevent committed secrets:

- **Gitleaks** (open source)
- **GitHub Advanced Security** (GitHub)
- **GitLab Secret Detection** (GitLab)

**Example Gitleaks config:**

```toml
# .gitleaks.toml
[[rules]]
id = "jwt-secrets"
description = "JWT secrets and keys"
regex = '''JWT_(SECRET|PRIVATE_JWK|PUBLIC_JWK|JWKS_URL)\s*=\s*["']?[A-Za-z0-9_\-+/={}:,"\.]{32,}["']?'''
```

## Hardening Checklist

Before deploying to production:

- [ ] HS512 or EdDSA explicitly enforced (not both in same environment)
- [ ] Secrets stored as Cloudflare bindings (`*_NAME` pattern)
- [ ] TTL ≤ 15 minutes; leeway ≤ 90 seconds
- [ ] No tokens in logs, URLs, or version control
- [ ] Minimal claims principle applied (no PII unless necessary)
- [ ] Rotation policy documented and tested (both HS512 and EdDSA)
- [ ] Thumbprint pinning configured (if using EdDSA with strict requirements)
- [ ] CI secret scan enabled
- [ ] Dependencies pinned in lockfiles
- [ ] Incident response runbook prepared
- [ ] TLS everywhere (no plaintext transmission)
- [ ] Authorization header used (`Authorization: Bearer`)
- [ ] Test coverage includes security-critical paths

## Incident Response

### On Leak or Compromise

**Immediate actions:**

1. Rotate secrets/keys immediately
2. Revoke sessions by shortening TTL and reissuing tokens
3. Review access logs for suspicious activity
4. Notify affected users if PII exposed

**Investigation:**

1. Identify scope of compromise (which secrets, how long exposed)
2. Review logs for unusual patterns
3. Check for permission escalation attempts

**Post-incident:**

1. Document root cause
2. Update security procedures
3. Add detection for similar incidents
4. Consider additional controls (e.g., replay prevention, stricter TTLs)

### Audit Logging

Log sufficient context for forensics without logging tokens:

```typescript
console.log({
  timestamp: new Date().toISOString(),
  jti: payload.jti, // JWT ID
  sub: payload.sub, // Subject
  iss: payload.iss, // Issuer
  aud: payload.aud, // Audience
  iat: payload.iat, // Issued at
  exp: payload.exp, // Expiration
  actor: payload.act?.sub, // Actor service (if delegated)
  action: 'read:sensitive', // Action performed
  result: 'success', // Outcome
  ip: requestIP, // Client IP (if applicable)
})
```

## Threat Model

### Threats Mitigated

- **Token forgery** — Cryptographic signature prevents creating valid tokens without secret/private key
- **Algorithm substitution** — Kit rejects tokens with unexpected `alg` headers
- **Expired token reuse** — Expiration checks with leeway prevent use of expired tokens
- **Clock skew exploitation** — Leeway limited to 90 seconds by default
- **Permission escalation** — Delegated tokens preserve original permissions, no escalation
- **Replay attacks** — Optional `jti` tracking in KV store

### Threats Not Mitigated

**Token theft:**

- If attacker obtains valid token, they can use it until expiration
- Mitigate with: Short TTLs (5-15 min), TLS everywhere, secure storage

**Compromised secret/private key:**

- Attacker can forge tokens indefinitely
- Mitigate with: Secret rotation, access controls, ephemeral keys, HSM storage

**Side-channel attacks:**

- Timing attacks on signature verification (EdDSA resistant, HS512 uses constant-time comparisons)
- Mitigate with: Use vetted crypto libraries (`jose`, WebCrypto)

**Distributed denial of service:**

- Signature verification is computationally expensive
- Mitigate with: Rate limiting, WAF rules, valid token caching

## References

- **[RFC 7519: JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519.html)**
- **[RFC 7517: JSON Web Key (JWK)](https://www.rfc-editor.org/rfc/rfc7517.html)**
- **[RFC 8693: OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693.html)**
- **[OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)**
- **[Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)**

---

**Questions or security concerns?** Open a security issue or contact the maintainers directly.
