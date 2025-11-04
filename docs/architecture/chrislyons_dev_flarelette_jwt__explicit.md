# explicit — Code View

[← Back to Container](./chrislyons_dev_flarelette_jwt.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>explicit</td>
</tr>
<tr>
<td><strong>Container</strong></td>
<td>@chrislyons-dev/flarelette-jwt</td>
</tr>
<tr>
<td><strong>Type</strong></td>
<td><code>module</code></td>
</tr>
<tr>
<td><strong>Description</strong></td>
<td>Explicit configuration API for JWT operations.

This module provides functions that accept explicit configuration objects
instead of relying on environment variables or global state. Use this API
when you need full control over configuration, especially in development
environments or when working with multiple JWT configurations.</td>
</tr>
</tbody>
</table>

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_chrislyons_dev_flarelette_jwt__explicit.png)

### Code Elements

<details>
<summary><strong>8 code element(s)</strong></summary>



#### Functions

##### `signWithConfig()`

Sign a JWT token with explicit configuration

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<string></code> — Signed JWT token string</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:102</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `payload`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - Claims to include in the token- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").SignConfig</code> — - Explicit JWT configuration- `overrides`: <code>Partial<{ iss: string; aud: string | string[]; ttlSeconds: number; }></code> — - Optional per-call overrides for iss, aud, ttlSeconds
**Examples:**
```typescript

```

---
##### `verifyWithConfig()`

Verify a JWT token with explicit configuration

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload></code> — Payload if valid, null if invalid</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:160</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `token`: <code>string</code> — - JWT token string to verify- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").VerifyConfig</code> — - Explicit JWT configuration- `overrides`: <code>Partial<{ iss: string; aud: string | string[]; leeway: number; }></code> — - Optional per-call overrides for iss, aud, leeway
**Examples:**
```typescript

```

---
##### `createTokenWithConfig()`

Create a signed JWT token with explicit configuration

Higher-level wrapper around signWithConfig for convenience.

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<string></code> — Signed JWT token string</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:209</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `claims`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - Claims to include in the token- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").SignConfig</code> — - Explicit JWT configuration- `overrides`: <code>Partial<{ iss: string; aud: string | string[]; ttlSeconds: number; }></code> — - Optional per-call overrides

---
##### `createDelegatedTokenWithConfig()`

Create a delegated JWT token with explicit configuration

Implements RFC 8693 actor claim pattern for service-to-service delegation.

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<string></code> — Signed JWT token string with delegation claim</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:246</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `originalPayload`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - The verified JWT payload from external auth- `actorService`: <code>string</code> — - Identifier of the service creating this delegated token- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").SignConfig</code> — - Explicit JWT configuration- `overrides`: <code>Partial<{ iss: string; aud: string | string[]; ttlSeconds: number; }></code> — - Optional per-call overrides
**Examples:**
```typescript

```

---
##### `checkAuthWithConfig()`

Verify and authorize a JWT token with explicit configuration

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").AuthUser></code> — AuthUser if valid and authorized, null otherwise</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:332</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `token`: <code>string</code> — - JWT token string to verify- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").VerifyConfig</code> — - Explicit JWT configuration- `authzOpts`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").AuthzOptsWithConfig</code> — - Authorization policy requirements- `verifyOverrides`: <code>Partial<{ iss: string; aud: string | string[]; leeway: number; }></code> — - Optional per-call verification overrides
**Examples:**
```typescript

```

---
##### `createHS512Config()`

Helper function to create HS512 config from base64url-encoded secret

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").HS512Config</code> — HS512 configuration</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:386</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `secret`: <code>string</code> — - Base64url-encoded secret string- `baseConfig`: <code>Omit<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway"> & Partial<Pick<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway">></code> — - Base JWT configuration

---
##### `createEdDSASignConfig()`

Helper function to create EdDSA sign config from JWK

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").EdDSASignConfig</code> — EdDSA sign configuration</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:414</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `privateJwk`: <code>any</code> — - Private JWK object or JSON string- `baseConfig`: <code>Omit<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway"> & Partial<Pick<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway">></code> — - Base JWT configuration- `kid`: <code>string</code> — - Optional key ID

---
##### `createEdDSAVerifyConfig()`

Helper function to create EdDSA verify config from JWK

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>public</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").EdDSAVerifyConfig</code> — EdDSA verify configuration</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:436</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `publicJwk`: <code>any</code> — - Public JWK object or JSON string- `baseConfig`: <code>Omit<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway"> & Partial<Pick<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway">></code> — - Base JWT configuration

---

</details>

---

<div align="center">
<sub><a href="./chrislyons_dev_flarelette_jwt.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>
