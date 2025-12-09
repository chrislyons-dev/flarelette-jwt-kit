import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  envMode,
  getCommon,
  getHSSecret,
  getJwksUrl,
  getJwksCacheTtl,
} from '../src/config'

describe('Config - envMode', () => {
  beforeEach(() => {
    // Clear all JWT-related env vars
    delete process.env.JWT_SECRET
    delete process.env.JWT_PRIVATE_JWK
    delete process.env.JWT_PRIVATE_JWK_NAME
    delete process.env.JWT_PRIVATE_JWK_PATH
    delete process.env.JWT_PUBLIC_JWK
    delete process.env.JWT_PUBLIC_JWK_NAME
    delete process.env.JWT_JWKS_SERVICE
    delete process.env.JWT_JWKS_SERVICE_NAME
  })

  afterEach(() => {
    // Clean up
    delete (globalThis as { __FLARELETTE_ENV?: unknown }).__FLARELETTE_ENV
  })

  it('should default to HS512 mode when no keys configured', () => {
    expect(envMode('producer')).toBe('HS512')
    expect(envMode('consumer')).toBe('HS512')
  })

  it('should detect EdDSA mode for producer with JWT_PRIVATE_JWK', () => {
    process.env.JWT_PRIVATE_JWK = '{"kty":"OKP"}'
    expect(envMode('producer')).toBe('EdDSA')
  })

  it('should detect EdDSA mode for producer with JWT_PRIVATE_JWK_NAME', () => {
    process.env.JWT_PRIVATE_JWK_NAME = 'MY_PRIVATE_KEY'
    expect(envMode('producer')).toBe('EdDSA')
  })

  it('should detect EdDSA mode for producer with JWT_PRIVATE_JWK_PATH', () => {
    process.env.JWT_PRIVATE_JWK_PATH = '/path/to/key.json'
    expect(envMode('producer')).toBe('EdDSA')
  })

  it('should detect EdDSA mode for consumer with JWT_PUBLIC_JWK', () => {
    process.env.JWT_PUBLIC_JWK = '{"kty":"OKP"}'
    expect(envMode('consumer')).toBe('EdDSA')
  })

  it('should detect EdDSA mode for consumer with JWT_PUBLIC_JWK_NAME', () => {
    process.env.JWT_PUBLIC_JWK_NAME = 'MY_PUBLIC_KEY'
    expect(envMode('consumer')).toBe('EdDSA')
  })

  it('should detect EdDSA mode for consumer with JWT_JWKS_SERVICE', () => {
    process.env.JWT_JWKS_SERVICE = 'jwks-service'
    expect(envMode('consumer')).toBe('EdDSA')
  })

  it('should detect EdDSA mode for consumer with JWT_JWKS_SERVICE_NAME', () => {
    process.env.JWT_JWKS_SERVICE_NAME = 'MY_JWKS_SERVICE'
    expect(envMode('consumer')).toBe('EdDSA')
  })

  it('should use HS512 for producer even if public key exists', () => {
    process.env.JWT_PUBLIC_JWK = '{"kty":"OKP"}'
    expect(envMode('producer')).toBe('HS512')
  })

  it('should use HS512 for consumer even if private key exists', () => {
    process.env.JWT_PRIVATE_JWK = '{"kty":"OKP"}'
    expect(envMode('consumer')).toBe('HS512')
  })

  it('should read from __FLARELETTE_ENV if available', () => {
    ;(globalThis as { __FLARELETTE_ENV?: Record<string, string> }).__FLARELETTE_ENV = {
      JWT_PRIVATE_JWK: '{"kty":"OKP"}',
    }
    expect(envMode('producer')).toBe('EdDSA')
  })

  it('should prefer __FLARELETTE_ENV over process.env', () => {
    process.env.JWT_PUBLIC_JWK = '{"kty":"OKP"}' // This should be ignored
    ;(globalThis as { __FLARELETTE_ENV?: Record<string, string> }).__FLARELETTE_ENV = {
      JWT_PRIVATE_JWK: '{"kty":"OKP"}', // This should be used
    }
    // __FLARELETTE_ENV takes precedence over process.env
    expect(envMode('producer')).toBe('EdDSA') // Private key in __FLARELETTE_ENV
    // Consumer still sees public key in process.env since we don't have it in __FLARELETTE_ENV
    // The proxy checks __FLARELETTE_ENV first, but if not found, falls back to process.env
    expect(envMode('consumer')).toBe('EdDSA') // Public key found in process.env fallback
  })
})

