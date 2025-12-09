/**
 * Explicit configuration API for JWT operations.
 *
 * This module provides functions that accept explicit configuration objects
 * instead of relying on environment variables or global state. Use this API
 * when you need full control over configuration, especially in development
 * environments or when working with multiple JWT configurations.
 *
 * @module explicit
 */

import {
  SignJWT,
  jwtVerify,
  importJWK,
  decodeProtectedHeader,
  type JWTVerifyResult,
  type JWK,
} from 'jose'
import { fetchJwksFromUrl, getKeyFromJwks } from './jwks.js'
import type { JwtPayload } from './types.js'

/**
 * Base JWT configuration shared by HS512 and EdDSA modes
 */
export interface BaseJwtConfig {
  /** Token issuer (iss claim) */
  iss: string
  /** Token audience (aud claim) - can be string or array */
  aud: string | string[]
  /** Token lifetime in seconds (default: 900 = 15 minutes) */
  ttlSeconds?: number
  /** Clock skew tolerance in seconds for verification (default: 90) */
  leeway?: number
}

/**
 * HS512 (HMAC-SHA512) symmetric configuration
 * Uses a shared secret for both signing and verification
 */
export interface HS512Config extends BaseJwtConfig {
  alg: 'HS512'
  /** Shared secret key as Uint8Array (minimum 32 bytes) */
  secret: Uint8Array
}

/**
 * EdDSA (Ed25519) asymmetric configuration for signing
 * Uses a private key to sign tokens
 */
export interface EdDSASignConfig extends BaseJwtConfig {
  alg: 'EdDSA'
  /** Private JWK for signing */
  privateJwk: JWK
  /** Key ID to include in JWT header */
  kid?: string
}

/**
 * EdDSA (Ed25519) asymmetric configuration for verification
 * Uses a public key to verify tokens
 */
export interface EdDSAVerifyConfig extends BaseJwtConfig {
  alg: 'EdDSA'
  /** Public JWK for verification */
  publicJwk: JWK
}

/**
 * EdDSA/RSA asymmetric configuration for verification via HTTP JWKS
 * Uses a remote JWKS endpoint to fetch public keys (supports key rotation)
 */
export interface JWKSUrlVerifyConfig extends BaseJwtConfig {
  alg: 'EdDSA' | 'RS256' | 'RS384' | 'RS512'
  /** HTTP(S) URL to JWKS endpoint */
  jwksUrl: string
  /** Cache TTL in seconds (default: 300) */
  cacheTtl?: number
}

/**
 * Union type for signing configuration
 */
export type SignConfig = HS512Config | EdDSASignConfig

/**
 * Union type for verification configuration
 */
export type VerifyConfig = HS512Config | EdDSAVerifyConfig | JWKSUrlVerifyConfig

/**
 * Sign a JWT token with explicit configuration
 *
 * @example
 * ```typescript
 * // HS512 mode
 * const config: HS512Config = {
 *   alg: 'HS512',
 *   secret: new Uint8Array(32), // Your secret
 *   iss: 'https://gateway.example.com',
 *   aud: 'api.example.com',
 *   ttlSeconds: 900
 * }
 * const token = await signWithConfig({ sub: 'user123' }, config)
 *
 * // EdDSA mode
 * const config: EdDSASignConfig = {
 *   alg: 'EdDSA',
 *   privateJwk: { kty: 'OKP', crv: 'Ed25519', d: '...', x: '...' },
 *   kid: 'ed25519-2025-01',
 *   iss: 'https://gateway.example.com',
 *   aud: 'api.example.com'
 * }
 * const token = await signWithConfig({ sub: 'user123' }, config)
 * ```
 *
 * @param payload - Claims to include in the token
 * @param config - Explicit JWT configuration
 * @param overrides - Optional per-call overrides for iss, aud, ttlSeconds
 * @returns Signed JWT token string
 */
