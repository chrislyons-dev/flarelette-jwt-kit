
export type Mode = 'HS512' | 'EdDSA'

export function envMode(role: 'producer'|'consumer'): Mode {
  const env = process.env
  if (env.JWT_PRIVATE_JWK || env.JWT_PRIVATE_JWK_PATH) return 'EdDSA'
  if (env.JWT_PUBLIC_JWK || env.JWT_JWKS_URL) return 'EdDSA'
  return 'HS512'
}

export function getCommon() {
  return {
    iss: process.env.JWT_ISS || '',
    aud: process.env.JWT_AUD || '',
    leeway: Number(process.env.JWT_LEEWAY ?? 90),
    ttlSeconds: Number(process.env.JWT_TTL_SECONDS ?? 900),
  }
}

export function getHSSecret(): Uint8Array {
  const s = process.env.JWT_SECRET || ''
  if (!s) throw new Error('JWT_SECRET missing')
  // Accept base64url or raw
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  try {
    const buf = Buffer.from(b64, 'base64')
    if (buf.length >= 32) return new Uint8Array(buf)
  } catch {}
  return new TextEncoder().encode(s)
}