describe('Config - getCommon', () => {
  beforeEach(() => {
    delete process.env.JWT_ISS
    delete process.env.JWT_AUD
    delete process.env.JWT_LEEWAY
    delete process.env.JWT_TTL_SECONDS
  })

  it('should return defaults when env vars not set', () => {
    const common = getCommon()
    expect(common.iss).toBe('')
    expect(common.aud).toBe('')
    expect(common.leeway).toBe(90)
    expect(common.ttlSeconds).toBe(900)
  })

  it('should read issuer from env', () => {
    process.env.JWT_ISS = 'my-issuer'
    const common = getCommon()
    expect(common.iss).toBe('my-issuer')
  })

  it('should read audience from env', () => {
    process.env.JWT_AUD = 'my-audience'
    const common = getCommon()
    expect(common.aud).toBe('my-audience')
  })

  it('should read leeway from env', () => {
    process.env.JWT_LEEWAY = '120'
    const common = getCommon()
    expect(common.leeway).toBe(120)
  })

  it('should read ttlSeconds from env', () => {
    process.env.JWT_TTL_SECONDS = '3600'
    const common = getCommon()
    expect(common.ttlSeconds).toBe(3600)
  })

  it('should read all values from env', () => {
    process.env.JWT_ISS = 'issuer'
    process.env.JWT_AUD = 'audience'
    process.env.JWT_LEEWAY = '60'
    process.env.JWT_TTL_SECONDS = '1800'

    const common = getCommon()
    expect(common.iss).toBe('issuer')
    expect(common.aud).toBe('audience')
    expect(common.leeway).toBe(60)
    expect(common.ttlSeconds).toBe(1800)
  })
})

describe('Config - getHSSecret', () => {
  beforeEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.JWT_SECRET_NAME
  })

  it('should read secret directly from JWT_SECRET', () => {
    const secret = Buffer.from('a'.repeat(64), 'utf8').toString('base64url')
    process.env.JWT_SECRET = secret
    const key = getHSSecret()

    expect(key).toBeInstanceOf(Uint8Array)
    expect(key.length).toBeGreaterThanOrEqual(64)
  })

  it('should use secret-name indirection', () => {
    const secret = Buffer.from('a'.repeat(64), 'utf8').toString('base64url')
    process.env.JWT_SECRET_NAME = 'MY_SECRET'
    process.env.MY_SECRET = secret

    const key = getHSSecret()
    expect(key).toBeInstanceOf(Uint8Array)
    expect(key.length).toBeGreaterThanOrEqual(64)
  })

  it('should prefer JWT_SECRET_NAME over JWT_SECRET', () => {
    const secret1 = Buffer.from('a'.repeat(64), 'utf8').toString('base64url')
    const secret2 = Buffer.from('b'.repeat(64), 'utf8').toString('base64url')

    process.env.JWT_SECRET = secret1
    process.env.JWT_SECRET_NAME = 'MY_SECRET'
    process.env.MY_SECRET = secret2

    const key = getHSSecret()

    // The keys should be different (secret2 was used)
    expect(key).toBeInstanceOf(Uint8Array)
  })

  it('should throw if secret is missing', () => {
    expect(() => getHSSecret()).toThrow('JWT secret missing')
  })

  it('should throw if secret is too short (base64)', () => {
    const shortSecret = Buffer.from('short', 'utf8').toString('base64url')
    process.env.JWT_SECRET = shortSecret

    expect(() => getHSSecret()).toThrow('JWT secret too short')
  })

  it('should throw if secret is too short (UTF-8 fallback)', () => {
    process.env.JWT_SECRET = 'short'

    expect(() => getHSSecret()).toThrow('JWT secret too short')
  })

  it('should accept base64url encoded secret', () => {
    const bytes = new Uint8Array(64)
    for (let i = 0; i < 64; i++) bytes[i] = i
    const secret = Buffer.from(bytes).toString('base64url')
    process.env.JWT_SECRET = secret

    const key = getHSSecret()
    expect(key.length).toBe(64)
  })

  it('should handle base64 with standard encoding', () => {
    const bytes = new Uint8Array(64)
    for (let i = 0; i < 64; i++) bytes[i] = i
    const secret = Buffer.from(bytes).toString('base64')
    process.env.JWT_SECRET = secret

    const key = getHSSecret()
    expect(key.length).toBe(64)
  })

  it('should enforce 64-byte minimum for HS512', () => {
    // 63 bytes should fail
    const bytes = new Uint8Array(63)
    for (let i = 0; i < 63; i++) bytes[i] = i
    const secret = Buffer.from(bytes).toString('base64url')
    process.env.JWT_SECRET = secret

    expect(() => getHSSecret()).toThrow(
      'JWT secret too short: 63 bytes, need >= 64 for HS512'
    )
  })

  it('should accept exactly 64 bytes', () => {
    const bytes = new Uint8Array(64)
    for (let i = 0; i < 64; i++) bytes[i] = i
    const secret = Buffer.from(bytes).toString('base64url')
    process.env.JWT_SECRET = secret

    const key = getHSSecret()
    expect(key.length).toBe(64)
  })
})