export async function signWithConfig(
  payload: JwtPayload,
  config: SignConfig,
  overrides?: Partial<{ iss: string; aud: string | string[]; ttlSeconds: number }>
): Promise<string> {
  const iss = overrides?.iss ?? config.iss
  const aud = overrides?.aud ?? config.aud
  const ttlSeconds = overrides?.ttlSeconds ?? config.ttlSeconds ?? 900

  const now = Math.floor(Date.now() / 1000)
  const jwt = new SignJWT(payload)
    .setIssuer(iss)
    .setAudience(aud)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)

  if (config.alg === 'HS512') {
    // SECURITY: HS512 requires 64-byte minimum (SHA-512 digest size)
    if (config.secret.length < 64) {
      throw new Error(
        `JWT secret too short: ${config.secret.length} bytes, need >= 64 for HS512`
      )
    }
    return jwt.setProtectedHeader({ alg: 'HS512', typ: 'JWT' }).sign(config.secret)
  } else {
    const key = await importJWK(config.privateJwk, 'EdDSA')
    return jwt
      .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT', kid: config.kid })
      .sign(key)
  }
}

/**
 * Verify a JWT token with explicit configuration
 *
 * @example
 * ```typescript
 * // HS512 mode
 * const config: HS512Config = {
 *   alg: 'HS512',
 *   secret: new Uint8Array(32), // Same secret used for signing
 *   iss: 'https://gateway.example.com',
 *   aud: 'api.example.com'
 * }
 * const payload = await verifyWithConfig(token, config)
 *
 * // EdDSA mode
 * const config: EdDSAVerifyConfig = {
 *   alg: 'EdDSA',
 *   publicJwk: { kty: 'OKP', crv: 'Ed25519', x: '...' },
 *   iss: 'https://gateway.example.com',
 *   aud: 'api.example.com'
 * }
 * const payload = await verifyWithConfig(token, config)
 * ```
 *
 * @param token - JWT token string to verify
 * @param config - Explicit JWT configuration
 * @param overrides - Optional per-call overrides for iss, aud, leeway
 * @returns Payload if valid, null if invalid
 */
export async function verifyWithConfig(
  token: string,
  config: VerifyConfig,
  overrides?: Partial<{ iss: string; aud: string | string[]; leeway: number }>
): Promise<JwtPayload | null> {
  try {
    const iss = overrides?.iss ?? config.iss
    const aud = overrides?.aud ?? config.aud
    const leeway = overrides?.leeway ?? config.leeway ?? 90

    let result: JWTVerifyResult

    if (config.alg === 'HS512') {
      // SECURITY: HS512 requires 64-byte minimum (SHA-512 digest size)
      if (config.secret.length < 64) {
        throw new Error(
          `JWT secret too short: ${config.secret.length} bytes, need >= 64 for HS512`
        )
      }
      result = await jwtVerify(token, config.secret, {
        issuer: iss,
        audience: aud,
        clockTolerance: leeway,
      })
    } else if ('publicJwk' in config) {
      // Inline JWK verification
      const key = await importJWK(config.publicJwk, 'EdDSA')
      result = await jwtVerify(token, key, {
        issuer: iss,
        audience: aud,
        clockTolerance: leeway,
      })
    } else if ('jwksUrl' in config) {
      // HTTP JWKS verification (NEW)
      const header = decodeProtectedHeader(token)
      const jwks = await fetchJwksFromUrl(config.jwksUrl, config.cacheTtl)
      const key = await getKeyFromJwks(header.kid, jwks)

      result = await jwtVerify(token, key, {
        algorithms: ['EdDSA', 'RS256', 'RS384', 'RS512'],
        issuer: iss,
        audience: aud,
        clockTolerance: leeway,
      })
    } else {
      throw new Error('Invalid verification config')
    }

    return result.payload as JwtPayload
  } catch (e) {
    console.error('JWT verification failed:', e)
    return null
  }
}

/**
 * Create a signed JWT token with explicit configuration
 *
 * Higher-level wrapper around signWithConfig for convenience.
 *
 * @param claims - Claims to include in the token
 * @param config - Explicit JWT configuration
 * @param overrides - Optional per-call overrides
 * @returns Signed JWT token string
 */
export async function createTokenWithConfig(
  claims: JwtPayload,
  config: SignConfig,
  overrides?: Partial<{ iss: string; aud: string | string[]; ttlSeconds: number }>
): Promise<string> {
  return signWithConfig(claims, config, overrides)
}

