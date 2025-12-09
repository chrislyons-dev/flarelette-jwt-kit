workspace "flarelette-jwt-kit" "JWT authentication and authorization library" {

    model {
        # flarelette-jwt-kit System
        flarelette_jwt_kit = softwareSystem "flarelette-jwt-kit" {
            description "JWT authentication and authorization library"
            # Containers




            chrislyons_dev_flarelette_jwt = container "@chrislyons-dev/flarelette-jwt" {
                description "Environment-driven JWT authentication for Cloudflare Workers with secret-name indirection"
                technology "Service"
                tags "Service,Auto-generated"

                # Components
                chrislyons_dev_flarelette_jwt__core = component "core" {
                    description "CLI utility for generating JWT secrets. This script provides options to generate secrets in various formats, including JSON and dotenv. It is designed to be executed as a standalone Node.js script. | Configuration utilities for JWT operations. This module provides functions to read environment variables and derive JWT-related configurations. It includes support for both symmetric (HS512) and asymmetric (EdDSA) algorithms. | JWT signing utilities. This module provides functions to sign JWT tokens using either HS512 or EdDSA algorithms. It supports custom claims and configuration overrides."
                    technology "module"
                }
                chrislyons_dev_flarelette_jwt__explicit = component "explicit" {
                    description "Explicit configuration API for JWT operations. This module provides functions that accept explicit configuration objects instead of relying on environment variables or global state. Use this API when you need full control over configuration, especially in development environments or when working with multiple JWT configurations."
                    technology "module"
                }
                chrislyons_dev_flarelette_jwt__util = component "util" {
                    description "High-level JWT utilities for creating, delegating, verifying, and authorizing JWT tokens | Key generation utility for EdDSA keys. This script generates EdDSA key pairs and exports them in JWK format. It is designed to be executed as a standalone Node.js script. | Secret generation and validation utilities. This module provides functions to generate secure secrets and validate base64url-encoded secrets. It ensures compatibility with JWT signing requirements. | Utility functions for JWT operations. This module provides helper functions for parsing JWTs, checking expiration, and mapping OAuth scopes. It is designed to support core JWT functionalities."
                    technology "module"
                }
                chrislyons_dev_flarelette_jwt__main = component "main" {
                    description "Entry point for the flarelette-jwt library. This module re-exports core functionalities, including signing, verification, utilities, and type definitions. It serves as the main interface for library consumers."
                    technology "module"
                }
                chrislyons_dev_flarelette_jwt__jwks = component "jwks" {
                    description "JSON Web Key Set (JWKS) utilities. This module provides functions to fetch and manage JWKS, including caching and key lookup by key ID (kid). It supports integration with external JWKS services."
                    technology "module"
                }
                chrislyons_dev_flarelette_jwt__types = component "types" {
                    description "Type definitions for JWT operations. This module defines types for JWT headers, payloads, profiles, and related structures. It ensures type safety and consistency across the library."
                    technology "module"
                }
                chrislyons_dev_flarelette_jwt__verify = component "verify" {
                    description "JWT verification utilities. This module provides functions to verify JWT tokens using either HS512 or EdDSA algorithms. It supports integration with JWKS services and thumbprint pinning."
                    technology "module"
                }
                chrislyons_dev_flarelette_jwt__adapters = component "adapters" {
                    description "Component inferred from directory: adapters"
                    technology "module"
                }

                # Code elements (classes, functions)
                chrislyons_dev_flarelette_jwt__core__envread = component "core.envRead" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__envmode = component "core.envMode" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__getcommon = component "core.getCommon" {
                    description "Get common JWT configuration from environment Returns partial JwtProfile-compatible configuration"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__getprofile = component "core.getProfile" {
                    description "Get JWT profile from environment Returns complete JwtProfile with detected algorithm"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__gethssecret = component "core.getHSSecret" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__getprivatejwkstring = component "core.getPrivateJwkString" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__getpublicjwkstring = component "core.getPublicJwkString" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__getjwksservicename = component "core.getJwksServiceName" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__getjwksurl = component "core.getJwksUrl" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__getjwkscachettl = component "core.getJwksCacheTtl" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__explicit__signwithconfig = component "explicit.signWithConfig" {
                    description "Sign a JWT token with explicit configuration"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__explicit__verifywithconfig = component "explicit.verifyWithConfig" {
                    description "Verify a JWT token with explicit configuration"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__explicit__createtokenwithconfig = component "explicit.createTokenWithConfig" {
                    description "Create a signed JWT token with explicit configuration Higher-level wrapper around signWithConfig for convenience."
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__explicit__createdelegatedtokenwithconfig = component "explicit.createDelegatedTokenWithConfig" {
                    description "Create a delegated JWT token with explicit configuration Implements RFC 8693 actor claim pattern for service-to-service delegation."
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__explicit__checkauthwithconfig = component "explicit.checkAuthWithConfig" {
                    description "Verify and authorize a JWT token with explicit configuration"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__explicit__createhs512config = component "explicit.createHS512Config" {
                    description "Helper function to create HS512 config from base64url-encoded secret"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__explicit__createeddsasignconfig = component "explicit.createEdDSASignConfig" {
                    description "Helper function to create EdDSA sign config from JWK"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__explicit__createeddsaverifyconfig = component "explicit.createEdDSAVerifyConfig" {
                    description "Helper function to create EdDSA verify config from JWK"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__explicit__createjwksurlverifyconfig = component "explicit.createJWKSUrlVerifyConfig" {
                    description "Helper function to create HTTP JWKS URL verification config Enables testing without environment variables by providing explicit configuration"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__createtoken = component "util.createToken" {
                    description "Create a signed JWT token with optional claims"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__createdelegatedtoken = component "util.createDelegatedToken" {
                    description "Create a delegated JWT token following RFC 8693 actor claim pattern Mints a new short-lived token for use within service boundaries where a service acts on behalf of the original end user. This implements zero-trust delegation: - Preserves original user identity (sub) and permissions - Identifies the acting service via 'act' claim - Prevents permission escalation by copying original permissions Pattern: \"I'm <actorService> doing work on behalf of <original user>\""
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__checkauth = component "util.checkAuth" {
                    description "Verify and authorize a JWT token with policy enforcement"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__policy = component "util.policy" {
                    description "Fluent builder for creating authorization policies"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__jwks__clearjwkscache = component "jwks.clearJwksCache" {
                    description "Clear the JWKS cache (for testing purposes)"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__jwks__clearhttpjwkscache = component "jwks.clearHttpJwksCache" {
                    description "Clear the HTTP JWKS cache (for testing purposes)"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__jwks__fetchjwksfromservice = component "jwks.fetchJwksFromService" {
                    description "Fetch JWKS from a service binding Implements 5-minute caching to reduce load on JWKS service"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__jwks__validatejwksurl = component "jwks.validateJwksUrl" {
                    description "Validate JWKS URL for security requirements Requirements: - Must be valid URL format - Must use HTTPS (except localhost/127.0.0.1/[::1] for testing)"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__jwks__fetchjwksfromurl = component "jwks.fetchJwksFromUrl" {
                    description "Fetch JWKS from HTTP URL with caching Implements configurable TTL caching (default 5 minutes) Security: HTTPS-only (except localhost), 5-second timeout, 100KB size limit"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__jwks__getkeyfromjwks = component "jwks.getKeyFromJwks" {
                    description "Find and import a specific key from JWKS by kid Supports both EdDSA (Ed25519) and RSA (RS256/RS384/RS512) keys Algorithm is auto-detected from key type (kty) and curve (crv)"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__jwks__allowedthumbprints = component "jwks.allowedThumbprints" {
                    description "Get allowed thumbprints for key pinning (optional security measure)"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__main = component "util.main" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__generatesecret = component "util.generateSecret" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__isvalidbase64urlsecret = component "util.isValidBase64UrlSecret" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__core__sign = component "core.sign" {
                    description "Sign a JWT token with HS512 or EdDSA algorithm"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__parse = component "util.parse" {
                    description "Parse a JWT token into header and payload without verification"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__isexpiringsoon = component "util.isExpiringSoon" {
                    description "Check if JWT payload will expire within specified seconds"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__util__mapscopestopermissions = component "util.mapScopesToPermissions" {
                    description "Map OAuth scopes to permission strings"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__verify__resolveverificationkey = component "verify.resolveVerificationKey" {
                    description "Resolve verification key from configured sources Implements key resolution strategy pattern: - Strategy 1: HS512 shared secret - Strategy 2: Inline public JWK - Strategy 3: Service binding JWKS - Strategy 4: HTTP JWKS URL"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__verify__verify = component "verify.verify" {
                    description "Verify a JWT token with HS512, EdDSA, or RSA algorithms Supports multiple key resolution strategies with automatic algorithm detection"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__adapters__bindenv = component "adapters.bindEnv" {
                    description "Store both environment variables and service bindings globally"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__adapters__getservicebinding = component "adapters.getServiceBinding" {
                    description "Get service binding by name from global storage"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__adapters__makekit = component "adapters.makeKit" {
                    description "Returns a namespaced kit whose calls use the provided env bag. Automatically injects JWKS service binding if configured."
                    technology "function"
                    tags "Code"
                }

                # Component relationships
                chrislyons_dev_flarelette_jwt__util -> chrislyons_dev_flarelette_jwt__types "ParsedJwt | JwtPayload"
                chrislyons_dev_flarelette_jwt__verify -> chrislyons_dev_flarelette_jwt__core "envMode | getCommon | getHSSecret | getPublicJwkString | getJwksUrl | getJwksCacheTtl"
                chrislyons_dev_flarelette_jwt__verify -> chrislyons_dev_flarelette_jwt__jwks "fetchJwksFromService | fetchJwksFromUrl | getKeyFromJwks | allowedThumbprints"
                chrislyons_dev_flarelette_jwt__verify -> chrislyons_dev_flarelette_jwt__types "AlgType | Fetcher | JwtPayload"
                chrislyons_dev_flarelette_jwt__adapters -> chrislyons_dev_flarelette_jwt__main "imports * as kit"
                chrislyons_dev_flarelette_jwt__adapters -> chrislyons_dev_flarelette_jwt__core "imports getJwksServiceName"
                chrislyons_dev_flarelette_jwt__adapters -> chrislyons_dev_flarelette_jwt__types "WorkerEnv | Fetcher"
            }





            flarelette_jwt = container "flarelette-jwt" {
                description "Environment-driven JWT authentication for Cloudflare Workers Python with secret-name indirection"
                technology "Service"
                tags "Service,Auto-generated"

                # Components
                flarelette_jwt__adapters = component "adapters" {
                    description "Adapters for Cloudflare Workers Environment This module provides utilities to adapt Cloudflare Workers environment variables for use with the Flarelette JWT library."
                    technology "module"
                }
                flarelette_jwt__util = component "util" {
                    description "Environment Configuration for JWT Operations This module provides functions to read environment variables and derive JWT-related configurations. It supports both symmetric (HS512) and asymmetric (EdDSA) algorithms."
                    technology "module"
                }
                flarelette_jwt__explicit = component "explicit" {
                    description "Explicit Configuration API for JWT Operations This module provides functions that accept explicit configuration objects instead of relying on environment variables or global state. Use this API when you need full control over configuration, especially in development environments or when working with multiple JWT configurations."
                    technology "module"
                }
                flarelette_jwt__flarelette_jwt = component "flarelette_jwt" {
                    description "Component derived from directory: flarelette_jwt"
                    technology "module"
                }

                # Code elements (classes, functions)
                flarelette_jwt__adapters__apply_env_bindings = component "adapters.apply_env_bindings" {
                    description "Copy a Cloudflare Worker `env` mapping into os.environ so the kit can read it."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__jwtheader = component "util.JwtHeader" {
                    description "JWT token header structure."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__util__actorclaim = component "util.ActorClaim" {
                    description "Actor claim for service delegation (RFC 8693)."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__util__jwtpayload = component "util.JwtPayload" {
                    description "JWT token payload/claims structure."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__util__jwtprofile = component "util.JwtProfile" {
                    description "JWT Profile structure matching flarelette-jwt.profile.schema.json."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__util__jwtcommonconfig = component "util.JwtCommonConfig" {
                    description "Common JWT configuration from environment variables."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__util__mode = component "util.mode" {
                    description "Detect JWT algorithm mode from environment variables based on role."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__common = component "util.common" {
                    description "Get common JWT configuration from environment."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__profile = component "util.profile" {
                    description "Get JWT profile from environment."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util___get_indirect = component "util._get_indirect" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__get_hs_secret_bytes = component "util.get_hs_secret_bytes" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__get_public_jwk_string = component "util.get_public_jwk_string" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__algtype = component "util.AlgType" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__util__jwtvalue = component "util.JwtValue" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__util__claimsdict = component "util.ClaimsDict" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__explicit__basejwtconfig = component "explicit.BaseJwtConfig" {
                    description "Base JWT configuration shared by HS512 and EdDSA modes."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__hs512config = component "explicit.HS512Config" {
                    description "HS512 (HMAC-SHA512) symmetric configuration."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__eddsasignconfig = component "explicit.EdDSASignConfig" {
                    description "EdDSA (Ed25519) asymmetric configuration for signing."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__eddsaverifyconfig = component "explicit.EdDSAVerifyConfig" {
                    description "EdDSA (Ed25519) asymmetric configuration for verification."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__authzoptswithconfig = component "explicit.AuthzOptsWithConfig" {
                    description "Authorization options for check_auth_with_config."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__authuser = component "explicit.AuthUser" {
                    description "Authenticated user information."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit___b64url = component "explicit._b64url" {
                    description "Encode bytes to base64url without padding."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit___b64url_decode = component "explicit._b64url_decode" {
                    description "Decode base64url string (with or without padding)."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__sign_with_config = component "explicit.sign_with_config" {
                    description "Sign a JWT token with explicit configuration."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__verify_with_config = component "explicit.verify_with_config" {
                    description "Verify a JWT token with explicit configuration."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__create_token_with_config = component "explicit.create_token_with_config" {
                    description "Create a signed JWT token with explicit configuration."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__create_delegated_token_with_config = component "explicit.create_delegated_token_with_config" {
                    description "Create a delegated JWT token with explicit configuration."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__check_auth_with_config = component "explicit.check_auth_with_config" {
                    description "Verify and authorize a JWT token with explicit configuration."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__create_hs512_config = component "explicit.create_hs512_config" {
                    description "Helper function to create HS512 config from base64url-encoded secret."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__create_eddsa_sign_config = component "explicit.create_eddsa_sign_config" {
                    description "Helper function to create EdDSA sign config from JWK."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__create_eddsa_verify_config = component "explicit.create_eddsa_verify_config" {
                    description "Helper function to create EdDSA verify config from JWK."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__explicit__signconfig = component "explicit.SignConfig" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__explicit__verifyconfig = component "explicit.VerifyConfig" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__util__authuser = component "util.AuthUser" {
                    description "Authenticated user information returned by check_auth."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__util__policybuilder = component "util.PolicyBuilder" {
                    description "Builder interface for creating JWT authorization policies."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__util__policybuilder_base = component "util.PolicyBuilder.base" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__policybuilder_need_all = component "util.PolicyBuilder.need_all" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__policybuilder_need_any = component "util.PolicyBuilder.need_any" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__policybuilder_roles_all = component "util.PolicyBuilder.roles_all" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__policybuilder_roles_any = component "util.PolicyBuilder.roles_any" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__policybuilder_where = component "util.PolicyBuilder.where" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__policybuilder_build = component "util.PolicyBuilder.build" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__builder = component "util.Builder" {
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__util__builder_base = component "util.Builder.base" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__builder_need_all = component "util.Builder.need_all" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__builder_need_any = component "util.Builder.need_any" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__builder_roles_all = component "util.Builder.roles_all" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__builder_roles_any = component "util.Builder.roles_any" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__builder_where = component "util.Builder.where" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__builder_build = component "util.Builder.build" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__util__create_token = component "util.create_token" {
                    description "Create a signed JWT token with optional claims."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__create_delegated_token = component "util.create_delegated_token" {
                    description "Create a delegated JWT token following RFC 8693 actor claim pattern."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__check_auth = component "util.check_auth" {
                    description "Verify and authorize a JWT token with policy enforcement."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__policy = component "util.policy" {
                    description "Fluent builder for creating authorization policies."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__generate_secret = component "util.generate_secret" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__is_valid_base64url_secret = component "util.is_valid_base64url_secret" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__main = component "util.main" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util___b64url = component "util._b64url" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__sign = component "util.sign" {
                    description "Sign a JWT token with HS512 or EdDSA algorithm."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__parsedjwt = component "util.ParsedJwt" {
                    description "Parsed JWT token structure."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__util__parse = component "util.parse" {
                    description "Parse a JWT token into header and payload without verification."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__is_expiring_soon = component "util.is_expiring_soon" {
                    description "Check if JWT payload will expire within specified seconds."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__map_scopes_to_permissions = component "util.map_scopes_to_permissions" {
                    description "Map OAuth scopes to permission strings."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util___b64url_decode = component "util._b64url_decode" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__util__verify = component "util.verify" {
                    description "Verify a JWT token with HS512 or EdDSA algorithm."
                    technology "function"
                    tags "Code,Code"
                }
            }

        }
    }

    views {
/**
 * Default Structurizr theme for Archlette
 * 
 * This theme provides a modern, professional color scheme for architecture diagrams
 * with clear visual hierarchy and accessibility considerations.
 */

theme default

// Element styles
styles {
    // Person/Actor styles
    element "Person" {
        background #08427b
        color #ffffff
        shape Person
        fontSize 22
    }

    // External System styles
    element "External System" {
        background #999999
        color #ffffff
        shape RoundedBox
        fontSize 22
    }

    element "External" {
        background #999999
        color #ffffff
        shape RoundedBox
        fontSize 22
    }

    // System styles
    element "Software System" {
        background #1168bd
        color #ffffff
        shape RoundedBox
        fontSize 24
    }

    // Container styles
    element "Container" {
        background #438dd5
        color #ffffff
        shape RoundedBox
        fontSize 20
    }

    element "Database" {
        background #438dd5
        color #ffffff
        shape Cylinder
        fontSize 20
    }

    element "Web Browser" {
        background #438dd5
        color #ffffff
        shape WebBrowser
        fontSize 20
    }

    element "Mobile App" {
        background #438dd5
        color #ffffff
        shape MobileDevicePortrait
        fontSize 20
    }

    // Component styles
    element "Component" {
        background #85bbf0
        color #000000
        shape RoundedBox
        fontSize 18
    }

    // Technology-specific styles
    element "Cloudflare Worker" {
        background #f6821f
        color #ffffff
        shape RoundedBox
        fontSize 18
    }

    element "Service" {
        background #438dd5
        color #ffffff
        shape RoundedBox
        fontSize 18
    }

    element "API" {
        background #85bbf0
        color #000000
        shape Hexagon
        fontSize 18
    }

    element "Queue" {
        background #85bbf0
        color #000000
        shape Pipe
        fontSize 18
    }

    // Tag-based styles
    element "Internal System" {
        background #1168bd
        color #ffffff
    }

    element "Deprecated" {
        background #cc0000
        color #ffffff
        opacity 60
    }

    element "Future" {
        background #dddddd
        color #000000
        opacity 50
        stroke #999999
        strokeWidth 2
    }

    element "Auto Generated" {
        stroke #999999
        strokeWidth 1
    }

    // Infrastructure styles
    element "Infrastructure" {
        background #92278f
        color #ffffff
        shape RoundedBox
    }

    element "Message Bus" {
        background #85bbf0
        color #000000
        shape Pipe
    }

    // Relationship styles
    relationship "Relationship" {
        color #707070
        dashed false
        routing Curved
        fontSize 12
        thickness 2
    }

    relationship "Async" {
        dashed true
        color #707070
    }

    relationship "Sync" {
        dashed false
        color #707070
    }

    relationship "Uses" {
        color #707070
        dashed false
    }

    relationship "Depends On" {
        color #707070
        dashed true
    }
}

// Diagram customization
branding {
    font "Arial"
}


        systemContext flarelette_jwt_kit "SystemContext" {
            include flarelette_jwt_kit
            autoLayout
        }

        container flarelette_jwt_kit "Containers" {
            include chrislyons_dev_flarelette_jwt
            include flarelette_jwt
            autoLayout
        }


        component chrislyons_dev_flarelette_jwt "Components__chrislyons_dev_flarelette_jwt" {
            include chrislyons_dev_flarelette_jwt__core
            include chrislyons_dev_flarelette_jwt__explicit
            include chrislyons_dev_flarelette_jwt__util
            include chrislyons_dev_flarelette_jwt__main
            include chrislyons_dev_flarelette_jwt__jwks
            include chrislyons_dev_flarelette_jwt__types
            include chrislyons_dev_flarelette_jwt__verify
            include chrislyons_dev_flarelette_jwt__adapters
            exclude "element.tag==Code"
            autoLayout
        }


        component flarelette_jwt "Components_flarelette_jwt" {
            include flarelette_jwt__adapters
            include flarelette_jwt__util
            include flarelette_jwt__explicit
            include flarelette_jwt__flarelette_jwt
            exclude "element.tag==Code"
            autoLayout
        }


        component chrislyons_dev_flarelette_jwt "Classes_chrislyons_dev_flarelette_jwt__core" {
            include chrislyons_dev_flarelette_jwt__core__envread
            include chrislyons_dev_flarelette_jwt__core__envmode
            include chrislyons_dev_flarelette_jwt__core__getcommon
            include chrislyons_dev_flarelette_jwt__core__getprofile
            include chrislyons_dev_flarelette_jwt__core__gethssecret
            include chrislyons_dev_flarelette_jwt__core__getprivatejwkstring
            include chrislyons_dev_flarelette_jwt__core__getpublicjwkstring
            include chrislyons_dev_flarelette_jwt__core__getjwksservicename
            include chrislyons_dev_flarelette_jwt__core__getjwksurl
            include chrislyons_dev_flarelette_jwt__core__getjwkscachettl
            include chrislyons_dev_flarelette_jwt__core__sign
            autoLayout
        }


        component chrislyons_dev_flarelette_jwt "Classes_chrislyons_dev_flarelette_jwt__explicit" {
            include chrislyons_dev_flarelette_jwt__explicit__signwithconfig
            include chrislyons_dev_flarelette_jwt__explicit__verifywithconfig
            include chrislyons_dev_flarelette_jwt__explicit__createtokenwithconfig
            include chrislyons_dev_flarelette_jwt__explicit__createdelegatedtokenwithconfig
            include chrislyons_dev_flarelette_jwt__explicit__checkauthwithconfig
            include chrislyons_dev_flarelette_jwt__explicit__createhs512config
            include chrislyons_dev_flarelette_jwt__explicit__createeddsasignconfig
            include chrislyons_dev_flarelette_jwt__explicit__createeddsaverifyconfig
            include chrislyons_dev_flarelette_jwt__explicit__createjwksurlverifyconfig
            autoLayout
        }


        component chrislyons_dev_flarelette_jwt "Classes_chrislyons_dev_flarelette_jwt__util" {
            include chrislyons_dev_flarelette_jwt__util__createtoken
            include chrislyons_dev_flarelette_jwt__util__createdelegatedtoken
            include chrislyons_dev_flarelette_jwt__util__checkauth
            include chrislyons_dev_flarelette_jwt__util__policy
            include chrislyons_dev_flarelette_jwt__util__main
            include chrislyons_dev_flarelette_jwt__util__generatesecret
            include chrislyons_dev_flarelette_jwt__util__isvalidbase64urlsecret
            include chrislyons_dev_flarelette_jwt__util__parse
            include chrislyons_dev_flarelette_jwt__util__isexpiringsoon
            include chrislyons_dev_flarelette_jwt__util__mapscopestopermissions
            autoLayout
        }


        component chrislyons_dev_flarelette_jwt "Classes_chrislyons_dev_flarelette_jwt__jwks" {
            include chrislyons_dev_flarelette_jwt__jwks__clearjwkscache
            include chrislyons_dev_flarelette_jwt__jwks__clearhttpjwkscache
            include chrislyons_dev_flarelette_jwt__jwks__fetchjwksfromservice
            include chrislyons_dev_flarelette_jwt__jwks__validatejwksurl
            include chrislyons_dev_flarelette_jwt__jwks__fetchjwksfromurl
            include chrislyons_dev_flarelette_jwt__jwks__getkeyfromjwks
            include chrislyons_dev_flarelette_jwt__jwks__allowedthumbprints
            autoLayout
        }


        component chrislyons_dev_flarelette_jwt "Classes_chrislyons_dev_flarelette_jwt__verify" {
            include chrislyons_dev_flarelette_jwt__verify__resolveverificationkey
            include chrislyons_dev_flarelette_jwt__verify__verify
            autoLayout
        }


        component chrislyons_dev_flarelette_jwt "Classes_chrislyons_dev_flarelette_jwt__adapters" {
            include chrislyons_dev_flarelette_jwt__adapters__bindenv
            include chrislyons_dev_flarelette_jwt__adapters__getservicebinding
            include chrislyons_dev_flarelette_jwt__adapters__makekit
            autoLayout
        }


        component flarelette_jwt "Classes_flarelette_jwt__adapters" {
            include flarelette_jwt__adapters__apply_env_bindings
            autoLayout
        }


        component flarelette_jwt "Classes_flarelette_jwt__util" {
            include flarelette_jwt__util__jwtheader
            include flarelette_jwt__util__actorclaim
            include flarelette_jwt__util__jwtpayload
            include flarelette_jwt__util__jwtprofile
            include flarelette_jwt__util__jwtcommonconfig
            include flarelette_jwt__util__mode
            include flarelette_jwt__util__common
            include flarelette_jwt__util__profile
            include flarelette_jwt__util___get_indirect
            include flarelette_jwt__util__get_hs_secret_bytes
            include flarelette_jwt__util__get_public_jwk_string
            include flarelette_jwt__util__algtype
            include flarelette_jwt__util__jwtvalue
            include flarelette_jwt__util__claimsdict
            include flarelette_jwt__util__authuser
            include flarelette_jwt__util__policybuilder
            include flarelette_jwt__util__policybuilder_base
            include flarelette_jwt__util__policybuilder_need_all
            include flarelette_jwt__util__policybuilder_need_any
            include flarelette_jwt__util__policybuilder_roles_all
            include flarelette_jwt__util__policybuilder_roles_any
            include flarelette_jwt__util__policybuilder_where
            include flarelette_jwt__util__policybuilder_build
            include flarelette_jwt__util__builder
            include flarelette_jwt__util__builder_base
            include flarelette_jwt__util__builder_need_all
            include flarelette_jwt__util__builder_need_any
            include flarelette_jwt__util__builder_roles_all
            include flarelette_jwt__util__builder_roles_any
            include flarelette_jwt__util__builder_where
            include flarelette_jwt__util__builder_build
            include flarelette_jwt__util__create_token
            include flarelette_jwt__util__create_delegated_token
            include flarelette_jwt__util__check_auth
            include flarelette_jwt__util__policy
            include flarelette_jwt__util__generate_secret
            include flarelette_jwt__util__is_valid_base64url_secret
            include flarelette_jwt__util__main
            include flarelette_jwt__util___b64url
            include flarelette_jwt__util__sign
            include flarelette_jwt__util__parsedjwt
            include flarelette_jwt__util__parse
            include flarelette_jwt__util__is_expiring_soon
            include flarelette_jwt__util__map_scopes_to_permissions
            include flarelette_jwt__util___b64url_decode
            include flarelette_jwt__util__verify
            autoLayout
        }


        component flarelette_jwt "Classes_flarelette_jwt__explicit" {
            include flarelette_jwt__explicit__basejwtconfig
            include flarelette_jwt__explicit__hs512config
            include flarelette_jwt__explicit__eddsasignconfig
            include flarelette_jwt__explicit__eddsaverifyconfig
            include flarelette_jwt__explicit__authzoptswithconfig
            include flarelette_jwt__explicit__authuser
            include flarelette_jwt__explicit___b64url
            include flarelette_jwt__explicit___b64url_decode
            include flarelette_jwt__explicit__sign_with_config
            include flarelette_jwt__explicit__verify_with_config
            include flarelette_jwt__explicit__create_token_with_config
            include flarelette_jwt__explicit__create_delegated_token_with_config
            include flarelette_jwt__explicit__check_auth_with_config
            include flarelette_jwt__explicit__create_hs512_config
            include flarelette_jwt__explicit__create_eddsa_sign_config
            include flarelette_jwt__explicit__create_eddsa_verify_config
            include flarelette_jwt__explicit__signconfig
            include flarelette_jwt__explicit__verifyconfig
            autoLayout
        }

    }

}
