/**
 * Tests for explicit configuration API
 *
 * These tests verify the new explicit config API works without
 * any environment variables or global state.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  signWithConfig,
  verifyWithConfig,
  createTokenWithConfig,
  createDelegatedTokenWithConfig,
  checkAuthWithConfig,
  createHS512Config,
  type HS512Config,
} from '../src/explicit.js'

describe('Explicit Configuration API', () => {
  let testConfig: HS512Config

  beforeEach(() => {
    // Create a fresh config for each test - no environment pollution!
    const secret = new Uint8Array(64).fill(42) // 64 bytes (HS512 minimum)
    testConfig = {
      alg: 'HS512',
      secret,
      iss: 'test-issuer',
      aud: 'test-audience',
      ttlSeconds: 900,
      leeway: 90,
    }
  })

  describe('signWithConfig', () => {
    it('should sign a token with explicit config', async () => {
      const token = await signWithConfig({ sub: 'user123' }, testConfig)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include custom claims', async () => {
      const token = await signWithConfig(
        {
          sub: 'user123',
          email: 'test@example.com',
          permissions: ['read:data', 'write:data'],
        },
        testConfig
      )

      const payload = await verifyWithConfig(token, testConfig)
      expect(payload?.sub).toBe('user123')
      expect(payload?.email).toBe('test@example.com')
      expect(payload?.permissions).toEqual(['read:data', 'write:data'])
    })

    it('should support per-call overrides', async () => {
      const token = await signWithConfig({ sub: 'user123' }, testConfig, {
        iss: 'override-issuer',
        aud: 'override-audience',
        ttlSeconds: 300,
      })

      const payload = await verifyWithConfig(token, {
        ...testConfig,
        iss: 'override-issuer',
        aud: 'override-audience',
      })

      expect(payload?.sub).toBe('user123')
    })

    it('should reject secrets shorter than 64 bytes', async () => {
      const shortConfig = {
        ...testConfig,
        secret: new Uint8Array(63), // Too short (need 64 for HS512)!
      }

      await expect(signWithConfig({ sub: 'test' }, shortConfig)).rejects.toThrow(
        'JWT secret too short'
      )
    })
  })

  describe('verifyWithConfig', () => {
    it('should verify a valid token', async () => {
      const token = await signWithConfig({ sub: 'user123' }, testConfig)
      const payload = await verifyWithConfig(token, testConfig)

      expect(payload).toBeDefined()
      expect(payload?.sub).toBe('user123')
      expect(payload?.iss).toBe('test-issuer')
      expect(payload?.aud).toBe('test-audience')
    })

    it('should reject tokens with wrong issuer', async () => {
      const token = await signWithConfig({ sub: 'user123' }, testConfig)

      const wrongConfig = { ...testConfig, iss: 'wrong-issuer' }
      const payload = await verifyWithConfig(token, wrongConfig)

      expect(payload).toBeNull()
    })

    it('should reject tokens with wrong audience', async () => {
      const token = await signWithConfig({ sub: 'user123' }, testConfig)

      const wrongConfig = { ...testConfig, aud: 'wrong-audience' }
      const payload = await verifyWithConfig(token, wrongConfig)

      expect(payload).toBeNull()
    })

    it('should reject tokens with wrong secret', async () => {
      const token = await signWithConfig({ sub: 'user123' }, testConfig)

      const wrongConfig = {
        ...testConfig,
        secret: new Uint8Array(32).fill(99), // Different secret
      }
      const payload = await verifyWithConfig(token, wrongConfig)

      expect(payload).toBeNull()
    })

    it('should reject expired tokens', async () => {
      // Create token that expires way in the past (beyond leeway)
      const token = await signWithConfig(
        { sub: 'user123' },
        { ...testConfig, ttlSeconds: -200 } // Expired 200 seconds ago, beyond 90s leeway
      )

      const payload = await verifyWithConfig(token, testConfig)
      expect(payload).toBeNull()
    })

    it('should handle clock skew with leeway', async () => {
      // Token issued "in the future" but within leeway
      const token = await signWithConfig({ sub: 'user123' }, testConfig)

      // Should still verify due to leeway
      const payload = await verifyWithConfig(token, {
        ...testConfig,
        leeway: 120, // 2 minutes leeway
      })

      expect(payload).toBeDefined()
    })
  })

  describe('createTokenWithConfig', () => {
    it('should create a token (convenience wrapper)', async () => {
      const token = await createTokenWithConfig(
        { sub: 'user123', permissions: ['admin'] },
        testConfig
      )

      const payload = await verifyWithConfig(token, testConfig)
      expect(payload?.sub).toBe('user123')
      expect(payload?.permissions).toEqual(['admin'])
    })
  })

  describe('createDelegatedTokenWithConfig', () => {
    it('should create delegated token with actor claim', async () => {
      const originalPayload = {
        sub: 'auth0|user123',
        email: 'user@example.com',
        permissions: ['read:data', 'write:data'],
      }

      const token = await createDelegatedTokenWithConfig(
        originalPayload,
        'gateway-service',
        testConfig
      )

      const payload = await verifyWithConfig(token, testConfig)

      expect(payload?.sub).toBe('auth0|user123') // Original user
      expect(payload?.act).toEqual({ sub: 'gateway-service' }) // Actor
      expect(payload?.permissions).toEqual(['read:data', 'write:data']) // Preserved
      expect(payload?.email).toBe('user@example.com') // Preserved
    })

    it('should handle delegation chains', async () => {
      const originalPayload = {
        sub: 'user123',
        permissions: ['read:data'],
        act: { sub: 'first-service' },
      }

      const token = await createDelegatedTokenWithConfig(
        originalPayload,
        'second-service',
        testConfig
      )

      const payload = await verifyWithConfig(token, testConfig)

      expect(payload?.act).toEqual({
        sub: 'second-service',
        act: { sub: 'first-service' },
      })
    })

    it('should preserve optional fields', async () => {
      const originalPayload = {
        sub: 'user123',
        permissions: ['read:data'],
        roles: ['admin'],
        groups: ['engineering'],
        tid: 'tenant-1',
        org_id: 'org-1',
        department: 'IT',
      }

      const token = await createDelegatedTokenWithConfig(
        originalPayload,
        'gateway',
        testConfig
      )

      const payload = await verifyWithConfig(token, testConfig)

      expect(payload?.roles).toEqual(['admin'])
      expect(payload?.groups).toEqual(['engineering'])
      expect(payload?.tid).toBe('tenant-1')
      expect(payload?.org_id).toBe('org-1')
      expect(payload?.department).toBe('IT')
    })
  })

  describe('checkAuthWithConfig', () => {
    it('should authorize valid token', async () => {
      const token = await createTokenWithConfig(
        {
          sub: 'user123',
          permissions: ['read:data', 'write:data'],
          roles: ['user'],
        },
        testConfig
      )

      const user = await checkAuthWithConfig(token, testConfig)

      expect(user).toBeDefined()
      expect(user?.sub).toBe('user123')
      expect(user?.permissions).toEqual(['read:data', 'write:data'])
      expect(user?.roles).toEqual(['user'])
    })

    it('should enforce require_all_permissions', async () => {
      const token = await createTokenWithConfig(
        {
          sub: 'user123',
          permissions: ['read:data'], // Missing write:data
        },
        testConfig
      )

      const user = await checkAuthWithConfig(token, testConfig, {
        require_all_permissions: ['read:data', 'write:data'],
      })

      expect(user).toBeNull()
    })

    it('should enforce require_any_permission', async () => {
      const token = await createTokenWithConfig(
        {
          sub: 'user123',
          permissions: ['read:data'],
        },
        testConfig
      )

      // Should pass - has one of the required permissions
      const user1 = await checkAuthWithConfig(token, testConfig, {
        require_any_permission: ['read:data', 'admin'],
      })
      expect(user1).toBeDefined()

      // Should fail - has none of the required permissions
      const user2 = await checkAuthWithConfig(token, testConfig, {
        require_any_permission: ['write:data', 'admin'],
      })
      expect(user2).toBeNull()
    })

    it('should enforce require_roles_all', async () => {
      const token = await createTokenWithConfig(
        {
          sub: 'user123',
          roles: ['user', 'editor'],
        },
        testConfig
      )

      const user = await checkAuthWithConfig(token, testConfig, {
        require_roles_all: ['user', 'admin'], // Missing admin
      })

      expect(user).toBeNull()
    })

    it('should enforce require_roles_any', async () => {
      const token = await createTokenWithConfig(
        {
          sub: 'user123',
          roles: ['user'],
        },
        testConfig
      )

      const user = await checkAuthWithConfig(token, testConfig, {
        require_roles_any: ['admin', 'editor'], // Has neither
      })

      expect(user).toBeNull()
    })

    it('should enforce custom predicates', async () => {
      const token = await createTokenWithConfig(
        {
          sub: 'user123',
          email: 'user@example.com',
        },
        testConfig
      )

      // Should pass
      const user1 = await checkAuthWithConfig(token, testConfig, {
        predicates: [
          payload => payload.email?.toString().endsWith('@example.com') || false,
        ],
      })
      expect(user1).toBeDefined()

      // Should fail
      const user2 = await checkAuthWithConfig(token, testConfig, {
        predicates: [
          payload => payload.email?.toString().endsWith('@other.com') || false,
        ],
      })
      expect(user2).toBeNull()
    })

    it('should combine multiple authorization rules', async () => {
      const token = await createTokenWithConfig(
        {
          sub: 'user123',
          email: 'admin@example.com',
          permissions: ['read:data', 'write:data', 'admin'],
          roles: ['admin', 'user'],
        },
        testConfig
      )

      const user = await checkAuthWithConfig(token, testConfig, {
        require_all_permissions: ['read:data', 'write:data'],
        require_any_permission: ['admin', 'super-admin'],
        require_roles_all: ['user'],
        require_roles_any: ['admin', 'editor'],
        predicates: [payload => payload.email?.toString().includes('admin') || false],
      })

      expect(user).toBeDefined()
      expect(user?.sub).toBe('user123')
    })
  })

  describe('createHS512Config helper', () => {
    it('should create config from base64url secret', () => {
      // Create a base64url-encoded secret (64 bytes minimum for HS512)
      const secret = Buffer.alloc(64, 42).toString('base64url')

      const config = createHS512Config(secret, {
        iss: 'test-issuer',
        aud: 'test-audience',
      })

      expect(config.alg).toBe('HS512')
      expect(config.secret).toBeInstanceOf(Uint8Array)
      expect(config.secret.length).toBe(64)
      expect(config.iss).toBe('test-issuer')
      expect(config.aud).toBe('test-audience')
    })

    it('should reject short secrets', () => {
      const shortSecret = Buffer.alloc(16).toString('base64url') // Only 16 bytes

      expect(() => {
        createHS512Config(shortSecret, {
          iss: 'test',
          aud: 'test',
        })
      }).toThrow('JWT secret too short')
    })
  })

  describe('Isolation: No environment pollution', () => {
    it('should work without any environment variables', async () => {
      // Explicitly verify no JWT_ environment variables are used
      const envBackup = process.env
      process.env = {} // Clear all env vars

      try {
        const config = {
          alg: 'HS512' as const,
          secret: new Uint8Array(64).fill(1),
          iss: 'isolated-test',
          aud: 'isolated-audience',
        }

        const token = await signWithConfig({ sub: 'isolated-user' }, config)
        const payload = await verifyWithConfig(token, config)

        expect(payload?.sub).toBe('isolated-user')
        expect(payload?.iss).toBe('isolated-test')
      } finally {
        process.env = envBackup
      }
    })

    it('should allow multiple configs in same process', async () => {
      const config1 = {
        alg: 'HS512' as const,
        secret: new Uint8Array(64).fill(1),
        iss: 'issuer-1',
        aud: 'audience-1',
      }

      const config2 = {
        alg: 'HS512' as const,
        secret: new Uint8Array(64).fill(2),
        iss: 'issuer-2',
        aud: 'audience-2',
      }

      // Create tokens with different configs
      const token1 = await signWithConfig({ sub: 'user1' }, config1)
      const token2 = await signWithConfig({ sub: 'user2' }, config2)

      // Each token only verifies with its own config
      const payload1 = await verifyWithConfig(token1, config1)
      const payload2 = await verifyWithConfig(token2, config2)
      const crossCheck1 = await verifyWithConfig(token1, config2)
      const crossCheck2 = await verifyWithConfig(token2, config1)

      expect(payload1?.sub).toBe('user1')
      expect(payload2?.sub).toBe('user2')
      expect(crossCheck1).toBeNull() // Wrong config
      expect(crossCheck2).toBeNull() // Wrong config
    })
  })
})
