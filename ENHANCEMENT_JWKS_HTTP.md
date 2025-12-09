# Enhancement Request: Add JWT_JWKS_URL Support for HTTP JWKS Endpoints

**Status**: Enhancement Request
**Priority**: High
**Target Package**: `@chrislyons-dev/flarelette-jwt`
**Impact**: Enables gateway workers to verify external OIDC tokens from Auth0, Okta, Google, Azure AD, and Cloudflare Access

---

## Executive Summary

Add support for `JWT_JWKS_URL` environment variable to enable HTTP-based JWKS fetching. This allows gateway workers to verify external OIDC tokens from standard identity providers while maintaining the existing service binding pattern for internal service mesh.

**Current State**: Only supports service bindings (`JWT_JWKS_SERVICE_NAME`) and inline keys (`JWT_PUBLIC_JWK_NAME`)
**Desired State**: Add HTTP JWKS URL support (`JWT_JWKS_URL`) with caching

---

## Motivation

### Use Case: Gateway + Service Mesh Architecture

**Typical flarelette deployment pattern:**

1. **Gateway Worker**: Verifies external OIDC tokens (Auth0, Okta, etc.) → needs HTTP JWKS
2. **Internal Services**: Verify internal tokens from gateway → uses service bindings (existing)

Both gateway and internal services use `flarelette-hono` middleware. The only difference is JWKS resolution strategy:

| Component         | JWKS Strategy                             | Current Support |
| ----------------- | ----------------------------------------- | --------------- |
| Gateway           | HTTP JWKS URL (`JWT_JWKS_URL`)            | ❌ **Missing**  |
| Internal Services | Service Binding (`JWT_JWKS_SERVICE_NAME`) | ✅ Exists       |
| Internal Services | Inline Public Key (`JWT_PUBLIC_JWK_NAME`) | ✅ Exists       |

**Problem**: Without `JWT_JWKS_URL`, gateway workers cannot verify external OIDC tokens using standard OIDC discovery patterns.

**Current Workaround**: None - users must manually fetch JWKS and convert to inline JWK, which breaks on key rotation.

---

## Requirements

### 1. Environment Variable

Add support for `JWT_JWKS_URL` environment variable:

```bash
# Gateway configuration
JWT_JWKS_URL=https://auth0.example.com/.well-known/jwks.json
JWT_ISS=https://auth0.example.com/
JWT_AUD=my-app-client-id
JWT_LEEWAY_SECONDS=300
```

**Type**: Public URL (not a secret) - should be in `[vars]` section of wrangler.toml, not secrets.

### 2. JWKS Resolution Priority

Update JWKS resolution strategy to include HTTP URLs:

**Current Priority**:

1. Service Binding (`JWT_JWKS_SERVICE_NAME`)
2. Inline Public Key (`JWT_PUBLIC_JWK_NAME`)

**New Priority**:

1. Service Binding (`JWT_JWKS_SERVICE_NAME`) - preferred for internal mesh
2. Inline Public Key (`JWT_PUBLIC_JWK_NAME`) - for simple deployments
3. **HTTP JWKS URL (`JWT_JWKS_URL`)** - NEW - for gateway/external OIDC

### 3. HTTP JWKS Fetching

**Fetch Behavior**:

- Use `fetch()` to retrieve JWKS from `JWT_JWKS_URL`
- Parse JSON response as RFC 7517 JWKS structure
- Extract keys array and validate structure

**Example JWKS Response**:

