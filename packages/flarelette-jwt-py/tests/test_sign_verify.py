"""Tests for sign and verify configuration and environment detection.

Note: Full sign/verify tests require Pyodide/Workers environment.
These tests focus on configuration and mode detection logic.
"""

from __future__ import annotations

import importlib.util
import os
import sys
from typing import TYPE_CHECKING, Any

import pytest

if TYPE_CHECKING:
    from collections.abc import Generator


def _load_env_module() -> Any:
    """Load env module without triggering js import."""
    # Use absolute path from project root
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "flarelette_jwt", "env.py"
    )
    spec = importlib.util.spec_from_file_location("flarelette_jwt.env", env_path)
    if spec and spec.loader:
        env_module = importlib.util.module_from_spec(spec)
        # Register in sys.modules so coverage can track it
        sys.modules["flarelette_jwt.env"] = env_module
        spec.loader.exec_module(env_module)
        return env_module
    raise ImportError("Could not load env module")


class TestEnvironmentSetup:
    """Tests for environment configuration."""

    def test_imports_available(self) -> None:
        """Should be able to import env module directly."""
        env = _load_env_module()

        assert hasattr(env, "mode")
        assert hasattr(env, "common")

    def test_environment_vars_readable(self) -> None:
        """Should read environment variables."""
        os.environ["TEST_VAR"] = "test_value"
        assert os.environ.get("TEST_VAR") == "test_value"
        del os.environ["TEST_VAR"]


