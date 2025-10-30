# 🧩 Flarelette JWT Kit

Cross-language **JWT signing and verification toolkit** for Cloudflare Workers and standard Node/Python runtimes.
Supports **HS512** and **EdDSA (Ed25519)** automatically based on environment, with full **secret-name indirection** for Cloudflare secret bindings.

---

## Simplified Overview

Flarelette JWT Kit simplifies JWT management by auto-detecting cryptographic modes (HS512 or EdDSA) based on environment variables. This ensures secure, environment-driven configurations without manual intervention.

---

### 📁 Repository Layout

- Root:
  - `package.json` + `pyproject.toml`
  - `README.md` describing env-driven + edge-safe modes
  - `.gitignore`, `LICENSE`
  - `examples/` with `.env.*.example` for HS512 and EdDSA producers/consumers

---

### ⚙️ TypeScript (`packages/flarelette-jwt-ts`)

**Env-driven HS512 + EdDSA**

| File        | Purpose                                                   |
| ----------- | --------------------------------------------------------- |
| `sign.ts`   | Signs JWTs (auto-detects HS512 or EdDSA).                 |
| `verify.ts` | Verifies JWTs (supports JWKS + thumbprint pinning).       |
| `config.ts` | Mode detection, env indirection, edge-safe env injection. |
| `jwks.ts`   | Cached JWKS fetch (with 5-min cooldown).                  |

**Helpers**

| File        | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| `high.ts`   | High-level helpers (`createToken`, `checkAuth`, `policy`). |
| `util.ts`   | Parsing, expiry check, and simple permission helpers.      |
| `secret.ts` | 64-byte base64url secret generator & validator.            |

**CLIs**

| CLI                     | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `flarelette-jwt-secret` | Generate HS512 secrets (`--len`, `--dotenv`, `--json`). |
| `flarelette-jwt-keygen` | Generate Ed25519 keypair (with `kid`).                  |

**Edge-Safe Adapters**

| File               | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `adapters/hono.ts` | Injects Cloudflare Worker `env` (no `process.env` dependency). |

Example:

```ts
import { adapters } from '@flarelette/jwt-ts'

export default {
  async fetch(req, env) {
    const jwt = adapters.makeKit(env) // binds secrets + vars
    const token = await jwt.createToken({ sub: 'u123' })
    const verified = await jwt.verify(token)
    return new Response(JSON.stringify(verified))
  },
}
```

---

### 🐍 Python Workers (`packages/flarelette-jwt-py`)

**Env-driven**

| File        | Purpose                                                   |
| ----------- | --------------------------------------------------------- |
| `env.py`    | Mode detection, env indirection, HS512 secret decoding.   |
| `sign.py`   | HS512 signing (EdDSA signing not available on Workers).   |
| `verify.py` | HS512 + EdDSA verification (via `JWT_PUBLIC_JWK[_NAME]`). |

**Helpers**

| File        | Purpose                                         |
| ----------- | ----------------------------------------------- |
| `high.py`   | `create_token`, `check_auth`, and `policy`.     |
| `util.py`   | `parse`, `is_expiring_soon`.                    |
| `secret.py` | Secret generator CLI (`flarelette-jwt-secret`). |

**Adapters**

| File          | Purpose                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| `adapters.py` | `apply_env_bindings(env)` — copies Worker env into `os.environ` for edge runtimes. |

Example:

```python
from flarelette_jwt.adapters import apply_env_bindings
from flarelette_jwt import create_token, verify

def fetch(req, env, ctx):
    apply_env_bindings(env)
    token = await create_token({"sub": "u123"})
    payload = await verify(token)
    return Response(str(payload))
```

---

### 🔐 Environment-Driven Modes

| Mode                | Key Sources                                                                                                                                         | Typical Use                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **HS512**           | `JWT_SECRET_NAME` → `<binding>` or `JWT_SECRET`                                                                                                     | Private symmetric secrets (fast, simple).             |
| **EdDSA (Ed25519)** | Producers: `JWT_PRIVATE_JWK_NAME` / `JWT_PRIVATE_JWK`<br>Consumers: `JWT_PUBLIC_JWK_NAME` / `JWT_PUBLIC_JWK` / `JWT_JWKS_URL_NAME` / `JWT_JWKS_URL` | Public/private separation for federated verification. |

**Common Variables**

| Variable                  | Description                        | Default |
| ------------------------- | ---------------------------------- | ------- |
| `JWT_ISS`                 | Token issuer                       | —       |
| `JWT_AUD`                 | Token audience                     | —       |
| `JWT_TTL_SECONDS`         | Lifetime                           | `900`   |
| `JWT_LEEWAY`              | Allowed clock skew                 | `90`    |
| `JWT_ALLOWED_THUMBPRINTS` | Optional comma-separated whitelist | —       |

---

