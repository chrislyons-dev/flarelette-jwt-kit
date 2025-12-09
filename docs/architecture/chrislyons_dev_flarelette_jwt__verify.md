# verify — Code View

[← Back to Container](./chrislyons_dev_flarelette_jwt.md) | [← Back to System](./README.md)

---

## Component Information

<table>
<tbody>
<tr>
<td><strong>Component</strong></td>
<td>verify</td>
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
<td>JWT verification utilities.

This module provides functions to verify JWT tokens using either HS512 or EdDSA algorithms.
It supports integration with JWKS services and thumbprint pinning.</td>
</tr>
</tbody>
</table>

---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_chrislyons_dev_flarelette_jwt__verify.png)

### Code Elements

<details>
<summary><strong>2 code element(s)</strong></summary>



#### Functions

##### `resolveVerificationKey()`

Resolve verification key from configured sources

Implements key resolution strategy pattern:
- Strategy 1: HS512 shared secret
- Strategy 2: Inline public JWK
- Strategy 3: Service binding JWKS
- Strategy 4: HTTP JWKS URL

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
<td><strong>Async</strong></td>
<td>Yes</td>
</tr>
<tr>
<td><strong>Returns</strong></td>
<td><code>Promise<{ key: Uint8Array<ArrayBufferLike> | CryptoKey; algorithms: string[]; }></code> — Key and allowed algorithms</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/verify.ts:47</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `token`: <code>string</code> — - JWT token string- `opts`: <code>Partial<{ jwksService: import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").Fetcher; jwksUrl: string; jwksCacheTtl: number; }></code> — - Verification options

---
##### `verify()`

Verify a JWT token with HS512, EdDSA, or RSA algorithms

Supports multiple key resolution strategies with automatic algorithm detection

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
<td><code>Promise<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload></code> — Decoded payload if valid, null otherwise</td>
</tr>
<tr>
<td><strong>Location</strong></td>
<td><code>C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/verify.ts:132</code></td>
</tr>
</tbody>
</table>

**Parameters:**

- `token`: <code>string</code> — - JWT token string to verify- `opts`: <code>Partial<{ iss: string; aud: string | string[]; leeway: number; jwksService: import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").Fetcher; jwksUrl: string; jwksCacheTtl: number; }></code> — - Optional overrides for iss, aud, leeway, jwksService, jwksUrl, jwksCacheTtl

---

</details>

---

<div align="center">
<sub><a href="./chrislyons_dev_flarelette_jwt.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>
