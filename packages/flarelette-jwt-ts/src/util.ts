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
