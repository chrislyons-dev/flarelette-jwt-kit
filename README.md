# Flarelette JWT Kit

**Environment-driven JWT authentication for Cloudflare Workers. Like Starlette, but for the edge.**

Same API for TS & Python (`sign`, `verify`, `createToken`, `checkAuth`), but the kit chooses crypto **from environment** and loads secrets **by name** (great for Cloudflare bindings).

## Modes

- **HS512 (default):** used if `JWT_SECRET_NAME` → `<binding>` (preferred) or `JWT_SECRET` (legacy) is set.
- **EdDSA (Ed25519):** used if any of `JWT_PRIVATE_JWK_NAME` / `JWT_PRIVATE_JWK` (producer) or `JWT_PUBLIC_JWK_NAME` / `JWT_PUBLIC_JWK` / `JWT_JWKS_URL_NAME` / `JWT_JWKS_URL` (consumer) is set.

## Common env

- `JWT_ISS`, `JWT_AUD`
- `JWT_TTL_SECONDS` (default 900)
- `JWT_LEEWAY` (default 90)

## Secret-name indirection

Instead of placing secret values in env vars directly, point to a binding name:

- `JWT_SECRET_NAME=FLARELETTE_JWT_SECRET` → read from `process.env['FLARELETTE_JWT_SECRET']` (Node) or `os.environ['FLARELETTE_JWT_SECRET']` (Python).
- Similarly for JWKs/URLs: `JWT_PRIVATE_JWK_NAME`, `JWT_PUBLIC_JWK_NAME`, `JWT_JWKS_URL_NAME`.

### Cloudflare Workers (Wrangler)

```toml
# wrangler.toml
name = "gateway"
main = "src/index.ts"

# Store the actual secret: wrangler secret put FLARELETTE_JWT_SECRET
[vars]
JWT_SECRET_NAME = "FLARELETTE_JWT_SECRET"
JWT_ISS = "https://gw.example"
JWT_AUD = "bond-math.api"
```

## Documentation

For detailed guides and references, please visit the [documentation index](./docs/index.md).