```json
{
  "keys": [
    {
      "kid": "key-2025-01",
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    },
    {
      "kid": "key-2024-12",
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

**Key Matching**:

- Match JWT header `kid` to JWKS `keys[].kid`
- Return matching key for verification
- Error if `kid` not found in JWKS

### 4. Caching Strategy

**Requirements**:

- In-memory cache per Worker instance
- 5-minute cooldown between JWKS fetches (configurable)
- Automatic cache invalidation on key-not-found
- Thread-safe cache access

**Cache Key**: `JWT_JWKS_URL` value

**Cache Invalidation**:

- Time-based: 5 minutes (default)
- Error-based: Immediate retry on 404/network error
- Key-not-found: Fetch fresh JWKS if requested `kid` not in cache

**Example Cache Logic**:

```typescript
interface JWKSCache {
  keys: JsonWebKey[]
  fetchedAt: number
  url: string
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function getJWKS(url: string): Promise<JsonWebKey[]> {
  const cached = jwksCache.get(url)
  const now = Date.now()

  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.keys
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`JWKS fetch failed: ${response.status}`)
  }

  const jwks = await response.json()

  jwksCache.set(url, {
    keys: jwks.keys,
    fetchedAt: now,
    url,
  })

  return jwks.keys
}
```

### 5. Error Handling

**Configuration Errors** (fail fast):

- Invalid URL format → `Error: Invalid JWT_JWKS_URL format`
- HTTPS required → `Error: JWT_JWKS_URL must use HTTPS`
- Both `JWT_JWKS_URL` and `JWT_JWKS_SERVICE_NAME` set → `Error: Cannot use both JWT_JWKS_URL and JWT_JWKS_SERVICE_NAME`

**Runtime Errors** (fail silent for verification):

- HTTP 404/500 → Return `null` (verification fails)
- Network timeout → Return `null`
- Invalid JSON → Return `null`
- Key not found → Return `null`
- Malformed JWKS → Return `null`

**Security Note**: Never leak JWKS URL or key details in error messages. Return generic "Invalid or expired token" for all verification failures.

### 6. Security Considerations

**HTTPS Only**:

- Reject `http://` URLs
- Only accept `https://` for JWKS fetching
- Exception: Allow `http://localhost` and `http://127.0.0.1` for testing

**URL Validation**:

- Validate URL format before fetching
- Prevent SSRF attacks (reject internal IPs in production)
- Set reasonable timeout (5 seconds recommended)

**Cache Security**:

- Cache only public keys (never private keys)
- Clear cache on Worker restart
- No persistent storage of JWKS

### 7. Testing Requirements

**Unit Tests**:

- ✅ Fetch JWKS from valid URL
- ✅ Parse standard JWKS response
- ✅ Match `kid` to key in JWKS
- ✅ Return `null` if `kid` not found
- ✅ Cache JWKS for 5 minutes
- ✅ Refresh cache after TTL expires
- ✅ Handle HTTP 404 gracefully
- ✅ Handle network timeout
- ✅ Handle malformed JSON
- ✅ Reject `http://` URLs (non-HTTPS)
- ✅ Allow `http://localhost` for testing
- ✅ Verify EdDSA tokens from HTTP JWKS
- ✅ Verify RSA tokens from HTTP JWKS

**Integration Tests**:

- ✅ Verify Auth0 token with live JWKS URL
- ✅ Verify Okta token with live JWKS URL
- ✅ Verify Cloudflare Access token with live JWKS URL
- ✅ Handle key rotation (dual-key JWKS)
- ✅ Cache invalidation on key-not-found

**Performance Tests**:

- First fetch: ~50-100ms (HTTP request)
- Cached fetch: <1ms (in-memory)
- Cache hit rate: >95% in steady state

### 8. Configuration Examples

#### Auth0

```toml
# wrangler.toml
[vars]
JWT_ISS = "https://your-tenant.auth0.com/"
JWT_AUD = "your-client-id"
JWT_JWKS_URL = "https://your-tenant.auth0.com/.well-known/jwks.json"
JWT_LEEWAY_SECONDS = "300"
```

**Notes**:

- Issuer **must** include trailing slash
- JWKS URL follows standard OIDC discovery

#### Okta

```toml
# wrangler.toml
[vars]
JWT_ISS = "https://your-domain.okta.com/oauth2/default"
JWT_AUD = "api://default"
JWT_JWKS_URL = "https://your-domain.okta.com/oauth2/default/v1/keys"
JWT_LEEWAY_SECONDS = "300"
```

**Notes**:

- Authorization server ID in path (`default` or custom)
- JWKS URL uses `/v1/keys` endpoint

#### Google Workspace

```toml
# wrangler.toml
[vars]
JWT_ISS = "https://accounts.google.com"
JWT_AUD = "123456789-abcdefg.apps.googleusercontent.com"
JWT_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
JWT_LEEWAY_SECONDS = "300"
```

**Notes**:

