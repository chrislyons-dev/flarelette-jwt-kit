
import { sign } from './sign'
import { verify } from './verify'

export type CreateTokenOpts = {
  secret: string; iss: string; aud: string; ttlSeconds?: number; jtiFactory?: () => string
}
export async function createToken(claims: Record<string, any>, opts: CreateTokenOpts): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const body = { ...claims }
  if (body.iss == null) body.iss = opts.iss
  if (body.aud == null) body.aud = opts.aud
  if (body.iat == null) body.iat = now
  if (body.exp == null) body.exp = now + (opts.ttlSeconds ?? 900)
  if (opts.jtiFactory && !body.jti) body.jti = opts.jtiFactory()
  return sign(body, { secret: opts.secret, iss: opts.iss, aud: opts.aud, ttlSeconds: body.exp - now })
}

export type AuthzOpts = {
  secret: string; iss: string; aud: string; leeway?: number
  require_all_permissions?: string[]; require_any_permission?: string[]
  require_roles_all?: string[]; require_roles_any?: string[]
  predicates?: Array<(payload: Record<string, any>) => boolean>
}
export async function checkAuth(token: string, opts: AuthzOpts) {
  const payload = await verify(token, { secret: opts.secret, iss: opts.iss, aud: opts.aud, leeway: opts.leeway })
  if (!payload) return null
  const perms = (payload.permissions as string[]) || []
  const roles = (payload.roles as string[]) || []
  if ((opts.require_all_permissions||[]).some(p => !perms.includes(p))) return null
  if ((opts.require_any_permission||[]).length && !(opts.require_any_permission||[]).some(p => perms.includes(p))) return null
  if ((opts.require_roles_all||[]).some(r => !roles.includes(r))) return null
  if ((opts.require_roles_any||[]).length && !(opts.require_roles_any||[]).some(r => roles.includes(r))) return null
  for (const pred of (opts.predicates||[])) if (!pred(payload)) return null
  return { sub: payload.sub as string|undefined, permissions: perms, roles, jti: payload.jti as string|undefined,
           cid: (payload as any).cid, rid: (payload as any).rid, tid: (payload as any).tid, payload }
}
export function policy() {
  const opts: any = {}
  return {
    base(b: { secret: string; iss: string; aud: string; leeway?: number }) { Object.assign(opts, b); return this },
    needAll(...perms: string[]) { opts.require_all_permissions = [...(opts.require_all_permissions||[]), ...perms]; return this },
    needAny(...perms: string[]) { opts.require_any_permission = [...(opts.require_any_permission||[]), ...perms]; return this },
    rolesAll(...roles: string[]) { opts.require_roles_all = [...(opts.require_roles_all||[]), ...roles]; return this },
    rolesAny(...roles: string[]) { opts.require_roles_any = [...(opts.require_roles_any||[]), ...roles]; return this },
    where(fn: (payload: Record<string, any>) => boolean) { opts.predicates = [...(opts.predicates||[]), fn]; return this },
    build() { return opts }
  }
}
export async function mintAccessToken(subject: string, permissions: string[] = [], roles: string[] = [], meta: Record<string, any> = {}, opts: CreateTokenOpts) {
  return createToken({ sub: subject, permissions, roles, ...meta }, opts)
}
