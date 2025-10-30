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
export type { Mode } from './config.js'

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
