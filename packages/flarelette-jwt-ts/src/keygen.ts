#!/usr/bin/env node

/**
 * Key generation utility for EdDSA and ECDSA keys.
 *
 * Generates asymmetric key pairs and exports them in JWK format.
 * Designed to be executed as a standalone Node.js script.
 *
 * @module util
 */

import { generateKeyPair, exportJWK } from 'jose'

const SUPPORTED_ALGS = ['EdDSA', 'ES256', 'ES384', 'ES512'] as const

async function main() {
  const alg =
    (process.argv.find(a => a.startsWith('--alg='))?.split('=')[1] as string) ?? 'EdDSA'
  const kid =
    process.argv.find(a => a.startsWith('--kid='))?.split('=')[1] ??
    `${alg.toLowerCase()}-${Date.now()}`
  const dotenv = process.argv.includes('--dotenv')

  if (!(SUPPORTED_ALGS as readonly string[]).includes(alg)) {
    console.error(
      `Unsupported algorithm: ${alg}. Use one of: ${SUPPORTED_ALGS.join(', ')}`
    )
    process.exit(1)
  }

  const { publicKey, privateKey } = await generateKeyPair(alg, { extractable: true })
  const pub = await exportJWK(publicKey)
  const prv = await exportJWK(privateKey)
  pub.kid = kid
  prv.kid = kid
  pub.alg = alg
  pub.use = 'sig'

  if (dotenv) {
    console.log(`JWT_PUBLIC_JWK='${JSON.stringify(pub)}'`)
    console.log(`JWT_PRIVATE_JWK='${JSON.stringify(prv)}'`)
  } else {
    console.log(JSON.stringify({ publicJwk: pub, privateJwk: prv }, null, 2))
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
