
/**
 * Cloudflare Workers / Hono adapter:
 * Injects the Worker `env` bag so the kit can read secrets without `process.env`.
 */
import * as kit from '../index'

export function bindEnv(env: Record<string, string>) {
  ;(globalThis as any).__FLARELETTE_ENV = env
}

/** Returns a namespaced kit whose calls use the provided env bag. */
export function makeKit(env: Record<string, string>) {
  bindEnv(env)
  return {
    ...kit,
    /** convenience re-exports */
    sign: kit.sign,
    verify: kit.verify,
    createToken: kit.createToken,
    checkAuth: kit.checkAuth,
    policy: kit.policy,
  }
}
