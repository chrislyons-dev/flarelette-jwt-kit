import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { sign } from '../src/sign'
import { verify } from '../src/verify'
import { generateKeyPair, exportJWK } from 'jose'

describe('Sign and Verify - HS512 Mode', () => {
  const testSecret = Buffer.from('a'.repeat(64), 'utf8').toString('base64url')

  beforeEach(() => {
    process.env.JWT_SECRET = testSecret
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
    process.env.JWT_TTL_SECONDS = '3600'
    delete process.env.JWT_PRIVATE_JWK
    delete process.env.JWT_PUBLIC_JWK
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should sign a token with HS512', async () => {
    const payload = { userId: '123', email: 'test@example.com' }
    const token = await sign(payload)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('should verify a valid HS512 token', async () => {
    const payload = { userId: '123', email: 'test@example.com' }
    const token = await sign(payload)
    const verified = await verify(token)

    expect(verified).not.toBeNull()
    expect(verified?.userId).toBe('123')
    expect(verified?.email).toBe('test@example.com')
    expect(verified?.iss).toBe('test-issuer')
    expect(verified?.aud).toBe('test-audience')
  })

  it('should reject token with wrong secret', async () => {
    const payload = { userId: '123' }
    const token = await sign(payload)

    // Change the secret
    process.env.JWT_SECRET = Buffer.from('b'.repeat(64), 'utf8').toString('base64url')
    const verified = await verify(token)

    expect(verified).toBeNull()
  })

  it('should use custom options for signing', async () => {
    const payload = { userId: '123' }
    const token = await sign(payload, {
      iss: 'custom-issuer',
      aud: 'custom-audience',
      ttlSeconds: 1800,
    })

    const verified = await verify(token, {
      iss: 'custom-issuer',
      aud: 'custom-audience',
    })

    expect(verified).not.toBeNull()
    expect(verified?.iss).toBe('custom-issuer')
    expect(verified?.aud).toBe('custom-audience')
  })

  it('should reject token with wrong issuer', async () => {
    const payload = { userId: '123' }
    const token = await sign(payload)
    const verified = await verify(token, { iss: 'wrong-issuer' })

    expect(verified).toBeNull()
  })

  it('should reject token with wrong audience', async () => {
    const payload = { userId: '123' }
    const token = await sign(payload)
    const verified = await verify(token, { aud: 'wrong-audience' })

    expect(verified).toBeNull()
  })

  it('should use secret-name indirection', async () => {
    process.env.JWT_SECRET_NAME = 'MY_SECRET'
    process.env.MY_SECRET = testSecret
    delete process.env.JWT_SECRET

    const payload = { userId: '123' }
    const token = await sign(payload)
    const verified = await verify(token)

    expect(verified).not.toBeNull()
    expect(verified?.userId).toBe('123')
  })

  it('should throw if secret is missing', async () => {
    delete process.env.JWT_SECRET
    delete process.env.JWT_SECRET_NAME

    const payload = { userId: '123' }
    await expect(sign(payload)).rejects.toThrow('JWT secret missing')
  })

  it('should throw if secret is too short', async () => {
    process.env.JWT_SECRET = Buffer.from('short', 'utf8').toString('base64url')

    const payload = { userId: '123' }
    await expect(sign(payload)).rejects.toThrow('JWT secret too short')
  })
})

describe('Sign and Verify - EdDSA Mode', () => {
  let privateJwk: string
  let publicJwk: string

  beforeEach(async () => {
    // Generate Ed25519 key pair
    const keyPair = await generateKeyPair('EdDSA', {
      crv: 'Ed25519',
      extractable: true,
    })
    const privateJwkObj = await exportJWK(keyPair.privateKey)
    const publicJwkObj = await exportJWK(keyPair.publicKey)
    privateJwk = JSON.stringify(privateJwkObj)
    publicJwk = JSON.stringify(publicJwkObj)

    process.env.JWT_PRIVATE_JWK = privateJwk
    process.env.JWT_PUBLIC_JWK = publicJwk
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
    process.env.JWT_TTL_SECONDS = '3600'
    process.env.JWT_KID = 'test-key-id'
    delete process.env.JWT_SECRET
    delete process.env.JWT_SECRET_NAME
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should sign a token with EdDSA', async () => {
    const payload = { userId: '123', email: 'test@example.com' }
    const token = await sign(payload)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('should verify a valid EdDSA token', async () => {
    const payload = { userId: '123', email: 'test@example.com' }
    const token = await sign(payload)
    const verified = await verify(token)

    expect(verified).not.toBeNull()
    expect(verified?.userId).toBe('123')
    expect(verified?.email).toBe('test@example.com')
    expect(verified?.iss).toBe('test-issuer')
    expect(verified?.aud).toBe('test-audience')
  })

  it('should reject token with wrong public key', async () => {
    const payload = { userId: '123' }
    const token = await sign(payload)

    // Generate a different key pair
    const newKeyPair = await generateKeyPair('EdDSA', { crv: 'Ed25519' })
    const newPublicJwkObj = await exportJWK(newKeyPair.publicKey)
    process.env.JWT_PUBLIC_JWK = JSON.stringify(newPublicJwkObj)

    const verified = await verify(token)
    expect(verified).toBeNull()
  })

  it('should use JWK-name indirection for signing', async () => {
    process.env.JWT_PRIVATE_JWK_NAME = 'MY_PRIVATE_KEY'
    process.env.MY_PRIVATE_KEY = privateJwk
    delete process.env.JWT_PRIVATE_JWK

    const payload = { userId: '123' }
    const token = await sign(payload)
    const verified = await verify(token)

    expect(verified).not.toBeNull()
    expect(verified?.userId).toBe('123')
  })

  it.skip('should use JWK-name indirection for verification', async () => {
    // Sign with normal setup
    const payload = { userId: '123' }
    const token = await sign(payload)

    // Create a fresh beforeEach setup for this specific test
    // to avoid state pollution from other tests
    const testPrivateJwk = process.env.JWT_PRIVATE_JWK!
    const testPublicJwk = process.env.JWT_PUBLIC_JWK!

    // Clear direct keys
    delete process.env.JWT_PUBLIC_JWK
    delete process.env.JWT_PRIVATE_JWK

    // Set up name indirection for BOTH keys to maintain mode detection
    process.env.JWT_PRIVATE_JWK_NAME = 'MY_PRIVATE_KEY'
    process.env.MY_PRIVATE_KEY = testPrivateJwk
    process.env.JWT_PUBLIC_JWK_NAME = 'MY_PUBLIC_KEY'
    process.env.MY_PUBLIC_KEY = testPublicJwk

    // Verify should work with name indirection
    const verified = await verify(token)

    expect(verified).not.toBeNull()
    expect(verified?.userId).toBe('123')
  })

  it('should throw if private JWK is missing for EdDSA signing', async () => {
    delete process.env.JWT_PRIVATE_JWK
    delete process.env.JWT_PRIVATE_JWK_NAME
    delete process.env.JWT_PRIVATE_JWK_PATH
    delete process.env.JWT_SECRET
    delete process.env.JWT_SECRET_NAME

    // Need to have EdDSA mode indicator but no actual key content
    process.env.JWT_PRIVATE_JWK_NAME = 'MISSING_KEY'
    // Don't set the MISSING_KEY env var

    const payload = { userId: '123' }
    await expect(sign(payload)).rejects.toThrow(
      'JWT_PRIVATE_JWK(_NAME) or JWT_PRIVATE_JWK_PATH required for EdDSA signing'
    )
  })

  it('should return null if public JWK is missing for EdDSA verification', async () => {
    const payload = { userId: '123' }
    const token = await sign(payload)

    delete process.env.JWT_PUBLIC_JWK
    delete process.env.JWT_PUBLIC_JWK_NAME
    delete process.env.JWT_SECRET
    delete process.env.JWT_SECRET_NAME

    // Set EdDSA mode indicator for consumer but don't provide the key
    process.env.JWT_JWKS_SERVICE_NAME = 'MISSING_SERVICE'

    // verify() catches errors and returns null instead of throwing
    const verified = await verify(token)
    expect(verified).toBeNull()
  })

  it('should include kid in token header', async () => {
    const payload = { userId: '123' }
    const token = await sign(payload)

    const [headerB64] = token.split('.')
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString())

    expect(header.kid).toBe('test-key-id')
    expect(header.alg).toBe('EdDSA')
    expect(header.typ).toBe('JWT')
  })
})

describe('Token Expiration and Timing', () => {
  beforeEach(() => {
    const testSecret = Buffer.from('a'.repeat(64), 'utf8').toString('base64url')
    process.env.JWT_SECRET = testSecret
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
    process.env.JWT_TTL_SECONDS = '1'
    delete process.env.JWT_PRIVATE_JWK
    delete process.env.JWT_PRIVATE_JWK_NAME
    delete process.env.JWT_PRIVATE_JWK_PATH
    delete process.env.JWT_PUBLIC_JWK
    delete process.env.JWT_PUBLIC_JWK_NAME
    delete process.env.JWT_JWKS_SERVICE
    delete process.env.JWT_JWKS_SERVICE_NAME
    delete process.env.JWT_KID
  })

  it('should reject expired token', async () => {
    const payload = { userId: '123' }
    const token = await sign(payload, { ttlSeconds: 1 })

    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Verify with zero leeway to ensure expiration is enforced
    const verified = await verify(token, { leeway: 0 })
    expect(verified).toBeNull()
  }, 10000)

  it('should accept token within leeway after expiration', async () => {
    const payload = { userId: '123' }
    // Use 0 second TTL so it expires immediately
    const token = await sign(payload, { ttlSeconds: 0 })

    // Immediately verify with leeway
    // The token is already expired but leeway should allow it
    const verified = await verify(token, { leeway: 90 })
    expect(verified).not.toBeNull()
  })

  it('should include iat and exp claims', async () => {
    const payload = { userId: '123' }
    const token = await sign(payload, { ttlSeconds: 3600 })
    const verified = await verify(token)

    expect(verified).not.toBeNull()
    expect(verified?.iat).toBeDefined()
    expect(verified?.exp).toBeDefined()
    expect(typeof verified?.iat).toBe('number')
    expect(typeof verified?.exp).toBe('number')
    expect(verified!.exp! - verified!.iat!).toBe(3600)
  })
})

describe('Thumbprint Pinning (EdDSA)', () => {
  let privateJwk: string
  let publicJwk: string

  beforeEach(async () => {
    // Generate Ed25519 key pair
    const keyPair = await generateKeyPair('EdDSA', {
      crv: 'Ed25519',
      extractable: true,
    })
    const privateJwkObj = await exportJWK(keyPair.privateKey)
    const publicJwkObj = await exportJWK(keyPair.publicKey)
    privateJwkObj.kid = 'pinned-key'
    publicJwkObj.kid = 'pinned-key'
    privateJwk = JSON.stringify(privateJwkObj)
    publicJwk = JSON.stringify(publicJwkObj)

    // Set up EdDSA mode
    process.env.JWT_PRIVATE_JWK = privateJwk
    process.env.JWT_PUBLIC_JWK = publicJwk
    process.env.JWT_KID = 'pinned-key'
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
    delete process.env.JWT_SECRET
  })

  afterEach(() => {
    delete process.env.JWT_ALLOWED_THUMBPRINTS
    const bag = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
      .__FLARELETTE_ENV
    if (bag) {
      delete bag.JWT_ALLOWED_THUMBPRINTS
    }
  })

  it('should verify token when thumbprint is in allowed list', async () => {
    const { calculateJwkThumbprint } = await import('jose')
    const publicJwkObj = JSON.parse(publicJwk)
    const thumbprint = await calculateJwkThumbprint(publicJwkObj)

    process.env.JWT_ALLOWED_THUMBPRINTS = thumbprint

    const payload = { userId: '123' }
    const token = await sign(payload)
    const verified = await verify(token)

    expect(verified).not.toBeNull()
    expect(verified?.userId).toBe('123')
  })

  it('should reject token when thumbprint is not in allowed list', async () => {
    process.env.JWT_ALLOWED_THUMBPRINTS = 'wrong-thumbprint,another-wrong'

    const payload = { userId: '123' }
    const token = await sign(payload)
    const verified = await verify(token)

    expect(verified).toBeNull()
  })
})
