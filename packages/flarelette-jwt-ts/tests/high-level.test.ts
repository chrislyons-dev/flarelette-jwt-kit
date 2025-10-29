import { describe, it, expect, beforeEach } from 'vitest'
import { createToken, checkAuth, policy } from '../src/high'

describe('High-Level API - createToken', () => {
  beforeEach(() => {
    const testSecret = Buffer.from('a'.repeat(64), 'utf8').toString('base64url')
    process.env.JWT_SECRET = testSecret
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
    process.env.JWT_TTL_SECONDS = '3600'
    delete process.env.JWT_PRIVATE_JWK
  })

  it('should create a token', async () => {
    const claims = { userId: '123', email: 'test@example.com' }
    const token = await createToken(claims)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('should create token with custom options', async () => {
    const claims = { userId: '123' }
    const token = await createToken(claims, {
      iss: 'custom-issuer',
      aud: 'custom-audience',
      ttlSeconds: 1800,
    })

    expect(token).toBeDefined()
  })
})

describe('High-Level API - checkAuth', () => {
  beforeEach(() => {
    const testSecret = Buffer.from('a'.repeat(64), 'utf8').toString('base64url')
    process.env.JWT_SECRET = testSecret
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
    process.env.JWT_TTL_SECONDS = '3600'
    delete process.env.JWT_PRIVATE_JWK
  })

  it('should check basic auth without requirements', async () => {
    const claims = { sub: 'user123', userId: '123' }
    const token = await createToken(claims)
    const result = await checkAuth(token, {})

    expect(result).not.toBeNull()
    expect(result?.sub).toBe('user123')
    expect(result?.payload.userId).toBe('123')
  })

  it('should verify all required permissions', async () => {
    const claims = {
      sub: 'user123',
      permissions: ['read', 'write', 'delete'],
    }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      require_all_permissions: ['read', 'write'],
    })

    expect(result).not.toBeNull()
    expect(result?.permissions).toEqual(['read', 'write', 'delete'])
  })

  it('should reject if missing required permission', async () => {
    const claims = {
      sub: 'user123',
      permissions: ['read'],
    }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      require_all_permissions: ['read', 'write'],
    })

    expect(result).toBeNull()
  })

  it('should verify any required permission', async () => {
    const claims = {
      sub: 'user123',
      permissions: ['read', 'write'],
    }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      require_any_permission: ['write', 'admin'],
    })

    expect(result).not.toBeNull()
  })

  it('should reject if no matching permission from any list', async () => {
    const claims = {
      sub: 'user123',
      permissions: ['read'],
    }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      require_any_permission: ['write', 'admin'],
    })

    expect(result).toBeNull()
  })

  it('should verify all required roles', async () => {
    const claims = {
      sub: 'user123',
      roles: ['user', 'editor', 'admin'],
    }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      require_roles_all: ['user', 'editor'],
    })

    expect(result).not.toBeNull()
    expect(result?.roles).toEqual(['user', 'editor', 'admin'])
  })

  it('should reject if missing required role', async () => {
    const claims = {
      sub: 'user123',
      roles: ['user'],
    }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      require_roles_all: ['user', 'admin'],
    })

    expect(result).toBeNull()
  })

  it('should verify any required role', async () => {
    const claims = {
      sub: 'user123',
      roles: ['user', 'editor'],
    }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      require_roles_any: ['editor', 'admin'],
    })

    expect(result).not.toBeNull()
  })

  it('should apply custom predicates', async () => {
    const claims = {
      sub: 'user123',
      age: 25,
      verified: true,
    }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      predicates: [
        payload => (payload.age as number) >= 18,
        payload => payload.verified === true,
      ],
    })

    expect(result).not.toBeNull()
  })

  it('should reject if predicate fails', async () => {
    const claims = {
      sub: 'user123',
      age: 15,
    }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      predicates: [payload => (payload.age as number) >= 18],
    })

    expect(result).toBeNull()
  })

  it('should handle missing permissions/roles arrays', async () => {
    const claims = { sub: 'user123' }
    const token = await createToken(claims)

    const result = await checkAuth(token, {
      require_all_permissions: ['read'],
    })

    expect(result).toBeNull()
  })

  it('should return jti if present', async () => {
    const claims = {
      sub: 'user123',
      jti: 'token-id-123',
    }
    const token = await createToken(claims)
    const result = await checkAuth(token, {})

    expect(result?.jti).toBe('token-id-123')
  })
})

describe('High-Level API - policy builder', () => {
  beforeEach(() => {
    const testSecret = Buffer.from('a'.repeat(64), 'utf8').toString('base64url')
    process.env.JWT_SECRET = testSecret
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
    delete process.env.JWT_PRIVATE_JWK
  })

  it('should build policy with base settings', () => {
    const opts = policy()
      .base({ iss: 'my-issuer', aud: 'my-audience', leeway: 60 })
      .build()

    expect(opts.iss).toBe('my-issuer')
    expect(opts.aud).toBe('my-audience')
    expect(opts.leeway).toBe(60)
  })

  it('should build policy with permission requirements', () => {
    const opts = policy().needAll('read', 'write').needAny('admin', 'superuser').build()

    expect(opts.require_all_permissions).toEqual(['read', 'write'])
    expect(opts.require_any_permission).toEqual(['admin', 'superuser'])
  })

  it('should build policy with role requirements', () => {
    const opts = policy()
      .rolesAll('user', 'verified')
      .rolesAny('editor', 'admin')
      .build()

    expect(opts.require_roles_all).toEqual(['user', 'verified'])
    expect(opts.require_roles_any).toEqual(['editor', 'admin'])
  })

  it('should build policy with custom predicates', () => {
    const opts = policy()
      .where(p => (p.age as number) >= 18)
      .where(p => p.verified === true)
      .build()

    expect(opts.predicates).toHaveLength(2)
  })

  it('should chain multiple policy methods', () => {
    const opts = policy()
      .base({ iss: 'test', aud: 'api' })
      .needAll('read')
      .rolesAny('user', 'admin')
      .where(p => p.active === true)
      .build()

    expect(opts.iss).toBe('test')
    expect(opts.require_all_permissions).toEqual(['read'])
    expect(opts.require_roles_any).toEqual(['user', 'admin'])
    expect(opts.predicates).toHaveLength(1)
  })

  it('should accumulate multiple calls to same method', () => {
    const opts = policy()
      .needAll('read')
      .needAll('write')
      .needAny('admin')
      .needAny('superuser')
      .build()

    expect(opts.require_all_permissions).toEqual(['read', 'write'])
    expect(opts.require_any_permission).toEqual(['admin', 'superuser'])
  })

  it('should use built policy with checkAuth', async () => {
    const claims = {
      sub: 'user123',
      permissions: ['read', 'write'],
      roles: ['user', 'editor'],
      active: true,
    }
    const token = await createToken(claims)

    const opts = policy()
      .base({ iss: 'test-issuer', aud: 'test-audience' })
      .needAll('read', 'write')
      .rolesAny('editor', 'admin')
      .where(p => p.active === true)
      .build()

    const result = await checkAuth(token, opts)

    expect(result).not.toBeNull()
    expect(result?.sub).toBe('user123')
  })
})
