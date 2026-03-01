# explicit — Code View

[← Back to Container](./flarelette_jwt.md) | [← Back to System](./README.md)

---

## Component Information

| Field | Value |
| --- | --- |
| **Component** | explicit |
| **Container** | flarelette-jwt |
| **Type** | `module` |
| **Description** | Explicit Configuration API for JWT Operations<br><br>This module provides functions that accept explicit configuration objects<br>instead of relying on environment variables or global state. Use this API<br>when you need full control over configuration, especially in development<br>environments or when working with multiple JWT configurations. |
---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_chrislyons_dev_flarelette_jwt__explicit.png)
![Class Diagram](./diagrams/structurizr-Classes_flarelette_jwt__explicit.png)

### Code Elements

<details>
<summary><strong>18 code element(s)</strong></summary>


#### Classes

##### `BaseJwtConfig`

Base JWT configuration shared by HS512 and EdDSA modes.

| Field | Value |
| --- | --- |
| **Type** | `class` |
| **Visibility** | `-` |
| **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:25` |


---
##### `HS512Config`

HS512 (HMAC-SHA512) symmetric configuration.

| Field | Value |
| --- | --- |
| **Type** | `class` |
| **Visibility** | `-` |
| **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:41` |


---
##### `EdDSASignConfig`

EdDSA (Ed25519) asymmetric configuration for signing.

| Field | Value |
| --- | --- |
| **Type** | `class` |
| **Visibility** | `-` |
| **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:55` |


---
##### `EdDSAVerifyConfig`

EdDSA (Ed25519) asymmetric configuration for verification.

| Field | Value |
| --- | --- |
| **Type** | `class` |
| **Visibility** | `-` |
| **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:71` |


---
##### `AuthzOptsWithConfig`

Authorization options for check_auth_with_config.

| Field | Value |
| --- | --- |
| **Type** | `class` |
| **Visibility** | `-` |
| **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:403` |


---
##### `AuthUser`

Authenticated user information.

| Field | Value |
| --- | --- |
| **Type** | `class` |
| **Visibility** | `-` |
| **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:421` |


---

#### Functions

##### `_b64url()`

Encode bytes to base64url without padding.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Returns** | `str` || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:90` |

**Parameters:**

- `b`: <code>bytes</code>

---
##### `_b64url_decode()`

Decode base64url string (with or without padding).

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Returns** | `bytes` || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:95` |

**Parameters:**

- `s`: <code>str</code>

---
##### `sign_with_config()`

Sign a JWT token with explicit configuration.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Async** | Yes || **Returns** | `str` - Signed JWT token string || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:100` |

**Parameters:**

- `payload`: <code>JwtPayload</code> — Claims to include in the token- `config`: <code>SignConfig</code> — Explicit JWT configuration
**Examples:**
```typescript

```

---
##### `verify_with_config()`

Verify a JWT token with explicit configuration.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Async** | Yes || **Returns** | `JwtPayload \| None` - Payload if valid, None if invalid || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:190` |

**Parameters:**

- `token`: <code>str</code> — JWT token string to verify- `config`: <code>VerifyConfig</code> — Explicit JWT configuration
**Examples:**
```typescript

```

---
##### `create_token_with_config()`

Create a signed JWT token with explicit configuration.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Async** | Yes || **Returns** | `str` - Signed JWT token string || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:300` |

**Parameters:**

- `claims`: <code>JwtPayload</code> — Claims to include in the token- `config`: <code>SignConfig</code> — Explicit JWT configuration

---
##### `create_delegated_token_with_config()`

Create a delegated JWT token with explicit configuration.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Async** | Yes || **Returns** | `str` - Signed JWT token string with delegation claim || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:327` |

**Parameters:**

- `original_payload`: <code>JwtPayload</code> — The verified JWT payload from external auth- `actor_service`: <code>str</code> — Identifier of the service creating this delegated token- `config`: <code>SignConfig</code> — Explicit JWT configuration
**Examples:**
```typescript

```

---
##### `check_auth_with_config()`

Verify and authorize a JWT token with explicit configuration.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Async** | Yes || **Returns** | `AuthUser \| None` - AuthUser if valid and authorized, None otherwise || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:441` |

**Parameters:**

- `token`: <code>str</code> — JWT token string to verify- `config`: <code>VerifyConfig</code> — Explicit JWT configuration- `authz_opts`: <code>AuthzOptsWithConfig | None</code> — Authorization policy requirements
**Examples:**
```typescript

```

---
##### `create_hs512_config()`

Helper function to create HS512 config from base64url-encoded secret.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Returns** | `HS512Config` - HS512Config || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:523` |

**Parameters:**

- `secret`: <code>str | bytes</code> — Base64url-encoded secret string or raw bytes (minimum 64 bytes)

---
##### `create_eddsa_sign_config()`

Helper function to create EdDSA sign config from JWK.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Returns** | `EdDSASignConfig` - EdDSASignConfig || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:568` |

**Parameters:**

- `private_jwk`: <code>dict[str, Any] | str</code> — Private JWK dictionary or JSON string

---
##### `create_eddsa_verify_config()`

Helper function to create EdDSA verify config from JWK.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Returns** | `EdDSAVerifyConfig` - EdDSAVerifyConfig || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\explicit.py:603` |

**Parameters:**

- `public_jwk`: <code>dict[str, Any] | str</code> — Public JWK dictionary or JSON string

---

</details>

---

<div align="center">
<sub><a href="./flarelette_jwt.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>

