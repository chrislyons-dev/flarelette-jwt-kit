/**
 * Tests for request-bound JWT helpers (Issue #39)
 *
 * Verifies that signWithRequestBinding / verifyWithRequestBinding prevent
 * replay of a captured token against a different endpoint.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  computeRequestHash,
  signWithRequestBinding,
  verifyWithRequestBinding,
} from '../src/index.js'

// 64-byte base64url secret for HS512
const SECRET = Buffer.alloc(64, 0xab).toString('base64url')

function makeRequest(url: string, method = 'GET', body?: string): Request {
  return new Request(url, {
    method,
    body: body !== undefined ? body : undefined,
  })
}

describe('computeRequestHash', () => {
  it('same request produces the same hash (deterministic)', async () => {
    const req1 = makeRequest('https://example.com/api/data?q=1', 'GET')
    const req2 = makeRequest('https://example.com/api/data?q=1', 'GET')
    const [h1, h2] = await Promise.all([
      computeRequestHash(req1),
      computeRequestHash(req2),
    ])
    expect(h1).toBe(h2)
  })

  it('different method produces different hash', async () => {
    const get = makeRequest('https://example.com/path', 'GET')
    const post = makeRequest('https://example.com/path', 'POST')
    const [h1, h2] = await Promise.all([
      computeRequestHash(get),
      computeRequestHash(post),
    ])
    expect(h1).not.toBe(h2)
  })

  it('different path produces different hash', async () => {
    const r1 = makeRequest('https://example.com/path/a')
    const r2 = makeRequest('https://example.com/path/b')
    const [h1, h2] = await Promise.all([computeRequestHash(r1), computeRequestHash(r2)])
    expect(h1).not.toBe(h2)
  })

  it('different query string produces different hash', async () => {
    const r1 = makeRequest('https://example.com/path?page=1')
    const r2 = makeRequest('https://example.com/path?page=2')
    const [h1, h2] = await Promise.all([computeRequestHash(r1), computeRequestHash(r2)])
    expect(h1).not.toBe(h2)
  })

  it('different body produces different hash', async () => {
    const r1 = makeRequest('https://example.com/path', 'POST', '{"a":1}')
    const r2 = makeRequest('https://example.com/path', 'POST', '{"a":2}')
    const [h1, h2] = await Promise.all([computeRequestHash(r1), computeRequestHash(r2)])
    expect(h1).not.toBe(h2)
  })

  it('GET with no body produces a stable hash', async () => {
    const r1 = makeRequest('https://example.com/stable')
    const r2 = makeRequest('https://example.com/stable')
    const [h1, h2] = await Promise.all([computeRequestHash(r1), computeRequestHash(r2)])
    expect(h1).toBe(h2)
    expect(h1.length).toBeGreaterThan(0)
  })

  it('hash is a non-empty base64url string', async () => {
    const req = makeRequest('https://example.com/api')
    const hash = await computeRequestHash(req)
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
    // base64url characters only
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})

describe('signWithRequestBinding', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.JWT_ISS
    delete process.env.JWT_AUD
  })

  it('returns a valid 3-part JWT string', async () => {
    const req = makeRequest('https://example.com/api/resource', 'GET')
    const token = await signWithRequestBinding({ sub: 'user123' }, req)

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('token contains req claim', async () => {
    const req = makeRequest('https://example.com/api/resource', 'POST', 'body')
    const token = await signWithRequestBinding({ sub: 'user123' }, req)

    const payloadPart = token.split('.')[1]
    const decoded = JSON.parse(
      Buffer.from(payloadPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
        'utf8'
      )
    )

    expect(decoded.req).toBeDefined()
    expect(typeof decoded.req).toBe('string')
    expect(decoded.req.length).toBeGreaterThan(0)
  })

  it('req claim is a base64url string', async () => {
    const req = makeRequest('https://example.com/api/resource')
    const token = await signWithRequestBinding({ sub: 'user123' }, req)

    const payloadPart = token.split('.')[1]
    const decoded = JSON.parse(
      Buffer.from(payloadPart.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
        'utf8'
      )
    )

    expect(decoded.req).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})

describe('verifyWithRequestBinding — success', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.JWT_ISS
    delete process.env.JWT_AUD
  })

  it('original request returns payload', async () => {
    const req = makeRequest('https://example.com/api/resource', 'GET')
    const token = await signWithRequestBinding({ sub: 'user123' }, req)

    // Re-create same request for verification
    const verifyReq = makeRequest('https://example.com/api/resource', 'GET')
    const payload = await verifyWithRequestBinding(token, verifyReq)

    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe('user123')
  })

  it('req claim is stripped from returned payload', async () => {
    const req = makeRequest('https://example.com/api/resource', 'GET')
    const token = await signWithRequestBinding({ sub: 'user123' }, req)

    const verifyReq = makeRequest('https://example.com/api/resource', 'GET')
    const payload = await verifyWithRequestBinding(token, verifyReq)

    expect(payload).not.toBeNull()
    expect(payload?.req).toBeUndefined()
  })
})

describe('verifyWithRequestBinding — replay rejection', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET
    process.env.JWT_ISS = 'test-issuer'
    process.env.JWT_AUD = 'test-audience'
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.JWT_ISS
    delete process.env.JWT_AUD
  })

  it('different method returns null', async () => {
    const req = makeRequest('https://example.com/api/resource', 'GET')
    const token = await signWithRequestBinding({ sub: 'user123' }, req)

    const replayReq = makeRequest('https://example.com/api/resource', 'POST')
    const payload = await verifyWithRequestBinding(token, replayReq)

    expect(payload).toBeNull()
  })

  it('different path returns null', async () => {
    const req = makeRequest('https://example.com/api/resource', 'GET')
    const token = await signWithRequestBinding({ sub: 'user123' }, req)

    const replayReq = makeRequest('https://example.com/api/other', 'GET')
    const payload = await verifyWithRequestBinding(token, replayReq)

    expect(payload).toBeNull()
  })

  it('different body returns null', async () => {
    const req = makeRequest(
      'https://example.com/api/resource',
      'POST',
      '{"action":"read"}'
    )
    const token = await signWithRequestBinding({ sub: 'user123' }, req)

    const replayReq = makeRequest(
      'https://example.com/api/resource',
      'POST',
      '{"action":"delete"}'
    )
    const payload = await verifyWithRequestBinding(token, replayReq)

    expect(payload).toBeNull()
  })

  it('expired token returns null', async () => {
    const req = makeRequest('https://example.com/api/resource', 'GET')
    // ttlSeconds = -200 forces token to be already-expired (beyond 90s default leeway)
    const token = await signWithRequestBinding({ sub: 'user123' }, req, {
      ttlSeconds: -200,
    })

    const verifyReq = makeRequest('https://example.com/api/resource', 'GET')
    const payload = await verifyWithRequestBinding(token, verifyReq)

    expect(payload).toBeNull()
  })

  it('invalid signature returns null', async () => {
    const req = makeRequest('https://example.com/api/resource', 'GET')
    const token = await signWithRequestBinding({ sub: 'user123' }, req)

    // Tamper with the signature (last segment)
    const parts = token.split('.')
    parts[2] = parts[2].split('').reverse().join('')
    const tampered = parts.join('.')

    const verifyReq = makeRequest('https://example.com/api/resource', 'GET')
    const payload = await verifyWithRequestBinding(tampered, verifyReq)

    expect(payload).toBeNull()
  })
})
