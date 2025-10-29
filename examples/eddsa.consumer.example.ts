// examples/eddsa.consumer.example.ts
/**
 * Example: EdDSA JWT Consumer (Service)
 *
 * - Verifies JWTs signed by the gateway using JWKS
 * - Uses binding-name indirection: JWT_JWKS_URL_NAME -> GW_JWKS_URL
 * - Demonstrates both raw verify() and policy-driven checkAuth()
 *
 * Required vars in wrangler.toml:
 *
 * [vars]
 * JWT_JWKS_URL_NAME = "GW_JWKS_URL"
 * GW_JWKS_URL = "https://gateway.internal/.well-known/jwks.json"
 * JWT_ISS = "https://gateway.internal"
 * JWT_AUD = "bond-math.api"
 *
 * # Optional key pinning (recommended if you want extra defense):
 * # JWT_ALLOWED_THUMBPRINTS = "thumb1,thumb2"
 */

import { Hono } from 'hono'
import { adapters } from '@flarelette/jwt-ts'

const app = new Hono()

/** Utility to extract a Bearer token */
function getBearerToken(req: Request): string | null {
  const auth = new Headers(req.headers).get('authorization') || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

/**
 * Health
 */
app.get('/health', _c => c.json({ ok: true }))

/**
 * Simple verification example: just validate the token and return the payload
 */
app.get('/whoami', async _c => {
  const jwt = adapters.makeKit(_c.env) // inject Cloudflare bindings (env-safe)
  const token = getBearerToken(_c.req.raw)
  if (!token) return _c.text('Missing Authorization: Bearer <token>', 401)

  const payload = await jwt.verify(token) // Enforces iss/aud/alg via env
  if (!payload) return _c.text('Unauthorized', 401)

  return _c.json({
    sub: payload.sub,
    roles: payload.roles,
    permissions: payload.permissions,
    exp: payload.exp,
  })
})

/**
 * Policy-driven guard: require at least one role and a specific permission.
 * (This mirrors what your micro-APIs will do most often.)
 */
app.get('/reports', async c => {
  const jwt = adapters.makeKit(c.env)
  const token = getBearerToken(c.req.raw)
  if (!token) return c.text('Missing Authorization', 401)

  const auth = await jwt.checkAuth(
    token,
    jwt
      .policy()
      .rolesAny('analyst', 'admin') // any-of roles
      .needAll('read:reports') // all required permissions
      .build()
  )
  if (!auth) return c.text('Forbidden', 403)

  // Proceed with business logic; `auth.payload` has the full verified claims
  return c.json({ ok: true, sub: auth.sub, roles: auth.roles })
})

export default app
