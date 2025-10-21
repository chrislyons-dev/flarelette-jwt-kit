
# SECURITY.md — Flarelette JWT Kit (HS512)

This document codifies the security baseline for projects using **flarelette-jwt-kit** (Python & Node) with **HS512** and **64‑byte base64url** secrets.

## 1) Cryptography Profile

- **Algorithm:** HMAC **HS512** (SHA‑512)
- **Secret length:** **64 bytes** (512 bits), uniformly random
- **Encoding:** base64url **without padding**
- **Token lifetime (TTL):** 5–15 minutes (default 15m)
- **Leeway:** 90 seconds for clock skew
- **Required claims:** `iss`, `aud`, `iat`, `exp` (auto-populated by helpers)
- **Verification:** consumers accept **HS512 only**

> Rationale: 64‑byte key + HS512 provides ~256‑bit security. Strict alg reduces downgrade/misconfig risk.

## 2) Key Management

### Generation
- **CLI (Node):** `npx flarelette-jwt-secret --len=64 --dotenv`
- **CLI (Python):** `flarelette-jwt-secret --len 64 --dotenv`
- Programmatic: `generateSecret(64)` (TS) / `generate_secret(64)` (Py)

### Storage
- Store only in secret managers (Cloudflare Vars/Secrets, AWS Secrets Manager, 1Password, etc.).
- **Never** commit secrets to VCS. Add `.env` to `.gitignore` in every repo.
- Scope secrets **per environment** (dev/stage/prod). Do not share across envs or tenants.

### Rotation
- Rotate **every 90 days** or on suspicion.
- Stagger rollout:
  1. Deploy new secret to **producer + consumers**.
  2. Producer signs with **new** secret.
  3. After max TTL, revoke/remove old secret.
- If you need zero-downtime migrations later, support parallel verification with an allowlist of KIDs. (Current baseline is single-secret.)

## 3) Token Issuance & Validation

### Issuance (Gateway)
- Set `iss`, `aud`, `iat`, `exp`, and `jti`.
- Keep payload minimal: subject identifiers, `permissions`/`roles`, and non-PII metadata (`cid`, `rid`, `tid`). Avoid embedding secrets or large objects.

### Validation (Consumers)
- Verify signature (HS512) and claims (`iss`, `aud`, `exp`, `nbf`/`iat` with leeway).
- Enforce authorization policy using `checkAuth(...)` with:
  - `require_all_permissions` (subset)
  - `require_any_permission` (any-of)
  - `require_roles_all` / `require_roles_any`
  - custom predicates

### Replay Resistance (Optional)
- If required, store `jti` in a short‑TTL KV to reject re-use until expiration.

## 4) Transport, Logging, and Privacy

- **TLS everywhere.** Never transmit tokens over plaintext.
- Use `Authorization: Bearer <jwt>` header; do **not** put tokens in URLs.
- **Do not log tokens.** If needed for debugging, log only the header and `jti`/`sub`/`exp`.
- Treat tokens as secrets in memory and traces; redact in APM/metrics.

## 5) Time & Skew

- Rely on platform time sync (e.g., Cloudflare Workers) and keep leeway at **90s**.
- Avoid excessive leeway; it weakens expiry guarantees.

## 6) Dependency & Supply Chain

- **Node:** `jose` pinned to stable; use dependabot/renovate and changelog review before upgrades.
- **Python (Workers):** uses WebCrypto; no extra crypto deps.
- Lockfiles: commit `pnpm-lock.yaml`/`package-lock.json` (if relevant) and pin toolchain in CI.

## 7) CI/CD & Testing

- Unit tests for:
  - Signature verification (positive/negative)
  - Claim checks (`aud`, `iss`, expired, not-yet-valid)
  - Authorization matrix (required permissions/roles)
- Static analysis & lint: enable `eslint/ruff/mypy` in CI.
- Secrets scanning (e.g., Gitleaks) to prevent accidental commits.

## 8) Incident Response

- **Leak or suspicion:** rotate the secret immediately, invalidate sessions by reducing TTL and reissuing tokens.
- Audit logs should include `jti`, `sub`, `iss`, `aud`, and issuance time—never full token strings.
- Post-incident: bump kit version, document findings in this file’s changelog.

## 9) Migration & Algorithm Agility

- Current baseline is symmetric HS512. If you later need one‑way trust (shared verify, restricted signers):
  - Migrate to **Ed25519 (EdDSA)** with JWKS for public verification.
  - Maintain the same high‑level API (`sign/verify`, `checkAuth`) for minimal app changes.

## 10) Hardening Checklist

- [ ] HS512 enforced in producers and consumers
- [ ] 64‑byte base64url secret in each environment
- [ ] TTL ≤ 15m; leeway ≤ 90s
- [ ] No tokens in logs or URLs
- [ ] Least‑privilege claims (only what you need)
- [ ] Rotation policy documented and tested
- [ ] Replay protection (`jti` store) if required by risk model
- [ ] CI secret scanning and dependency updates
- [ ] Incident response runbook in place

---

**Questions or updates?** Open a security issue or PR against this file with your proposal and threat model notes.
