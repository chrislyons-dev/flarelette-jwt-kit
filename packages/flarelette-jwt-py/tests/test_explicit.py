from __future__ import annotations

import base64
import json
import os
import sys
import time
import types
from typing import TYPE_CHECKING, Any, cast

import pytest
from flarelette_jwt.explicit import (
    create_es512_verify_config,
    create_jwks_url_verify_config,
    verify_with_config,
)
from flarelette_jwt.verify import verify

if TYPE_CHECKING:
    from collections.abc import Iterator


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _make_token(header: dict[str, Any], payload: dict[str, Any]) -> str:
    return ".".join(
        [
            _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8")),
            _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8")),
            _b64url(b"signature"),
        ]
    )


class _FakeResponse:
    def __init__(self, body: str) -> None:
        self.ok = True
        self.status = 200
        self.statusText = "OK"
        self._body = body

    async def text(self) -> str:
        return self._body


class _FakeSubtle:
    def __init__(self) -> None:
        self.import_calls: list[tuple[Any, ...]] = []
        self.verify_calls: list[tuple[Any, ...]] = []

    async def importKey(
        self,
        format_name: str,
        key_data: Any,
        algorithm: dict[str, Any],
        extractable: bool,
        usages: list[str],
    ) -> dict[str, Any]:
        self.import_calls.append(
            (format_name, key_data, algorithm, extractable, usages)
        )
        return {
            "format_name": format_name,
            "key_data": key_data,
            "algorithm": algorithm,
            "extractable": extractable,
            "usages": usages,
        }

    async def verify(
        self, algorithm: dict[str, Any], key: dict[str, Any], sig: bytes, data: bytes
    ) -> bool:
        self.verify_calls.append((algorithm, key, sig, data))
        return True


class _FakeFetch:
    def __init__(self, body: str) -> None:
        self.body = body
        self.urls: list[str] = []

    async def __call__(self, url: str) -> _FakeResponse:
        self.urls.append(url)
        return _FakeResponse(self.body)


def _install_runtime(
    monkeypatch: pytest.MonkeyPatch, *, jwks_keys: list[dict[str, Any]] | None = None
) -> tuple[_FakeSubtle, _FakeFetch | None]:
    subtle = _FakeSubtle()
    js_module = cast("Any", types.ModuleType("js"))
    js_module.crypto = types.SimpleNamespace(subtle=subtle)

    fetch = None
    if jwks_keys is not None:
        fetch = _FakeFetch(json.dumps({"keys": jwks_keys}))
        js_module.fetch = fetch

    ffi_module = cast("Any", types.ModuleType("pyodide.ffi"))
    ffi_module.to_js = lambda value: value

    pyodide_module = cast("Any", types.ModuleType("pyodide"))
    pyodide_module.ffi = ffi_module

    monkeypatch.setitem(sys.modules, "js", js_module)
    monkeypatch.setitem(sys.modules, "pyodide", pyodide_module)
    monkeypatch.setitem(sys.modules, "pyodide.ffi", ffi_module)

    return subtle, fetch


@pytest.fixture(autouse=True)
def _clear_env() -> Iterator[None]:
    keys = [
        "JWT_SECRET",
        "JWT_SECRET_NAME",
        "JWT_PUBLIC_JWK",
        "JWT_PUBLIC_JWK_NAME",
        "JWT_JWKS_URL",
        "JWT_JWKS_URL_NAME",
        "JWT_ISS",
        "JWT_AUD",
        "JWT_LEEWAY",
        "JWT_TTL_SECONDS",
    ]
    previous = {key: os.environ.get(key) for key in keys}
    for key in keys:
        os.environ.pop(key, None)

    yield

    for key, value in previous.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value


def test_create_jwks_url_verify_config_supports_explicit_algorithm() -> None:
    config = create_jwks_url_verify_config(
        "https://tenant.auth0.com/.well-known/jwks.json",
        iss="https://tenant.auth0.com/",
        aud="my-app-client-id",
        alg="RS256",
        cache_ttl=600,
    )

    assert config["alg"] == "RS256"
    assert config["cache_ttl"] == 600


