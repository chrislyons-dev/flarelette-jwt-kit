
from __future__ import annotations
import json, base64, time
from js import crypto  # Cloudflare Workers WebCrypto

def _b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode('utf-8').rstrip('=')

async def sign(payload: dict, *, secret: str, iss: str, aud: str, ttl_seconds: int = 900) -> str:
    header = {"alg": "HS512", "typ": "JWT"}
    now = int(time.time())
    body = dict(payload)
    body.setdefault("iss", iss)
    body.setdefault("aud", aud)
    body.setdefault("iat", now)
    body.setdefault("exp", now + int(ttl_seconds))
    h = _b64url(json.dumps(header, separators=(',', ':')).encode())
    p = _b64url(json.dumps(body, separators=(',', ':')).encode())
    signing_input = f"{h}.{p}".encode()
    key = await crypto.subtle.importKey("raw", bytes(secret, "utf-8"), {"name": "HMAC", "hash": "SHA-512"}, False, ["sign"])
    sig = await crypto.subtle.sign({"name": "HMAC"}, key, signing_input)
    from pyodide.ffi import to_py
    sig_b = bytes(to_py(sig))
    s = _b64url(sig_b)
    return f"{h}.{p}.{s}"
