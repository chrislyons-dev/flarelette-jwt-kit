/**
 * Configuration utilities for JWT operations.
 *
 * This module provides functions to read environment variables and derive JWT-related configurations.
 * It includes support for both symmetric (HS512) and asymmetric (EdDSA) algorithms.
 *
 * @module core
 *
 */

import type { AlgType } from './types.js'

function envRead(name: string): string | undefined {
  // Prefer an injected edge env bag over process.env (which doesn't exist on Workers)
  const bag: Record<string, string> | undefined = (
    globalThis as { __FLARELETTE_ENV?: Record<string, string> }
  ).__FLARELETTE_ENV
  return (
    bag?.[name] ?? (typeof process !== 'undefined' ? process.env?.[name] : undefined)
  )
}

export function envMode(role: 'producer' | 'consumer'): AlgType {
  const env = new Proxy({} as Record<string, string | undefined>, {
    get: (_, k: string | symbol) => envRead(String(k)),
  })

  // Producers use private keys to sign
  if (role === 'producer') {
    if (env.JWT_PRIVATE_JWK || env.JWT_PRIVATE_JWK_PATH || env.JWT_PRIVATE_JWK_NAME) {
      return 'EdDSA'
    }
  }

  // Consumers use public keys or JWKS to verify
  if (role === 'consumer') {
    // SECURITY: Detect conflicting configuration to prevent mode confusion attacks
    const hasHS512 = !!(env.JWT_SECRET || env.JWT_SECRET_NAME)
    const hasAsymmetric = !!(
      env.JWT_PUBLIC_JWK ||
      env.JWT_PUBLIC_JWK_NAME ||
      env.JWT_JWKS_SERVICE ||
      env.JWT_JWKS_SERVICE_NAME ||
      env.JWT_JWKS_URL
    )

    if (hasHS512 && hasAsymmetric) {
      throw new Error(
        'Configuration error: Both HS512 (JWT_SECRET) and asymmetric (JWT_PUBLIC_JWK/JWT_JWKS_*) secrets configured. Choose one to prevent algorithm confusion attacks.'
      )
    }

    if (hasAsymmetric) {
      return 'EdDSA'
    }
  }

  return 'HS512'
}

/**
 * Get common JWT configuration from environment
 * Returns partial JwtProfile-compatible configuration
 */
export function getCommon() {
  return {
    iss: envRead('JWT_ISS') || '',
    aud: envRead('JWT_AUD') || '',
    leeway: Number(envRead('JWT_LEEWAY') ?? 90),
    ttlSeconds: Number(envRead('JWT_TTL_SECONDS') ?? 900),
  }
}

/**
 * Get JWT profile from environment
 * Returns complete JwtProfile with detected algorithm
 */
export function getProfile(
  role: 'producer' | 'consumer'
): Partial<import('./types.js').JwtProfile> & { ttlSeconds: number } {
  const alg = envMode(role)
  const { iss, aud, leeway, ttlSeconds } = getCommon()

  return {
    alg,
    iss,
    aud,
    leeway_seconds: leeway,
    ttlSeconds, // Additional property for convenience
  }
}

export function getHSSecret(): Uint8Array {
  const name = envRead('JWT_SECRET_NAME') as string | undefined
  const raw = name ? envRead(name) : envRead('JWT_SECRET')
  const s = raw || ''
  if (!s)
    throw new Error(
      'JWT secret missing: set JWT_SECRET_NAME -> bound secret, or JWT_SECRET'
    )
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  try {
    const buf = Buffer.from(b64, 'base64')
    // SECURITY: HS512 uses SHA-512 (512 bits = 64 bytes). Enforce minimum 64-byte secret.
    // This prevents brute-force attacks and ensures secret entropy matches algorithm strength.
    if (buf.length >= 64) return new Uint8Array(buf)
    throw new Error(
      `JWT secret too short: ${buf.length} bytes, need >= 64 for HS512 (use 'npx flarelette-jwt-secret --len=64')`
    )
  } catch (e) {
    if (e instanceof Error && e.message.includes('too short')) throw e
    // Fallback to UTF-8 encoding for backwards compatibility
    console.warn(
      'JWT_SECRET is not valid base64url. Treating as raw UTF-8 string (not recommended for production)'
    )
    const bytes = new TextEncoder().encode(s)
    if (bytes.length < 64) {
      throw new Error(
        `JWT secret too short: ${bytes.length} bytes, need >= 64 for HS512 (use 'npx flarelette-jwt-secret --len=64')`
      )
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

export function getJwksServiceName(): string | null {
  const name = envRead('JWT_JWKS_SERVICE_NAME') as string | undefined
  if (name && envRead(name)) return envRead(name)!
  return envRead('JWT_JWKS_SERVICE') || null
}

export function getJwksUrl(): string | null {
  return envRead('JWT_JWKS_URL') || null
}

export function getJwksCacheTtl(): number {
  const ttl = envRead('JWT_JWKS_CACHE_TTL_SECONDS')
  if (!ttl) return 300 // Default: 5 minutes

  const parsed = Number(ttl)
  if (isNaN(parsed) || parsed < 0) {
    throw new Error('JWT_JWKS_CACHE_TTL_SECONDS must be a positive number')
  }

  return parsed
}
