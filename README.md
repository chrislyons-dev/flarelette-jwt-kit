
# Flarelette JWT Kit (Env-Driven) — HS512 default, EdDSA optional

Same API across TS & Python (`sign`, `verify`, `createToken`, `checkAuth`), but the crypto mode is chosen by **environment variables**.

## Modes
- **HS512 (default)**: If `JWT_SECRET` is present.
- **EdDSA (Ed25519)**: If any of `JWT_PRIVATE_JWK`, `JWT_PRIVATE_JWK_PATH`, `JWT_PUBLIC_JWK`, or `JWT_JWKS_URL` is present.

## Env Variables
Common:
- `JWT_ISS`, `JWT_AUD`
- `JWT_LEEWAY` (default 90), `JWT_TTL_SECONDS` (default 900)

HS512:
- `JWT_SECRET` (base64url or raw string; recommended base64url 64 bytes)

EdDSA:
- Producer: `JWT_PRIVATE_JWK` (JWK JSON) or `JWT_PRIVATE_JWK_PATH` (file path), optional `JWT_KID`
- Consumer: `JWT_PUBLIC_JWK` (inline JWK) **or** `JWT_JWKS_URL` (TS only)
- Optional pinning: `JWT_ALLOWED_THUMBPRINTS` (comma-separated RFC7638 thumbprints)

## Packages
- `packages/flarelette-jwt-ts`: TypeScript (Node/Workers), supports HS512 + EdDSA sign/verify, JWKS cache, secret and keygen CLIs
- `packages/flarelette-jwt-py`: Workers Python, supports HS512 sign/verify, EdDSA verify (via `JWT_PUBLIC_JWK`), secret CLI

