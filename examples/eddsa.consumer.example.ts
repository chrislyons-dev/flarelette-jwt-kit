// examples/eddsa.consumer.example.ts
/**
 * Example: EdDSA JWT Consumer (Service)
 *
 * - Verifies JWTs signed by the gateway using JWKS via service binding
 * - Uses service binding indirection: JWT_JWKS_SERVICE_NAME -> GATEWAY_BINDING
 * - Demonstrates both raw verify() and policy-driven checkAuth()
 *
 * Required configuration in wrangler.toml:
 *
 * [vars]
 * JWT_JWKS_SERVICE_NAME = "GATEWAY_BINDING"
 * JWT_ISS = "https://gateway.internal"
 * JWT_AUD = "api.internal"
 *
 * [[services]]
 * binding = "GATEWAY_BINDING"
 * service = "jwt-gateway"
 * environment = "production"
 *
 * # Optional key pinning (recommended for additional security):
 * # JWT_ALLOWED_THUMBPRINTS = "thumb1,thumb2"
 */

import { Hono } from 'hono'
import { adapters } from '@chrislyons-dev/flarelette-jwt'

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
app.get('/health', c => c.json({ ok: true }))

/**
 * Simple verification example: just validate the token and return the payload
 */
app.get('/whoami', async c => {
  const jwt = adapters.makeKit(c.env) // inject Cloudflare bindings (env-safe)
  const token = getBearerToken(c.req.raw)
  if (!token) return c.text('Missing Authorization: Bearer <token>', 401)

  const payload = await jwt.verify(token) // Enforces iss/aud/alg via env
  if (!payload) return c.text('Unauthorized', 401)

  return c.json({
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
