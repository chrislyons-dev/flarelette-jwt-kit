"""Test Worker for flarelette-jwt Python package.

This worker is used with Miniflare to test the JWT functionality
in a Cloudflare Workers environment with Pyodide.
"""

from flarelette_jwt import create_token, sign, verify
from js import Response


async def on_fetch(request, _env):
    """Handle incoming requests for testing."""
    url = request.url
    path = url.split("/")[-1]

    if path == "sign":
        # Test signing a token
        payload = {"user_id": "123", "email": "test@example.com"}
        token = await sign(payload)
        return Response.new(token)

    elif path == "verify":
        # Test verifying a token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response.new("Missing or invalid Authorization header", status=401)

        token = auth_header[7:]  # Remove "Bearer " prefix
        payload = await verify(token)

        if payload is None:
            return Response.new("Invalid token", status=401)

        import json

        return Response.new(
            json.dumps(payload), headers={"Content-Type": "application/json"}
        )

    elif path == "create":
        # Test high-level createToken
        token = await create_token(
            {"user_id": "456"}, permissions=["read", "write"], roles=["user"]
        )
        return Response.new(token)

    else:
        return Response.new("Test endpoints: /sign, /verify, /create", status=200)
