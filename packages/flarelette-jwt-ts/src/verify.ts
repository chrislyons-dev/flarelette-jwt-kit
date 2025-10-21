
import { jwtVerify } from 'jose'

export async function verify(
  token: string,
  opts: { secret: string; iss: string; aud: string; leeway?: number }
): Promise<Record<string, any> | null> {
  const key = new TextEncoder().encode(opts.secret)
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS512'],
      issuer: opts.iss,
      audience: opts.aud,
      clockTolerance: opts.leeway ?? 90,
    })
    return payload as Record<string, any>
  } catch {
    return null
  }
}
