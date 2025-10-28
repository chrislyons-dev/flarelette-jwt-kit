// examples/eddsa.producer.example.ts
/**
 * Example: EdDSA JWT Producer (Gateway)
 *
 * - Signs JWTs using Ed25519 private JWK (from secret binding)
 * - Exposes internal JWKS endpoint for verifiers
 * - Demonstrates env-driven config (JWT_PRIVATE_JWK_NAME, JWT_KID)
 *
 * Required vars in wrangler.toml:
 *
 * [vars]
 * JWT_PRIVATE_JWK_NAME = "GW_ED25519_PRIVATE"
 * JWT_KID = "ed25519-2025-01"
 * JWT_ISS = "https://gateway.internal"
 * JWT_AUD = "bond-math.api"
 *
 * # Store private JWK secret (output from npx flarelette-jwt-keygen)
 * # wrangler secret put GW_ED25519_PRIVATE
 *
 * # Store public JWK for JWKS endpoint
 * # wrangler kv:put GW_ED25519_PUBLIC '{"kty":"OKP","crv":"Ed25519","kid":"ed25519-2025-01","x":"...","use":"sig","alg":"EdDSA"}'
 */

import { Hono } from "hono";
import { adapters } from "@flarelette/jwt-ts";

const app = new Hono();

/**
 * JWKS endpoint — exposes the public key(s) used by this gateway.
 * Should be reachable only by internal services.
 */
app.get("/.well-known/jwks.json", (_c) => {
  const jwks = {
    keys: [
      JSON.parse(_c.env.GW_ED25519_PUBLIC), // pulled from a plain var or KV binding
    ],
  };
  return _c.json(jwks, 200, {
    "Cache-Control": "public, max-age=300", // 5 min cache
  });
});

/**
 * Token issuance endpoint (for internal service-to-service auth)
 */
app.post("/token", async (_c) => {
  const jwt = adapters.makeKit(_c.env); // inject Cloudflare bindings
  const payload = await _c.req.json().catch(() => ({}));

  // Add basic subject info and claims
  const token = await jwt.createToken({
    sub: payload.sub || "system",
    roles: payload.roles || ["service"],
    permissions: payload.permissions || ["read:data"],
  });

  return _c.json({ token });
});

/**
 * Example protected endpoint (optional sanity check)
 * You can verify immediately using the same kit.
 */
app.get("/verify", async (_c) => {
  const jwt = adapters.makeKit(_c.env);
  const authHeader = _c.req.header("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const verified = await jwt.verify(token);
  if (!verified) return _c.text("Invalid or expired token", 401);

  return _c.json({
    message: "Token valid",
    sub: verified.sub,
    exp: verified.exp,
  });
});

export default app;
