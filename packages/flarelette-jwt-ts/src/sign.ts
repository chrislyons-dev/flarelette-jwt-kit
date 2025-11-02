/**
 * JWT signing utilities.
 *
 * This module provides functions to sign JWT tokens using either HS512 or EdDSA algorithms.
 * It supports custom claims and configuration overrides.
 *
 * @module core
 *
 */

import { SignJWT, importJWK } from 'jose'
import { envMode, getCommon, getHSSecret, getPrivateJwkString } from './config.js'
import type { AlgType, JwtPayload } from './types.js'

/**
 * Sign a JWT token with HS512 or EdDSA algorithm
 *
 * @param payload - Claims to include in the token (can include custom claims beyond standard JWT fields)
 * @param opts - Optional overrides for iss, aud, ttlSeconds
 * @returns Signed JWT token string
 */
export async function sign(
  payload: JwtPayload,
  opts?: Partial<{ iss: string; aud: string | string[]; ttlSeconds: number }>
): Promise<string> {
  const mode: AlgType = envMode('producer')
  const { iss, aud, ttlSeconds } = { ...getCommon(), ...(opts || {}) }
  const now = Math.floor(Date.now() / 1000)
  const jwt = new SignJWT(payload)
    .setIssuer(iss)
    .setAudience(aud)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)

  if (mode === 'HS512') {
    const key = getHSSecret()
    return jwt.setProtectedHeader({ alg: 'HS512', typ: 'JWT' }).sign(key)
  } else {
    const kid = process.env.JWT_KID
    let jwkStr = getPrivateJwkString()
    if (!jwkStr && process.env.JWT_PRIVATE_JWK_PATH) {
      const fs = await import('fs/promises')
      jwkStr = await fs.readFile(process.env.JWT_PRIVATE_JWK_PATH, 'utf8')
    }
    if (!jwkStr)
      throw new Error(
        'JWT_PRIVATE_JWK(_NAME) or JWT_PRIVATE_JWK_PATH required for EdDSA signing'
      )
    const jwk = JSON.parse(jwkStr)
    const key = await importJWK(jwk, 'EdDSA')
    return jwt.setProtectedHeader({ alg: 'EdDSA', typ: 'JWT', kid }).sign(key)
  }
}
