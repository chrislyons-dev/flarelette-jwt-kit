
from __future__ import annotations
import json, base64, time
from typing import Any
from js import crypto  # Cloudflare Workers WebCrypto

def _b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))

async def verify(token: str, *, secret: str, iss: str, aud: str, leeway: int = 90) -> dict[str, Any] | None:
    try:
        h_b64, p_b64, s_b64 = token.split('.')
        header = json.loads(_b64url_decode(h_b64))
        payload = json.loads(_b64url_decode(p_b64))
        sig = _b64url_decode(s_b64)
    except Exception:
        return None
    if header.get('alg') != 'HS512':
        return None
    key = await crypto.subtle.importKey("raw", bytes(secret, "utf-8"), {"name": "HMAC", "hash": "SHA-512"}, False, ["verify"])
    ok = await crypto.subtle.verify({"name": "HMAC"}, key, sig, (h_b64 + '.' + p_b64).encode())
    if not ok:
        return None
    now = int(time.time())
    if payload.get('iss') != iss: return None
    if payload.get('aud') != aud: return None
    if now > int(payload.get('exp', 0)) + int(leeway): return None
    nbf = int(payload.get('nbf', payload.get('iat', 0)))
    if now + int(leeway) < nbf: return None
    return payload
