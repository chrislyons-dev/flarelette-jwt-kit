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
                chrislyons_dev_flarelette_jwt__src = component "src" {
                    description "Component inferred from directory: src"
                    technology "module"
                }
                chrislyons_dev_flarelette_jwt__adapters = component "adapters" {
                    description "Component inferred from directory: adapters"
                    technology "module"
                }

                # Code elements (classes, functions)
                chrislyons_dev_flarelette_jwt__src__envread = component "src.envRead" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__envmode = component "src.envMode" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__getcommon = component "src.getCommon" {
                    description "Get common JWT configuration from environment Returns partial JwtProfile-compatible configuration"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__getprofile = component "src.getProfile" {
                    description "Get JWT profile from environment Returns complete JwtProfile with detected algorithm"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__gethssecret = component "src.getHSSecret" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__getprivatejwkstring = component "src.getPrivateJwkString" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__getpublicjwkstring = component "src.getPublicJwkString" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__getjwksservicename = component "src.getJwksServiceName" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__createtoken = component "src.createToken" {
                    description "Create a signed JWT token with optional claims"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__createdelegatedtoken = component "src.createDelegatedToken" {
                    description "Create a delegated JWT token following RFC 8693 actor claim pattern Mints a new short-lived token for use within service boundaries where a service acts on behalf of the original end user. This implements zero-trust delegation: - Preserves original user identity (sub) and permissions - Identifies the acting service via 'act' claim - Prevents permission escalation by copying original permissions Pattern: \"I'm <actorService> doing work on behalf of <original user>\""
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__checkauth = component "src.checkAuth" {
                    description "Verify and authorize a JWT token with policy enforcement"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__policy = component "src.policy" {
                    description "Fluent builder for creating authorization policies"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__clearjwkscache = component "src.clearJwksCache" {
                    description "Clear the JWKS cache (for testing purposes)"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__fetchjwksfromservice = component "src.fetchJwksFromService" {
                    description "Fetch JWKS from a service binding Implements 5-minute caching to reduce load on JWKS service"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__getkeyfromjwks = component "src.getKeyFromJwks" {
                    description "Find and import a specific key from JWKS by kid"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__allowedthumbprints = component "src.allowedThumbprints" {
                    description "Get allowed thumbprints for key pinning (optional security measure)"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__main = component "src.main" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__generatesecret = component "src.generateSecret" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__isvalidbase64urlsecret = component "src.isValidBase64UrlSecret" {
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__sign = component "src.sign" {
                    description "Sign a JWT token with HS512 or EdDSA algorithm"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__parse = component "src.parse" {
                    description "Parse a JWT token into header and payload without verification"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__isexpiringsoon = component "src.isExpiringSoon" {
                    description "Check if JWT payload will expire within specified seconds"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__mapscopestopermissions = component "src.mapScopesToPermissions" {
                    description "Map OAuth scopes to permission strings"
                    technology "function"
                    tags "Code"
                }
                chrislyons_dev_flarelette_jwt__src__verify = component "src.verify" {
                    description "Verify a JWT token with HS512 or EdDSA algorithm"
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
                chrislyons_dev_flarelette_jwt__adapters -> chrislyons_dev_flarelette_jwt__src "* as kit | getJwksServiceName | WorkerEnv | Fetcher"
            }





            flarelette_jwt = container "flarelette-jwt" {
                description "Environment-driven JWT authentication for Cloudflare Workers Python with secret-name indirection"
                technology "Service"
                tags "Service,Auto-generated"

                # Components
                flarelette_jwt__flarelette_jwt_py = component "flarelette-jwt-py" {
                    description "Component derived from directory: flarelette-jwt-py"
                    technology "module"
                }
                flarelette_jwt__flarelette_jwt = component "flarelette_jwt" {
                    description "Component derived from directory: flarelette_jwt"
                    technology "module"
                }

                # Code elements (classes, functions)
                flarelette_jwt__flarelette_jwt_py__on_fetch = component "flarelette-jwt-py.on_fetch" {
                    description "Handle incoming requests for testing."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt_py__pkg_dir = component "flarelette-jwt-py.PKG_DIR" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__flarelette_jwt_py__docs_dir = component "flarelette-jwt-py.DOCS_DIR" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__flarelette_jwt__apply_env_bindings = component "flarelette_jwt.apply_env_bindings" {
                    description "Copy a Cloudflare Worker `env` mapping into os.environ so the kit can read it."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__jwtheader = component "flarelette_jwt.JwtHeader" {
                    description "JWT token header structure."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__actorclaim = component "flarelette_jwt.ActorClaim" {
                    description "Actor claim for service delegation (RFC 8693)."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__jwtpayload = component "flarelette_jwt.JwtPayload" {
                    description "JWT token payload/claims structure."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__jwtprofile = component "flarelette_jwt.JwtProfile" {
                    description "JWT Profile structure matching flarelette-jwt.profile.schema.json."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__jwtcommonconfig = component "flarelette_jwt.JwtCommonConfig" {
                    description "Common JWT configuration from environment variables."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__mode = component "flarelette_jwt.mode" {
                    description "Detect JWT algorithm mode from environment variables based on role."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__common = component "flarelette_jwt.common" {
                    description "Get common JWT configuration from environment."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__profile = component "flarelette_jwt.profile" {
                    description "Get JWT profile from environment."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt___get_indirect = component "flarelette_jwt._get_indirect" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__get_hs_secret_bytes = component "flarelette_jwt.get_hs_secret_bytes" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__get_public_jwk_string = component "flarelette_jwt.get_public_jwk_string" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__algtype = component "flarelette_jwt.AlgType" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__flarelette_jwt__jwtvalue = component "flarelette_jwt.JwtValue" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__flarelette_jwt__claimsdict = component "flarelette_jwt.ClaimsDict" {
                    technology "type"
                    tags "Code,Code,Type"
                }
                flarelette_jwt__flarelette_jwt__authuser = component "flarelette_jwt.AuthUser" {
                    description "Authenticated user information returned by check_auth."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__policybuilder = component "flarelette_jwt.PolicyBuilder" {
                    description "Builder interface for creating JWT authorization policies."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__policybuilder_base = component "flarelette_jwt.PolicyBuilder.base" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__policybuilder_need_all = component "flarelette_jwt.PolicyBuilder.need_all" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__policybuilder_need_any = component "flarelette_jwt.PolicyBuilder.need_any" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__policybuilder_roles_all = component "flarelette_jwt.PolicyBuilder.roles_all" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__policybuilder_roles_any = component "flarelette_jwt.PolicyBuilder.roles_any" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__policybuilder_where = component "flarelette_jwt.PolicyBuilder.where" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__policybuilder_build = component "flarelette_jwt.PolicyBuilder.build" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__builder = component "flarelette_jwt.Builder" {
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__builder_base = component "flarelette_jwt.Builder.base" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__builder_need_all = component "flarelette_jwt.Builder.need_all" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__builder_need_any = component "flarelette_jwt.Builder.need_any" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__builder_roles_all = component "flarelette_jwt.Builder.roles_all" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__builder_roles_any = component "flarelette_jwt.Builder.roles_any" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__builder_where = component "flarelette_jwt.Builder.where" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__builder_build = component "flarelette_jwt.Builder.build" {
                    technology "method"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__create_token = component "flarelette_jwt.create_token" {
                    description "Create a signed JWT token with optional claims."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__create_delegated_token = component "flarelette_jwt.create_delegated_token" {
                    description "Create a delegated JWT token following RFC 8693 actor claim pattern."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__check_auth = component "flarelette_jwt.check_auth" {
                    description "Verify and authorize a JWT token with policy enforcement."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__policy = component "flarelette_jwt.policy" {
                    description "Fluent builder for creating authorization policies."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__generate_secret = component "flarelette_jwt.generate_secret" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__is_valid_base64url_secret = component "flarelette_jwt.is_valid_base64url_secret" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__main = component "flarelette_jwt.main" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt___b64url = component "flarelette_jwt._b64url" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__sign = component "flarelette_jwt.sign" {
                    description "Sign a JWT token with HS512 or EdDSA algorithm."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__parsedjwt = component "flarelette_jwt.ParsedJwt" {
                    description "Parsed JWT token structure."
                    technology "class"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__parse = component "flarelette_jwt.parse" {
                    description "Parse a JWT token into header and payload without verification."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__is_expiring_soon = component "flarelette_jwt.is_expiring_soon" {
                    description "Check if JWT payload will expire within specified seconds."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__map_scopes_to_permissions = component "flarelette_jwt.map_scopes_to_permissions" {
                    description "Map OAuth scopes to permission strings."
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt___b64url_decode = component "flarelette_jwt._b64url_decode" {
                    technology "function"
                    tags "Code,Code"
                }
                flarelette_jwt__flarelette_jwt__verify = component "flarelette_jwt.verify" {
                    description "Verify a JWT token with HS512 or EdDSA algorithm."
                    technology "function"
                    tags "Code,Code"
                }

                # Component relationships
                flarelette_jwt__flarelette_jwt_py -> flarelette_jwt__flarelette_jwt "create_token | sign | verify"
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
            include chrislyons_dev_flarelette_jwt__src
            include chrislyons_dev_flarelette_jwt__adapters
            exclude "element.tag==Code"
            autoLayout
        }


        component flarelette_jwt "Components_flarelette_jwt" {
            include flarelette_jwt__flarelette_jwt_py
            include flarelette_jwt__flarelette_jwt
            exclude "element.tag==Code"
            autoLayout
        }


        component chrislyons_dev_flarelette_jwt "Classes_chrislyons_dev_flarelette_jwt__src" {
            include chrislyons_dev_flarelette_jwt__src__envread
            include chrislyons_dev_flarelette_jwt__src__envmode
            include chrislyons_dev_flarelette_jwt__src__getcommon
            include chrislyons_dev_flarelette_jwt__src__getprofile
            include chrislyons_dev_flarelette_jwt__src__gethssecret
            include chrislyons_dev_flarelette_jwt__src__getprivatejwkstring
            include chrislyons_dev_flarelette_jwt__src__getpublicjwkstring
            include chrislyons_dev_flarelette_jwt__src__getjwksservicename
            include chrislyons_dev_flarelette_jwt__src__createtoken
            include chrislyons_dev_flarelette_jwt__src__createdelegatedtoken
            include chrislyons_dev_flarelette_jwt__src__checkauth
            include chrislyons_dev_flarelette_jwt__src__policy
            include chrislyons_dev_flarelette_jwt__src__clearjwkscache
            include chrislyons_dev_flarelette_jwt__src__fetchjwksfromservice
            include chrislyons_dev_flarelette_jwt__src__getkeyfromjwks
            include chrislyons_dev_flarelette_jwt__src__allowedthumbprints
            include chrislyons_dev_flarelette_jwt__src__main
            include chrislyons_dev_flarelette_jwt__src__generatesecret
            include chrislyons_dev_flarelette_jwt__src__isvalidbase64urlsecret
            include chrislyons_dev_flarelette_jwt__src__sign
            include chrislyons_dev_flarelette_jwt__src__parse
            include chrislyons_dev_flarelette_jwt__src__isexpiringsoon
            include chrislyons_dev_flarelette_jwt__src__mapscopestopermissions
            include chrislyons_dev_flarelette_jwt__src__verify
            autoLayout
        }


        component chrislyons_dev_flarelette_jwt "Classes_chrislyons_dev_flarelette_jwt__adapters" {
            include chrislyons_dev_flarelette_jwt__adapters__bindenv
            include chrislyons_dev_flarelette_jwt__adapters__getservicebinding
            include chrislyons_dev_flarelette_jwt__adapters__makekit
            autoLayout
        }


        component flarelette_jwt "Classes_flarelette_jwt__flarelette_jwt_py" {
            include flarelette_jwt__flarelette_jwt_py__on_fetch
            include flarelette_jwt__flarelette_jwt_py__pkg_dir
            include flarelette_jwt__flarelette_jwt_py__docs_dir
            autoLayout
        }


        component flarelette_jwt "Classes_flarelette_jwt__flarelette_jwt" {
            include flarelette_jwt__flarelette_jwt__apply_env_bindings
            include flarelette_jwt__flarelette_jwt__jwtheader
            include flarelette_jwt__flarelette_jwt__actorclaim
            include flarelette_jwt__flarelette_jwt__jwtpayload
            include flarelette_jwt__flarelette_jwt__jwtprofile
            include flarelette_jwt__flarelette_jwt__jwtcommonconfig
            include flarelette_jwt__flarelette_jwt__mode
            include flarelette_jwt__flarelette_jwt__common
            include flarelette_jwt__flarelette_jwt__profile
            include flarelette_jwt__flarelette_jwt___get_indirect
            include flarelette_jwt__flarelette_jwt__get_hs_secret_bytes
            include flarelette_jwt__flarelette_jwt__get_public_jwk_string
            include flarelette_jwt__flarelette_jwt__algtype
            include flarelette_jwt__flarelette_jwt__jwtvalue
            include flarelette_jwt__flarelette_jwt__claimsdict
            include flarelette_jwt__flarelette_jwt__authuser
            include flarelette_jwt__flarelette_jwt__policybuilder
            include flarelette_jwt__flarelette_jwt__policybuilder_base
            include flarelette_jwt__flarelette_jwt__policybuilder_need_all
            include flarelette_jwt__flarelette_jwt__policybuilder_need_any
            include flarelette_jwt__flarelette_jwt__policybuilder_roles_all
            include flarelette_jwt__flarelette_jwt__policybuilder_roles_any
            include flarelette_jwt__flarelette_jwt__policybuilder_where
            include flarelette_jwt__flarelette_jwt__policybuilder_build
            include flarelette_jwt__flarelette_jwt__builder
            include flarelette_jwt__flarelette_jwt__builder_base
            include flarelette_jwt__flarelette_jwt__builder_need_all
            include flarelette_jwt__flarelette_jwt__builder_need_any
            include flarelette_jwt__flarelette_jwt__builder_roles_all
            include flarelette_jwt__flarelette_jwt__builder_roles_any
            include flarelette_jwt__flarelette_jwt__builder_where
            include flarelette_jwt__flarelette_jwt__builder_build
            include flarelette_jwt__flarelette_jwt__create_token
            include flarelette_jwt__flarelette_jwt__create_delegated_token
            include flarelette_jwt__flarelette_jwt__check_auth
            include flarelette_jwt__flarelette_jwt__policy
            include flarelette_jwt__flarelette_jwt__generate_secret
            include flarelette_jwt__flarelette_jwt__is_valid_base64url_secret
            include flarelette_jwt__flarelette_jwt__main
            include flarelette_jwt__flarelette_jwt___b64url
            include flarelette_jwt__flarelette_jwt__sign
            include flarelette_jwt__flarelette_jwt__parsedjwt
            include flarelette_jwt__flarelette_jwt__parse
            include flarelette_jwt__flarelette_jwt__is_expiring_soon
            include flarelette_jwt__flarelette_jwt__map_scopes_to_permissions
            include flarelette_jwt__flarelette_jwt___b64url_decode
            include flarelette_jwt__flarelette_jwt__verify
            autoLayout
        }

    }

}
