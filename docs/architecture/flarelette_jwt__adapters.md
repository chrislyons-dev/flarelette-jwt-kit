# adapters — Code View

[← Back to Container](./flarelette_jwt.md) | [← Back to System](./README.md)

---

## Component Information

| Field | Value |
| --- | --- |
| **Component** | adapters |
| **Container** | flarelette-jwt |
| **Type** | `module` |
| **Description** | Adapters for Cloudflare Workers Environment<br><br>This module provides utilities to adapt Cloudflare Workers environment variables<br>for use with the Flarelette JWT library. |
---

## Code Structure

### Class Diagram

![Class Diagram](./diagrams/structurizr-Classes_chrislyons_dev_flarelette_jwt__adapters.png)
![Class Diagram](./diagrams/structurizr-Classes_flarelette_jwt__adapters.png)

### Code Elements

<details>
<summary><strong>1 code element(s)</strong></summary>



#### Functions

##### `apply_env_bindings()`

Copy a Cloudflare Worker `env` mapping into os.environ so the kit can read it.

| Field | Value |
| --- | --- |
| **Type** | `function` |
| **Visibility** | `-` |
| **Returns** | `None` || **Location** | `C:\Users\chris\git\flarelette-jwt-kit\packages\flarelette-jwt-py\flarelette_jwt\adapters.py:15` |

**Parameters:**

- `env`: <code>Mapping[str, str]</code>

---

</details>

---

<div align="center">
<sub><a href="./flarelette_jwt.md">← Back to Container</a> | <a href="./README.md">← Back to System</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>

