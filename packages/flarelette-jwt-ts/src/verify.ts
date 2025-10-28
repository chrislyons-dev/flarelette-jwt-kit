
import { jwtVerify, importJWK, calculateJwkThumbprint } from 'jose'
import { envMode, getCommon, getHSSecret, getPublicJwkString } from './config'
import { jwksFromEnv, allowedThumbprints } from './jwks'

export async function verify(token: string, opts?: Partial<{ iss:string; aud:string; leeway:number }>): Promise<Record<string, any> | null> {
  const mode = envMode('consumer')
  const { iss, aud, leeway } = { ...getCommon(), ...(opts||{}) }

  if (mode === 'HS512') {
    try {
      const key = getHSSecret()
      const { payload } = await jwtVerify(token, key, { algorithms:['HS512'], issuer:iss, audience:aud, clockTolerance: leeway })
      return payload as Record<string, any>
    } catch { return null }
  } else {
    try {
      let keyLike: any
      const inline = getPublicJwkString();
      if (inline) {
        const jwk = JSON.parse(inline)
        keyLike = await importJWK(jwk, 'EdDSA')
        const pins = allowedThumbprints()
        if (pins) {
          const th = await calculateJwkThumbprint(jwk)
          if (!pins.has(th)) throw new Error('untrusted public key')
        }
      } else {
        keyLike = jwksFromEnv()
      }
      const res = await jwtVerify(token, keyLike, { algorithms:['EdDSA'], issuer:iss, audience:aud, clockTolerance: leeway })
      const pins = allowedThumbprints()
      if (pins && (res as any).key) {
        const jwk = (res as any).key
        const th = await calculateJwkThumbprint(jwk)
        if (!pins.has(th)) throw new Error('untrusted key (pin mismatch)')
      }
      return res.payload as Record<string, any>
    } catch { return null }
  }
}
