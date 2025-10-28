# Flarelette Auth Stack — Package Relationship Map

> **Goal:** Keep `flarelette-jwt-kit` a _framework-neutral_ core for signing, verification, and key management. Push route guards and framework wiring into adapter packages (e.g., `flarelette-hono`).

## 1. Layers & Responsibilities

```text
┌──────────────────────────────┐
│  Service Apps (APIs, UIs)    │  ← Your microservices
└──────────────┬───────────────┘
               │ uses
┌──────────────▼───────────────┐
│     flarelette (py) /        │  ← Middleware, guards
│  flarelette-hono (js/ts)     │  ← Middleware, guards, Hono integration
└──────────────┬───────────────┘
               │ depends on
┌──────────────▼───────────────┐
│     flarelette-jwt-kit       │  ← Core JWT utilities (TS + Py)
│  (this repo)                 │
└──────────────┬───────────────┘
               │ uses
┌──────────────▼───────────────┐
│  Platform Secrets / Env      │  ← Cloudflare bindings, KV, R2
└──────────────────────────────┘
```

### `flarelette-jwt-kit` (this repo)

- **What it is:** Cross-runtime JWT core (TypeScript + Workers Python).
- **Does:**
  - `sign`, `verify`, `createToken`, `checkAuth`, `policy()`
  - **HS512** (shared secret) and **EdDSA** (Ed25519 + JWKS)
  - Env indirection (`*_NAME`) + edge-safe env injection
  - JWKS fetch + cache + optional thumbprint pinning (TS)
  - CLI: `flarelette-jwt-secret`, `flarelette-jwt-keygen`
- **Does not:**
  - Route guards, HTTP middleware, request parsing
  - Session management, persistence, replay store

### `flarelette-hono` (adapter package)

- **What it is:** Hono/Workers integration sitting on top of `jwt-kit`.
- **Does:**
  - `authGuard(policy)` middleware
  - Injects Worker `env` and binds kit
  - Adds ergonomic helpers (`c.get('auth')`, etc.)
- **Depends on:** `flarelette-jwt-kit`

## 2. Package Boundaries & APIs

| Concern                   | `jwt-kit` | `flarelette` & `flarelette-hono` |
| ------------------------- | --------- | -------------------------------- |
| Sign/Verify (HS512/EdDSA) | ✅        | uses core                        |
| JWKS handling             | ✅ (TS)   | passthrough                      |
| Env handling (`*_NAME`)   | ✅        | passthrough                      |
| Middleware / Guards       | ❌        | ✅                               |
| Request parsing (headers) | ❌        | ✅                               |
| Replay store (KV)         | ❌        | optional addon                   |
| Logging/metrics           | ❌        | per app / adapter                |

## 3. Configuration (shared schema)

- `JWT_ISS`, `JWT_AUD`, `JWT_TTL_SECONDS` (default 900), `JWT_LEEWAY` (default 90)
- HS512: `JWT_SECRET_NAME` → `<binding>` (preferred) or `JWT_SECRET`
- EdDSA producer: `JWT_PRIVATE_JWK_NAME` / `JWT_PRIVATE_JWK`, optional `JWT_KID`
- EdDSA consumer (TS): `JWT_JWKS_URL_NAME` / `JWT_JWKS_URL`, optional `JWT_ALLOWED_THUMBPRINTS`
- EdDSA consumer (Py): `JWT_PUBLIC_JWK_NAME` / `JWT_PUBLIC_JWK` (inline JWK)

## 4. Versioning & Release Guidance

- **jwt-kit:** semver; treat crypto & env behavior as **stable API**. Breaking changes → major.
- **adapters:** minor/patch can track new kit features without forcing app changes.
- Keep **changelogs**: `packages/flarelette-jwt-ts/CHANGELOG.md`, `packages/flarelette-jwt-py/CHANGELOG.md`.

## 5. Testing Matrix

| Case                           | TS (Node/Workers)   | Python Workers |
| ------------------------------ | ------------------- | -------------- |
| HS512 sign/verify              | ✅                  | ✅             |
| EdDSA sign                     | ✅ (gateway)        | —              |
| EdDSA verify                   | ✅ (JWKS or inline) | ✅ (inline)    |
| Alg mismatch rejection         | ✅                  | ✅             |
| Claim checks (iss/aud/exp/nbf) | ✅                  | ✅             |
| Policy checks (roles/perms)    | ✅                  | ✅             |
| Env indirection (`*_NAME`)     | ✅                  | ✅             |

## 6. Migration Patterns

- **HS512 → EdDSA**: Stand up JWKS; publish new key with `kid`; switch producer; keep dual keys through TTL; remove old.
- **Edge-safe env**: Prefer `*_NAME` → `env[<binding>]` everywhere; adapters inject env automatically.

---

**TL;DR:** Keep crypto & validation **here**; push framework wiring into **flarelette/flarelette-hono**. Apps depend on the adapter, not directly on `jwt-kit` (unless they need the low-level API).
