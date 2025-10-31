"""
Flarelette JWT Python Library

This package provides utilities for JWT signing, verification, and management.
It includes support for both symmetric (HS512) and asymmetric (EdDSA) algorithms.
"""

from .env import (
    ActorClaim,
    AlgType,
    ClaimsDict,
    JwtCommonConfig,
    JwtHeader,
    JwtPayload,
    JwtProfile,
    JwtValue,
    common,
    mode,
    profile,
)
from .high import AuthUser, check_auth, create_delegated_token, create_token, policy
from .secret import generate_secret, is_valid_base64url_secret
from .sign import sign
from .util import ParsedJwt, is_expiring_soon, map_scopes_to_permissions, parse
from .verify import verify

__version__ = "0.1.0"

__all__ = [
    # Types
    "AlgType",
    "JwtValue",
    "ClaimsDict",
    "JwtProfile",
    "JwtCommonConfig",
    "JwtHeader",
    "JwtPayload",
    "ActorClaim",
    "ParsedJwt",
    "AuthUser",
    # Functions
    "common",
    "mode",
    "profile",
    "check_auth",
    "create_token",
    "create_delegated_token",
    "policy",
    "generate_secret",
    "is_valid_base64url_secret",
    "sign",
    "is_expiring_soon",
    "map_scopes_to_permissions",
    "parse",
    "verify",
]