/**
 * Create a delegated JWT token with explicit configuration
 *
 * Implements RFC 8693 actor claim pattern for service-to-service delegation.
 *
 * @example
 * ```typescript
 * const config: HS512Config = {
 *   alg: 'HS512',
 *   secret: mySecret,
 *   iss: 'https://gateway.example.com',
 *   aud: 'internal-api'
 * }
 *
 * // Gateway receives Auth0 token and creates delegated token
 * const auth0Payload = await verifyAuth0Token(externalToken)
 * const internalToken = await createDelegatedTokenWithConfig(
 *   auth0Payload,
 *   'gateway-service',
 *   config
 * )
 * ```
 *
 * @param originalPayload - The verified JWT payload from external auth
 * @param actorService - Identifier of the service creating this delegated token
 * @param config - Explicit JWT configuration
 * @param overrides - Optional per-call overrides
 * @returns Signed JWT token string with delegation claim
 */
export async function createDelegatedTokenWithConfig(
  originalPayload: JwtPayload,
  actorService: string,
  config: SignConfig,
  overrides?: Partial<{ iss: string; aud: string | string[]; ttlSeconds: number }>
): Promise<string> {
  // Preserve original user context and permissions
  const delegatedClaims: JwtPayload = {
    sub: originalPayload.sub,
    permissions: originalPayload.permissions || [],
    roles: originalPayload.roles || [],
  }

  // Add actor claim
  const existingAct = originalPayload.act
  if (existingAct) {
    delegatedClaims.act = {
      sub: actorService,
      act: existingAct,
    }
  } else {
    delegatedClaims.act = { sub: actorService }
  }

  // Preserve additional context fields
  if (originalPayload.email) delegatedClaims.email = originalPayload.email
  if (originalPayload.name) delegatedClaims.name = originalPayload.name
  if (originalPayload.groups) delegatedClaims.groups = originalPayload.groups
  if (originalPayload.tid) delegatedClaims.tid = originalPayload.tid
  if (originalPayload.org_id) delegatedClaims.org_id = originalPayload.org_id
  if (originalPayload.department)
    delegatedClaims.department = originalPayload.department

  return signWithConfig(delegatedClaims, config, overrides)
}

/**
 * Authorization options for checkAuthWithConfig
 */
export type AuthzOptsWithConfig = {
  require_all_permissions?: string[]
  require_any_permission?: string[]
  require_roles_all?: string[]
  require_roles_any?: string[]
  predicates?: Array<(payload: JwtPayload) => boolean>
}

/**
 * Authenticated user information
 */
export type AuthUser = {
  sub: string | undefined
  permissions: string[]
  roles: string[]
  jti: string | undefined
  payload: JwtPayload
}

/**
 * Verify and authorize a JWT token with explicit configuration
 *
 * @example
 * ```typescript
 * const config: HS512Config = {
 *   alg: 'HS512',
 *   secret: mySecret,
 *   iss: 'https://gateway.example.com',
 *   aud: 'api.example.com'
 * }
 *
 * const user = await checkAuthWithConfig(token, config, {
 *   require_all_permissions: ['read:data'],
 *   require_any_permission: ['admin', 'editor']
 * })
 *
 * if (user) {
 *   console.log('Authorized user:', user.sub)
 * }
 * ```
 *
 * @param token - JWT token string to verify
 * @param config - Explicit JWT configuration
 * @param authzOpts - Authorization policy requirements
 * @param verifyOverrides - Optional per-call verification overrides
 * @returns AuthUser if valid and authorized, null otherwise
 */
export async function checkAuthWithConfig(
  token: string,
  config: VerifyConfig,
  authzOpts?: AuthzOptsWithConfig,
  verifyOverrides?: Partial<{ iss: string; aud: string | string[]; leeway: number }>
): Promise<AuthUser | null> {
  const payload = await verifyWithConfig(token, config, verifyOverrides)
  if (!payload) return null

  const opts = authzOpts || {}
  const perms = (payload.permissions as string[]) || []
  const roles = (payload.roles as string[]) || []

  // Check all required permissions
  if ((opts.require_all_permissions || []).some(p => !perms.includes(p))) return null

  // Check any required permission
  if (
    (opts.require_any_permission || []).length &&
    !(opts.require_any_permission || []).some(p => perms.includes(p))
  )
    return null

  // Check all required roles
  if ((opts.require_roles_all || []).some(r => !roles.includes(r))) return null

  // Check any required role
  if (
    (opts.require_roles_any || []).length &&
    !(opts.require_roles_any || []).some(r => roles.includes(r))
  )
    return null

  // Check custom predicates
  for (const pred of opts.predicates || []) {
    if (!pred(payload)) return null
  }

  return {
    sub: payload.sub as string | undefined,
    permissions: perms,
    roles,
    jti: payload.jti as string | undefined,
    payload,
  }
}

