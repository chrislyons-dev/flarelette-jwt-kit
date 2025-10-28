
/**
 * Cloudflare Workers / Hono adapter:
 * Injects the Worker `env` bag so the kit can read secrets and service bindings
 * without relying on process.env (which doesn't exist on Workers).
 */
import * as kit from '../index'
import { getJwksServiceName } from '../config'
import type { WorkerEnv, Fetcher } from '../types'

/**
 * Store both environment variables and service bindings globally
 */
export function bindEnv(env: WorkerEnv) {
  const vars: Record<string, string> = {}
  const services: Record<string, Fetcher> = {}

  for (const [k, v] of Object.entries(env)) {
    if (typeof v === 'string') {
      vars[k] = v
    } else if (v && typeof v === 'object' && 'fetch' in v) {
      services[k] = v as Fetcher
    }
  }

  // Store in global for config.ts to read
  ;(globalThis as any).__FLARELETTE_ENV = vars
  ;(globalThis as any).__FLARELETTE_SERVICES = services
}

/**
 * Get service binding by name from global storage
 */
function getServiceBinding(name: string): Fetcher | undefined {
  const services = (globalThis as any).__FLARELETTE_SERVICES as Record<string, Fetcher> | undefined
  return services?.[name]
}

/**
 * Returns a namespaced kit whose calls use the provided env bag.
 * Automatically injects JWKS service binding if configured.
 */
export function makeKit(env: WorkerEnv) {
  bindEnv(env)

  // Detect JWKS service binding if configured
  const jwksServiceName = getJwksServiceName()
  const jwksService = jwksServiceName ? getServiceBinding(jwksServiceName) : undefined

  return {
    sign: kit.sign,
    verify: (token: string, opts?: any) =>
      kit.verify(token, { ...opts, jwksService }),
    createToken: kit.createToken,
    checkAuth: (token: string, opts?: any) =>
      kit.checkAuth(token, { ...opts, jwksService }),
    policy: kit.policy,
    // Re-export for convenience
    parse: kit.parse,
    isExpiringSoon: kit.isExpiringSoon,
  }
}
