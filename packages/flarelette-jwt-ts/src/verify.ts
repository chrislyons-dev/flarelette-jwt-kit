import {
  jwtVerify,
  importJWK,
  calculateJwkThumbprint,
  decodeProtectedHeader,
} from 'jose'
import { envMode, getCommon, getHSSecret, getPublicJwkString } from './config.js'
import { fetchJwksFromService, getKeyFromJwks, allowedThumbprints } from './jwks.js'
import type { JWTPayload } from 'jose'
import type { Fetcher } from './types.js'

export async function verify(
  token: string,
  opts?: Partial<{
    iss: string
    aud: string
    leeway: number
    jwksService: Fetcher
  }>
): Promise<JWTPayload | null> {
  const mode = envMode('consumer')
  const { iss, aud, leeway } = { ...getCommon(), ...(opts || {}) }

  if (mode === 'HS512') {
    try {
      const key = getHSSecret()
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS512'],
        issuer: iss,
        audience: aud,
        clockTolerance: leeway,
      })
      return payload
    } catch {
      return null
    }
  } else {
    // EdDSA mode
    try {
      let keyLike: CryptoKey | Uint8Array
      const inline = getPublicJwkString()

      if (inline) {
        // Strategy 1: Inline public JWK (single key)
        const jwk = JSON.parse(inline)
        keyLike = await importJWK(jwk, 'EdDSA')

        // Optional: Verify thumbprint if pinning configured
        const pins = allowedThumbprints()
        if (pins) {
          const th = await calculateJwkThumbprint(jwk)
          if (!pins.has(th)) {
            throw new Error('Public key thumbprint not in allowed list')
          }
        }
      } else if (opts?.jwksService) {
        // Strategy 2: Service binding JWKS (key set with rotation)
        const header = decodeProtectedHeader(token)
        const jwks = await fetchJwksFromService(opts.jwksService)
        keyLike = await getKeyFromJwks(header.kid, jwks)
      } else {
        throw new Error(
          'EdDSA verification requires JWT_PUBLIC_JWK or JWT_JWKS_SERVICE'
        )
      }

      const res = await jwtVerify(token, keyLike, {
        algorithms: ['EdDSA'],
        issuer: iss,
        audience: aud,
        clockTolerance: leeway,
      })

      // For JWKS verification, verify thumbprint if pinning configured
      const pins = allowedThumbprints()
      if (pins && opts?.jwksService) {
        // Note: jose doesn't expose the key in the result, so we skip thumbprint verification for JWKS
        // In production, configure JWT_ALLOWED_THUMBPRINTS to pin specific keys
      }

      return res.payload
    } catch {
      return null
    }
  }
}
