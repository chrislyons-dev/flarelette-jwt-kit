import { describe, test, expect, beforeEach } from 'vitest'
import {
  fetchJwksFromService,
  getKeyFromJwks,
  allowedThumbprints,
  clearJwksCache,
} from '../src/jwks'

describe('jwks.ts', () => {
  beforeEach(() => {
    // Clear JWKS cache before each test
    clearJwksCache()

    // Clean up environment
    const bag = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
      .__FLARELETTE_ENV
    if (bag) {
      delete bag.JWT_ALLOWED_THUMBPRINTS
    }
    if (typeof process !== 'undefined' && process.env) {
      delete process.env.JWT_ALLOWED_THUMBPRINTS
    }
  })

  describe('fetchJwksFromService', () => {
    test('should fetch JWKS from service successfully', async () => {
      const mockKeys = [
        { kid: 'key1', kty: 'RSA', use: 'sig' },
        { kid: 'key2', kty: 'EC', use: 'sig' },
      ]

      const mockService = {
        fetch: async (url: string) => {
          expect(url).toBe('/.well-known/jwks.json')
          return {
            ok: true,
            status: 200,
            json: async () => ({ keys: mockKeys }),
          } as Response
        },
      }

      const result = await fetchJwksFromService(mockService)

      expect(result).toEqual(mockKeys)
    })

    test('should throw error if service returns non-ok status', async () => {
      const mockService = {
        fetch: async () => {
          return {
            ok: false,
            status: 404,
            statusText: 'Not Found',
          } as Response
        },
      }

      await expect(fetchJwksFromService(mockService)).rejects.toThrow(
        'JWKS service returned 404: Not Found'
      )
    })

    test('should throw error if response missing keys array', async () => {
      const mockService = {
        fetch: async () => {
          return {
            ok: true,
            status: 200,
            json: async () => ({ data: 'invalid' }),
          } as Response
        },
      }

      await expect(fetchJwksFromService(mockService)).rejects.toThrow(
        'Invalid JWKS response: missing keys array'
      )
    })

    test('should throw error if keys is not an array', async () => {
      const mockService = {
        fetch: async () => {
          return {
            ok: true,
            status: 200,
            json: async () => ({ keys: 'not-an-array' }),
          } as Response
        },
      }

      await expect(fetchJwksFromService(mockService)).rejects.toThrow(
        'Invalid JWKS response: missing keys array'
      )
    })

    test('should cache JWKS for 5 minutes', async () => {
      let fetchCount = 0
      const mockKeys = [{ kid: 'key1', kty: 'RSA' }]

      const mockService = {
        fetch: async () => {
          fetchCount++
          return {
            ok: true,
            status: 200,
            json: async () => ({ keys: mockKeys }),
          } as Response
        },
      }

      // First fetch
      const result1 = await fetchJwksFromService(mockService)
      expect(result1).toEqual(mockKeys)
      expect(fetchCount).toBe(1)

      // Second fetch (should use cache)
      const result2 = await fetchJwksFromService(mockService)
      expect(result2).toEqual(mockKeys)
      expect(fetchCount).toBe(1) // Still 1, not fetched again
    })

    test('should handle empty keys array', async () => {
      const mockService = {
        fetch: async () => {
          return {
            ok: true,
            status: 200,
            json: async () => ({ keys: [] }),
          } as Response
        },
      }

      const result = await fetchJwksFromService(mockService)

      expect(result).toEqual([])
    })
  })

  describe('getKeyFromJwks', () => {
    test('should throw error if kid is undefined', async () => {
      const jwks = [{ kid: 'key1', kty: 'OKP', crv: 'Ed25519', x: 'abc' }]

      await expect(getKeyFromJwks(undefined, jwks)).rejects.toThrow(
        'Token header missing kid (key ID) - required for JWKS verification'
      )
    })

    test('should throw error if key not found in JWKS', async () => {
      const jwks = [
        { kid: 'key1', kty: 'OKP' },
        { kid: 'key2', kty: 'OKP' },
      ]

      await expect(getKeyFromJwks('key3', jwks)).rejects.toThrow(
        'Key with kid="key3" not found in JWKS (available: key1, key2)'
      )
    })

    test('should handle JWKS with no kids', async () => {
      const jwks = [{ kty: 'OKP' }, { kty: 'RSA' }]

      await expect(getKeyFromJwks('key1', jwks)).rejects.toThrow(
        'Key with kid="key1" not found in JWKS (available: )'
      )
    })

    test('should import key successfully when found', async () => {
      // Valid Ed25519 public key
      const jwks = [
        {
          kid: 'test-key',
          kty: 'OKP',
          crv: 'Ed25519',
          x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
          alg: 'EdDSA',
          use: 'sig',
        },
      ]

      const result = await getKeyFromJwks('test-key', jwks)

      expect(result).toBeDefined()
      // CryptoKey doesn't have many properties to check, but it should be a CryptoKey
      expect(result).toBeInstanceOf(Object)
    })

    test('should list available kids in error message', async () => {
      const jwks = [
        { kid: 'key-a', kty: 'OKP' },
        { kid: 'key-b', kty: 'OKP' },
        { kid: 'key-c', kty: 'OKP' },
      ]

      await expect(getKeyFromJwks('missing', jwks)).rejects.toThrow(
        'available: key-a, key-b, key-c'
      )
    })
  })

  describe('allowedThumbprints', () => {
    test('should return null when JWT_ALLOWED_THUMBPRINTS not set', () => {
      const result = allowedThumbprints()

      expect(result).toBeNull()
    })

    test('should parse comma-separated thumbprints from __FLARELETTE_ENV', () => {
      const bag = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      if (!bag) {
        ;(
          globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
        ).__FLARELETTE_ENV = {}
      }
      ;(
        globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
      ).__FLARELETTE_ENV.JWT_ALLOWED_THUMBPRINTS = 'thumb1,thumb2,thumb3'

      const result = allowedThumbprints()

      expect(result).toBeInstanceOf(Set)
      expect(result?.size).toBe(3)
      expect(result?.has('thumb1')).toBe(true)
      expect(result?.has('thumb2')).toBe(true)
      expect(result?.has('thumb3')).toBe(true)
    })

    test('should parse thumbprints from process.env if __FLARELETTE_ENV not set', () => {
      if (typeof process !== 'undefined' && process.env) {
        process.env.JWT_ALLOWED_THUMBPRINTS = 'env-thumb1,env-thumb2'
      }

      const result = allowedThumbprints()

      expect(result).toBeInstanceOf(Set)
      expect(result?.size).toBe(2)
      expect(result?.has('env-thumb1')).toBe(true)
      expect(result?.has('env-thumb2')).toBe(true)
    })

    test('should prefer __FLARELETTE_ENV over process.env', () => {
      const bag = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      if (!bag) {
        ;(
          globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
        ).__FLARELETTE_ENV = {}
      }
      ;(
        globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
      ).__FLARELETTE_ENV.JWT_ALLOWED_THUMBPRINTS = 'global-thumb'

      if (typeof process !== 'undefined' && process.env) {
        process.env.JWT_ALLOWED_THUMBPRINTS = 'process-thumb'
      }

      const result = allowedThumbprints()

      expect(result?.has('global-thumb')).toBe(true)
      expect(result?.has('process-thumb')).toBe(false)
    })

    test('should trim whitespace from thumbprints', () => {
      const bag = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      if (!bag) {
        ;(
          globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
        ).__FLARELETTE_ENV = {}
      }
      ;(
        globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
      ).__FLARELETTE_ENV.JWT_ALLOWED_THUMBPRINTS = ' thumb1 , thumb2 , thumb3 '

      const result = allowedThumbprints()

      expect(result?.size).toBe(3)
      expect(result?.has('thumb1')).toBe(true)
      expect(result?.has('thumb2')).toBe(true)
    })

    test('should filter out empty strings', () => {
      const bag = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      if (!bag) {
        ;(
          globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
        ).__FLARELETTE_ENV = {}
      }
      ;(
        globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
      ).__FLARELETTE_ENV.JWT_ALLOWED_THUMBPRINTS = 'thumb1,,thumb2,  ,thumb3'

      const result = allowedThumbprints()

      expect(result?.size).toBe(3)
      expect(result?.has('')).toBe(false)
    })

    test('should handle single thumbprint', () => {
      const bag = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      if (!bag) {
        ;(
          globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
        ).__FLARELETTE_ENV = {}
      }
      ;(
        globalThis as unknown as { __FLARELETTE_ENV: Record<string, string> }
      ).__FLARELETTE_ENV.JWT_ALLOWED_THUMBPRINTS = 'single-thumb'

      const result = allowedThumbprints()

      expect(result?.size).toBe(1)
      expect(result?.has('single-thumb')).toBe(true)
    })
  })
})
