# explicit — Code View

[← Back to Container](./chrislyons_dev_flarelette_jwt.md) | [← Back to System](./README.md)

---

## Component Information

| Field | Value |
| --- | --- |
| **Component** | explicit |
| **Container** | @chrislyons-dev/flarelette-jwt |
| **Type** | `module` |
| **Description** | Explicit configuration API for JWT operations.<br><br>This module provides functions that accept explicit configuration objects<br>instead of relying on environment variables or global state. Use this API<br>when you need full control over configuration, especially in development<br>environments or when working with multiple JWT configurations. |
---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_chrislyons_dev_flarelette_jwt__explicit.png)

### Code Elements

<details>
<summary><strong>10 code element(s)</strong></summary>



#### Functions

##### `signWithConfig()`

Sign a JWT token with explicit configuration

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<string>` - Signed JWT token string || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:134` |

**Parameters:**

- `payload`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - Claims to include in the token- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").SignConfig</code> — - Explicit JWT configuration- `overrides`: <code>Partial<{ iss: string; aud: string | string[]; ttlSeconds: number; }></code> — - Optional per-call overrides for iss, aud, ttlSeconds
**Examples:**
```typescript

```

---
##### `verifyWithConfig()`

Verify a JWT token with explicit configuration

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload>` - Payload if valid, null if invalid || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:204` |

**Parameters:**

- `token`: <code>string</code> — - JWT token string to verify- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").VerifyConfig</code> — - Explicit JWT configuration- `overrides`: <code>Partial<{ iss: string; aud: string | string[]; leeway: number; }></code> — - Optional per-call overrides for iss, aud, leeway
**Examples:**
```typescript

```

---
##### `createTokenWithConfig()`

Create a signed JWT token with explicit configuration

Higher-level wrapper around signWithConfig for convenience.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<string>` - Signed JWT token string || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:273` |

**Parameters:**

- `claims`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - Claims to include in the token- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").SignConfig</code> — - Explicit JWT configuration- `overrides`: <code>Partial<{ iss: string; aud: string | string[]; ttlSeconds: number; }></code> — - Optional per-call overrides

---
##### `createDelegatedTokenWithConfig()`

Create a delegated JWT token with explicit configuration

Implements RFC 8693 actor claim pattern for service-to-service delegation.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<string>` - Signed JWT token string with delegation claim || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:310` |

**Parameters:**

- `originalPayload`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload</code> — - The verified JWT payload from external auth- `actorService`: <code>string</code> — - Identifier of the service creating this delegated token- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").SignConfig</code> — - Explicit JWT configuration- `overrides`: <code>Partial<{ iss: string; aud: string | string[]; ttlSeconds: number; }></code> — - Optional per-call overrides
**Examples:**
```typescript

```

---
##### `checkAuthWithConfig()`

Verify and authorize a JWT token with explicit configuration

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Async** | Yes || **Returns** | `Promise<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").AuthUser>` - AuthUser if valid and authorized, null otherwise || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:396` |

**Parameters:**

- `token`: <code>string</code> — - JWT token string to verify- `config`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").VerifyConfig</code> — - Explicit JWT configuration- `authzOpts`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").AuthzOptsWithConfig</code> — - Authorization policy requirements- `verifyOverrides`: <code>Partial<{ iss: string; aud: string | string[]; leeway: number; }></code> — - Optional per-call verification overrides
**Examples:**
```typescript

```

---
##### `createHS512Config()`

Helper function to create HS512 config from base64url-encoded secret

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").HS512Config` - HS512 configuration || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:450` |

**Parameters:**

- `secret`: <code>string</code> — - Base64url-encoded secret string- `baseConfig`: <code>Omit<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway"> & Partial<Pick<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway">></code> — - Base JWT configuration

---
##### `createEdDSASignConfig()`

Helper function to create EdDSA sign config from JWK

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").EdDSASignConfig` - EdDSA sign configuration || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:479` |

**Parameters:**

- `privateJwk`: <code>any</code> — - Private JWK object or JSON string- `baseConfig`: <code>Omit<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway"> & Partial<Pick<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway">></code> — - Base JWT configuration- `kid`: <code>string</code> — - Optional key ID

---
##### `createEdDSAVerifyConfig()`

Helper function to create EdDSA verify config from JWK

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").EdDSAVerifyConfig` - EdDSA verify configuration || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:501` |

**Parameters:**

- `publicJwk`: <code>any</code> — - Public JWK object or JSON string- `baseConfig`: <code>Omit<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway"> & Partial<Pick<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway">></code> — - Base JWT configuration

---
##### `createES512SignConfig()`

Helper function to create ES512 sign config from a P-521 EC private JWK

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").ES512SignConfig` - ES512 sign configuration || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:522` |

**Parameters:**

- `privateJwk`: <code>any</code> — - Private JWK object or JSON string (EC P-521 key)- `baseConfig`: <code>Omit<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway"> & Partial<Pick<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway">></code> — - Base JWT configuration- `kid`: <code>string</code> — - Optional key ID

---
##### `createJWKSUrlVerifyConfig()`

Helper function to create HTTP JWKS URL verification config

Enables testing without environment variables by providing explicit configuration

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").JWKSUrlVerifyConfig` - JWKS URL verification configuration || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit.ts:561` |

**Parameters:**

- `jwksUrl`: <code>string</code> — - HTTP(S) URL to JWKS endpoint- `baseConfig`: <code>Omit<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway"> & Partial<Pick<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/explicit").BaseJwtConfig, "ttlSeconds" | "leeway">></code> — - Base JWT configuration- `cacheTtl`: <code>number</code> — - Optional cache TTL in seconds (default: 300)
**Examples:**
```typescript

```

---

</details>

---

<div align="center">
<sub><a href="./chrislyons_dev_flarelette_jwt.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>

