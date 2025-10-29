import base64
import os
from typing import TypedDict


class JwtCommonConfig(TypedDict):
    """Common JWT configuration from environment variables."""

    iss: str
    aud: str
    leeway: int
    ttl_seconds: int


def mode(role: str) -> str:
    """Detect JWT mode from environment variables based on role."""

    # Producers use private keys to sign
    if role == "producer" and (
        os.getenv("JWT_PRIVATE_JWK")
        or os.getenv("JWT_PRIVATE_JWK_PATH")
        or os.getenv("JWT_PRIVATE_JWK_NAME")
    ):
        return "EdDSA"

    # Consumers use public keys or JWKS to verify
    if role == "consumer" and (
        os.getenv("JWT_PUBLIC_JWK")
        or os.getenv("JWT_PUBLIC_JWK_NAME")
        or os.getenv("JWT_JWKS_URL")
        or os.getenv("JWT_JWKS_URL_NAME")
    ):
        return "EdDSA"

    return "HS512"


def common() -> JwtCommonConfig:
    return {
        "iss": os.getenv("JWT_ISS", ""),
        "aud": os.getenv("JWT_AUD", ""),
        "leeway": int(os.getenv("JWT_LEEWAY", "90")),
        "ttl_seconds": int(os.getenv("JWT_TTL_SECONDS", "900")),
    }


def _get_indirect(name_var: str, direct_var: str) -> str | None:
    name = os.getenv(name_var)
    if name and os.getenv(name):
        return os.getenv(name)
    return os.getenv(direct_var)


def get_hs_secret_bytes() -> bytes:
    s = _get_indirect("JWT_SECRET_NAME", "JWT_SECRET") or ""
    if not s:
        raise RuntimeError(
            "JWT secret missing: set JWT_SECRET_NAME -> bound secret, or JWT_SECRET"
        )
    try:
        b = base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))
        if len(b) >= 32:
            return b
    except Exception:
        pass
    return s.encode("utf-8")


def get_public_jwk_string() -> str | None:
    return _get_indirect("JWT_PUBLIC_JWK_NAME", "JWT_PUBLIC_JWK")
