import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  createJWKSUrlVerifyConfig,
  verifyWithConfig,
  createHS512Config,
  createEdDSASignConfig,
  checkAuthWithConfig,
} from '../src/explicit'
import { clearHttpJwksCache } from '../src/jwks'
import { SignJWT, generateKeyPair, exportJWK } from 'jose'

describe('explicit-jwks.test.ts - Explicit Configuration API', () => {
  beforeEach(() => {
    // Clear HTTP JWKS cache before each test
    clearHttpJwksCache()

    // Ensure environment variables don't interfere
    delete process.env.JWT_SECRET
    delete process.env.JWT_ISS
    delete process.env.JWT_AUD
    delete process.env.JWT_PUBLIC_JWK
    delete process.env.JWT_JWKS_URL
  })

  describe('createJWKSUrlVerifyConfig', () => {
    test('should create config without environment variables', () => {
      const config = createJWKSUrlVerifyConfig(
        'https://tenant.auth0.com/.well-known/jwks.json',
        {
          iss: 'https://tenant.auth0.com/',
          aud: 'my-app-client-id',
        }
      )

      expect(config).toEqual({
        alg: 'EdDSA',
        jwksUrl: 'https://tenant.auth0.com/.well-known/jwks.json',
        cacheTtl: undefined,
        iss: 'https://tenant.auth0.com/',
        aud: 'my-app-client-id',
      })
    })

    test('should accept custom cache TTL', () => {
      const config = createJWKSUrlVerifyConfig(
        'https://tenant.auth0.com/.well-known/jwks.json',
        {
          iss: 'https://tenant.auth0.com/',
          aud: 'my-app',
        },
        600 // 10 minutes
      )

      expect(config.cacheTtl).toBe(600)
    })

    test('should accept optional ttlSeconds', () => {
      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
          ttlSeconds: 1800,
        }
      )

      expect(config.ttlSeconds).toBe(1800)
    })

    test('should accept optional leeway', () => {
      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
          leeway: 120,
        }
      )

      expect(config.leeway).toBe(120)
    })
  })

  describe('verifyWithConfig - JWKS URL', () => {
    test('should verify token using HTTP JWKS without environment', async () => {
      // Generate EdDSA keypair for testing
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'test-key-1'
      publicJWK.alg = 'EdDSA' // Required by jose importJWK
      publicJWK.use = 'sig'

      // Create and sign a token
      const token = await new SignJWT({ sub: 'user123', permissions: ['read:data'] })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'test-key-1' })
        .setIssuer('https://test-issuer.com/')
        .setAudience('test-audience')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      // Mock fetch to return JWKS
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      // Create config without environment variables
      const config = createJWKSUrlVerifyConfig(
        'https://test-issuer.com/.well-known/jwks.json',
        {
          iss: 'https://test-issuer.com/',
          aud: 'test-audience',
        }
      )

      // Verify token
      const payload = await verifyWithConfig(token, config)

      expect(payload).toBeDefined()
      expect(payload?.sub).toBe('user123')
      expect(payload?.permissions).toEqual(['read:data'])
    })

    test('should return null for invalid token', async () => {
      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
        }
      )

      // Invalid token
      const payload = await verifyWithConfig('invalid.jwt.token', config)

      expect(payload).toBeNull()
    })

    test('should return null for expired token', async () => {
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'expired-key'
      publicJWK.alg = 'EdDSA'

      // Create expired token
      const token = await new SignJWT({ sub: 'user123' })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'expired-key' })
        .setIssuer('https://example.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('-1h') // Expired 1 hour ago
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload).toBeNull()
    })

    test('should return null for wrong issuer', async () => {
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'test-key'
      publicJWK.alg = 'EdDSA'

      // Token with different issuer
      const token = await new SignJWT({ sub: 'user123' })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'test-key' })
        .setIssuer('https://wrong-issuer.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://correct-issuer.com/', // Different issuer
          aud: 'my-app',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload).toBeNull()
    })

    test('should return null for wrong audience', async () => {
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'test-key'
      publicJWK.alg = 'EdDSA'

      const token = await new SignJWT({ sub: 'user123' })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'test-key' })
        .setIssuer('https://example.com/')
        .setAudience('wrong-audience')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'correct-audience',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload).toBeNull()
    })

    test('should return null when key not found in JWKS', async () => {
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'available-key'
      publicJWK.alg = 'EdDSA'

      // Token uses different kid
      const token = await new SignJWT({ sub: 'user123' })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'missing-key' })
        .setIssuer('https://example.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload).toBeNull()
    })

    test('should use custom leeway from config', async () => {
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'test-key'
      publicJWK.alg = 'EdDSA'

      // Token that's slightly expired (within custom leeway)
      const token = await new SignJWT({ sub: 'user123' })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'test-key' })
        .setIssuer('https://example.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('1s') // Will be expired soon
        .sign(privateKey)

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
          leeway: 300, // 5 minutes leeway
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload).toBeDefined()
      expect(payload?.sub).toBe('user123')
    })
  })

  describe('RSA Token Verification', () => {
    test('should verify RSA RS256 token using HTTP JWKS', async () => {
      // Generate RSA keypair
      const { privateKey, publicKey } = await generateKeyPair('RS256')
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'rsa-key-1'
      publicJWK.alg = 'RS256'
      publicJWK.use = 'sig'

      // Create RSA-signed token
      const token = await new SignJWT({ sub: 'user123', role: 'admin' })
        .setProtectedHeader({ alg: 'RS256', kid: 'rsa-key-1' })
        .setIssuer('https://auth0.example.com/')
        .setAudience('api-client-id')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://auth0.example.com/.well-known/jwks.json',
        {
          iss: 'https://auth0.example.com/',
          aud: 'api-client-id',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload).toBeDefined()
      expect(payload?.sub).toBe('user123')
      expect(payload?.role).toBe('admin')
    })

    test('should verify RSA RS384 token', async () => {
      const { privateKey, publicKey } = await generateKeyPair('RS384')
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'rsa-384-key'
      publicJWK.alg = 'RS384'

      const token = await new SignJWT({ sub: 'user456' })
        .setProtectedHeader({ alg: 'RS384', kid: 'rsa-384-key' })
        .setIssuer('https://example.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload?.sub).toBe('user456')
    })

    test('should verify RSA RS512 token', async () => {
      const { privateKey, publicKey } = await generateKeyPair('RS512')
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'rsa-512-key'
      publicJWK.alg = 'RS512'

      const token = await new SignJWT({ sub: 'user789' })
        .setProtectedHeader({ alg: 'RS512', kid: 'rsa-512-key' })
        .setIssuer('https://example.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload?.sub).toBe('user789')
    })

    test('should handle JWKS with multiple RSA keys', async () => {
      const { privateKey: _pk1, publicKey: pub1 } = await generateKeyPair('RS256')
      const { privateKey: pk2, publicKey: pub2 } = await generateKeyPair('RS256')

      const jwk1 = await exportJWK(pub1)
      jwk1.kid = 'old-key'
      jwk1.alg = 'RS256'

      const jwk2 = await exportJWK(pub2)
      jwk2.kid = 'new-key'
      jwk2.alg = 'RS256'

      // Sign with new key
      const token = await new SignJWT({ sub: 'user123' })
        .setProtectedHeader({ alg: 'RS256', kid: 'new-key' })
        .setIssuer('https://example.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(pk2)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [jwk1, jwk2] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload?.sub).toBe('user123')
    })

    test('should handle mixed EdDSA and RSA keys in JWKS', async () => {
      const { privateKey: rsaKey, publicKey: rsaPub } = await generateKeyPair('RS256')
      const { privateKey: _edKey, publicKey: edPub } = await generateKeyPair('EdDSA', {
        extractable: true,
      })

      const rsaJWK = await exportJWK(rsaPub)
      rsaJWK.kid = 'rsa-key'
      rsaJWK.alg = 'RS256'

      const edJWK = await exportJWK(edPub)
      edJWK.kid = 'ed-key'
      edJWK.alg = 'EdDSA'

      // Sign with RSA
      const token = await new SignJWT({ sub: 'rsa-user' })
        .setProtectedHeader({ alg: 'RS256', kid: 'rsa-key' })
        .setIssuer('https://example.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(rsaKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [edJWK, rsaJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload?.sub).toBe('rsa-user')
    })
  })

  describe('checkAuthWithConfig - JWKS URL', () => {
    test('should authorize user with valid token', async () => {
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'auth-key'
      publicJWK.alg = 'EdDSA'

      const token = await new SignJWT({
        sub: 'user123',
        permissions: ['read:data', 'write:data'],
        roles: ['admin'],
      })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'auth-key' })
        .setIssuer('https://example.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
        }
      )

      const authUser = await checkAuthWithConfig(token, config, {
        require_all_permissions: ['read:data'],
        require_roles_any: ['admin'],
      })

      expect(authUser).toBeDefined()
      expect(authUser?.sub).toBe('user123')
      expect(authUser?.permissions).toContain('read:data')
      expect(authUser?.roles).toContain('admin')
    })

    test('should reject user without required permissions', async () => {
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'auth-key'
      publicJWK.alg = 'EdDSA'

      const token = await new SignJWT({
        sub: 'user123',
        permissions: ['read:data'],
      })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'auth-key' })
        .setIssuer('https://example.com/')
        .setAudience('my-app')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://example.com/.well-known/jwks.json',
        {
          iss: 'https://example.com/',
          aud: 'my-app',
        }
      )

      const authUser = await checkAuthWithConfig(token, config, {
        require_all_permissions: ['write:data'], // User doesn't have this
      })

      expect(authUser).toBeNull()
    })

    test('should work without environment variables', async () => {
      // Explicitly verify no env vars are set
      expect(process.env.JWT_ISS).toBeUndefined()
      expect(process.env.JWT_AUD).toBeUndefined()
      expect(process.env.JWT_JWKS_URL).toBeUndefined()

      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'test-key'
      publicJWK.alg = 'EdDSA'

      const token = await new SignJWT({ sub: 'user123' })
        .setProtectedHeader({ alg: 'EdDSA', kid: 'test-key' })
        .setIssuer('https://explicit-config.com/')
        .setAudience('explicit-app')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://explicit-config.com/.well-known/jwks.json',
        {
          iss: 'https://explicit-config.com/',
          aud: 'explicit-app',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload?.sub).toBe('user123')
    })
  })

  describe('Cross-Mode Testing - No Environment Pollution', () => {
    test('should work alongside HS512 config without interference', async () => {
      // Create HS512 secret (base64url string)
      const secretBytes = new Uint8Array(64)
      for (let i = 0; i < 64; i++) secretBytes[i] = i
      const secret = Buffer.from(secretBytes).toString('base64url')

      const hs512Config = createHS512Config(secret, {
        iss: 'https://hs512-issuer.com/',
        aud: 'hs512-app',
      })

      // Create JWKS config
      const jwksConfig = createJWKSUrlVerifyConfig(
        'https://jwks-issuer.com/.well-known/jwks.json',
        {
          iss: 'https://jwks-issuer.com/',
          aud: 'jwks-app',
        }
      )

      // Both configs should coexist without env vars
      expect(hs512Config.alg).toBe('HS512')
      expect(jwksConfig.alg).toBe('EdDSA')
      expect(process.env.JWT_ISS).toBeUndefined()
    })

    test('should work alongside EdDSA inline config', async () => {
      const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
        extractable: true,
      })
      const privateJWK = await exportJWK(privateKey)
      const _publicJWK = await exportJWK(publicKey)

      const signConfig = createEdDSASignConfig(privateJWK, 'test-kid', {
        iss: 'https://inline-issuer.com/',
        aud: 'inline-app',
      })

      const jwksConfig = createJWKSUrlVerifyConfig(
        'https://jwks-issuer.com/.well-known/jwks.json',
        {
          iss: 'https://jwks-issuer.com/',
          aud: 'jwks-app',
        }
      )

      // Both configs should work independently
      expect(signConfig.alg).toBe('EdDSA')
      expect(jwksConfig.alg).toBe('EdDSA')
      expect(jwksConfig.jwksUrl).toBe('https://jwks-issuer.com/.well-known/jwks.json')
    })
  })

  describe('Integration-Style Tests', () => {
    test('should simulate Auth0 verification flow', async () => {
      const { privateKey, publicKey } = await generateKeyPair('RS256')
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'auth0-key-123'
      publicJWK.alg = 'RS256'
      publicJWK.use = 'sig'

      // Simulate Auth0 token
      const token = await new SignJWT({
        sub: 'auth0|123456',
        email: 'user@example.com',
        permissions: ['read:profile'],
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'auth0-key-123' })
        .setIssuer('https://tenant.auth0.com/')
        .setAudience('my-api-client-id')
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://tenant.auth0.com/.well-known/jwks.json',
        {
          iss: 'https://tenant.auth0.com/',
          aud: 'my-api-client-id',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload?.sub).toBe('auth0|123456')
      expect(payload?.email).toBe('user@example.com')
    })

    test('should simulate Okta verification flow', async () => {
      const { privateKey, publicKey } = await generateKeyPair('RS256')
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'okta-key-abc'
      publicJWK.alg = 'RS256'

      const token = await new SignJWT({
        sub: '00u123456',
        email: 'user@company.com',
        groups: ['Everyone', 'Developers'],
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'okta-key-abc' })
        .setIssuer('https://company.okta.com/oauth2/default')
        .setAudience('api://default')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://company.okta.com/oauth2/default/v1/keys',
        {
          iss: 'https://company.okta.com/oauth2/default',
          aud: 'api://default',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload?.sub).toBe('00u123456')
      expect(payload?.groups).toContain('Developers')
    })

    test('should simulate Google OAuth verification flow', async () => {
      const { privateKey, publicKey } = await generateKeyPair('RS256')
      const publicJWK = await exportJWK(publicKey)
      publicJWK.kid = 'google-key-xyz'
      publicJWK.alg = 'RS256'

      const token = await new SignJWT({
        sub: '1234567890',
        email: 'user@gmail.com',
        email_verified: true,
        name: 'Test User',
      })
        .setProtectedHeader({ alg: 'RS256', kid: 'google-key-xyz' })
        .setIssuer('https://accounts.google.com')
        .setAudience('123456-abcdefg.apps.googleusercontent.com')
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey)

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ keys: [publicJWK] }),
      })

      const config = createJWKSUrlVerifyConfig(
        'https://www.googleapis.com/oauth2/v3/certs',
        {
          iss: 'https://accounts.google.com',
          aud: '123456-abcdefg.apps.googleusercontent.com',
        }
      )

      const payload = await verifyWithConfig(token, config)

      expect(payload?.sub).toBe('1234567890')
      expect(payload?.email).toBe('user@gmail.com')
      expect(payload?.email_verified).toBe(true)
    })
  })
})