### ☁️ Cloudflare Secret-Name Indirection

Rather than embedding secrets in your environment, you reference Cloudflare bindings:

```toml
# wrangler.toml
name = "gateway"
main = "src/index.ts"

# Define the name, not the secret value:
[vars]
JWT_SECRET_NAME = "FLARELETTE_JWT_SECRET"
JWT_ISS = "https://gw.example"
JWT_AUD = "bond-math.api"

# Store the real secret at deploy time:
# wrangler secret put FLARELETTE_JWT_SECRET
```

This works equally for:

- `JWT_PRIVATE_JWK_NAME`
- `JWT_PUBLIC_JWK_NAME`
- `JWT_JWKS_URL_NAME`

---

### 🚀 Quick Starts

**HS512 producer (Node or Python)**

```bash
# Node
export JWT_SECRET=$(npx flarelette-jwt-secret --dotenv | cut -d= -f2)
export JWT_ISS=https://gw.example
export JWT_AUD=bond-math.api
# then call sign(...) or createToken(...)

# Python Workers
export JWT_SECRET=$(flarelette-jwt-secret --dotenv | cut -d= -f2)
# then await sign(...) from flarelette_jwt
```

**EdDSA producer (Node)**

```bash
npx flarelette-jwt-keygen --kid=ed25519-2025-01 > jwk.json
export JWT_PRIVATE_JWK="$(cat jwk.json | jq -c .privateJwk)"
export JWT_KID="ed25519-2025-01"
```

**EdDSA consumer**

| Runtime                    | How to Configure                                                                |
| -------------------------- | ------------------------------------------------------------------------------- |
| **TypeScript (Node/Edge)** | `JWT_JWKS_URL` or `JWT_JWKS_URL_NAME`, plus optional `JWT_ALLOWED_THUMBPRINTS`. |
| **Python Workers**         | `JWT_PUBLIC_JWK` or `JWT_PUBLIC_JWK_NAME` (inline JSON JWK).                    |

---

## 🧩 Auth Guards & Route Decorators

Flarelette provides convenient guards to enforce policies directly in routes.

### 🪶 TypeScript: Hono Middleware

Add `authGuard(policy)` to validate JWTs automatically.

```ts
import { adapters } from '@flarelette/jwt-ts'
import { Hono } from 'hono'

const app = new Hono()

app.use('*', async (c, next) => {
  const jwt = adapters.makeKit(c.env)
  c.set('jwt', jwt)
  await next()
})

app.get('/secure', async c => {
  const { jwt } = c.get('jwt')
  const auth = await jwt.checkAuth(
    c.req.header('authorization')?.replace('Bearer ', ''),
    jwt.policy().rolesAny('admin', 'editor').needAll('read:data').build()
  )
  if (!auth) return c.text('Unauthorized', 401)
  return c.json({ message: 'Welcome!', user: auth.sub })
})

export default app
```

**Notes:**

- Works both in Workers (`fetch(req, env)`) and Hono-on-Node.
- You can build `policy()` objects declaratively (roles, permissions, custom predicates).

---

### 🐍 Python: Decorator for Route Protection

For Workers Python frameworks (or pure fetch handlers):

```python
from flarelette_jwt import check_auth, policy
from flarelette_jwt.adapters import apply_env_bindings

def auth_guard(required_policy):
    def decorator(fn):
        async def wrapper(req, env, *args, **kwargs):
            apply_env_bindings(env)
            token = req.headers.get("authorization", "").replace("Bearer ", "")
            auth = await check_auth(token, **required_policy)
            if not auth:
                return Response("Unauthorized", status=401)
            return await fn(req, env, auth, *args, **kwargs)
        return wrapper
    return decorator

@auth_guard(policy().roles_any("admin", "editor").need_all("read:data").build())
async def secure(req, env, auth):
    return Response(f"Hello {auth['sub']}", status=200)
```

**Features:**

- Decorator-based, async-friendly.
- Injects the verified `auth` payload into the handler.
- Compatible with Cloudflare Worker fetch signatures.

---

### ✅ Summary

| Feature                 | Node/Edge (TS)                                      | Workers Python             |
| ----------------------- | --------------------------------------------------- | -------------------------- |
| HS512 / EdDSA           | ✅                                                  | ✅ (verify only for EdDSA) |
| Secret-name indirection | ✅                                                  | ✅                         |
| Env-safe in Workers     | ✅ (`adapters/hono`)                                | ✅ (`apply_env_bindings`)  |
| Auth guard              | ✅ Middleware                                       | ✅ Decorator               |
| CLI utilities           | ✅ `flarelette-jwt-secret`, `flarelette-jwt-keygen` | ✅ `flarelette-jwt-secret` |

---

Would you like me to generate this into a downloadable `USAGE.md` file (formatted and linked to the zip contents)?
