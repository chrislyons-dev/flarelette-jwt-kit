
import { SignJWT } from 'jose'

export async function sign(
  payload: Record<string, any>,
  opts: { secret: string; iss: string; aud: string; ttlSeconds?: number }
): Promise<string> {
  const key = new TextEncoder().encode(opts.secret) // treat as raw bytes or decode base64url upstream
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (opts.ttlSeconds ?? 900)
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS512', typ: 'JWT' })
    .setIssuer(opts.iss)
    .setAudience(opts.aud)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(key)
}
