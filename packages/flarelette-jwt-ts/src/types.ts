/**
 * Type definitions for JWT operations.
 *
 * This module defines types for JWT headers, payloads, profiles, and related structures.
 * It ensures type safety and consistency across the library.
 *
 * @module types
 *
 */

/**
 * Type definitions for Cloudflare Workers service bindings and environment
 */

/**
 * JWT algorithm type
 *
 * Only two algorithms supported by design:
 * - HS512: Symmetric signing for trusted producer-consumer pairs (shared secret)
 * - EdDSA: Asymmetric signing for public verification with key rotation support
 *
 * No RSA/ECDSA to reduce attack surface and simplify key management.
 */
export type AlgType = 'HS512' | 'EdDSA'

/**
 * JWT value types (JSON-compatible values used in claims and predicates)
 *
 * Constrains claim values to JSON-serializable types instead of `any`.
 * Enables type-safe claim handling while maintaining flexibility for custom claims.
 * Used throughout signing, verification, and policy evaluation.
 */
export type JwtValue =
  | string
  | number
  | boolean
  | string[]
  | Record<string, unknown>
  | null

/**
 * JWT claims dictionary type
 *
 * Standard pattern for passing claims with type safety.
 * Maps string keys to JwtValue-constrained values, preventing unsafe `any` types
 * while allowing custom claims beyond the standard JwtPayload fields.
 */
export type ClaimsDict = Record<string, JwtValue>

/**
 * JWT token header structure
 *
 * Standard JWT header (RFC 7519) with algorithm and optional key ID.
 * The `kid` field enables key rotation in EdDSA mode by identifying which
 * public key in a JWKS should be used for verification. Required for production
 * EdDSA deployments with multiple active keys.
 */
export interface JwtHeader {
  /** Algorithm: HS512 or EdDSA */
  alg: AlgType
  /** Token type, typically "JWT" */
  typ?: string
  /** Key ID for key rotation (optional) */
  kid?: string
}

/**
 * Actor claim for service delegation (RFC 8693)
 *
 * Identifies a service acting on behalf of another principal.
 * Can be nested for delegation chains.
 */
export interface ActorClaim {
  /** Service identifier acting on behalf of original subject */
  sub: string
  /** The issuer of the actor token. */
  iss?: string
  /** Nested actor for delegation chains (recursive) */
  act?: ActorClaim
}

/**
 * JWT token payload/claims structure
 *
 * Includes standard JWT claims, OIDC claims, and common custom claims.
 * Index signature allows any additional custom claims at runtime.
 */
export interface JwtPayload {
  // Standard JWT claims (RFC 7519)
  /** Issuer */
  iss?: string
  /** Audience (single or multiple) */
  aud?: string | string[]
  /** Subject */
  sub?: string
  /** Expiration time (Unix timestamp) */
  exp?: number
  /** Issued at (Unix timestamp) */
  iat?: number
  /** Not before (Unix timestamp) */
  nbf?: number
  /** JWT ID */
  jti?: string

  // OIDC standard claims
  /** Full name */
  name?: string
  /** Email address */
  email?: string
  /** Email verification status */
  email_verified?: boolean
  /** OAuth2 client identifier */
  client_id?: string
  /** Client ID (alternative) */
  cid?: string
  /** Authorized party */
  azp?: string
  /** Space-separated scope string (OAuth2) */
  scope?: string
  /** Scopes as array */
  scopes?: string[]

  // Multi-tenant claims
  /** Tenant ID */
  tid?: string
  /** Organization ID */
  org_id?: string

  // Authorization claims
  /** Permission strings */
  permissions?: string[]
  /** Role strings */
  roles?: string[]
  /** Group memberships */
  groups?: string[]
  /** Primary user role */
  user_role?: string
  /** Department/division */
  department?: string

  // Delegation claims (RFC 8693)
  /** Service acting on behalf of subject */
  act?: ActorClaim

  /** Additional custom claims */
  [key: string]: unknown
}

/**
 * Parsed JWT token structure
 *
 * Result of parsing a JWT without verification. Useful for inspecting claims
 * before verification (e.g., routing decisions) or debugging token issues.
 * Never trust the payload from parse() alone - always verify() for security-sensitive operations.
 */
export interface ParsedJwt {
  header: JwtHeader
  payload: JwtPayload
}

/**
 * JWT Profile structure matching flarelette-jwt.profile.schema.json
 *
 * Represents the complete configuration profile for JWT operations.
 */
export interface JwtProfile {
  /**
   * Profile schema version (optional, >= 1)
   */
  version?: number

  /**
   * JWT algorithm - HS512 (symmetric) or EdDSA (asymmetric)
   */
  alg: AlgType

  /**
   * Token audience - single string or array of audience values
   */
  aud: string | string[]

  /**
   * Token issuer - identifies the principal that issued the JWT
   */
  iss: string

  /**
   * Clock skew tolerance in seconds (default: 90)
   * Used for time-based claim validation (exp, nbf, iat)
   */
  leeway_seconds?: number

  /**
   * Additional properties allowed for extensibility
   */
  [key: string]: unknown
}

/**
 * Cloudflare service binding interface (Worker-to-Worker RPC)
 *
 * Enables direct Worker-to-Worker communication for JWKS fetching without
 * public HTTP endpoints. Provides better security (no public exposure),
 * performance (lower latency), and reliability (no DNS/network failures).
 * Preferred over HTTP URLs for production EdDSA verification.
 */
export interface Fetcher {
  fetch(input: string | Request, init?: RequestInit): Promise<Response>
}

/**
 * Cloudflare Worker environment with typed bindings
 *
 * Defines all JWT-related environment variables and service bindings.
 * Supports secret-name indirection pattern: JWT_SECRET_NAME points to the
 * actual secret binding name, enabling proper secret management without
 * exposing values in environment variables. All *_NAME fields follow this pattern.
 */
export interface WorkerEnv extends Record<string, unknown> {
  // Standard environment variables (strings)
  JWT_ISS?: string
  JWT_AUD?: string
  JWT_TTL_SECONDS?: string
  JWT_LEEWAY?: string
  JWT_KID?: string

  // HS512 secrets
  JWT_SECRET?: string
  JWT_SECRET_NAME?: string

  // EdDSA keys
  JWT_PRIVATE_JWK?: string
  JWT_PRIVATE_JWK_NAME?: string
  JWT_PRIVATE_JWK_PATH?: string
  JWT_PUBLIC_JWK?: string
  JWT_PUBLIC_JWK_NAME?: string

  // Service bindings (Fetcher objects)
  JWT_JWKS_SERVICE?: Fetcher
  JWT_JWKS_SERVICE_NAME?: string

  // Thumbprint pinning
  JWT_ALLOWED_THUMBPRINTS?: string
}

/**
 * JWKS (JSON Web Key Set) response format
 *
 * Standard RFC 7517 structure for distributing public keys.
 * Used in EdDSA mode to support key rotation - consumers fetch this from
 * producers to get current public keys. Each key includes a `kid` that
 * matches the JWT header for identification during verification.
 */
export interface JWKSResponse {
  keys: JsonWebKey[]
}

/**
 * Internal environment bag for service bindings
 *
 * Separates string environment variables from Fetcher service bindings
 * during injection. Required because Cloudflare Workers pass both types
 * in the same `env` object, but they need different handling - vars go
 * to globalThis.__FLARELETTE_ENV, services go to globalThis.__FLARELETTE_SERVICES.
 */
export interface EnvBag {
  vars: Record<string, string>
  services: Record<string, Fetcher>
}
