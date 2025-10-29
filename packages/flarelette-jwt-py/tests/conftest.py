"""Pytest configuration and fixtures."""

import pytest


@pytest.fixture
def mock_env(monkeypatch):
    """Fixture to mock environment variables."""

    def _set_env(env_vars: dict):
        for key, value in env_vars.items():
            monkeypatch.setenv(key, value)

    return _set_env


@pytest.fixture
def hs512_env(mock_env):
    """Fixture for HS512 test environment."""
    mock_env(
        {
            "JWT_SECRET": "dGVzdC1zZWNyZXQtdGhhdC1pcy1hdC1sZWFzdC1zaXh0eS1mb3VyLWJ5dGVzLWxvbmctZm9yLXRlc3Rpbmc=",
            "JWT_ISS": "https://test.example.com",
            "JWT_AUD": "test-audience",
            "JWT_TTL_SECONDS": "900",
            "JWT_LEEWAY": "90",
        }
    )


@pytest.fixture
def eddsa_env(mock_env):
    """Fixture for EdDSA test environment."""
    # Mock public key for verification tests
    public_jwk = '{"kty":"OKP","crv":"Ed25519","x":"test-public-key"}'
    mock_env(
        {
            "JWT_PUBLIC_JWK": public_jwk,
            "JWT_ISS": "https://test.example.com",
            "JWT_AUD": "test-audience",
            "JWT_TTL_SECONDS": "900",
            "JWT_LEEWAY": "90",
        }
    )