@pytest.mark.asyncio
async def test_verify_with_config_supports_explicit_es512(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    subtle, _ = _install_runtime(monkeypatch)
    now = int(time.time())
    token = _make_token(
        {"alg": "ES512", "kid": "es-key"},
        {
            "sub": "user-es512",
            "iss": "issuer",
            "aud": "audience",
            "iat": now,
            "exp": now + 60,
        },
    )

    config = create_es512_verify_config(
        {"kty": "EC", "crv": "P-521", "x": "x", "y": "y"},
        iss="issuer",
        aud="audience",
    )

    payload = await verify_with_config(token, config)

    assert payload is not None
    assert payload["sub"] == "user-es512"
    assert subtle.import_calls[0][2]["namedCurve"] == "P-521"
    assert subtle.verify_calls[0][0]["hash"] == "SHA-512"


@pytest.mark.asyncio
async def test_verify_with_config_supports_jwks_rs256(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    subtle, fetch = _install_runtime(
        monkeypatch,
        jwks_keys=[
            {"kid": "rsa-key", "kty": "RSA", "alg": "RS256", "n": "abc", "e": "AQAB"}
        ],
    )
    now = int(time.time())
    token = _make_token(
        {"alg": "RS256", "kid": "rsa-key"},
        {
            "sub": "user-rs256",
            "iss": "issuer",
            "aud": "audience",
            "iat": now,
            "exp": now + 60,
        },
    )

    config = create_jwks_url_verify_config(
        "https://issuer.example/.well-known/jwks.json",
        iss="issuer",
        aud="audience",
        alg="RS256",
    )

    payload = await verify_with_config(token, config)

    assert payload is not None
    assert payload["sub"] == "user-rs256"
    assert fetch is not None
    assert fetch.urls == ["https://issuer.example/.well-known/jwks.json"]
    assert subtle.import_calls[0][2]["hash"] == "SHA-256"


@pytest.mark.asyncio
async def test_verify_supports_env_inline_es512(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    subtle, _ = _install_runtime(monkeypatch)
    os.environ["JWT_PUBLIC_JWK"] = json.dumps(
        {"kty": "EC", "crv": "P-521", "x": "x", "y": "y"}
    )
    os.environ["JWT_ISS"] = "issuer"
    os.environ["JWT_AUD"] = "audience"

    now = int(time.time())
    token = _make_token(
        {"alg": "ES512", "kid": "es-key"},
        {
            "sub": "env-es512",
            "iss": "issuer",
            "aud": "audience",
            "iat": now,
            "exp": now + 60,
        },
    )

    payload = await verify(token)

    assert payload is not None
    assert payload["sub"] == "env-es512"
    assert subtle.import_calls[0][2]["namedCurve"] == "P-521"


@pytest.mark.asyncio
async def test_verify_supports_env_jwks_rs256(monkeypatch: pytest.MonkeyPatch) -> None:
    subtle, fetch = _install_runtime(
        monkeypatch,
        jwks_keys=[
            {"kid": "rsa-key", "kty": "RSA", "alg": "RS256", "n": "abc", "e": "AQAB"}
        ],
    )
    os.environ["JWT_JWKS_URL"] = "https://issuer.example/.well-known/jwks.json"
    os.environ["JWT_ISS"] = "issuer"
    os.environ["JWT_AUD"] = "audience"

    now = int(time.time())
    token = _make_token(
        {"alg": "RS256", "kid": "rsa-key"},
        {
            "sub": "env-rs256",
            "iss": "issuer",
            "aud": "audience",
            "iat": now,
            "exp": now + 60,
        },
    )

    payload = await verify(token)

    assert payload is not None
    assert payload["sub"] == "env-rs256"
    assert fetch is not None
    assert fetch.urls == ["https://issuer.example/.well-known/jwks.json"]
    assert subtle.import_calls[0][2]["hash"] == "SHA-256"
