# @chrislyons-dev/flarelette-jwt

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
<td>@chrislyons-dev/flarelette-jwt</td>
</tr>
<tr>
<td><strong>Type</strong></td>
<td><code>Service</code></td>
</tr>
<tr>
<td><strong>Description</strong></td>
<td>Environment-driven JWT authentication for Cloudflare Workers with secret-name indirection</td>
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
<td><strong>core</strong></td>
<td><code>module</code></td>
<td>CLI utility for generating JWT secrets.

This script provides options to generate secrets in various formats, including JSON and dotenv.
It is designed to be executed as a standalone Node.js script. | Configuration utilities for JWT operations.

This module provides functions to read environment variables and derive JWT-related configurations.
It includes support for both symmetric (HS512) and asymmetric (EdDSA) algorithms. | JWT signing utilities.

This module provides functions to sign JWT tokens using either HS512 or EdDSA algorithms.
It supports custom claims and configuration overrides.</td>
<td><a href="./chrislyons_dev_flarelette_jwt__core.md">View →</a></td>
</tr>
<tr>
<td><strong>util</strong></td>
<td><code>module</code></td>
<td>High-level JWT utilities for creating, delegating, verifying, and authorizing JWT tokens | JSON Web Key Set (JWKS) utilities.

This module provides functions to fetch and manage JWKS, including caching and key lookup by key ID (kid).
It supports integration with external JWKS services. | Key generation utility for EdDSA keys.

This script generates EdDSA key pairs and exports them in JWK format.
It is designed to be executed as a standalone Node.js script. | Secret generation and validation utilities.

This module provides functions to generate secure secrets and validate base64url-encoded secrets.
It ensures compatibility with JWT signing requirements. | Utility functions for JWT operations.

This module provides helper functions for parsing JWTs, checking expiration, and mapping OAuth scopes.
It is designed to support core JWT functionalities. | JWT verification utilities.

This module provides functions to verify JWT tokens using either HS512 or EdDSA algorithms.
It supports integration with JWKS services and thumbprint pinning.</td>
<td><a href="./chrislyons_dev_flarelette_jwt__util.md">View →</a></td>
</tr>
<tr>
<td><strong>main</strong></td>
<td><code>module</code></td>
<td>Entry point for the flarelette-jwt library.

This module re-exports core functionalities, including signing, verification, utilities, and type definitions.
It serves as the main interface for library consumers.</td>
<td><a href="./chrislyons_dev_flarelette_jwt__main.md">View →</a></td>
</tr>
<tr>
<td><strong>types</strong></td>
<td><code>module</code></td>
<td>Type definitions for JWT operations.

This module defines types for JWT headers, payloads, profiles, and related structures.
It ensures type safety and consistency across the library.</td>
<td><a href="./chrislyons_dev_flarelette_jwt__types.md">View →</a></td>
</tr>
<tr>
<td><strong>adapters</strong></td>
<td><code>module</code></td>
<td>Component inferred from directory: adapters</td>
<td><a href="./chrislyons_dev_flarelette_jwt__adapters.md">View →</a></td>
</tr>
</tbody>
</table>


---

<div align="center">
<sub><a href="./README.md">← Back to System Overview</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>
