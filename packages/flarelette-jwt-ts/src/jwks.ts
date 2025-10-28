
import { importJWK } from 'jose'
import type { Fetcher, JWKSResponse } from './types'

/**
 * JWKS cache with cooldown period
 */
interface JWKSCache {
  keys: JsonWebKey[]
  fetchedAt: number
}

let cache: JWKSCache | null = null
const COOLDOWN = 300000 // 5 minutes in milliseconds

/**
 * Fetch JWKS from a service binding
 * Implements 5-minute caching to reduce load on JWKS service
 */
export async function fetchJwksFromService(service: Fetcher): Promise<JsonWebKey[]> {
  const now = Date.now()

  // Return cached keys if within cooldown period
  if (cache && (now - cache.fetchedAt) < COOLDOWN) {
    return cache.keys
  }

  // Fetch fresh JWKS from service
  const response = await service.fetch('/.well-known/jwks.json')

  if (!response.ok) {
    throw new Error(`JWKS service returned ${response.status}: ${response.statusText}`)
  }

  const data = await response.json() as JWKSResponse

  if (!data.keys || !Array.isArray(data.keys)) {
    throw new Error('Invalid JWKS response: missing keys array')
  }

  // Update cache
  cache = { keys: data.keys, fetchedAt: now }

  return data.keys
}

/**
 * Find and import a specific key from JWKS by kid
 */
export async function getKeyFromJwks(kid: string | undefined, jwks: JsonWebKey[]): Promise<any> {
  if (!kid) {
    throw new Error('Token header missing kid (key ID) - required for JWKS verification')
  }

  const jwk = jwks.find(k => k.kid === kid)

  if (!jwk) {
    throw new Error(`Key with kid="${kid}" not found in JWKS (available: ${jwks.map(k => k.kid).join(', ')})`)
  }

  return importJWK(jwk, 'EdDSA')
}

/**
 * Get set of allowed thumbprints for key pinning
 */
export function allowedThumbprints(): Set<string> | null {
  // Check global env first, then process.env
  const bag = (globalThis as any).__FLARELETTE_ENV as Record<string, string> | undefined
  const s = bag?.JWT_ALLOWED_THUMBPRINTS ?? (typeof process !== 'undefined' ? process.env.JWT_ALLOWED_THUMBPRINTS : undefined)

  if (!s) return null

  return new Set(s.split(',').map(x => x.trim()).filter(Boolean))
}
