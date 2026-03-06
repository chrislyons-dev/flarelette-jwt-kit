# util — Code View

[← Back to Container](./chrislyons_dev_flarelette_jwt.md) | [← Back to System](./README.md)

---

## Component Information

| Field | Value |
| --- | --- |
| **Component** | util |
| **Container** | @chrislyons-dev/flarelette-jwt |
| **Type** | `module` |
| **Description** | High-level JWT utilities for creating, delegating, verifying, and authorizing JWT tokens \| Key generation utility for EdDSA and ECDSA keys.<br><br>Generates asymmetric key pairs and exports them in JWK format.<br>Designed to be executed as a standalone Node.js script. \| Secret generation and validation utilities.<br><br>This module provides functions to generate secure secrets and validate base64url-encoded secrets.<br>It ensures compatibility with JWT signing requirements. \| Utility functions for JWT operations.<br><br>This module provides helper functions for parsing JWTs, checking expiration, and mapping OAuth scopes.<br>It is designed to support core JWT functionalities. |
---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_chrislyons_dev_flarelette_jwt__util.png)

### Code Elements

<details>
<summary><strong>13 code element(s)</strong></summary>



#### Functions

##### `createToken()`

Create a signed JWT token with optional claims

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<string>` - Signed JWT token string || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high.ts:19` |

**Parameters:**

- `claims`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - Claims to include in the token (can include custom claims beyond standard JWT fields)- `opts`: <code>Partial<{ iss: string; aud: string | string[]; ttlSeconds: number; }></code> — - Optional overrides for iss, aud, ttlSeconds

---
##### `createDelegatedToken()`

Create a delegated JWT token following RFC 8693 actor claim pattern

Mints a new short-lived token for use within service boundaries where a service
acts on behalf of the original end user. This implements zero-trust delegation:
- Preserves original user identity (sub) and permissions
- Identifies the acting service via 'act' claim
- Prevents permission escalation by copying original permissions

Pattern: "I'm <actorService> doing work on behalf of <original user>"

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<string>` - Signed JWT token string with delegation claim || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high.ts:62` |

**Parameters:**

- `originalPayload`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - The verified JWT payload from external auth (e.g., Auth0)- `actorService`: <code>string</code> — - Identifier of the service creating this delegated token- `opts`: <code>Partial<{ iss: string; aud: string | string[]; ttlSeconds: number; }></code> — - Optional overrides for iss, aud, ttlSeconds
**Examples:**
```typescript

```

---
##### `signWithRequestBinding()`

Sign a JWT token bound to a specific HTTP request.

Adds a `req` claim containing base64url(SHA-256(canonical request)) to prevent
replay of a captured token against a different endpoint within the TTL window.

Canonical form: METHOD + "\n" + pathname + search + "\n" + body bytes

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<string>` - Signed JWT token string with req claim || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high.ts:112` |

**Parameters:**

- `payload`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - Claims to include in the token- `request`: <code>Request</code> — - The HTTP request this token is minted for- `opts`: <code>Partial<{ iss: string; aud: string | string[]; ttlSeconds: number; }></code> — - Optional overrides for iss, aud, ttlSeconds

---
##### `verifyWithRequestBinding()`

Verify a JWT token and validate its request binding.

Re-computes the request hash and compares it with the `req` claim.
Returns null on any mismatch (fail-silent, same as verify()).
The `req` claim is stripped from the returned payload — it's an implementation
detail that has already been validated.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload>` - Payload (without req claim) if valid and request matches, null otherwise || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high.ts:134` |

**Parameters:**

- `token`: <code>string</code> — - JWT token string to verify- `request`: <code>Request</code> — - The HTTP request to validate against- `opts`: <code>Partial<{ iss: string; aud: string | string[]; leeway: number; jwksService: import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").Fetcher; }></code> — - Optional overrides for iss, aud, leeway

---
##### `checkAuth()`

Verify and authorize a JWT token with policy enforcement

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high").AuthUser>` - AuthUser if valid and authorized, null otherwise || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high.ts:199` |

**Parameters:**

- `token`: <code>string</code> — - JWT token string to verify- `opts`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high").AuthzOpts</code> — - Authorization options including verification and policy requirements

---
##### `policy()`

Fluent builder for creating authorization policies

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `{ base(b: Partial<{ iss: string; aud: string \| string[]; leeway: number; }>): any; needAll(...perms: string[]): any; needAny(...perms: string[]): any; rolesAll(...roles: string[]): any; rolesAny(...roles: string[]): any; where(fn: (payload: import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload) => boolean): any; build(): import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high").AuthzOpts; }` - Policy builder with chainable methods || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high.ts:234` |



---
##### `main()`


| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `private` |
| **Async** | Yes || **Returns** | `Promise<void>` || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/keygen.ts:16` |



---
##### `generateSecret()`


| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `string` || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/secret.ts:13` |

**Parameters:**

- `lengthBytes`: <code>number</code>

---
##### `isValidBase64UrlSecret()`


| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `boolean` || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/secret.ts:25` |

**Parameters:**

- `s`: <code>string</code>- `minBytes`: <code>number</code>

---
##### `parse()`

Parse a JWT token into header and payload without verification

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").ParsedJwt` - Parsed header and payload || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/util.ts:19` |

**Parameters:**

- `token`: <code>string</code> — - JWT token string

---
##### `isExpiringSoon()`

Check if JWT payload will expire within specified seconds

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `boolean` - True if token expires within the threshold || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/util.ts:35` |

**Parameters:**

- `payload`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - JWT payload with 'exp' claim- `seconds`: <code>number</code> — - Number of seconds threshold

---
##### `mapScopesToPermissions()`

Map OAuth scopes to permission strings

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `string[]` - List of permission strings (currently identity mapping) || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/util.ts:47` |

**Parameters:**

- `scopes`: <code>string[]</code> — - List of OAuth scope strings

---
##### `computeRequestHash()`

Compute a deterministic SHA-256 hash that binds a JWT to a specific HTTP request.

Canonical form: UTF-8(METHOD + "\n" + pathname + search + "\n") || body_bytes
- Method is uppercased
- Binds to path and query string only (not host/scheme — internal Workers use different hostnames)
- Body is consumed from a clone to preserve the original stream

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<string>` - base64url-encoded SHA-256 hash of the canonical request representation || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/util.ts:62` |

**Parameters:**

- `request`: <code>Request</code> — - Fetch API Request object

---

</details>

---

<div align="center">
<sub><a href="./chrislyons_dev_flarelette_jwt.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>

