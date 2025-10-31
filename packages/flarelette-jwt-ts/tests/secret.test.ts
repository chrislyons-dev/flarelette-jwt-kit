import { describe, test, expect } from 'vitest'
import { generateSecret, isValidBase64UrlSecret } from '../src/secret'

describe('secret.ts', () => {
  describe('generateSecret', () => {
    test('should generate a secret with default 64 bytes', () => {
      const secret = generateSecret()

      // Base64url encoded 64 bytes should be around 86 characters (no padding)
      expect(secret.length).toBeGreaterThanOrEqual(85)
      expect(secret.length).toBeLessThanOrEqual(90)
    })

    test('should generate base64url encoded string (no +, /, =)', () => {
      const secret = generateSecret()

      expect(secret).toMatch(/^[A-Za-z0-9\-_]+$/)
      expect(secret).not.toContain('+')
      expect(secret).not.toContain('/')
      expect(secret).not.toContain('=')
    })

    test('should generate different secrets each time', () => {
      const secret1 = generateSecret()
      const secret2 = generateSecret()

      expect(secret1).not.toBe(secret2)
    })

    test('should generate secret with custom length', () => {
      const secret32 = generateSecret(32) // 32 bytes
      const secret128 = generateSecret(128) // 128 bytes

      // 32 bytes ~ 43 chars, 128 bytes ~ 171 chars
      expect(secret32.length).toBeGreaterThanOrEqual(42)
      expect(secret32.length).toBeLessThanOrEqual(45)

      expect(secret128.length).toBeGreaterThanOrEqual(170)
      expect(secret128.length).toBeLessThanOrEqual(175)
    })

    test('should generate very short secret', () => {
      const secret = generateSecret(8) // 8 bytes

      expect(secret.length).toBeGreaterThanOrEqual(10)
      expect(secret.length).toBeLessThanOrEqual(12)
      expect(secret).toMatch(/^[A-Za-z0-9\-_]+$/)
    })
  })

  describe('isValidBase64UrlSecret', () => {
    test('should accept valid base64url secret of sufficient length', () => {
      const secret = generateSecret(64)

      const result = isValidBase64UrlSecret(secret, 64)

      expect(result).toBe(true)
    })

    test('should reject secret that is too short', () => {
      const secret = generateSecret(32) // only 32 bytes

      const result = isValidBase64UrlSecret(secret, 64) // requires 64 bytes

      expect(result).toBe(false)
    })

    test('should accept secret that meets exact minimum length', () => {
      const secret = generateSecret(64)

      const result = isValidBase64UrlSecret(secret, 64)

      expect(result).toBe(true)
    })

    test('should reject secret with invalid base64url characters', () => {
      const invalidSecret = 'invalid+secret/with=padding'

      const result = isValidBase64UrlSecret(invalidSecret, 32)

      expect(result).toBe(false)
    })

    test('should reject secret with spaces', () => {
      const invalidSecret = 'secret with spaces'

      const result = isValidBase64UrlSecret(invalidSecret, 32)

      expect(result).toBe(false)
    })

    test('should reject secret with special characters', () => {
      const invalidSecret = 'secret@with#special$chars!'

      const result = isValidBase64UrlSecret(invalidSecret, 32)

      expect(result).toBe(false)
    })

    test('should accept valid base64url with hyphens and underscores', () => {
      const validSecret = 'valid-base64url_string_with-hyphens_and_underscores'

      const result = isValidBase64UrlSecret(validSecret, 10)

      expect(result).toBe(true)
    })

    test('should handle custom minimum byte length', () => {
      const secret = generateSecret(16)

      expect(isValidBase64UrlSecret(secret, 16)).toBe(true)
      expect(isValidBase64UrlSecret(secret, 32)).toBe(false)
    })

    test('should reject empty string', () => {
      const result = isValidBase64UrlSecret('', 32)

      expect(result).toBe(false)
    })

    test('should handle malformed base64', () => {
      // Valid characters but not valid base64 when decoded
      const malformed = 'abc'

      // Should still check pattern and length
      const result = isValidBase64UrlSecret(malformed, 1)

      expect(result).toBe(true) // passes pattern, decoded is 2 bytes
    })
  })
})
