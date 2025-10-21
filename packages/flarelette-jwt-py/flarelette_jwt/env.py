
import os, base64

def mode(role: str) -> str:
    if os.getenv('JWT_PRIVATE_JWK') or os.getenv('JWT_PRIVATE_JWK_PATH'): return 'EdDSA'
    if os.getenv('JWT_PUBLIC_JWK') or os.getenv('JWT_JWKS_URL'): return 'EdDSA'
    return 'HS512'

def common():
    return {
        "iss": os.getenv("JWT_ISS", ""),
        "aud": os.getenv("JWT_AUD", ""),
        "leeway": int(os.getenv("JWT_LEEWAY", "90")),
        "ttl_seconds": int(os.getenv("JWT_TTL_SECONDS", "900")),
    }

def get_hs_secret_bytes() -> bytes:
    s = os.getenv("JWT_SECRET", "")
    if not s: raise RuntimeError("JWT_SECRET missing")
    try:
        b = base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))
        if len(b) >= 32: return b
    except Exception:
        pass
    return s.encode("utf-8")
