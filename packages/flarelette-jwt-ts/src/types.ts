/**
 * Type definitions for Cloudflare Workers service bindings and environment
 */

/**
 * JWT algorithm type
 */
export type AlgType = 'HS512' | 'EdDSA'

/**
 * JWT value types (JSON-compatible values used in claims and predicates)
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
 */
export type ClaimsDict = Record<string, JwtValue>

/**
 * JWT token header structure
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
 */
export interface Fetcher {
  fetch(input: string | Request, init?: RequestInit): Promise<Response>
}

/**
 * Cloudflare Worker environment with typed bindings
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
 */
export interface JWKSResponse {
  keys: JsonWebKey[]
}

/**
 * Internal environment bag for service bindings
 */
export interface EnvBag {
  vars: Record<string, string>
  services: Record<string, Fetcher>
}
