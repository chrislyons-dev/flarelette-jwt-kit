#!/usr/bin/env node
import { copyFileSync, existsSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PKG_DIR = resolve(__dirname)
const MD_ROOT = resolve(PKG_DIR, '../..')

const files = [
  { src: join(MD_ROOT, 'README.md'), dst: 'README.md' },
  { src: join(MD_ROOT, 'CONTRIBUTING.md'), dst: 'CONTRIBUTING.md' },
  { src: join(MD_ROOT, 'THIRD_PARTY_LICENSES.md'), dst: 'THIRD_PARTY_LICENSES.md' },
  { src: join(MD_ROOT, 'LICENSE'), dst: 'LICENSE' },
]

console.log(`Copying documentation files from ${MD_ROOT} to ${PKG_DIR} directory...`)

for (const { src, dst } of files) {
  if (!existsSync(src)) {
    console.error(`ERROR: Missing ${src}`)
    process.exit(1)
  }
  console.log(`Copying ${dst}...`)
  copyFileSync(src, join(PKG_DIR, dst))
}

console.log('Copy complete')
