# @chrislyons-dev/flarelette-jwt

[← Back to System Overview](./README.md)

---

## Container Context

<img src="./diagrams/structurizr-Containers.png" alt="Container Diagram" style="max-width: 100%; height: auto;">

---

## Container Information

| Field | Value |
| --- | --- |
| **Name** | @chrislyons-dev/flarelette-jwt |
| **Type** | `Service` |
| **Description** | TypeScript implementation of the Flarelette JWT Kit: An environment-driven JWT authentication package for Cloudflare Workers || **Tags** | `Auto-generated` |
---

## Components


### Component View

<img src="./diagrams/structurizr-Components__chrislyons_dev_flarelette_jwt.png" alt="Component Diagram" style="max-width: 100%; height: auto;">

### Component Details

| Component | Type | Description | Code |
| --- | --- | --- | --- |
| **core** | `module` | CLI utility for generating JWT secrets.<br><br>This script provides options to generate secrets in various formats, including JSON and dotenv.<br>It is designed to be executed as a standalone Node.js script. \| Configuration utilities for JWT operations.<br><br>This module provides functions to read environment variables and derive JWT-related configurations.<br>It includes support for both symmetric (HS512) and asymmetric (EdDSA) algorithms. \| JWT signing utilities.<br><br>This module provides functions to sign JWT tokens using either HS512 or EdDSA algorithms.<br>It supports custom claims and configuration overrides. | [View](./chrislyons_dev_flarelette_jwt__core.md) |
| **explicit** | `module` | Explicit configuration API for JWT operations.<br><br>This module provides functions that accept explicit configuration objects<br>instead of relying on environment variables or global state. Use this API<br>when you need full control over configuration, especially in development<br>environments or when working with multiple JWT configurations. | [View](./chrislyons_dev_flarelette_jwt__explicit.md) |
| **util** | `module` | High-level JWT utilities for creating, delegating, verifying, and authorizing JWT tokens \| Key generation utility for EdDSA and ECDSA keys.<br><br>Generates asymmetric key pairs and exports them in JWK format.<br>Designed to be executed as a standalone Node.js script. \| Secret generation and validation utilities.<br><br>This module provides functions to generate secure secrets and validate base64url-encoded secrets.<br>It ensures compatibility with JWT signing requirements. \| Utility functions for JWT operations.<br><br>This module provides helper functions for parsing JWTs, checking expiration, and mapping OAuth scopes.<br>It is designed to support core JWT functionalities. | [View](./chrislyons_dev_flarelette_jwt__util.md) |
| **main** | `module` | Entry point for the flarelette-jwt library.<br><br>This module re-exports core functionalities, including signing, verification, utilities, and type definitions.<br>It serves as the main interface for library consumers. | [View](./chrislyons_dev_flarelette_jwt__main.md) |
| **jwks** | `module` | JSON Web Key Set (JWKS) utilities.<br><br>This module provides functions to fetch and manage JWKS, including caching and key lookup by key ID (kid).<br>It supports integration with external JWKS services. | [View](./chrislyons_dev_flarelette_jwt__jwks.md) |
| **types** | `module` | Type definitions for JWT operations.<br><br>This module defines types for JWT headers, payloads, profiles, and related structures.<br>It ensures type safety and consistency across the library. | [View](./chrislyons_dev_flarelette_jwt__types.md) |
| **verify** | `module` | JWT verification utilities.<br><br>This module provides functions to verify JWT tokens using either HS512 or EdDSA algorithms.<br>It supports integration with JWKS services and thumbprint pinning. | [View](./chrislyons_dev_flarelette_jwt__verify.md) |
| **adapters** | `module` | Component inferred from directory: adapters | [View](./chrislyons_dev_flarelette_jwt__adapters.md) |


---

<div align="center">
<sub><a href="./README.md">← Back to System Overview</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>

