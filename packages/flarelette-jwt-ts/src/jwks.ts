
import { createRemoteJWKSet } from 'jose'
import { getJwksUrl } from './config'

export function jwksFromEnv() {
  const url = getJwksUrl()
  if (!url) throw new Error('JWT_JWKS_URL or JWT_JWKS_URL_NAME missing for EdDSA verification')
  return createRemoteJWKSet(new URL(url), { cooldownDuration: 300000 })
}

export function allowedThumbprints(): Set<string> | null {
  const s = process.env.JWT_ALLOWED_THUMBPRINTS
  if (!s) return null
  return new Set(s.split(',').map(x => x.trim()).filter(Boolean))
}
