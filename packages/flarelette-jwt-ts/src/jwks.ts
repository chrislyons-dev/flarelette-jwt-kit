/**
 * JSON Web Key Set (JWKS) utilities.
 *
 * This module provides functions to fetch and manage JWKS, including caching and key lookup by key ID (kid).
 * It supports integration with external JWKS services.
 *
 * @module jwks
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
 * JWKS cache with cooldown period (service binding)
 */
interface JWKSCache {
  keys: JWKWithKid[]
  fetchedAt: number
}

/**
 * HTTP JWKS cache entry with configurable TTL
 */
interface HttpJWKSCacheEntry {
  keys: JWKWithKid[]
  fetchedAt: number
  ttl: number // TTL in milliseconds
}

let cache: JWKSCache | null = null
const COOLDOWN = 300000 // 5 minutes in milliseconds

// HTTP JWKS cache (separate from service binding cache)
const httpJwksCache = new Map<string, HttpJWKSCacheEntry>()

/**
 * Clear the JWKS cache (for testing purposes)
 * @internal
 */
export function clearJwksCache(): void {
  cache = null
}

/**
 * Clear the HTTP JWKS cache (for testing purposes)
 * @internal
 */
export function clearHttpJwksCache(): void {
  httpJwksCache.clear()
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
 * Validate JWKS URL for security requirements
 *
 * Requirements:
 * - Must be valid URL format
 * - Must use HTTPS (except localhost/127.0.0.1/[::1] for testing)
 *
 * @param url - JWKS URL to validate
 * @returns Parsed URL object
 * @throws Error if validation fails (fail-fast for config errors)
 */
function validateJwksUrl(url: string): URL {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    throw new Error('JWT_JWKS_URL must be a valid URL')
  }

  // HTTPS required (except localhost for testing)
  if (parsed.protocol !== 'https:') {
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]' // IPv6 localhost

    if (!isLocalhost || parsed.protocol !== 'http:') {
      throw new Error('JWT_JWKS_URL must use HTTPS (except localhost for testing)')
    }
  }

  return parsed
}

/**
 * Fetch JWKS from HTTP URL with caching
 *
 * Implements configurable TTL caching (default 5 minutes)
 * Security: HTTPS-only (except localhost), 5-second timeout, 100KB size limit
 *
 * @param url - HTTP(S) URL to JWKS endpoint
 * @param ttlSeconds - Cache TTL in seconds (default: 300)
 * @returns Array of JWK objects
 * @throws Error on configuration errors (validation), fail-silent pattern for runtime errors handled by caller
 */
export async function fetchJwksFromUrl(
  url: string,
  ttlSeconds: number = 300
): Promise<JWKWithKid[]> {
  // Validate URL (fail-fast on config errors)
  validateJwksUrl(url)

  // Check cache
  const cached = httpJwksCache.get(url)
  const now = Date.now()

  if (cached) {
    const age = now - cached.fetchedAt
    if (age < cached.ttl) {
      return cached.keys
    }
    // Cache expired, remove it
    httpJwksCache.delete(url)
  }

  // Fetch fresh JWKS
  const MAX_JWKS_SIZE_BYTES = 100 * 1024 // 100KB

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'flarelette-jwt-ts',
    },
    signal: AbortSignal.timeout(5000), // 5 second timeout
  })

  if (!response.ok) {
    throw new Error(
      `JWKS HTTP fetch returned ${response.status}: ${response.statusText}`
    )
  }

  // Read as text first to check size
  const text = await response.text()

  if (text.length > MAX_JWKS_SIZE_BYTES) {
    throw new Error('JWKS response exceeds size limit (100KB)')
  }

  // Parse JSON
  const data = JSON.parse(text) as JWKSResponse

  if (!data.keys || !Array.isArray(data.keys)) {
    throw new Error('Invalid JWKS response: missing keys array')
  }

  // Cache the result
  const ttlMs = ttlSeconds * 1000
  httpJwksCache.set(url, {
    keys: data.keys,
    fetchedAt: now,
    ttl: ttlMs,
  })

  return data.keys
}

/**
 * Find and import a specific key from JWKS by kid
 *
 * Supports both EdDSA (Ed25519) and RSA (RS256/RS384/RS512) keys
 * Algorithm is auto-detected from key type (kty) and curve (crv)
 *
 * @param kid - Key ID from JWT header
 * @param jwks - Array of JWK objects
 * @returns CryptoKey or Uint8Array suitable for jose verification
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

  // SECURITY: Strict equality (===) prevents injection attacks. The kid is treated
  // as a pure lookup key, never interpolated into SQL, file paths, or URLs.
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

  // Let jose infer algorithm from JWK structure
  // EdDSA: kty=OKP, crv=Ed25519
  // RSA: kty=RSA (algorithm in alg field or inferred)
  return importJWK(jwk as Parameters<typeof importJWK>[0])
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