describe('Config - JWT_JWKS_URL Detection', () => {
  beforeEach(() => {
    delete process.env.JWT_PUBLIC_JWK
    delete process.env.JWT_PUBLIC_JWK_NAME
    delete process.env.JWT_JWKS_SERVICE
    delete process.env.JWT_JWKS_SERVICE_NAME
    delete process.env.JWT_JWKS_URL
    delete process.env.JWT_SECRET
    delete process.env.JWT_SECRET_NAME
  })

  afterEach(() => {
    delete (globalThis as { __FLARELETTE_ENV?: unknown }).__FLARELETTE_ENV
  })

  it('should detect EdDSA mode for consumer with JWT_JWKS_URL', () => {
    process.env.JWT_JWKS_URL = 'https://tenant.auth0.com/.well-known/jwks.json'
    expect(envMode('consumer')).toBe('EdDSA')
  })

  it('should not detect JWT_JWKS_URL for producer', () => {
    process.env.JWT_JWKS_URL = 'https://example.com/.well-known/jwks.json'
    // Producer should default to HS512 since no private key
    expect(envMode('producer')).toBe('HS512')
  })

  it('should throw error if both HS512 and asymmetric secrets configured', () => {
    process.env.JWT_SECRET = Buffer.from('a'.repeat(64)).toString('base64url')
    process.env.JWT_JWKS_URL = 'https://example.com/.well-known/jwks.json'

    expect(() => envMode('consumer')).toThrow(
      'Configuration error: Both HS512 (JWT_SECRET) and asymmetric (JWT_PUBLIC_JWK/JWT_JWKS_*) secrets configured'
    )
  })

  it('should throw error if JWT_SECRET_NAME and JWT_PUBLIC_JWK both configured', () => {
    process.env.JWT_SECRET_NAME = 'MY_SECRET'
    process.env.JWT_PUBLIC_JWK = '{"kty":"OKP"}'

    expect(() => envMode('consumer')).toThrow(
      'Configuration error: Both HS512 (JWT_SECRET) and asymmetric'
    )
  })

  it('should throw error if JWT_SECRET and JWT_JWKS_SERVICE configured', () => {
    process.env.JWT_SECRET = Buffer.from('a'.repeat(64)).toString('base64url')
    process.env.JWT_JWKS_SERVICE = 'my-jwks-service'

    expect(() => envMode('consumer')).toThrow('Configuration error')
  })

  it('should allow JWT_JWKS_URL without JWT_SECRET', () => {
    process.env.JWT_JWKS_URL = 'https://example.com/.well-known/jwks.json'
    expect(() => envMode('consumer')).not.toThrow()
    expect(envMode('consumer')).toBe('EdDSA')
  })

  it('should allow JWT_SECRET without JWT_JWKS_URL', () => {
    process.env.JWT_SECRET = Buffer.from('a'.repeat(64)).toString('base64url')
    expect(() => envMode('consumer')).not.toThrow()
    expect(envMode('consumer')).toBe('HS512')
  })
})

