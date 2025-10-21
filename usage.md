# flarelette-jwt-kit repository

  * `package.json` + `pyproject.toml`
  * `README.md` describing the env-driven modes
  * `.gitignore`, `LICENSE`
  * `examples/` with `.env.*.example` for HS512 and EdDSA producers/consumers

* **TypeScript (`packages/flarelette-jwt-ts`)**

  * Env-driven **HS512 + EdDSA**:

    * `sign.ts` (HS512 or EdDSA based on env)
    * `verify.ts` (HS512 or EdDSA, with optional thumbprint pinning)
    * `config.ts` (mode detection, common envs, secret decoding)
    * `jwks.ts` (JWKS fetch cache with cooldown)

  * Helpers:

    * `high.ts` (createToken, checkAuth, policy)
    * `util.ts` (parse, isExpiringSoon)
    * `secret.ts` (64-byte base64url generator + validator)

  * CLIs:

    * `cli.ts` → `flarelette-jwt-secret`
    * `keygen.ts` → `flarelette-jwt-keygen` (Ed25519 keypair with `kid`)

* **Python Workers (`packages/flarelette-jwt-py`)**

  * Env-driven:

    * `env.py` (mode detection, common envs, HS secret decode)
    * `sign.py` (HS512 signing; EdDSA signing not provided in Workers Python)
    * `verify.py` (HS512 verify; **EdDSA verify using `JWT_PUBLIC_JWK`**)
  * Helpers:

    * `high.py` (create_token, check_auth, policy)
    * `util.py` (parse, is_expiring_soon)
    * `secret.py` (64-byte base64url generator + CLI `flarelette-jwt-secret`)

### Quick starts

**HS512 producer (Node or Python)**

```bash
# Node
export JWT_SECRET=$(npx flarelette-jwt-secret --dotenv | cut -d= -f2)
export JWT_ISS=https://gw.example
export JWT_AUD=bond-math.api
# then call sign(...) from @flarelette/jwt-ts

# Python Workers
export JWT_SECRET=$(flarelette-jwt-secret --dotenv | cut -d= -f2)
# then await sign(...) from flarelette_jwt
```

**EdDSA producer (Node)**

```bash
# Generate a keypair
npx flarelette-jwt-keygen --kid=ed25519-2025-01 > jwk.json
export JWT_PRIVATE_JWK="$(cat jwk.json | jq -c .privateJwk)"
export JWT_KID="ed25519-2025-01"
# then call sign(...) — kit auto-uses EdDSA
```

**EdDSA consumer**

* **TypeScript**: set `JWT_JWKS_URL` (optionally `JWT_ALLOWED_THUMBPRINTS=...`).
* **Python Workers**: set `JWT_PUBLIC_JWK` (inline public JWK JSON).

