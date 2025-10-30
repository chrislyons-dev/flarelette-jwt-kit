# SECURITY.md — Flarelette JWT Kit (HS512 + EdDSA, Cloudflare-Ready)

- [SECURITY.md — Flarelette JWT Kit (HS512 + EdDSA, Cloudflare-Ready)](#securitymd--flarelette-jwt-kit-hs512--eddsa-cloudflare-ready)
  - [1. Cryptography Profiles](#1-cryptography-profiles)
  - [2. Key Management](#2-key-management)
    - [Generation](#generation)
    - [Secret Storage (Cloudflare style)](#secret-storage-cloudflare-style)
    - [Ed25519 Key Distribution](#ed25519-key-distribution)
  - [3. Rotation](#3-rotation)
  - [4. Token Issuance \& Validation](#4-token-issuance--validation)
    - [Issuance (Gateway)](#issuance-gateway)
    - [Validation (Consumers)](#validation-consumers)
    - [Replay Resistance (Optional)](#replay-resistance-optional)
  - [5. Transport \& Logging Practices](#5-transport--logging-practices)
  - [6. Environment Injection (Edge Runtimes)](#6-environment-injection-edge-runtimes)
  - [7. Time \& Skew](#7-time--skew)
  - [8. Dependency \& Supply Chain Security](#8-dependency--supply-chain-security)
  - [9. CI/CD \& Testing](#9-cicd--testing)
  - [10. Algorithm Agility \& Migration](#10-algorithm-agility--migration)
  - [11. Hardening Checklist](#11-hardening-checklist)
  - [12. Incident Response](#12-incident-response)
  - [13. Service Delegation Pattern (RFC 8693)](#13-service-delegation-pattern-rfc-8693)
    - [The Actor Claim (`act`)](#the-actor-claim-act)
    - [Delegation Chains](#delegation-chains)
    - [Using `createDelegatedToken`](#using-createdelegatedtoken)
    - [Security Guarantees](#security-guarantees)
    - [Architecture Pattern](#architecture-pattern)

This document defines the security baseline for projects using **Flarelette JWT Kit** (TypeScript + Python) across both **HS512** and **Ed25519 (EdDSA)** profiles in Cloudflare and standard runtimes.

---

## 1. Cryptography Profiles

| Profile             | Algorithm                 | Key Material             | Typical Use                                       |
| ------------------- | ------------------------- | ------------------------ | ------------------------------------------------- |
| **HS512 (default)** | HMAC-SHA-512              | 64-byte base64url secret | Internal trusted producer + consumer (shared key) |
| **EdDSA (Ed25519)** | Ed25519 digital signature | JSON Web Keys (JWKs)     | One-way trust — gateway signs, services verify    |

- **Encoding:** base64url (no padding)
- **TTL:** 5–15 minutes (default 15 m)
- **Leeway:** 90 seconds
- **Claims:** `iss`, `aud`, `iat`, `exp`, `jti`
- **Verification:** reject tokens with unexpected `alg`

> Rationale: HS512 with 64-byte keys provides ~256-bit security. Ed25519 offers strong asymmetric signing with small keys and simple rotation.

---

## 2. Key Management

### Generation

- **HS512:**
  - `npx flarelette-jwt-secret --len=64 --dotenv`
  - `flarelette-jwt-secret --len 64 --dotenv`
  - or programmatic: `generateSecret(64)` / `generate_secret(64)`
- **Ed25519:**
  - `npx flarelette-jwt-keygen --kid=ed25519-<date>` → JSON JWKs (`publicJwk`, `privateJwk`)
  - pro tip: do this during your deployment github action - this results in ephemeral keys that no human ever sees

### Secret Storage (Cloudflare style)

- Reference **binding names**, not raw secrets:
  ```
  JWT_SECRET_NAME=FLARELETTE_JWT_SECRET
  JWT_PRIVATE_JWK_NAME=GW_ED25519_PRIVATE
  JWT_PUBLIC_JWK_NAME=GW_ED25519_PUBLIC
  ```
- Workers access the real value via `env[<binding>]`.
- Never embed secrets in `wrangler.toml` or commit `.env`.
- Scope secrets per environment (dev/stage/prod).

### Ed25519 Key Distribution

**Production (Service Binding - Recommended):**

1. Deploy JWT gateway (producer) with JWKS endpoint and public key
2. Configure consumer workers with service binding (`[[services]]` in wrangler.toml)
3. Keys fetched via direct Worker-to-Worker RPC (private, low-latency)
4. Benefits: No public endpoint, better performance, integrated routing

**Development/Offline (Inline JWK):**

1. Deploy public key directly to consumer environment
2. Configure `JWT_PUBLIC_JWK_NAME` pointing to secret binding
3. Note: Requires redeployment for key rotation, no JWKS support

**Security:**

- Keep private JWK in secure binding (never commit to wrangler.toml)
- Optionally pin trusted key thumbprints: `JWT_ALLOWED_THUMBPRINTS=abc123,def456`
- Use service bindings to avoid exposing public JWKS endpoints

---

## 3. Rotation

| Profile     | Rotation Steps                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| **HS512**   | 1. Deploy new secret to producer + consumers → 2. start signing with new secret → 3. after TTL, remove old              |
| **Ed25519** | 1. Generate new keypair → 2. publish new JWKS with `kid` → 3. allow dual verification during TTL → 4. deprecate old key |

- Rotate at least every 90 days or on suspicion.
- Document and test rotation procedures in CI.

---

## 4. Token Issuance & Validation

### Issuance (Gateway)

- Helpers auto-populate `iss`, `aud`, `iat`, `exp`, `jti`.
- Keep payload minimal (identifiers, permissions, roles, non-PII metadata).
- **EdDSA:** include `kid` header.
- The `alg` is auto-set based on environment.

### Validation (Consumers)

- Verify signature (`HS512` or `EdDSA`) and claims (`iss`, `aud`, `exp`, `nbf` with leeway).
- Use `checkAuth(...)` or `policy()` for fine-grained authorization.
- Consumers must reject mismatched `alg`.

### Replay Resistance (Optional)

- Store `jti` in a short-TTL KV to prevent token reuse until expiry.

---

## 5. Transport & Logging Practices

- **TLS everywhere.** Never transmit tokens over plaintext.
- Use `Authorization: Bearer <jwt>`; never in URLs.
- Do not log entire tokens; log header or `jti` only.
- Redact tokens in APM and telemetry.

---

## 6. Environment Injection (Edge Runtimes)

Cloudflare Workers and other edge runtimes lack `process.env`.

- **TypeScript:** use `adapters.makeKit(env)` to inject bindings.
- **Python:** use `apply_env_bindings(env)` to copy bindings into `os.environ`.
- Ensures consistent secret access without Node globals.

---

## 7. Time & Skew

- Depend on platform time sync (Cloudflare is NTP backed).
- Keep leeway ≤ 90 seconds to avoid expiry drift.

---

## 8. Dependency & Supply Chain Security

- **Node:** pinned `jose` dependency; review changelogs before upgrades.
- **Python:** uses WebCrypto (no external crypto deps).
- Commit lockfiles and pin toolchain in CI.
- Use Dependabot/Renovate for updates.

---

## 9. CI/CD & Testing

- Unit tests must cover:
  - Signature verify (positive / negative)
  - Claim validation (`aud`, `iss`, expiry, nbf)
  - Authorization logic (`roles`, `permissions`)
- Static analysis: `eslint`, `ruff`, `mypy`.
- Enable secret scanning (Gitleaks, GitHub Advanced Security).

---

## 10. Algorithm Agility & Migration

| From    | To          | Purpose                            | Steps                                                                              |
| ------- | ----------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| HS512   | Ed25519     | One-way trust (public verify only) | 1. Generate keypair → 2. publish JWKS → 3. update producer → 4. roll out consumers |
| Ed25519 | New Ed25519 | Key rotation                       | Publish new JWKS with versioned `kid`; remove old after TTL                        |

> The high-level APIs (`sign`, `verify`, `checkAuth`) are algorithm-agnostic for transparent migration.

---

## 11. Hardening Checklist

- [ ] HS512 or Ed25519 explicitly enforced
- [ ] Secrets and JWKs stored as Cloudflare bindings (`*_NAME`)
- [ ] TTL ≤ 15 m; leeway ≤ 90 s
- [ ] No tokens in logs or URLs
- [ ] Minimal claims principle applied
- [ ] Rotation policy tested (both HS and EdDSA)
- [ ] Thumbprint pinning if required
- [ ] CI secret scan + dependency pinning
- [ ] Incident response runbook ready

---

## 12. Incident Response

- On leak or suspicion: rotate immediately.
- Revoke sessions by shortening TTL + reissuing tokens.
- Audit logs should record `jti`, `sub`, `iss`, `aud`, `iat` — never the token body.
- Document root cause and update this file post-incident.

---

**Questions or updates?** Open a security issue or PR with proposed changes and threat model notes.

## 13. Service Delegation Pattern (RFC 8693)

**Zero-Trust Architecture:** Flarelette implements a zero-trust model where external authentication tokens (e.g., Auth0) are exchanged at the gateway for short-lived internal delegation tokens. This ensures:

1. External tokens never penetrate service boundaries
2. Services communicate only via service bindings (no internet access)
3. All services trust only internally-minted tokens
4. Original user permissions are preserved (prevents permission creep)

### The Actor Claim (`act`)

Following **RFC 8693 (OAuth 2.0 Token Exchange)**, delegated tokens use the `act` claim to identify which service is acting on behalf of the original end user:

```json
{
  "sub": "user@example.com", // Original end user
  "iss": "https://gateway.internal", // Who minted this token
  "aud": "api.internal", // Target service
  "permissions": ["read:data"], // ORIGINAL user permissions (preserved)
  "roles": ["user"],
  "act": {
    // The service acting on behalf of user
    "sub": "gateway-service" // Service identifier
  }
}
```

**Pattern Statement:** "I'm `gateway-service` doing work on behalf of `user@example.com`"

### Delegation Chains

For multi-hop service calls (service calling another service), the `act` claim nests:

```json
{
  "sub": "user@example.com",
  "permissions": ["read:data"],
  "act": {
    "sub": "api-service", // Direct actor
    "act": {
      // Nested: who api-service is acting for
      "sub": "gateway-service"
    }
  }
}
```

### Using `createDelegatedToken`

**TypeScript:**

```typescript
import { createDelegatedToken } from '@flarelette/jwt-ts'

// Gateway receives external Auth0 token
const auth0Payload = await verifyAuth0Token(externalToken)

// Create internal delegated token for API service
const internalToken = await createDelegatedToken(
  auth0Payload, // Original payload with user context
  'gateway-service', // This service's identifier
  { aud: 'internal-api' } // Target service
)

// Token now contains:
// - Original user identity (sub)
// - Original permissions (no escalation possible)
// - Actor claim identifying the gateway as the acting service
```

**Python:**

```python
from flarelette_jwt import create_delegated_token

# Gateway receives external Auth0 token
auth0_payload = await verify_auth0_token(external_token)

# Create internal delegated token for API service
internal_token = await create_delegated_token(
    original_payload=auth0_payload,
    actor_service="gateway-service",
    aud="internal-api"
)
```

### Security Guarantees

1. **No Permission Escalation:** `createDelegatedToken` copies permissions from the original token - services cannot grant themselves additional permissions
2. **Audit Trail:** The `act` claim chain provides full traceability of which services handled the request
3. **Short-Lived Tokens:** Internal tokens use `JWT_TTL_SECONDS` (default 15 minutes) to minimize exposure
4. **Service Isolation:** Service bindings ensure tokens never traverse public networks

### Architecture Pattern

```
┌──────────────────┐
│  External IdP    │
│  (e.g., Auth0)   │
└────────┬─────────┘
         │ External JWT
         │ (user permissions)
         ▼
┌──────────────────────────────┐
│   Gateway (JWT Producer)     │
│   Role: Token Exchange        │
│   - Verifies external JWT    │
│   - Mints delegated token    │
│   - Adds 'act' claim         │
└──────┬────────────────┬──────┘
       │                │
       │ Delegated JWT  │ Service Binding
       │ (preserved     │ (internal only)
       │  permissions)  │
       ▼                ▼
┌──────────────┐      ┌──────────────┐
│  Service A   │─────→│  Service B   │
│  (Consumer)  │      │  (Consumer)  │
│              │      │              │
│  - Verifies  │      │  - Verifies  │
│  - Checks    │      │  - Checks    │
│    act claim │      │    act chain │
└──────────────┘      └──────────────┘
```

**Reference:** [RFC 8693 - OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693.html)