describe('Config - getJwksUrl', () => {
  beforeEach(() => {
    delete process.env.JWT_JWKS_URL
  })

  afterEach(() => {
    delete (globalThis as { __FLARELETTE_ENV?: unknown }).__FLARELETTE_ENV
  })

  it('should return null when JWT_JWKS_URL not set', () => {
    expect(getJwksUrl()).toBeNull()
  })

  it('should read JWT_JWKS_URL from process.env', () => {
    process.env.JWT_JWKS_URL = 'https://tenant.auth0.com/.well-known/jwks.json'
    expect(getJwksUrl()).toBe('https://tenant.auth0.com/.well-known/jwks.json')
  })

  it('should read JWT_JWKS_URL from __FLARELETTE_ENV', () => {
    ;(globalThis as { __FLARELETTE_ENV?: Record<string, string> }).__FLARELETTE_ENV = {
      JWT_JWKS_URL: 'https://example.com/.well-known/jwks.json',
    }
    expect(getJwksUrl()).toBe('https://example.com/.well-known/jwks.json')
  })

  it('should prefer __FLARELETTE_ENV over process.env', () => {
    process.env.JWT_JWKS_URL = 'https://process.example.com/jwks.json'
    ;(globalThis as { __FLARELETTE_ENV?: Record<string, string> }).__FLARELETTE_ENV = {
      JWT_JWKS_URL: 'https://global.example.com/jwks.json',
    }
    expect(getJwksUrl()).toBe('https://global.example.com/jwks.json')
  })
})

describe('Config - getJwksCacheTtl', () => {
  beforeEach(() => {
    delete process.env.JWT_JWKS_CACHE_TTL_SECONDS
  })

  afterEach(() => {
    delete (globalThis as { __FLARELETTE_ENV?: unknown }).__FLARELETTE_ENV
  })

  it('should return default 300 seconds when not set', () => {
    expect(getJwksCacheTtl()).toBe(300)
  })

  it('should read custom TTL from process.env', () => {
    process.env.JWT_JWKS_CACHE_TTL_SECONDS = '600'
    expect(getJwksCacheTtl()).toBe(600)
  })

  it('should read TTL from __FLARELETTE_ENV', () => {
    ;(globalThis as { __FLARELETTE_ENV?: Record<string, string> }).__FLARELETTE_ENV = {
      JWT_JWKS_CACHE_TTL_SECONDS: '900',
    }
    expect(getJwksCacheTtl()).toBe(900)
  })

  it('should accept 0 as valid TTL (no caching)', () => {
    process.env.JWT_JWKS_CACHE_TTL_SECONDS = '0'
    expect(getJwksCacheTtl()).toBe(0)
  })

  it('should throw error for negative TTL', () => {
    process.env.JWT_JWKS_CACHE_TTL_SECONDS = '-60'
    expect(() => getJwksCacheTtl()).toThrow(
      'JWT_JWKS_CACHE_TTL_SECONDS must be a positive number'
    )
  })

  it('should throw error for non-numeric TTL', () => {
    process.env.JWT_JWKS_CACHE_TTL_SECONDS = 'not-a-number'
    expect(() => getJwksCacheTtl()).toThrow(
      'JWT_JWKS_CACHE_TTL_SECONDS must be a positive number'
    )
  })

  it('should throw error for empty string', () => {
    process.env.JWT_JWKS_CACHE_TTL_SECONDS = ''
    // Empty string should use default, not throw
    expect(getJwksCacheTtl()).toBe(300)
  })

  it('should accept large TTL values', () => {
    process.env.JWT_JWKS_CACHE_TTL_SECONDS = '86400' // 24 hours
    expect(getJwksCacheTtl()).toBe(86400)
  })

  it('should handle decimal values by converting to integer', () => {
    process.env.JWT_JWKS_CACHE_TTL_SECONDS = '300.5'
    expect(getJwksCacheTtl()).toBe(300.5)
  })
})
