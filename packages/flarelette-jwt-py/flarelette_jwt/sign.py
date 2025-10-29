from __future__ import annotations

import base64
import json
import time

from js import crypto

from .env import common, get_hs_secret_bytes, mode


def _b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode("utf-8").rstrip("=")


async def sign(
    payload: dict,
    *,
    iss: str | None = None,
    aud: str | None = None,
    ttl_seconds: int | None = None,
) -> str:
    m = mode("producer")
    cfg = common()
    iss = iss or cfg["iss"]
    aud = aud or cfg["aud"]
    ttl = int(ttl_seconds or cfg["ttl_seconds"])
    now = int(time.time())
    body = dict(payload)
    body.setdefault("iss", iss)
    body.setdefault("aud", aud)
    body.setdefault("iat", now)
    body.setdefault("exp", now + ttl)

    if m == "HS512":
        header = {"alg": "HS512", "typ": "JWT"}
        h = _b64url(json.dumps(header, separators=(",", ":")).encode())
        p = _b64url(json.dumps(body, separators=(",", ":")).encode())
        signing_input = f"{h}.{p}".encode()
        key = await crypto.subtle.importKey(
            "raw",
            get_hs_secret_bytes(),
            {"name": "HMAC", "hash": "SHA-512"},
            False,
            ["sign"],
        )
        sig = await crypto.subtle.sign({"name": "HMAC"}, key, signing_input)
        from pyodide.ffi import to_py

        return f"{h}.{p}.{_b64url(bytes(to_py(sig)))}"
    else:
        raise RuntimeError(
            "EdDSA signing is not supported in Workers Python; produce tokens with the Node gateway"
        )