class TestConfigurationLogic:
    """Tests for configuration functions that don't require WebCrypto."""

    @pytest.fixture(autouse=True)
    def setup_env(self) -> Generator[None, None, None]:
        """Setup clean environment."""
        # Clear all JWT env vars
        jwt_keys = [
            "JWT_SECRET",
            "JWT_SECRET_NAME",
            "JWT_PRIVATE_JWK",
            "JWT_PRIVATE_JWK_NAME",
            "JWT_PRIVATE_JWK_PATH",
            "JWT_PUBLIC_JWK",
            "JWT_PUBLIC_JWK_NAME",
            "JWT_JWKS_URL",
            "JWT_JWKS_URL_NAME",
            "JWT_ISS",
            "JWT_AUD",
            "JWT_TTL_SECONDS",
            "JWT_LEEWAY",
        ]
        for key in jwt_keys:
            os.environ.pop(key, None)

        yield

        # Cleanup
        for key in jwt_keys:
            os.environ.pop(key, None)

    def test_mode_defaults_to_hs512(self) -> None:
        """Should default to HS512 mode when no keys configured."""
        env = _load_env_module()
        mode = env.mode

        assert mode("producer") == "HS512"
        assert mode("consumer") == "HS512"

    def test_mode_detects_eddsa_for_producer_with_private_key(self) -> None:
        """Should detect EdDSA mode for producer with private key."""
        env = _load_env_module()
        mode = env.mode

        os.environ["JWT_PRIVATE_JWK"] = "dummy-key"
        assert mode("producer") == "EdDSA"

    def test_mode_detects_eddsa_for_consumer_with_public_key(self) -> None:
        """Should detect EdDSA mode for consumer with public key."""
        env = _load_env_module()
        mode = env.mode

        os.environ["JWT_PUBLIC_JWK"] = "dummy-key"
        assert mode("consumer") == "EdDSA"

    def test_mode_producer_ignores_public_key(self) -> None:
        """Producer should use HS512 even if public key exists."""
        env = _load_env_module()
        mode = env.mode

        os.environ["JWT_PUBLIC_JWK"] = "dummy-key"
        assert mode("producer") == "HS512"

    def test_mode_consumer_ignores_private_key(self) -> None:
        """Consumer should use HS512 even if private key exists."""
        env = _load_env_module()
        mode = env.mode

        os.environ["JWT_PRIVATE_JWK"] = "dummy-key"
        assert mode("consumer") == "HS512"

    def test_common_returns_defaults(self) -> None:
        """Should return default common configuration."""
        env = _load_env_module()
        common = env.common

        cfg = common()
        assert cfg["iss"] == ""
        assert cfg["aud"] == ""
        assert cfg["leeway"] == 90
        assert cfg["ttl_seconds"] == 900

    def test_common_reads_from_env(self) -> None:
        """Should read common config from environment."""
        env = _load_env_module()
        common = env.common

        os.environ["JWT_ISS"] = "test-issuer"
        os.environ["JWT_AUD"] = "test-audience"
        os.environ["JWT_LEEWAY"] = "120"
        os.environ["JWT_TTL_SECONDS"] = "3600"

        cfg = common()
        assert cfg["iss"] == "test-issuer"
        assert cfg["aud"] == "test-audience"
        assert cfg["leeway"] == 120
        assert cfg["ttl_seconds"] == 3600

    def test_secret_name_indirection_detection(self) -> None:
        """Should detect when JWT_SECRET_NAME is used."""
        os.environ["JWT_SECRET_NAME"] = "MY_SECRET"
        os.environ["MY_SECRET"] = "actual-secret-value"

        # Mode detection should still work
        env = _load_env_module()
        mode = env.mode
        assert mode("producer") == "HS512"

    def test_private_key_name_indirection_detection(self) -> None:
        """Should detect EdDSA with JWT_PRIVATE_JWK_NAME."""
        env = _load_env_module()
        mode = env.mode

        os.environ["JWT_PRIVATE_JWK_NAME"] = "MY_PRIVATE_KEY"
        assert mode("producer") == "EdDSA"

    def test_public_key_name_indirection_detection(self) -> None:
        """Should detect EdDSA with JWT_PUBLIC_JWK_NAME."""
        env = _load_env_module()
        mode = env.mode

        os.environ["JWT_PUBLIC_JWK_NAME"] = "MY_PUBLIC_KEY"
        assert mode("consumer") == "EdDSA"

    def test_jwks_url_name_indirection_detection(self) -> None:
        """Should detect EdDSA with JWT_JWKS_URL_NAME."""
        env = _load_env_module()
        mode = env.mode

        os.environ["JWT_JWKS_URL_NAME"] = "MY_JWKS_URL"
        assert mode("consumer") == "EdDSA"

    def test_mode_conflict_raises_for_consumer(self) -> None:
        """Should raise RuntimeError when both HS512 and asymmetric keys configured."""
        import pytest

        env = _load_env_module()
        mode = env.mode

        os.environ["JWT_SECRET"] = "some-secret"
        os.environ["JWT_PUBLIC_JWK"] = "some-public-key"

        with pytest.raises(RuntimeError, match="algorithm confusion"):
            mode("consumer")

    def test_mode_conflict_does_not_raise_for_producer(self) -> None:
        """Mode conflict check only applies to consumer role."""
        env = _load_env_module()
        mode = env.mode

        # Producer ignores public keys entirely — no conflict error
        os.environ["JWT_SECRET"] = "some-secret"
        os.environ["JWT_PUBLIC_JWK"] = "some-public-key"

        # Should not raise; producer checks only for private key
        assert mode("producer") == "HS512"

    def test_hs512_secret_minimum_64_bytes(self) -> None:
        """get_hs_secret_bytes should reject secrets shorter than 64 bytes."""
        import base64

        import pytest

        env = _load_env_module()

        # 32-byte secret — previously accepted, now rejected
        short_secret = base64.urlsafe_b64encode(b"a" * 32).rstrip(b"=").decode()
        os.environ["JWT_SECRET"] = short_secret

        with pytest.raises(RuntimeError, match="too short"):
            env.get_hs_secret_bytes()

    def test_hs512_secret_accepts_64_bytes(self) -> None:
        """get_hs_secret_bytes should accept secrets of exactly 64 bytes."""
        import base64

        env = _load_env_module()

        valid_secret = base64.urlsafe_b64encode(b"a" * 64).rstrip(b"=").decode()
        os.environ["JWT_SECRET"] = valid_secret

        result = env.get_hs_secret_bytes()
        assert len(result) == 64
