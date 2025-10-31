/**
 * JSON Web Key Set (JWKS) utilities.
 *
 * This module provides functions to fetch and manage JWKS, including caching and key lookup by key ID (kid).
 * It supports integration with external JWKS services.
 *
 * @module util
 *
 */

import { importJWK } from 'jose'
import type { Fetcher, JWKSResponse } from './types.js'

/**
 * Extended JsonWebKey with kid property
 * (kid exists at runtime but isn't in TypeScript's JsonWebKey type)
 */
interface JWKWithKid extends JsonWebKey {
  kid?: string
}

/**
 * JWKS cache with cooldown period
 */
interface JWKSCache {
  keys: JWKWithKid[]
  fetchedAt: number
}

let cache: JWKSCache | null = null
const COOLDOWN = 300000 // 5 minutes in milliseconds

/**
 * Clear the JWKS cache (for testing purposes)
 * @internal
 */
export function clearJwksCache(): void {
  cache = null
}

/**
 * Fetch JWKS from a service binding
 * Implements 5-minute caching to reduce load on JWKS service
 */
export async function fetchJwksFromService(service: Fetcher): Promise<JWKWithKid[]> {
  const now = Date.now()

  // Return cached keys if within cooldown period
  if (cache && now - cache.fetchedAt < COOLDOWN) {
    return cache.keys
  }

  // Fetch fresh JWKS from service
  const response = await service.fetch('/.well-known/jwks.json')

  if (!response.ok) {
    throw new Error(`JWKS service returned ${response.status}: ${response.statusText}`)
  }

  const data = (await response.json()) as JWKSResponse

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
export async function getKeyFromJwks(
  kid: string | undefined,
  jwks: JWKWithKid[]
): Promise<CryptoKey | Uint8Array> {
  if (!kid) {
    throw new Error(
      'Token header missing kid (key ID) - required for JWKS verification'
    )
  }

  const jwk = jwks.find(k => k.kid === kid)

  if (!jwk) {
    const availableKids = jwks
      .map(k => k.kid)
      .filter(Boolean)
      .join(', ')
    throw new Error(
      `Key with kid="${kid}" not found in JWKS (available: ${availableKids})`
    )
  }

  // Cast to JWK type that jose expects
  return importJWK(jwk as Parameters<typeof importJWK>[0], 'EdDSA')
}

/**
 * Get allowed thumbprints for key pinning (optional security measure)
 */
export function allowedThumbprints(): Set<string> | null {
  // Check global env first, then process.env
  const bag = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
    .__FLARELETTE_ENV
  const raw =
    bag?.JWT_ALLOWED_THUMBPRINTS ??
    (typeof process !== 'undefined' ? process.env.JWT_ALLOWED_THUMBPRINTS : undefined)

  if (!raw) return null

  return new Set(
    raw
      .split(',')
      .map(x => x.trim())
      .filter(Boolean)
  )
}
