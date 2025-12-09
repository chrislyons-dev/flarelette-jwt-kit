/**
 * JWT verification utilities.
 *
 * This module provides functions to verify JWT tokens using either HS512 or EdDSA algorithms.
 * It supports integration with JWKS services and thumbprint pinning.
 *
 * @module verify
 *
 */

import {
  jwtVerify,
  importJWK,
  calculateJwkThumbprint,
  decodeProtectedHeader,
} from 'jose'
import {
  envMode,
  getCommon,
  getHSSecret,
  getPublicJwkString,
  getJwksUrl,
  getJwksCacheTtl,
} from './config.js'
import {
  fetchJwksFromService,
  fetchJwksFromUrl,
  getKeyFromJwks,
  allowedThumbprints,
} from './jwks.js'
import type { AlgType, Fetcher, JwtPayload } from './types.js'

/**
 * Resolve verification key from configured sources
 *
 * Implements key resolution strategy pattern:
 * - Strategy 1: HS512 shared secret
 * - Strategy 2: Inline public JWK
 * - Strategy 3: Service binding JWKS
 * - Strategy 4: HTTP JWKS URL
 *
 * @param token - JWT token string
 * @param opts - Verification options
 * @returns Key and allowed algorithms
 * @throws Error if no key source configured
 */
async function resolveVerificationKey(
  token: string,
  opts?: Partial<{
    jwksService: Fetcher
    jwksUrl: string
    jwksCacheTtl: number
  }>
): Promise<{ key: CryptoKey | Uint8Array; algorithms: string[] }> {
  const mode: AlgType = envMode('consumer')

  // Strategy 1: HS512 shared secret
  if (mode === 'HS512') {
    return {
      key: getHSSecret(),
      algorithms: ['HS512'],
    }
  }

  // EdDSA/RSA mode - multiple key sources
  const inline = getPublicJwkString()

  // Strategy 2: Inline public JWK
  if (inline) {
    const jwk = JSON.parse(inline)
    // SECURITY: Detect algorithm from JWK structure. If JWK has explicit alg field, jose will use it.
    // For EdDSA keys (kty=OKP, crv=Ed25519), explicitly specify 'EdDSA' for compatibility.
    // Algorithm whitelist in jwtVerify() provides defense-in-depth protection.
    const isEdDSA = jwk.kty === 'OKP' && jwk.crv === 'Ed25519'
    const key = isEdDSA ? await importJWK(jwk, 'EdDSA') : await importJWK(jwk)

    // Optional thumbprint pinning
    const pins = allowedThumbprints()
    if (pins) {
      const th = await calculateJwkThumbprint(jwk)
      if (!pins.has(th)) {
        throw new Error('Public key thumbprint not in allowed list')
      }
    }

    return {
      key,
      algorithms: ['EdDSA', 'RS256', 'RS384', 'RS512'],
    }
  }

  // Strategy 3: Service binding JWKS
  if (opts?.jwksService) {
    const header = decodeProtectedHeader(token)
    const jwks = await fetchJwksFromService(opts.jwksService)
    const key = await getKeyFromJwks(header.kid, jwks)

    return {
      key,
      algorithms: ['EdDSA', 'RS256', 'RS384', 'RS512'],
    }
  }

  // Strategy 4: HTTP JWKS URL (NEW)
  const jwksUrl = opts?.jwksUrl ?? getJwksUrl()
  if (jwksUrl) {
    const header = decodeProtectedHeader(token)
    const cacheTtl = opts?.jwksCacheTtl ?? getJwksCacheTtl()
    const jwks = await fetchJwksFromUrl(jwksUrl, cacheTtl)
    const key = await getKeyFromJwks(header.kid, jwks)

    return {
      key,
      algorithms: ['EdDSA', 'RS256', 'RS384', 'RS512'],
    }
  }

  throw new Error(
    'Verification requires JWT_SECRET, JWT_PUBLIC_JWK, JWT_JWKS_SERVICE, or JWT_JWKS_URL'
  )
}

/**
 * Verify a JWT token with HS512, EdDSA, or RSA algorithms
 *
 * Supports multiple key resolution strategies with automatic algorithm detection
 *
 * @param token - JWT token string to verify
 * @param opts - Optional overrides for iss, aud, leeway, jwksService, jwksUrl, jwksCacheTtl
 * @returns Decoded payload if valid, null otherwise
 */
export async function verify(
  token: string,
  opts?: Partial<{
    iss: string
    aud: string | string[]
    leeway: number
    jwksService: Fetcher
    jwksUrl: string
    jwksCacheTtl: number
  }>
): Promise<JwtPayload | null> {
  const { iss, aud, leeway } = { ...getCommon(), ...(opts || {}) }

  try {
    // All strategies use the same verification logic
    const { key, algorithms } = await resolveVerificationKey(token, opts)

    const { payload } = await jwtVerify(token, key, {
      algorithms,
      issuer: iss,
      audience: aud,
      clockTolerance: leeway,
    })

    return payload
  } catch {
    return null // Fail-silent pattern
  }
}
