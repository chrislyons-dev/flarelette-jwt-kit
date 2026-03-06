"""
JWT Verification Utilities

This module provides functions to verify JWT tokens using HS512 or EdDSA algorithms.
It includes support for audience and issuer validation, as well as clock skew tolerance.

@module util

"""

from __future__ import annotations

import base64
import json
import time

# NOTE: 'js' module imported lazily inside function - only available in Cloudflare Workers
from .env import (
    AlgType,
    JwtHeader,
    JwtPayload,
    common,
    get_hs_secret_bytes,
    get_jwks_url,
    get_public_jwk_string,
    mode,
)
from .explicit import (
    _fetch_jwks_from_url,
    _find_jwk_by_kid,
    _verify_asymmetric_signature,
)


def _b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


async def verify(
    token: str,
    *,
    iss: str | None = None,
    aud: str | list[str] | None = None,
    leeway: int | None = None,
) -> JwtPayload | None:
    """Verify a JWT token with HS512 or EdDSA algorithm.

    Args:
        token: JWT token string to verify
        iss: Optional issuer override
        aud: Optional audience override (string or list)
        leeway: Optional clock skew tolerance override in seconds

    Returns:
        Decoded payload if valid, None otherwise
    """
    m: AlgType = mode("consumer")
    cfg = common()
    iss = iss or cfg["iss"]
    aud = aud or cfg["aud"]
    leeway = int(leeway or cfg["leeway"])

    try:
        h_b64, p_b64, s_b64 = token.split(".")
        header: JwtHeader = json.loads(_b64url_decode(h_b64))
        payload: JwtPayload = json.loads(_b64url_decode(p_b64))
        sig = _b64url_decode(s_b64)
    except Exception:
        return None

    if m == "HS512":
        if header.get("alg") != "HS512":
            return None
        # Lazy import - only available in Cloudflare Workers/Pyodide runtime
        from js import crypto  # noqa: PLC0415

        key = await crypto.subtle.importKey(
            "raw",
            get_hs_secret_bytes(),
            {"name": "HMAC", "hash": "SHA-512"},
            False,
            ["verify"],
        )
        ok = await crypto.subtle.verify(
            {"name": "HMAC"}, key, sig, (h_b64 + "." + p_b64).encode()
        )
        if not ok:
            return None
    else:
        signing_input = (h_b64 + "." + p_b64).encode()
        jwk_str = get_public_jwk_string()
        if jwk_str:
            jwk = json.loads(jwk_str)
        else:
            jwks_url = get_jwks_url()
            if not jwks_url:
                return None
            jwk = _find_jwk_by_kid(
                header.get("kid"), await _fetch_jwks_from_url(jwks_url)
            )
        if not jwk:
            return None
        if not await _verify_asymmetric_signature(header, signing_input, sig, jwk):
            return None

    now = int(time.time())
    if payload.get("iss") != iss:
        return None
    if payload.get("aud") != aud:
        return None
    if now > int(payload.get("exp", 0)) + int(leeway):
        return None
    nbf = int(payload.get("nbf", payload.get("iat", 0)))
    if now + int(leeway) < nbf:
        return None
    return payload