- Audience is OAuth 2.0 client ID
- JWKS URL is Google's public certs endpoint

#### Azure AD (Microsoft Entra ID)

```toml
# wrangler.toml
[vars]
JWT_ISS = "https://login.microsoftonline.com/your-tenant-id/v2.0"
JWT_AUD = "api://your-app-client-id"
JWT_JWKS_URL = "https://login.microsoftonline.com/your-tenant-id/discovery/v2.0/keys"
JWT_LEEWAY_SECONDS = "300"
```

**Notes**:

- Replace `your-tenant-id` with actual tenant GUID
- JWKS URL is tenant-specific

#### Cloudflare Access

```toml
# wrangler.toml
[vars]
JWT_ISS = "https://your-team.cloudflareaccess.com"
JWT_AUD = "abc123def456ghi789"
JWT_JWKS_URL = "https://your-team.cloudflareaccess.com/cdn-cgi/access/certs"
JWT_LEEWAY_SECONDS = "300"
```

**Notes**:

- Non-standard JWKS path (`/cdn-cgi/access/certs`)
- AUD is application AUD tag from Access policy
- Standard RFC 7517 JWKS format (despite non-standard path)

---

## Implementation Guidance

### Suggested Code Location

**Package**: `@chrislyons-dev/flarelette-jwt`
**File**: `src/jwks.ts` (or existing JWKS resolution module)

### Key Changes Required

1. **Add `JWT_JWKS_URL` to `WorkerEnv` interface** (src/types.ts):

```typescript
export interface WorkerEnv extends Record<string, unknown> {
  // ... existing vars
  JWT_JWKS_URL?: string // NEW
}
```

2. **Update JWKS resolution logic** (src/jwks.ts or similar):

```typescript
async function resolveJWKS(env: WorkerEnv): Promise<JsonWebKey[]> {
  // Priority 1: Service binding
  if (env.JWT_JWKS_SERVICE_NAME && env[env.JWT_JWKS_SERVICE_NAME]) {
    return fetchJWKSViaBinding(env[env.JWT_JWKS_SERVICE_NAME])
  }

  // Priority 2: Inline public key
  if (env.JWT_PUBLIC_JWK_NAME && env[env.JWT_PUBLIC_JWK_NAME]) {
    return [parseInlineJWK(env[env.JWT_PUBLIC_JWK_NAME])]
  }

  // Priority 3: HTTP JWKS URL (NEW)
  if (env.JWT_JWKS_URL) {
    return fetchJWKSViaHTTP(env.JWT_JWKS_URL)
  }

  throw new Error('No JWKS source configured')
}

async function fetchJWKSViaHTTP(url: string): Promise<JsonWebKey[]> {
  validateJWKSURL(url)

  const cached = getJWKSFromCache(url)
  if (cached) return cached

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000), // 5 second timeout
  })

  if (!response.ok) {
    throw new Error(`JWKS fetch failed: ${response.status}`)
  }

  const jwks = (await response.json()) as JWKSResponse

  if (!jwks.keys || !Array.isArray(jwks.keys)) {
    throw new Error('Invalid JWKS response')
  }

  cacheJWKS(url, jwks.keys)

  return jwks.keys
}

function validateJWKSURL(url: string): void {
  try {
    const parsed = new URL(url)

    // HTTPS required (except localhost for testing)
    if (parsed.protocol !== 'https:') {
      const isLocalhost =
        parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
      if (!isLocalhost || parsed.protocol !== 'http:') {
        throw new Error('JWT_JWKS_URL must use HTTPS')
      }
    }
  } catch (error) {
    throw new Error('Invalid JWT_JWKS_URL format')
  }
}
```

3. **Add caching layer**:

```typescript
interface CacheEntry {
  keys: JsonWebKey[]
  fetchedAt: number
}

const jwksCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

function getJWKSFromCache(url: string): JsonWebKey[] | null {
  const entry = jwksCache.get(url)
  if (!entry) return null

  const age = Date.now() - entry.fetchedAt
  if (age > CACHE_TTL_MS) {
    jwksCache.delete(url)
    return null
  }

  return entry.keys
}

function cacheJWKS(url: string, keys: JsonWebKey[]): void {
  jwksCache.set(url, {
    keys,
    fetchedAt: Date.now(),
  })
}
```

