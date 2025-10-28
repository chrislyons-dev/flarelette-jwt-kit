

export type Mode = 'HS512' | 'EdDSA'

function envRead(name: string): string | undefined {
  // Prefer an injected edge env bag over process.env (which doesn't exist on Workers)
  const bag: Record<string, string> | undefined = (globalThis as any).__FLARELETTE_ENV;
  return (bag && bag[name]) ?? (typeof process !== 'undefined' ? (process.env as any)?.[name] : undefined);
}

export function envMode(role: 'producer'|'consumer'): Mode {
  const env = new Proxy({}, { get: (_,k:any)=>envRead(String(k)) })
  if (env.JWT_PRIVATE_JWK || env.JWT_PRIVATE_JWK_PATH || env.JWT_PRIVATE_JWK_NAME) return 'EdDSA'
  if (env.JWT_PUBLIC_JWK || env.JWT_PUBLIC_JWK_NAME || env.JWT_JWKS_URL || env.JWT_JWKS_URL_NAME) return 'EdDSA'
  return 'HS512'
}

export function getCommon() {
  return {
    iss: envRead('JWT_ISS') || '',
    aud: envRead('JWT_AUD') || '',
    leeway: Number(envRead('JWT_LEEWAY') ?? 90),
    ttlSeconds: Number(envRead('JWT_TTL_SECONDS') ?? 900),
  }
}

export function getHSSecret(): Uint8Array {
  const name = envRead('JWT_SECRET_NAME') as string | undefined
  const raw = name ? envRead(name) : envRead('JWT_SECRET')
  const s = raw || ''
  if (!s) throw new Error('JWT secret missing: set JWT_SECRET_NAME -> bound secret, or JWT_SECRET')
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  try {
    const buf = Buffer.from(b64, 'base64')
    if (buf.length >= 32) return new Uint8Array(buf)
    throw new Error(`JWT secret too short: ${buf.length} bytes, need >= 32`)
  } catch (e) {
    if (e instanceof Error && e.message.includes('too short')) throw e
    // Fallback to UTF-8 encoding for backwards compatibility
    console.warn('JWT_SECRET is not valid base64url. Treating as raw UTF-8 string (not recommended for production)')
    const bytes = new TextEncoder().encode(s)
    if (bytes.length < 32) {
      throw new Error(`JWT secret too short: ${bytes.length} bytes, need >= 32`)
    }
    return bytes
  }
}

export function getPrivateJwkString(): string | null {
  const name = envRead('JWT_PRIVATE_JWK_NAME') as string | undefined
  if (name && envRead(name)) return envRead(name)!
  return envRead('JWT_PRIVATE_JWK') || null
}

export function getPublicJwkString(): string | null {
  const name = envRead('JWT_PUBLIC_JWK_NAME') as string | undefined
  if (name && envRead(name)) return envRead(name)!
  return envRead('JWT_PUBLIC_JWK') || null
}

export function getJwksUrl(): string | null {
  const name = envRead('JWT_JWKS_URL_NAME') as string | undefined
  if (name && envRead(name)) return envRead(name)!
  return envRead('JWT_JWKS_URL') || null
}