/**
 * Helper function to create HS512 config from base64url-encoded secret
 *
 * @param secret - Base64url-encoded secret string
 * @param baseConfig - Base JWT configuration
 * @returns HS512 configuration
 */
export function createHS512Config(
  secret: string,
  baseConfig: Omit<BaseJwtConfig, 'ttlSeconds' | 'leeway'> &
    Partial<Pick<BaseJwtConfig, 'ttlSeconds' | 'leeway'>>
): HS512Config {
  // Decode base64url
  const b64 = secret.replace(/-/g, '+').replace(/_/g, '/')
  const buf = Buffer.from(b64, 'base64')

  // SECURITY: HS512 requires 64-byte minimum (SHA-512 digest size)
  if (buf.length < 64) {
    throw new Error(`JWT secret too short: ${buf.length} bytes, need >= 64 for HS512`)
  }

  return {
    alg: 'HS512',
    secret: new Uint8Array(buf),
    ...baseConfig,
  }
}

/**
 * Helper function to create EdDSA sign config from JWK
 *
 * @param privateJwk - Private JWK object or JSON string
 * @param baseConfig - Base JWT configuration
 * @param kid - Optional key ID
 * @returns EdDSA sign configuration
 */
export function createEdDSASignConfig(
  privateJwk: JWK | string,
  baseConfig: Omit<BaseJwtConfig, 'ttlSeconds' | 'leeway'> &
    Partial<Pick<BaseJwtConfig, 'ttlSeconds' | 'leeway'>>,
  kid?: string
): EdDSASignConfig {
  const jwk = typeof privateJwk === 'string' ? JSON.parse(privateJwk) : privateJwk
  return {
    alg: 'EdDSA',
    privateJwk: jwk,
    kid,
    ...baseConfig,
  }
}

/**
 * Helper function to create EdDSA verify config from JWK
 *
 * @param publicJwk - Public JWK object or JSON string
 * @param baseConfig - Base JWT configuration
 * @returns EdDSA verify configuration
 */
export function createEdDSAVerifyConfig(
  publicJwk: JWK | string,
  baseConfig: Omit<BaseJwtConfig, 'ttlSeconds' | 'leeway'> &
    Partial<Pick<BaseJwtConfig, 'ttlSeconds' | 'leeway'>>
): EdDSAVerifyConfig {
  const jwk = typeof publicJwk === 'string' ? JSON.parse(publicJwk) : publicJwk
  return {
    alg: 'EdDSA',
    publicJwk: jwk,
    ...baseConfig,
  }
}

/**
 * Helper function to create HTTP JWKS URL verification config
 *
 * Enables testing without environment variables by providing explicit configuration
 *
 * @example
 * ```typescript
 * // Auth0 configuration
 * const config = createJWKSUrlVerifyConfig(
 *   'https://tenant.auth0.com/.well-known/jwks.json',
 *   {
 *     iss: 'https://tenant.auth0.com/',
 *     aud: 'my-client-id'
 *   }
 * )
 *
 * const payload = await verifyWithConfig(token, config)
 * ```
 *
 * @param jwksUrl - HTTP(S) URL to JWKS endpoint
 * @param baseConfig - Base JWT configuration
 * @param cacheTtl - Optional cache TTL in seconds (default: 300)
 * @returns JWKS URL verification configuration
 */
export function createJWKSUrlVerifyConfig(
  jwksUrl: string,
  baseConfig: Omit<BaseJwtConfig, 'ttlSeconds' | 'leeway'> &
    Partial<Pick<BaseJwtConfig, 'ttlSeconds' | 'leeway'>>,
  cacheTtl?: number
): JWKSUrlVerifyConfig {
  return {
    alg: 'EdDSA', // Default, will support RSA via JWKS
    jwksUrl,
    cacheTtl,
    ...baseConfig,
  }
}