### Backward Compatibility

**Guaranteed**: Existing configurations continue to work without changes.

- ✅ `JWT_JWKS_SERVICE_NAME` still takes priority
- ✅ `JWT_PUBLIC_JWK_NAME` still works
- ✅ No breaking changes to API
- ✅ New feature is opt-in via `JWT_JWKS_URL`

### Performance Impact

**Gateway Workers** (new HTTP JWKS):

- First request: +50-100ms (HTTP JWKS fetch)
- Subsequent requests: +<1ms (cache hit)
- Cache expires: +50-100ms every 5 minutes

**Internal Services** (existing service bindings):

- No change (service bindings still preferred)

---

## Documentation Updates Required

### 1. README.md

- Add `JWT_JWKS_URL` to environment variables table
- Add gateway configuration example
- Update JWKS resolution priority

### 2. Configuration Guide

- Add HTTP JWKS strategy
- Document caching behavior
- Add OIDC provider examples (Auth0, Okta, Google, Azure AD, Cloudflare Access)

### 3. API Documentation

- Document `JWT_JWKS_URL` variable
- Security considerations (HTTPS-only)
- Performance characteristics (caching)

---

## Success Criteria

**Implementation Complete When**:

1. ✅ `JWT_JWKS_URL` environment variable supported
2. ✅ HTTP JWKS fetching works for all standard OIDC providers
3. ✅ 5-minute caching implemented and tested
4. ✅ HTTPS validation enforces security
5. ✅ All unit tests pass (95%+ coverage)
6. ✅ Integration tests with Auth0, Okta, Cloudflare Access pass
7. ✅ Documentation updated (README, config guide, API docs)
8. ✅ Backward compatibility verified (existing configs unchanged)

**Validation Tests**:

```bash
# Test 1: Verify Auth0 token
JWT_JWKS_URL=https://your-tenant.auth0.com/.well-known/jwks.json
JWT_ISS=https://your-tenant.auth0.com/
JWT_AUD=your-client-id

# Test 2: Verify Cloudflare Access token
JWT_JWKS_URL=https://your-team.cloudflareaccess.com/cdn-cgi/access/certs
JWT_ISS=https://your-team.cloudflareaccess.com
JWT_AUD=your-aud-tag

# Test 3: Cache performance
# First request: ~50-100ms
# Second request (cached): <1ms
# After 5 minutes: ~50-100ms (cache refresh)
```

---

## Questions for Implementation

1. **Cache TTL Configuration**: Should `JWT_JWKS_CACHE_TTL_SECONDS` be configurable, or fixed at 5 minutes?
   - Recommendation: Fixed at 5 minutes initially, add env var if needed

2. **Algorithm Support**: Should we support RSA (RS256, RS384, RS512) in addition to EdDSA?
   - Recommendation: Yes - most OIDC providers use RSA

3. **JWKS Size Limit**: Should we limit JWKS response size (e.g., 100KB max)?
   - Recommendation: Yes - prevent DOS via large JWKS responses

4. **Retry Logic**: Should we retry failed JWKS fetches?
   - Recommendation: No - fail fast and return `null` for verification

5. **Metrics**: Should we expose JWKS cache hit/miss metrics?
   - Recommendation: Not in v1 - add later if needed

---

## References

### Standards

- [RFC 7517 - JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517)
- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html)

### OIDC Provider JWKS URLs

- **Auth0**: `https://{tenant}.auth0.com/.well-known/jwks.json`
- **Okta**: `https://{domain}.okta.com/oauth2/{authServerId}/v1/keys`
- **Google**: `https://www.googleapis.com/oauth2/v3/certs`
- **Azure AD**: `https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys`
- **Cloudflare Access**: `https://{team}.cloudflareaccess.com/cdn-cgi/access/certs`

### Related Documentation

- [Cloudflare Workers fetch() API](https://developers.cloudflare.com/workers/runtime-apis/fetch/)
- [Web Crypto API](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)

---

## Contact

**Package**: `@chrislyons-dev/flarelette-jwt`
**Repository**: `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-ts\`
**Requesting Package**: `@chrislyons-dev/flarelette-hono`
**Date**: 2025-12-07
