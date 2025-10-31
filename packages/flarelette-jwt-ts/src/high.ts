/**
 * High-level JWT utilities for creating, delegating, verifying, and authorizing JWT tokens
 *
 * @module util
 *
 */
import { sign } from './sign.js'
import { verify } from './verify.js'
import type { ClaimsDict, Fetcher } from './types.js'
import type { JWTPayload } from 'jose'

/**
 * Create a signed JWT token with optional claims
 *
 * @param claims - Claims to include in the token (can include custom claims beyond standard JWT fields)
 * @param opts - Optional overrides for iss, aud, ttlSeconds
 * @returns Signed JWT token string
 */
export async function createToken(
  claims: ClaimsDict,
  opts?: Partial<{ iss: string; aud: string | string[]; ttlSeconds: number }>
) {
  return sign(claims, opts)
}

/**
 * Create a delegated JWT token following RFC 8693 actor claim pattern
 *
 * Mints a new short-lived token for use within service boundaries where a service
 * acts on behalf of the original end user. This implements zero-trust delegation:
 * - Preserves original user identity (sub) and permissions
 * - Identifies the acting service via 'act' claim
 * - Prevents permission escalation by copying original permissions
 *
 * Pattern: "I'm <actorService> doing work on behalf of <original user>"
 *
 * @example
 * ```typescript
 * // Gateway receives Auth0 token for user@example.com with ["read:data"]
 * // Gateway creates delegated token for internal API service:
 * const auth0Payload = await verifyAuth0Token(externalToken)
 * const internalToken = await createDelegatedToken(
 *   auth0Payload,
 *   'gateway-service',
 *   { aud: 'internal-api' }
 * )
 * // Result: {
 * //   "sub": "user@example.com",
 * //   "permissions": ["read:data"],  // Preserved from original
 * //   "act": {"sub": "gateway-service"}
 * // }
 * ```
 *
 * @param originalPayload - The verified JWT payload from external auth (e.g., Auth0)
 * @param actorService - Identifier of the service creating this delegated token
 * @param opts - Optional overrides for iss, aud, ttlSeconds
 * @returns Signed JWT token string with delegation claim
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc8693.html|RFC 8693: OAuth 2.0 Token Exchange}
 * @see security.md - Service Delegation Pattern section
 */
export async function createDelegatedToken(
  originalPayload: ClaimsDict,
  actorService: string,
  opts?: Partial<{ iss: string; aud: string | string[]; ttlSeconds: number }>
): Promise<string> {
  // Preserve original user context and permissions
  const delegatedClaims: ClaimsDict = {
    sub: originalPayload.sub, // Original end user
    permissions: originalPayload.permissions || [], // NO escalation
    roles: originalPayload.roles || [],
  }

  // Add actor claim - who is acting on behalf of the original user
  const existingAct = originalPayload.act
  if (existingAct) {
    // Delegation chain: new actor wraps previous actor
    delegatedClaims.act = {
      sub: actorService,
      act: existingAct,
    }
  } else {
    // First delegation
    delegatedClaims.act = { sub: actorService }
  }

  // Preserve additional context fields if present
  const contextFields = [
    'email',
    'name',
    'groups',
    'tid',
    'org_id',
    'department',
  ] as const
  for (const field of contextFields) {
    if (field in originalPayload) {
      delegatedClaims[field] = originalPayload[field]
    }
  }

  return sign(delegatedClaims, opts)
}

/**
 * Authorization options for checkAuth
 *
 * Combines JWT verification options (iss, aud, leeway, jwksService) with
 * authorization policy requirements (permissions, roles, custom predicates).
 * Use policy() builder for cleaner syntax or construct this object directly
 * for dynamic policy composition.
 */
export type AuthzOpts = Partial<{
  iss: string
  aud: string | string[]
  leeway: number
  jwksService: Fetcher
}> & {
  require_all_permissions?: string[]
  require_any_permission?: string[]
  require_roles_all?: string[]
  require_roles_any?: string[]
  predicates?: Array<(payload: JWTPayload) => boolean>
}

/**
 * Authenticated user information returned by checkAuth
 *
 * Returned when a token passes both verification (signature valid, not expired)
 * and authorization (all policy requirements met). Contains extracted identity
 * and permission information for use in downstream authorization decisions.
 * Never returned on verification/authorization failure - checkAuth returns null instead.
 */
export type AuthUser = {
  sub: string | undefined
  permissions: string[]
  roles: string[]
  jti: string | undefined
  payload: JWTPayload
}

/**
 * Verify and authorize a JWT token with policy enforcement
 *
 * @param token - JWT token string to verify
 * @param opts - Authorization options including verification and policy requirements
 * @returns AuthUser if valid and authorized, null otherwise
 */
export async function checkAuth(
  token: string,
  opts: AuthzOpts
): Promise<AuthUser | null> {
  const payload = await verify(token, opts)
  if (!payload) return null
  const perms = (payload.permissions as string[]) || []
  const roles = (payload.roles as string[]) || []
  if ((opts.require_all_permissions || []).some(p => !perms.includes(p))) return null
  if (
    (opts.require_any_permission || []).length &&
    !(opts.require_any_permission || []).some(p => perms.includes(p))
  )
    return null
  if ((opts.require_roles_all || []).some(r => !roles.includes(r))) return null
  if (
    (opts.require_roles_any || []).length &&
    !(opts.require_roles_any || []).some(r => roles.includes(r))
  )
    return null
  for (const pred of opts.predicates || []) if (!pred(payload)) return null
  return {
    sub: payload.sub as string | undefined,
    permissions: perms,
    roles,
    jti: payload.jti as string | undefined,
    payload,
  }
}

/**
 * Fluent builder for creating authorization policies
 *
 * @returns Policy builder with chainable methods
 */
export function policy() {
  const opts: AuthzOpts = {}
  return {
    base(b: Partial<{ iss: string; aud: string | string[]; leeway: number }>) {
      Object.assign(opts, b)
      return this
    },
    needAll(...perms: string[]) {
      opts.require_all_permissions = [...(opts.require_all_permissions || []), ...perms]
      return this
    },
    needAny(...perms: string[]) {
      opts.require_any_permission = [...(opts.require_any_permission || []), ...perms]
      return this
    },
    rolesAll(...roles: string[]) {
      opts.require_roles_all = [...(opts.require_roles_all || []), ...roles]
      return this
    },
    rolesAny(...roles: string[]) {
      opts.require_roles_any = [...(opts.require_roles_any || []), ...roles]
      return this
    },
    where(fn: (payload: JWTPayload) => boolean) {
      opts.predicates = [...(opts.predicates || []), fn]
      return this
    },
    build() {
      return opts
    },
  }
}
