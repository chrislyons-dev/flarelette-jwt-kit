import { describe, test, expect, beforeEach } from 'vitest'
import { bindEnv, makeKit } from '../src/adapters/hono'
import type { WorkerEnv } from '../src/types'

describe('Hono Adapter', () => {
  beforeEach(() => {
    // Clean up global environment
    delete (globalThis as { __FLARELETTE_ENV?: unknown }).__FLARELETTE_ENV
    delete (globalThis as { __FLARELETTE_SERVICES?: unknown }).__FLARELETTE_SERVICES
  })

  describe('bindEnv', () => {
    test('should bind string environment variables', () => {
      const env: WorkerEnv = {
        JWT_SECRET: 'test-secret',
        JWT_ISS: 'test-issuer',
        SOME_OTHER_VAR: 'value',
      }

      bindEnv(env)

      const bag = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      expect(bag).toBeDefined()
      expect(bag?.JWT_SECRET).toBe('test-secret')
      expect(bag?.JWT_ISS).toBe('test-issuer')
      expect(bag?.SOME_OTHER_VAR).toBe('value')
    })

    test('should bind service bindings separately', () => {
      const mockService = {
        fetch: async () => new Response(),
      }

      const env: WorkerEnv = {
        JWT_SECRET: 'secret',
        JWKS_SERVICE: mockService,
      }

      bindEnv(env)

      const services = (
        globalThis as { __FLARELETTE_SERVICES?: Record<string, unknown> }
      ).__FLARELETTE_SERVICES
      expect(services).toBeDefined()
      expect(services?.JWKS_SERVICE).toBe(mockService)
    })

    test('should separate strings from objects', () => {
      const mockService = { fetch: async () => new Response() }

      const env: WorkerEnv = {
        STRING_VAR: 'value',
        SERVICE_VAR: mockService,
        ANOTHER_STRING: 'another',
      }

      bindEnv(env)

      const vars = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      const services = (
        globalThis as { __FLARELETTE_SERVICES?: Record<string, unknown> }
      ).__FLARELETTE_SERVICES

      expect(vars?.STRING_VAR).toBe('value')
      expect(vars?.ANOTHER_STRING).toBe('another')
      expect(vars?.SERVICE_VAR).toBeUndefined()

      expect(services?.SERVICE_VAR).toBe(mockService)
      expect(services?.STRING_VAR).toBeUndefined()
    })

    test('should handle empty environment', () => {
      bindEnv({})

      const vars = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      expect(vars).toBeDefined()
      expect(Object.keys(vars!)).toHaveLength(0)
    })

    test('should filter out non-Fetcher objects', () => {
      const env: WorkerEnv = {
        STRING: 'value',
        OBJECT_WITHOUT_FETCH: { data: 'test' },
        NUMBER: 42,
      }

      bindEnv(env)

      const vars = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV

      // Only strings should be in vars
      expect(vars?.STRING).toBe('value')
      expect(vars?.NUMBER).toBeUndefined()
      expect(vars?.OBJECT_WITHOUT_FETCH).toBeUndefined()
    })
  })

  describe('makeKit', () => {
    test('should create kit with bound environment', () => {
      const env: WorkerEnv = {
        JWT_SECRET: Buffer.from('a'.repeat(64)).toString('base64url'),
      }

      const kit = makeKit(env)

      expect(kit).toHaveProperty('sign')
      expect(kit).toHaveProperty('verify')
      expect(kit).toHaveProperty('createToken')
      expect(kit).toHaveProperty('checkAuth')
      expect(kit).toHaveProperty('policy')
      expect(kit).toHaveProperty('parse')
      expect(kit).toHaveProperty('isExpiringSoon')
    })

    test('should bind environment when creating kit', () => {
      const env: WorkerEnv = {
        JWT_ISS: 'test-issuer',
        JWT_SECRET: Buffer.from('x'.repeat(64)).toString('base64url'),
      }

      makeKit(env)

      const vars = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      expect(vars?.JWT_ISS).toBe('test-issuer')
    })

    test('should handle JWKS service binding', () => {
      const mockJwksService = {
        fetch: async () => new Response(),
      }

      const env: WorkerEnv = {
        JWT_JWKS_SERVICE_NAME: 'MY_JWKS',
        MY_JWKS: mockJwksService,
      }

      const kit = makeKit(env)

      // Kit should be created successfully with JWKS service binding
      expect(kit.verify).toBeDefined()
      expect(kit.checkAuth).toBeDefined()
    })

    test('should handle environment without JWKS service', () => {
      const env: WorkerEnv = {
        JWT_SECRET: Buffer.from('y'.repeat(64)).toString('base64url'),
      }

      const kit = makeKit(env)

      // Kit should still work without JWKS service
      expect(kit.sign).toBeDefined()
      expect(kit.verify).toBeDefined()
    })

    test('should expose utility functions', () => {
      const env: WorkerEnv = {
        JWT_SECRET: Buffer.from('z'.repeat(64)).toString('base64url'),
      }

      const kit = makeKit(env)

      expect(typeof kit.parse).toBe('function')
      expect(typeof kit.isExpiringSoon).toBe('function')
    })

    test('should create independent kit instances', () => {
      const env1: WorkerEnv = { VAR1: 'value1' }
      const env2: WorkerEnv = { VAR2: 'value2' }

      const kit1 = makeKit(env1)
      const kit2 = makeKit(env2)

      // Both kits should exist but env2 overwrote env1 in global
      expect(kit1).toBeDefined()
      expect(kit2).toBeDefined()

      const vars = (globalThis as { __FLARELETTE_ENV?: Record<string, string> })
        .__FLARELETTE_ENV
      expect(vars?.VAR2).toBe('value2')
    })
  })
})
