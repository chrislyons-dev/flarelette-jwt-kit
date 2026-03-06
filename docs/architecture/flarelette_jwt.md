# flarelette-jwt

[← Back to System Overview](./README.md)

---

## Container Context

<img src="./diagrams/structurizr-Containers.png" alt="Container Diagram" style="max-width: 100%; height: auto;">

---

## Container Information

| Field | Value |
| --- | --- |
| **Name** | flarelette-jwt |
| **Type** | `Service` |
| **Description** | Python implementation of the Flarelette JWT Kit: An environment-driven JWT authentication package for Cloudflare Workers || **Tags** | `Auto-generated` |
---

## Components


### Component View

<img src="./diagrams/structurizr-Components_flarelette_jwt.png" alt="Component Diagram" style="max-width: 100%; height: auto;">
<img src="./diagrams/structurizr-Components__chrislyons_dev_flarelette_jwt.png" alt="Component Diagram" style="max-width: 100%; height: auto;">

### Component Details

| Component | Type | Description | Code |
| --- | --- | --- | --- |
| **adapters** | `module` | Adapters for Cloudflare Workers Environment<br><br>This module provides utilities to adapt Cloudflare Workers environment variables<br>for use with the Flarelette JWT library. | [View](./flarelette_jwt__adapters.md) |
| **util** | `module` | Environment Configuration for JWT Operations<br><br>This module provides functions to read environment variables and derive JWT-related configurations.<br>It supports both symmetric (HS512) and asymmetric (EdDSA) algorithms. | [View](./flarelette_jwt__util.md) |
| **explicit** | `module` | Explicit Configuration API for JWT Operations<br><br>This module provides functions that accept explicit configuration objects<br>instead of relying on environment variables or global state. Use this API<br>when you need full control over configuration, especially in development<br>environments or when working with multiple JWT configurations. | [View](./flarelette_jwt__explicit.md) |
| **flarelette_jwt** | `module` | Component derived from directory: flarelette_jwt | [View](./flarelette_jwt__flarelette_jwt.md) |


---

<div align="center">
<sub><a href="./README.md">← Back to System Overview</a> | Generated with <a href="https://github.com/chrislyons-dev/archlette">Archlette</a></sub>
</div>

