/**
 * Example: Using Explicit Configuration API
 *
 * This example demonstrates how to use the new explicit configuration API
 * that doesn't rely on environment variables or global state. This is ideal
 * for development environments, testing, and scenarios where you need
 * full control over JWT configuration.
 */

import {
  signWithConfig,
  verifyWithConfig,
  createTokenWithConfig,
  createDelegatedTokenWithConfig,
  checkAuthWithConfig,
  createHS512Config,
  createEdDSASignConfig,
  createEdDSAVerifyConfig,
  type HS512Config,
  type EdDSASignConfig,
  type EdDSAVerifyConfig,
} from '@chrislyons-dev/flarelette-jwt'

// ============================================================================
// Example 1: HS512 (Symmetric) Configuration
// ============================================================================

async function exampleHS512() {
  console.log('\n=== HS512 Example ===\n')

  // Create a base64url-encoded secret (in production, use the CLI tool)
  const secretString = 'your-base64url-encoded-secret-at-least-32-bytes-long'

  // Create configuration object
  const config: HS512Config = createHS512Config(secretString, {
    iss: 'https://gateway.example.com',
    aud: 'api.example.com',
    ttlSeconds: 900, // 15 minutes
    leeway: 90, // 90 seconds clock skew tolerance
  })

  // Sign a token
  const token = await signWithConfig(
    {
      sub: 'user123',
      email: 'user@example.com',
      permissions: ['read:data', 'write:data'],
    },
    config
  )

  console.log('Signed token:', token.substring(0, 50) + '...')

  // Verify the token
  const payload = await verifyWithConfig(token, config)
  console.log('Verified payload:', payload)

  // Check authorization with policy
  const user = await checkAuthWithConfig(token, config, {
    require_all_permissions: ['read:data'],
  })

  if (user) {
    console.log('Authorized user:', user.sub, user.permissions)
  } else {
    console.log('Authorization failed')
  }
}

// ============================================================================
// Example 2: EdDSA (Asymmetric) Configuration
// ============================================================================

async function exampleEdDSA() {
  console.log('\n=== EdDSA Example ===\n')

  // In production, generate these with: npx flarelette-jwt-keygen
  const privateJwk = {
    kty: 'OKP',
    crv: 'Ed25519',
    d: 'your-private-key-d-value',
    x: 'your-public-key-x-value',
  }

  const publicJwk = {
    kty: 'OKP',
    crv: 'Ed25519',
    x: 'your-public-key-x-value',
  }

  // Create sign configuration (for token producers)
  const signConfig: EdDSASignConfig = createEdDSASignConfig(
    privateJwk,
    {
      iss: 'https://gateway.example.com',
      aud: 'api.example.com',
      ttlSeconds: 900,
    },
    'ed25519-2025-01' // Key ID
  )

  // Create verify configuration (for token consumers)
  const verifyConfig: EdDSAVerifyConfig = createEdDSAVerifyConfig(publicJwk, {
    iss: 'https://gateway.example.com',
    aud: 'api.example.com',
    leeway: 90,
  })

  // Sign a token
  const token = await signWithConfig(
    {
      sub: 'user456',
      email: 'user@example.com',
      permissions: ['read:admin'],
    },
    signConfig
  )

  console.log('Signed token:', token.substring(0, 50) + '...')

  // Verify the token
  const payload = await verifyWithConfig(token, verifyConfig)
  console.log('Verified payload:', payload)
}

// ============================================================================
// Example 3: Service Delegation (RFC 8693)
// ============================================================================

async function exampleDelegation() {
  console.log('\n=== Service Delegation Example ===\n')

  const config: HS512Config = createHS512Config(
    'your-base64url-encoded-secret-at-least-32-bytes-long',
    {
      iss: 'https://gateway.example.com',
      aud: 'internal-api',
      ttlSeconds: 300, // 5 minutes for internal tokens
    }
  )

  // Simulate external Auth0 token payload
  const externalPayload = {
    sub: 'auth0|user123',
    email: 'user@example.com',
    permissions: ['read:data', 'write:data'],
  }

  // Gateway creates delegated token for internal service
  const delegatedToken = await createDelegatedTokenWithConfig(
    externalPayload,
    'gateway-service', // Actor service identifier
    config
  )

  console.log('Delegated token created')

  // Verify the delegated token in backend service
  const verifiedPayload = await verifyWithConfig(delegatedToken, config)
  console.log('Delegated token payload:', {
    sub: verifiedPayload?.sub, // Original user
    act: verifiedPayload?.act, // Acting service
    permissions: verifiedPayload?.permissions, // Original permissions
  })
}

// ============================================================================
// Example 4: Development Environment Setup (No .env files needed!)
// ============================================================================

async function exampleDevEnvironment() {
  console.log('\n=== Development Environment Example ===\n')

  // Create a simple secret for local development
  const devSecret = Buffer.alloc(32) // All zeros for simplicity

  const devConfig: HS512Config = {
    alg: 'HS512',
    secret: devSecret,
    iss: 'http://localhost:3000',
    aud: ['http://localhost:3001', 'http://localhost:3002'],
    ttlSeconds: 3600, // 1 hour for local dev
  }

  // Gateway mints token
  const token = await createTokenWithConfig(
    {
      sub: 'dev-user',
      email: 'dev@local',
      permissions: ['*'], // All permissions in dev
    },
    devConfig
  )

  console.log('Dev token created:', token.substring(0, 50) + '...')

  // Backend services verify with same config (no env vars needed!)
  const user = await checkAuthWithConfig(token, devConfig)
  console.log('Dev user:', user?.sub, user?.permissions)
}

// ============================================================================
// Example 5: Testing Without Environment Setup
// ============================================================================

async function exampleTesting() {
  console.log('\n=== Testing Example ===\n')

  // Test configuration - completely isolated from environment
  const testConfig: HS512Config = {
    alg: 'HS512',
    secret: new Uint8Array(32), // All zeros
    iss: 'test-issuer',
    aud: 'test-audience',
    ttlSeconds: 60,
  }

  // Create test token
  const token = await createTokenWithConfig(
    {
      sub: 'test-user',
      permissions: ['read:test'],
    },
    testConfig
  )

  // Verify in test
  const payload = await verifyWithConfig(token, testConfig)
  console.assert(payload?.sub === 'test-user', 'Subject should match')
  console.assert(
    (payload?.permissions as string[])?.[0] === 'read:test',
    'Permission should match'
  )
  console.log('✓ All assertions passed')
}

// ============================================================================
// Run all examples
// ============================================================================

async function main() {
  try {
    await exampleHS512()
    // await exampleEdDSA()  // Uncomment with real keys
    await exampleDelegation()
    await exampleDevEnvironment()
    await exampleTesting()

    console.log('\n✓ All examples completed successfully!\n')
  } catch (error) {
    console.error('Error running examples:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
