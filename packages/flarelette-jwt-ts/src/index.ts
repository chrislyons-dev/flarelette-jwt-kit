/**
 * Entry point for the flarelette-jwt library.
 *
 * This module re-exports core functionalities, including signing, verification, utilities, and type definitions.
 * It serves as the main interface for library consumers.
 *
 * @module main
 *
 */

// Core configuration and environment
export {
  envMode,
  getCommon,
  getProfile,
  getHSSecret,
  getPrivateJwkString,
  getPublicJwkString,
  getJwksServiceName,
} from './config.js'

// Signing and verification
export { sign } from './sign.js'
export { verify } from './verify.js'

// Utilities
export { parse, isExpiringSoon } from './util.js'

// High-level API
export { createToken, createDelegatedToken, checkAuth, policy } from './high.js'
export type { AuthzOpts, AuthUser } from './high.js'

// Secret generation
export { generateSecret } from './secret.js'

// Type definitions
export type {
  AlgType,
  JwtValue,
  ClaimsDict,
  JwtProfile,
  JwtHeader,
  JwtPayload,
  ActorClaim,
  ParsedJwt,
  Fetcher,
  WorkerEnv,
  JWKSResponse,
  EnvBag,
} from './types.js'

// Adapters
export * as adapters from './adapters/hono.js'
