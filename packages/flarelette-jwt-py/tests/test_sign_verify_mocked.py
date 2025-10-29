"""Tests for sign and verify functionality using mocked js module.

These tests use a mock implementation of the Cloudflare Workers js module
to test the actual sign/verify logic without requiring Pyodide.
"""

import os

import pytest

# Install js mock BEFORE importing anything from flarelette_jwt
from .mock_js import install_js_mock, uninstall_js_mock

install_js_mock()

# Now we can import the actual modules
from flarelette_jwt import create_token, sign, verify  # noqa: E402


class TestSignVerifyWithMock:
    """Tests for sign/verify using mocked WebCrypto."""

    @pytest.fixture(autouse=True)
    def setup_env(self):
        """Setup environment for each test."""
        # Set up HS512 mode with mock secret
        os.environ["JWT_SECRET"] = (
            "dGVzdC1zZWNyZXQtdGhhdC1pcy1sb25nLWVub3VnaC1mb3ItaG1hYy1zaGE1MTI"
        )
        os.environ["JWT_ISS"] = "test-issuer"
        os.environ["JWT_AUD"] = "test-audience"
        os.environ["JWT_TTL_SECONDS"] = "3600"

        # Clear EdDSA keys
        for key in [
            "JWT_PRIVATE_JWK",
            "JWT_PUBLIC_JWK",
            "JWT_PRIVATE_JWK_NAME",
            "JWT_PUBLIC_JWK_NAME",
        ]:
            if key in os.environ:
                del os.environ[key]

        yield

        # Cleanup
        for key in list(os.environ.keys()):
            if key.startswith("JWT_"):
                del os.environ[key]

    @pytest.mark.asyncio
    async def test_sign_creates_token(self):
        """Should sign a token with HS512."""
        payload = {"user_id": "123", "email": "test@example.com"}

        token = await sign(payload)

        assert token is not None
        assert isinstance(token, str)
        assert token.count(".") == 2  # JWT format: header.payload.signature

    @pytest.mark.asyncio
    async def test_sign_includes_claims(self):
        """Should include standard JWT claims."""
        payload = {"user_id": "123"}

        token = await sign(payload)
        verified = await verify(token)

        assert verified is not None
        assert verified.get("user_id") == "123"
        assert verified.get("iss") == "test-issuer"
        assert verified.get("aud") == "test-audience"
        assert "iat" in verified
        assert "exp" in verified

    @pytest.mark.asyncio
    async def test_verify_accepts_valid_token(self):
        """Should verify a valid token."""
        payload = {"user_id": "456", "role": "admin"}

        token = await sign(payload)
        verified = await verify(token)

        assert verified is not None
        assert verified["user_id"] == "456"
        assert verified["role"] == "admin"

    @pytest.mark.asyncio
    async def test_verify_rejects_invalid_token(self):
        """Should return None for invalid token."""
        invalid_token = "invalid.token.string"

        verified = await verify(invalid_token)

        assert verified is None

    @pytest.mark.asyncio
    async def test_verify_with_custom_options(self):
        """Should accept custom issuer and audience."""
        payload = {"data": "test"}
        token = await sign(payload)

        # Verify with same issuer/audience
        verified = await verify(token, iss="test-issuer", aud="test-audience")

        assert verified is not None
        assert verified["data"] == "test"

    @pytest.mark.asyncio
    async def test_sign_with_custom_ttl(self):
        """Should sign with custom TTL."""
        payload = {"user_id": "789"}

        token = await sign(payload, ttl_seconds=7200)
        verified = await verify(token)

        assert verified is not None
        # Check that exp - iat = 7200
        assert verified["exp"] - verified["iat"] == 7200

    @pytest.mark.asyncio
    async def test_create_token_basic(self):
        """Should create token with basic payload."""
        token = await create_token({"user_id": "123"})

        verified = await verify(token)

        assert verified is not None
        assert verified["user_id"] == "123"

    @pytest.mark.asyncio
    async def test_create_token_with_options(self):
        """Should create token with custom options."""
        token = await create_token(
            {"user_id": "123"}, iss="custom-issuer", ttl_seconds=7200
        )

        verified = await verify(token, iss="custom-issuer")

        assert verified is not None
        assert verified["user_id"] == "123"
        assert verified["iss"] == "custom-issuer"

    @pytest.mark.asyncio
    async def test_multiple_sign_verify_cycles(self):
        """Should handle multiple sign/verify operations."""
        payloads = [
            {"user_id": "1", "name": "Alice"},
            {"user_id": "2", "name": "Bob"},
            {"user_id": "3", "name": "Charlie"},
        ]

        for payload in payloads:
            token = await sign(payload)
            verified = await verify(token)

            assert verified is not None
            assert verified["user_id"] == payload["user_id"]
            assert verified["name"] == payload["name"]


@pytest.fixture(scope="module", autouse=True)
def cleanup_js_mock():
    """Cleanup js mock after all tests in this module."""
    yield
    uninstall_js_mock()
