# jwks — Code View

[← Back to Container](./chrislyons_dev_flarelette_jwt.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>jwks</td>
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
<td>JSON Web Key Set (JWKS) utilities.

This module provides functions to fetch and manage JWKS, including caching and key lookup by key ID (kid).
It supports integration with external JWKS services.</td>
</tr>
</tbody>
</table>

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_chrislyons_dev_flarelette_jwt__jwks.png)

### Code Elements

<details>
<summary><strong>7 code element(s)</strong></summary>



#### Functions

##### `clearJwksCache()`

Clear the JWKS cache (for testing purposes)

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
<td><code>void</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/jwks.ts:49</code></td>
</tr>
</tbody>
</table>



---
##### `clearHttpJwksCache()`

Clear the HTTP JWKS cache (for testing purposes)

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
<td><code>void</code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/jwks.ts:57</code></td>
</tr>
</tbody>
</table>



---
##### `fetchJwksFromService()`

Fetch JWKS from a service binding
Implements 5-minute caching to reduce load on JWKS service

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
<td><code>Promise<JWKWithKid[]></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/jwks.ts:65</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `service`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").Fetcher</code>

---
##### `validateJwksUrl()`

Validate JWKS URL for security requirements

Requirements:
- Must be valid URL format
- Must use HTTPS (except localhost/127.0.0.1/[::1] for testing)

<table>
<tbody>
<tr>
<td><strong>Type</strong></td>
<td><code>function</code></td>
</tr>
<tr>
<td><strong>Visibility</strong></td>
<td><code>private</code></td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>URL</code> — Parsed URL object</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/jwks.ts:103</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `url`: <code>string</code> — - JWKS URL to validate

---
##### `fetchJwksFromUrl()`

Fetch JWKS from HTTP URL with caching

Implements configurable TTL caching (default 5 minutes)
Security: HTTPS-only (except localhost), 5-second timeout, 100KB size limit

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
<td><code>Promise<JWKWithKid[]></code> — Array of JWK objects</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/jwks.ts:138</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `url`: <code>string</code> — - HTTP(S) URL to JWKS endpoint- `ttlSeconds`: <code>number</code> — - Cache TTL in seconds (default: 300)

---
##### `getKeyFromJwks()`

Find and import a specific key from JWKS by kid

Supports both EdDSA (Ed25519) and RSA (RS256/RS384/RS512) keys
Algorithm is auto-detected from key type (kty) and curve (crv)

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
<td><code>Promise<Uint8Array<ArrayBufferLike> | CryptoKey></code> — CryptoKey or Uint8Array suitable for jose verification</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/jwks.ts:209</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `kid`: <code>string</code> — - Key ID from JWT header- `jwks`: <code>JWKWithKid[]</code> — - Array of JWK objects

---
##### `allowedThumbprints()`

Get allowed thumbprints for key pinning (optional security measure)

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
<td><code>Set<string></code></td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/jwks.ts:242</code></td>
</tr>
</tbody>
</table>



---

</details>

---

<div align="center">
<sub><a href="./chrislyons_dev_flarelette_jwt.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>
