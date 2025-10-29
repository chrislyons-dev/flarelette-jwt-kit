import { describe, test, expect } from 'vitest'
import { parse, isExpiringSoon, mapScopesToPermissions } from '../src/util'

describe('util.ts', () => {
  describe('parse', () => {
    test('should parse a valid JWT token', () => {
      // Create a simple JWT-like token (header.payload.signature)
      const header = { alg: 'HS512', typ: 'JWT' }
      const payload = { sub: '1234', name: 'Test User', iat: 1234567890 }

      const headerB64 = Buffer.from(JSON.stringify(header))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const payloadB64 = Buffer.from(JSON.stringify(payload))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const token = `${headerB64}.${payloadB64}.fakesignature`

      const result = parse(token)

      expect(result.header).toEqual(header)
      expect(result.payload).toEqual(payload)
    })

    test('should parse token with base64url encoding', () => {
      const header = { alg: 'EdDSA' }
      const payload = { data: 'test+/with special chars' }

      const headerB64 = Buffer.from(JSON.stringify(header))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const payloadB64 = Buffer.from(JSON.stringify(payload))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const token = `${headerB64}.${payloadB64}.sig`

      const result = parse(token)

      expect(result.header).toEqual(header)
      expect(result.payload).toEqual(payload)
    })
  })

  describe('isExpiringSoon', () => {
    test('should return true if token expires within specified seconds', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = { exp: now + 30 } // expires in 30 seconds

      const result = isExpiringSoon(payload, 60) // check if expiring within 60 seconds

      expect(result).toBe(true)
    })

    test('should return false if token expires after specified seconds', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = { exp: now + 300 } // expires in 5 minutes

      const result = isExpiringSoon(payload, 60) // check if expiring within 60 seconds

      expect(result).toBe(false)
    })

    test('should return true if token is already expired', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = { exp: now - 10 } // expired 10 seconds ago

      const result = isExpiringSoon(payload, 60)

      expect(result).toBe(true)
    })

    test('should return true if exp is 0 (missing or invalid)', () => {
      const payload = { sub: '123' } // no exp field

      const result = isExpiringSoon(payload, 60)

      expect(result).toBe(true)
    })

    test('should return true if exp is not a number', () => {
      const payload = { exp: 'invalid' }

      const result = isExpiringSoon(payload, 60)

      expect(result).toBe(true)
    })

    test('should handle exactly at threshold', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload = { exp: now + 60 } // expires exactly in 60 seconds

      const result = isExpiringSoon(payload, 60)

      expect(result).toBe(true) // <= threshold
    })
  })

  describe('mapScopesToPermissions', () => {
    test('should return scopes unchanged', () => {
      const scopes = ['read', 'write', 'admin']

      const result = mapScopesToPermissions(scopes)

      expect(result).toEqual(scopes)
    })

    test('should handle empty array', () => {
      const result = mapScopesToPermissions([])

      expect(result).toEqual([])
    })

    test('should preserve scope values exactly', () => {
      const scopes = ['scope:read', 'scope:write:all', 'custom-permission']

      const result = mapScopesToPermissions(scopes)

      expect(result).toEqual(scopes)
    })
  })
})
