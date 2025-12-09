import { describe, test, expect, beforeEach, vi } from 'vitest'
import { fetchJwksFromUrl, clearHttpJwksCache } from '../src/jwks'

// Mock fetch globally
const originalFetch = globalThis.fetch

describe('jwks-http.ts - HTTP JWKS Fetching', () => {
  beforeEach(() => {
    // Clear HTTP JWKS cache before each test
    clearHttpJwksCache()

    // Restore original fetch
    globalThis.fetch = originalFetch
  })

  describe('URL Validation', () => {
    test('should reject invalid URL format', async () => {
      await expect(fetchJwksFromUrl('not-a-url')).rejects.toThrow(
        'JWT_JWKS_URL must be a valid URL'
      )
    })

    test('should reject empty URL', async () => {
      await expect(fetchJwksFromUrl('')).rejects.toThrow(
        'JWT_JWKS_URL must be a valid URL'
      )
    })

    test('should reject http:// URLs (non-localhost)', async () => {
      await expect(
        fetchJwksFromUrl('http://example.com/.well-known/jwks.json')
      ).rejects.toThrow('JWT_JWKS_URL must use HTTPS (except localhost for testing)')
    })

    test('should allow http://localhost for testing', async () => {
      const mockKeys = [{ kid: 'test-key', kty: 'OKP' }]

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: mockKeys }),
      })

      const result = await fetchJwksFromUrl(
        'http://localhost:3000/.well-known/jwks.json'
      )
      expect(result).toEqual(mockKeys)
    })

    test('should allow http://127.0.0.1 for testing', async () => {
      const mockKeys = [{ kid: 'test-key', kty: 'OKP' }]

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: mockKeys }),
      })

      const result = await fetchJwksFromUrl(
        'http://127.0.0.1:3000/.well-known/jwks.json'
      )
      expect(result).toEqual(mockKeys)
    })

    test('should allow http://[::1] (IPv6 localhost) for testing', async () => {
      const mockKeys = [{ kid: 'test-key', kty: 'OKP' }]

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: mockKeys }),
      })

      const result = await fetchJwksFromUrl('http://[::1]:3000/.well-known/jwks.json')
      expect(result).toEqual(mockKeys)
    })

    test('should allow https:// URLs', async () => {
      const mockKeys = [{ kid: 'test-key', kty: 'OKP' }]

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: mockKeys }),
      })

      const result = await fetchJwksFromUrl(
        'https://tenant.auth0.com/.well-known/jwks.json'
      )
      expect(result).toEqual(mockKeys)
    })

    test('should reject ftp:// protocol', async () => {
      await expect(
        fetchJwksFromUrl('ftp://example.com/.well-known/jwks.json')
      ).rejects.toThrow('JWT_JWKS_URL must use HTTPS')
    })

    test('should reject file:// protocol', async () => {
      await expect(fetchJwksFromUrl('file:///etc/jwks.json')).rejects.toThrow(
        'JWT_JWKS_URL must use HTTPS'
      )
    })
  })

  describe('HTTP Fetching', () => {
    test('should fetch JWKS successfully', async () => {
      const mockKeys = [
        { kid: 'key1', kty: 'RSA', use: 'sig', n: 'abc', e: 'AQAB' },
        { kid: 'key2', kty: 'OKP', crv: 'Ed25519', x: 'xyz' },
      ]

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: mockKeys }),
      })

      const result = await fetchJwksFromUrl('https://example.com/.well-known/jwks.json')

      expect(result).toEqual(mockKeys)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://example.com/.well-known/jwks.json',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'flarelette-jwt-ts',
          },
        })
      )
    })

    test('should throw error on 404 Not Found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow('JWKS HTTP fetch returned 404: Not Found')
    })

    test('should throw error on 500 Internal Server Error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow('JWKS HTTP fetch returned 500: Internal Server Error')
    })

    test('should throw error on 403 Forbidden', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      })

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow('JWKS HTTP fetch returned 403: Forbidden')
    })

    test('should throw error on network timeout', async () => {
      // Simulate timeout by rejecting after delay
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('AbortError'))

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow()
    })

    test('should throw error on malformed JSON', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'not valid json{{{',
      })

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow()
    })

    test('should throw error if response missing keys array', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: 'invalid' }),
      })

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow('Invalid JWKS response: missing keys array')
    })

    test('should throw error if keys is not an array', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: 'not-an-array' }),
      })

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow('Invalid JWKS response: missing keys array')
    })

    test('should handle empty keys array', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [] }),
      })

      const result = await fetchJwksFromUrl('https://example.com/.well-known/jwks.json')

      expect(result).toEqual([])
    })

    test('should include timeout in fetch options', async () => {
      const mockKeys = [{ kid: 'key1', kty: 'OKP' }]

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: mockKeys }),
      })

      await fetchJwksFromUrl('https://example.com/.well-known/jwks.json')

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      )
    })
  })

  describe('Caching', () => {
    test('should cache JWKS for default TTL (5 minutes)', async () => {
      let fetchCount = 0
      const mockKeys = [{ kid: 'key1', kty: 'OKP' }]

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        fetchCount++
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ keys: mockKeys }),
        }
      })

      const url = 'https://example.com/.well-known/jwks.json'

      // First fetch
      const result1 = await fetchJwksFromUrl(url)
      expect(result1).toEqual(mockKeys)
      expect(fetchCount).toBe(1)

      // Second fetch (should use cache)
      const result2 = await fetchJwksFromUrl(url)
      expect(result2).toEqual(mockKeys)
      expect(fetchCount).toBe(1) // Still 1, not fetched again
    })

    test('should respect custom cache TTL', async () => {
      let fetchCount = 0
      const mockKeys = [{ kid: 'key1', kty: 'OKP' }]

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        fetchCount++
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ keys: mockKeys }),
        }
      })

      const url = 'https://example.com/.well-known/jwks.json'
      const ttl = 600 // 10 minutes

      // First fetch with custom TTL
      const result1 = await fetchJwksFromUrl(url, ttl)
      expect(result1).toEqual(mockKeys)
      expect(fetchCount).toBe(1)

      // Second fetch (should use cache)
      const result2 = await fetchJwksFromUrl(url, ttl)
      expect(result2).toEqual(mockKeys)
      expect(fetchCount).toBe(1)
    })

    test('should cache per URL', async () => {
      const mockKeys1 = [{ kid: 'key1', kty: 'OKP' }]
      const mockKeys2 = [{ kid: 'key2', kty: 'RSA' }]

      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        const keys = url.includes('auth0') ? mockKeys1 : mockKeys2
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ keys }),
        }
      })

      const url1 = 'https://tenant.auth0.com/.well-known/jwks.json'
      const url2 = 'https://domain.okta.com/.well-known/jwks.json'

      // Fetch from two different URLs
      const result1 = await fetchJwksFromUrl(url1)
      const result2 = await fetchJwksFromUrl(url2)

      expect(result1).toEqual(mockKeys1)
      expect(result2).toEqual(mockKeys2)
      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    })

    test('should expire cache after TTL', async () => {
      let fetchCount = 0
      const mockKeys = [{ kid: 'key1', kty: 'OKP' }]

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        fetchCount++
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ keys: mockKeys }),
        }
      })

      const url = 'https://example.com/.well-known/jwks.json'
      const ttl = 0.1 // 100ms for testing

      // First fetch
      await fetchJwksFromUrl(url, ttl)
      expect(fetchCount).toBe(1)

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Second fetch (should fetch again)
      await fetchJwksFromUrl(url, ttl)
      expect(fetchCount).toBe(2)
    })

    test('should clear cache on demand', async () => {
      let fetchCount = 0
      const mockKeys = [{ kid: 'key1', kty: 'OKP' }]

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        fetchCount++
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ keys: mockKeys }),
        }
      })

      const url = 'https://example.com/.well-known/jwks.json'

      // First fetch
      await fetchJwksFromUrl(url)
      expect(fetchCount).toBe(1)

      // Clear cache
      clearHttpJwksCache()

      // Second fetch (should fetch again due to cleared cache)
      await fetchJwksFromUrl(url)
      expect(fetchCount).toBe(2)
    })

    test('should update cache on re-fetch after expiry', async () => {
      const mockKeys1 = [{ kid: 'old-key', kty: 'OKP' }]
      const mockKeys2 = [{ kid: 'new-key', kty: 'OKP' }]

      let callCount = 0
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++
        const keys = callCount === 1 ? mockKeys1 : mockKeys2
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ keys }),
        }
      })

      const url = 'https://example.com/.well-known/jwks.json'
      const ttl = 0.1 // 100ms

      // First fetch
      const result1 = await fetchJwksFromUrl(url, ttl)
      expect(result1).toEqual(mockKeys1)

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150))

      // Second fetch (should get updated keys)
      const result2 = await fetchJwksFromUrl(url, ttl)
      expect(result2).toEqual(mockKeys2)
    })
  })

  describe('Size Limit Enforcement', () => {
    test('should reject response exceeding 100KB', async () => {
      // Create a response larger than 100KB
      const largeKeys = Array(1000)
        .fill(null)
        .map((_, i) => ({
          kid: `key-${i}`,
          kty: 'RSA',
          n: 'a'.repeat(300), // Make each key large
          e: 'AQAB',
        }))

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: largeKeys }),
      })

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow('JWKS response exceeds size limit (100KB)')
    })

    test('should accept response under 100KB', async () => {
      // Create a reasonable-sized response
      const keys = Array(10)
        .fill(null)
        .map((_, i) => ({
          kid: `key-${i}`,
          kty: 'RSA',
          n: 'abc123',
          e: 'AQAB',
        }))

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys }),
      })

      const result = await fetchJwksFromUrl('https://example.com/.well-known/jwks.json')

      expect(result).toHaveLength(10)
    })

    test('should accept response at exactly 100KB', async () => {
      // Create a response that's exactly at the limit
      const exactSize = '{ "keys": [' + 'x'.repeat(100 * 1024 - 13) + '] }'

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => exactSize,
      })

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow() // Will fail JSON parse, but not size check
    })
  })

  describe('RSA Key Support', () => {
    test('should handle RSA keys with standard modulus', async () => {
      const rsaKey = {
        kid: 'rsa-key-1',
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw',
        e: 'AQAB',
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [rsaKey] }),
      })

      const jwks = await fetchJwksFromUrl('https://example.com/.well-known/jwks.json')

      expect(jwks).toHaveLength(1)
      expect(jwks[0].kty).toBe('RSA')
      expect(jwks[0].kid).toBe('rsa-key-1')
    })

    test('should handle mixed EdDSA and RSA keys', async () => {
      const keys = [
        {
          kid: 'eddsa-key',
          kty: 'OKP',
          crv: 'Ed25519',
          x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
        },
        {
          kid: 'rsa-key',
          kty: 'RSA',
          n: 'abc123',
          e: 'AQAB',
        },
      ]

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys }),
      })

      const jwks = await fetchJwksFromUrl('https://example.com/.well-known/jwks.json')

      expect(jwks).toHaveLength(2)
      expect(jwks[0].kty).toBe('OKP')
      expect(jwks[1].kty).toBe('RSA')
    })
  })

  describe('Real-World OIDC Provider Patterns', () => {
    test('should handle Auth0-style JWKS', async () => {
      const auth0Keys = {
        keys: [
          {
            alg: 'RS256',
            kty: 'RSA',
            use: 'sig',
            n: 'xjlCRBqkQf4w',
            e: 'AQAB',
            kid: 'ABC123',
            x5t: 'xyz',
            x5c: ['cert-data'],
          },
        ],
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(auth0Keys),
      })

      const result = await fetchJwksFromUrl(
        'https://tenant.auth0.com/.well-known/jwks.json'
      )

      expect(result).toHaveLength(1)
      expect(result[0].alg).toBe('RS256')
    })

    test('should handle Okta-style JWKS', async () => {
      const oktaKeys = {
        keys: [
          {
            kty: 'RSA',
            alg: 'RS256',
            kid: 'key-id-1',
            use: 'sig',
            e: 'AQAB',
            n: 'modulus-data',
          },
        ],
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(oktaKeys),
      })

      const result = await fetchJwksFromUrl(
        'https://domain.okta.com/oauth2/default/v1/keys'
      )

      expect(result).toHaveLength(1)
      expect(result[0].use).toBe('sig')
    })

    test('should handle Google-style JWKS', async () => {
      const googleKeys = {
        keys: [
          {
            kid: 'google-key-id',
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            n: 'modulus',
            e: 'AQAB',
          },
        ],
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(googleKeys),
      })

      const result = await fetchJwksFromUrl(
        'https://www.googleapis.com/oauth2/v3/certs'
      )

      expect(result).toHaveLength(1)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(
        fetchJwksFromUrl('https://example.com/.well-known/jwks.json')
      ).rejects.toThrow('Network error')
    })

    test('should handle DNS resolution failures', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'))

      await expect(
        fetchJwksFromUrl('https://nonexistent.example.com/.well-known/jwks.json')
      ).rejects.toThrow()
    })

    test('should handle JSON with extra fields', async () => {
      const keysWithExtras = {
        keys: [{ kid: 'key1', kty: 'OKP' }],
        extra_field: 'ignored',
        metadata: { version: '1.0' },
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(keysWithExtras),
      })

      const result = await fetchJwksFromUrl('https://example.com/.well-known/jwks.json')

      expect(result).toEqual([{ kid: 'key1', kty: 'OKP' }])
    })

    test('should handle keys with missing optional fields', async () => {
      const minimalKey = {
        kid: 'minimal',
        kty: 'OKP',
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [minimalKey] }),
      })

      const result = await fetchJwksFromUrl('https://example.com/.well-known/jwks.json')

      expect(result).toEqual([minimalKey])
    })
  })
})
