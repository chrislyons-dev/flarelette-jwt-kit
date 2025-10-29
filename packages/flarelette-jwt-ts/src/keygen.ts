#!/usr/bin/env node

import { generateKeyPair, exportJWK } from 'jose'

async function main() {
  const kid =
    process.argv.find(a => a.startsWith('--kid='))?.split('=')[1] ||
    `ed25519-${Date.now()}`
  const { publicKey, privateKey } = await generateKeyPair('EdDSA')
  const pub = await exportJWK(publicKey)
  const prv = await exportJWK(privateKey)
  pub.kid = kid
  prv.kid = kid
  pub.alg = 'EdDSA'
  pub.use = 'sig'
  console.log(JSON.stringify({ publicJwk: pub, privateJwk: prv }, null, 2))
}
main().catch(e => {
  console.error(e)
  process.exit(1)
})
