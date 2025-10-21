
import { createRemoteJWKSet } from 'jose'

export function jwksFromEnv() {
  const url = process.env.JWT_JWKS_URL
  if (!url) throw new Error('JWT_JWKS_URL missing for EdDSA verification')
  return createRemoteJWKSet(new URL(url), { cooldownDuration: 300000 }) // 5 minutes
}

export function allowedThumbprints(): Set<string> | null {
  const s = process.env.JWT_ALLOWED_THUMBPRINTS
  if (!s) return null
  return new Set(s.split(',').map(x => x.trim()).filter(Boolean))
}
