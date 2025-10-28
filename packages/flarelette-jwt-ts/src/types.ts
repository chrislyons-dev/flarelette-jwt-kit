/**
 * Type definitions for Cloudflare Workers service bindings and environment
 */

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
