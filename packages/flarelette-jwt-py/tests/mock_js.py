"""Mock implementations of Cloudflare Workers js module for testing.

This allows testing Python Worker code without requiring the actual
Pyodide/Workers runtime.
"""

import base64
import hashlib
import hmac
import json
import sys
from typing import Any


class MockCrypto:
    """Mock implementation of WebCrypto API."""

    class subtle:
        """Mock SubtleCrypto API."""

        @staticmethod
        async def sign(algorithm: dict, key: Any, data: bytes) -> bytes:
            """Mock signing operation."""
            if algorithm.get("name") == "HMAC":
                # Simple HMAC signing mock
                secret = getattr(key, "_secret", b"mock-secret")
                return hmac.new(secret, data, hashlib.sha512).digest()
            elif algorithm.get("name") == "Ed25519":
                # Mock Ed25519 signing - just return a fake signature
                return b"mock-ed25519-signature" + data[:32]
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        @staticmethod
        async def verify(
            algorithm: dict, key: Any, signature: bytes, data: bytes
        ) -> bool:
            """Mock verification operation."""
            if algorithm.get("name") == "HMAC":
                secret = getattr(key, "_secret", b"mock-secret")
                expected = hmac.new(secret, data, hashlib.sha512).digest()
                return hmac.compare_digest(signature, expected)
            elif algorithm.get("name") == "Ed25519":
                # Mock Ed25519 verification - just check format
                return signature.startswith(b"mock-ed25519-signature")
            raise ValueError(f"Unsupported algorithm: {algorithm}")

        @staticmethod
        async def importKey(
            format: str,
            keyData: Any,
            algorithm: dict,
            extractable: bool,
            usages: list,
        ) -> Any:
            """Mock key import."""

            class MockKey:
                def __init__(self, data: Any):
                    if isinstance(data, dict):
                        # JWK format
                        self.type = data.get("kty", "oct")
                        self.algorithm = algorithm
                        if "k" in data:  # Symmetric key
                            self._secret = base64.urlsafe_b64decode(
                                data["k"] + "=" * (4 - len(data["k"]) % 4)
                            )
                    elif isinstance(data, bytes):
                        # Raw format
                        self._secret = data
                        self.type = "secret"
                        self.algorithm = algorithm

            return MockKey(keyData)

    @staticmethod
    def getRandomValues(buffer: Any) -> Any:
        """Mock random value generation."""
        import random

        if hasattr(buffer, "__len__"):
            for i in range(len(buffer)):
                buffer[i] = random.randint(0, 255)
        return buffer


class MockResponse:
    """Mock Response object."""

    def __init__(
        self,
        body: str | bytes | None = None,
        status: int = 200,
        headers: dict | None = None,
    ):
        self._body = body
        self.status = status
        self.ok = 200 <= status < 300
        self.headers = headers or {}
        self.statusText = "OK" if self.ok else "Error"

    @staticmethod
    def new(
        body: str | bytes = "", status: int = 200, headers: dict | None = None
    ) -> "MockResponse":
        """Create a new Response."""
        return MockResponse(body, status, headers)

    async def text(self) -> str:
        """Get response body as text."""
        if isinstance(self._body, bytes):
            return self._body.decode("utf-8")
        return self._body or ""

    async def json(self) -> Any:
        """Get response body as JSON."""
        text = await self.text()
        return json.loads(text)


class MockJsModule:
    """Mock js module for testing."""

    crypto = MockCrypto()
    Response = MockResponse


def install_js_mock() -> None:
    """Install the js module mock into sys.modules."""
    sys.modules["js"] = MockJsModule()  # type: ignore[assignment]

    # Also mock pyodide.ffi
    class MockPyodideFfi:
        @staticmethod
        def to_py(obj: Any) -> Any:
            """Mock to_py - converts JS objects to Python. For bytes, just return as-is."""
            return obj

    class MockPyodideModule:
        ffi = MockPyodideFfi

    sys.modules["pyodide"] = MockPyodideModule()  # type: ignore[assignment]
    sys.modules["pyodide.ffi"] = MockPyodideFfi()  # type: ignore[assignment]


def uninstall_js_mock() -> None:
    """Remove the js module mock from sys.modules."""
    for module in ["js", "pyodide", "pyodide.ffi"]:
        if module in sys.modules:
            del sys.modules[module]
