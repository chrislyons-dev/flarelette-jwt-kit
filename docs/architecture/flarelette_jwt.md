# flarelette-jwt

[← Back to System Overview](./README.md)

---

## Container Context

![Container Diagram](./diagrams/structurizr-Containers.png)

---

## Container Information

<table>
<tbody>
<tr>
<td><strong>Name</strong></td>
<td>flarelette-jwt</td>
</tr>
<tr>
<td><strong>Type</strong></td>
<td><code>Service</code></td>
</tr>
<tr>
<td><strong>Description</strong></td>
<td>Environment-driven JWT authentication for Cloudflare Workers Python with secret-name indirection</td>
</tr>
<tr>
<td><strong>Tags</strong></td>
<td><code>Auto-generated</code></td>
</tr>
</tbody>
</table>

---

## Components


### Component View

![Component Diagram](./diagrams/structurizr-Components_flarelette_jwt.png)
![Component Diagram](./diagrams/structurizr-Components__chrislyons_dev_flarelette_jwt.png)

### Component Details

<table>
<thead>
<tr>
<th>Component</th>
<th>Type</th>
<th>Description</th>
<th>Code</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>adapters</strong></td>
<td><code>module</code></td>
<td>Adapters for Cloudflare Workers Environment

This module provides utilities to adapt Cloudflare Workers environment variables
for use with the Flarelette JWT library.</td>
<td><a href="./flarelette_jwt__adapters.md">View →</a></td>
</tr>
<tr>
<td><strong>util</strong></td>
<td><code>module</code></td>
<td>Environment Configuration for JWT Operations

This module provides functions to read environment variables and derive JWT-related configurations.
It supports both symmetric (HS512) and asymmetric (EdDSA) algorithms.</td>
<td><a href="./flarelette_jwt__util.md">View →</a></td>
</tr>
<tr>
<td><strong>flarelette_jwt</strong></td>
<td><code>module</code></td>
<td>Component derived from directory: flarelette_jwt</td>
<td><a href="./flarelette_jwt__flarelette_jwt.md">View →</a></td>
</tr>
</tbody>
</table>


---

<div align="center">
<sub><a href="./README.md">← Back to System Overview</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>
