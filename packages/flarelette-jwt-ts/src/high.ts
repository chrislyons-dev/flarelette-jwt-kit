
import { sign } from './sign'
import { verify } from './verify'
import type { Fetcher } from './types'

export async function createToken(claims: Record<string, any>, opts?: Partial<{ iss:string; aud:string; ttlSeconds:number }>) {
  return sign(claims, opts)
}
export type AuthzOpts = Partial<{ iss:string; aud:string; leeway:number; jwksService:Fetcher }> & {
  require_all_permissions?: string[]; require_any_permission?: string[]
  require_roles_all?: string[]; require_roles_any?: string[]
  predicates?: Array<(payload: Record<string, any>) => boolean>
}
export async function checkAuth(token: string, opts: AuthzOpts) {
  const payload = await verify(token, opts)
  if (!payload) return null
  const perms = (payload.permissions as string[]) || []
  const roles = (payload.roles as string[]) || []
  if ((opts.require_all_permissions||[]).some(p => !perms.includes(p))) return null
  if ((opts.require_any_permission||[]).length && !(opts.require_any_permission||[]).some(p => perms.includes(p))) return null
  if ((opts.require_roles_all||[]).some(r => !roles.includes(r))) return null
  if ((opts.require_roles_any||[]).length && !(opts.require_roles_any||[]).some(r => roles.includes(r))) return null
  for (const pred of (opts.predicates||[])) if (!pred(payload)) return null
  return { sub: payload.sub as string|undefined, permissions: perms, roles, jti: payload.jti as string|undefined, payload }
}
export function policy() {
  const opts: any = {}
  return {
    base(b: Partial<{iss:string;aud:string;leeway:number}>) { Object.assign(opts, b); return this },
    needAll(...perms: string[]) { opts.require_all_permissions = [...(opts.require_all_permissions||[]), ...perms]; return this },
    needAny(...perms: string[]) { opts.require_any_permission = [...(opts.require_any_permission||[]), ...perms]; return this },
    rolesAll(...roles: string[]) { opts.require_roles_all = [...(opts.require_roles_all||[]), ...roles]; return this },
    rolesAny(...roles: string[]) { opts.require_roles_any = [...(opts.require_roles_any||[]), ...roles]; return this },
    where(fn: (payload: Record<string, any>) => boolean) { opts.predicates = [...(opts.predicates||[]), fn]; return this },
    build() { return opts }
  }
}
