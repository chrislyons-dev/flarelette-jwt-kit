/**
 * Utility functions for JWT operations.
 *
 * This module provides helper functions for parsing JWTs, checking expiration, and mapping OAuth scopes.
 * It is designed to support core JWT functionalities.
 *
 * @module util
 *
 */

import type { ParsedJwt, JwtPayload } from './types.js'

/**
 * Parse a JWT token into header and payload without verification
 *
 * @param token - JWT token string
 * @returns Parsed header and payload
 */
export function parse(token: string): ParsedJwt {
  const [hb, pb] = token.split('.')
  const dec = (s: string) =>
    JSON.parse(
      Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    )
  return { header: dec(hb), payload: dec(pb) }
}

/**
 * Check if JWT payload will expire within specified seconds
 *
 * @param payload - JWT payload with 'exp' claim
 * @param seconds - Number of seconds threshold
 * @returns True if token expires within the threshold
 */
export function isExpiringSoon(payload: JwtPayload, seconds: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  const exp = typeof payload.exp === 'number' ? payload.exp : 0
  return exp - now <= seconds
}

/**
 * Map OAuth scopes to permission strings
 *
 * @param scopes - List of OAuth scope strings
 * @returns List of permission strings (currently identity mapping)
 */
export function mapScopesToPermissions(scopes: string[]): string[] {
  return scopes
}

/**
 * Compute a deterministic SHA-256 hash that binds a JWT to a specific HTTP request.
 *
 * Canonical form: UTF-8(METHOD + "\n" + pathname + search + "\n") || body_bytes
 * - Method is uppercased
 * - Binds to path and query string only (not host/scheme — internal Workers use different hostnames)
 * - Body is consumed from a clone to preserve the original stream
 *
 * @param request - Fetch API Request object
 * @returns base64url-encoded SHA-256 hash of the canonical request representation
 */
export async function computeRequestHash(request: Request): Promise<string> {
  const url = new URL(request.url)
  const prefix = new TextEncoder().encode(
    `${request.method.toUpperCase()}\n${url.pathname}${url.search}\n`
  )

  let bodyBytes = new Uint8Array(0)
  if (request.body) {
    const cloned = request.clone()
    bodyBytes = new Uint8Array(await cloned.arrayBuffer())
  }

  const combined = new Uint8Array(prefix.length + bodyBytes.length)
  combined.set(prefix, 0)
  combined.set(bodyBytes, prefix.length)

  const digest = await crypto.subtle.digest('SHA-256', combined)
  // base64url encode without external deps
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
