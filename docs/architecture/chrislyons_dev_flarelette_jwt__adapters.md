# adapters — Code View

[← Back to Container](./chrislyons_dev_flarelette_jwt.md) | [← Back to System](./README.md)

---

## Component Information

| Field | Value |
| --- | --- |
| **Component** | adapters |
| **Container** | @chrislyons-dev/flarelette-jwt |
| **Type** | `module` |
| **Description** | Component inferred from directory: adapters |
---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_chrislyons_dev_flarelette_jwt__adapters.png)

### Code Elements

<details>
<summary><strong>3 code element(s)</strong></summary>



#### Functions

##### `bindEnv()`

Store both environment variables and service bindings globally

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `void` || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/adapters/hono.ts:13` |

**Parameters:**

- `env`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").WorkerEnv</code>

---
##### `getServiceBinding()`

Get service binding by name from global storage

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `private` |
| **Returns** | `import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").Fetcher` || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/adapters/hono.ts:35` |

**Parameters:**

- `name`: <code>string</code>

---
##### `makeKit()`

Returns a namespaced kit whose calls use the provided env bag.
Automatically injects JWKS service binding if configured.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `public` |
| **Returns** | `{ sign: typeof import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/sign").sign; verify: (token: string, opts?: Partial<{ iss: string; aud: string; leeway: number; }>) => Promise<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").JwtPayload>; createToken: typeof import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high").createToken; checkAuth: (token: string, opts?: import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high").AuthzOpts) => Promise<import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high").AuthUser>; policy: typeof import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/high").policy; parse: typeof import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/util").parse; isExpiringSoon: typeof import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/util").isExpiringSoon; }` || **Location** | `C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/adapters/hono.ts:45` |

**Parameters:**

- `env`: <code>import("C:/Users/chris/git/flarelette-jwt-kit/packages/flarelette-jwt-ts/src/types").WorkerEnv</code>

---

</details>

---

<div align="center">
<sub><a href="./chrislyons_dev_flarelette_jwt.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>

