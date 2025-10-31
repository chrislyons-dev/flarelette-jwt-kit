/**
 * Example: EdDSA JWT Producer (Gateway)
 *
 * This worker performs two roles:
 * 1. Signs JWTs using Ed25519 private key
 * 2. Exposes JWKS endpoint for consumer workers (via service binding)
 *
 * Required setup:
 *   1. Generate keypair: npx flarelette-jwt-keygen --kid=ed25519-2025-01 > keys.json
 *   2. Store private key: wrangler secret put GW_ED25519_PRIVATE
 *      (paste privateJwk from keys.json)
 *   3. Copy publicJwk to GW_ED25519_PUBLIC in wrangler.toml
 *   4. Deploy: wrangler deploy --config examples/eddsa.producer.example.toml
 *
 * Consumer workers can:
 *   - Bind to this worker via [[services]] for JWKS
 *   - Receive JWTs from authentication flow
 *   - Verify tokens using the service binding
 */

import { Hono } from 'hono'
import { adapters } from '@chrislyons-dev/flarelette-jwt'

interface Env {
  // Secret bindings (indirection pattern)
  GW_ED25519_PRIVATE?: string

  // Environment variables
  JWT_PRIVATE_JWK_NAME?: string
  JWT_KID?: string
  JWT_ISS?: string
  JWT_AUD?: string
  JWT_TTL_SECONDS?: string

  // Public key for JWKS endpoint
  GW_ED25519_PUBLIC?: string
  JWT_PUBLIC_JWK_NAME?: string
}

const app = new Hono<{ Bindings: Env }>()

/**
 * JWKS Endpoint (for service binding consumers)
 *
 * Consumer workers fetch this via service binding:
 *   env.GATEWAY_BINDING.fetch('/.well-known/jwks.json')
 *
 * Not exposed as public HTTP endpoint - internal only.
 */
app.get('/.well-known/jwks.json', c => {
  // Support indirection for public key
  const publicKeyName = c.env.JWT_PUBLIC_JWK_NAME || 'GW_ED25519_PUBLIC'
  const publicJwkString = c.env[publicKeyName as keyof Env]

  if (!publicJwkString || typeof publicJwkString !== 'string') {
    return c.json({ error: 'Public key not configured' }, 500)
  }

  try {
    const publicJwk = JSON.parse(publicJwkString)

    return c.json(
      { keys: [publicJwk] },
      200,
      { 'Cache-Control': 'public, max-age=300' } // 5 minute cache
    )
  } catch {
    return c.json({ error: 'Invalid public key format' }, 500)
  }
})

/**
 * Token Issuance Endpoint
 *
 * Example: POST /token
 * Body: { "sub": "user123", "roles": ["admin"], "permissions": ["read:data"] }
 */
app.post('/token', async c => {
  const jwt = adapters.makeKit(c.env)
  const payload = (await c.req
    .json<{
      sub?: string
      roles?: string[]
      permissions?: string[]
      [key: string]: unknown
    }>()
    .catch(() => ({}))) as {
    sub?: string
    roles?: string[]
    permissions?: string[]
    [key: string]: unknown
  }

  // Sign token with EdDSA
  const token = await jwt.createToken({
    sub: payload.sub || 'system',
    roles: payload.roles || ['service'],
    permissions: payload.permissions || [],
    ...payload, // Allow additional claims
  })

  return c.json({ token })
})

/**
 * Token Verification Endpoint (optional sanity check)
 *
 * Verifies tokens signed by this gateway.
 * Example: GET /verify with Authorization: Bearer <token>
 */
app.get('/verify', async c => {
  const jwt = adapters.makeKit(c.env)
  const authHeader = c.req.header('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')

  if (!token) {
    return c.json({ error: 'Missing token' }, 401)
  }

  const verified = await jwt.verify(token)
  if (!verified) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  return c.json({
    message: 'Token valid',
    sub: verified.sub,
    exp: verified.exp,
    iat: verified.iat,
    roles: verified.roles,
    permissions: verified.permissions,
  })
})

/**
 * Health check endpoint
 */
app.get('/health', c => {
  return c.json({
    status: 'healthy',
    service: 'jwt-gateway',
    endpoints: {
      jwks: '/.well-known/jwks.json',
      token: 'POST /token',
      verify: 'GET /verify',
    },
  })
})

export default app
