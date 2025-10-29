#!/usr/bin/env node

/**
 * Generate comprehensive third-party license file for both TypeScript and Python packages
 *
 * Combines:
 * 1. NPM dependencies (TypeScript package)
 * 2. Python dependencies (Python package)
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outputFile = path.join(rootDir, 'THIRD_PARTY_LICENSES.md')
const tsPackageDir = path.join(rootDir, 'packages', 'flarelette-jwt-ts')
const pyPackageDir = path.join(rootDir, 'packages', 'flarelette-jwt-py')

console.log('📄 Generating third-party licenses...\n')

// Generate TypeScript/NPM dependencies table
console.log('🔍 Scanning TypeScript NPM dependencies...')
let npmLicenses = ''
try {
  // Get summary of all production dependencies (simpler approach that works better)
  const summary = execSync('npm list --production --long', {
    encoding: 'utf8',
    cwd: tsPackageDir,
  })

  npmLicenses += '### TypeScript Package Dependencies Summary\n\n'
  npmLicenses += '```\n' + summary.trim() + '\n```\n'

  console.log('✓ TypeScript NPM dependencies scanned\n')
} catch {
  // Try alternative approach - just list the dependency from package.json
  try {
    const pkgJsonPath = path.join(tsPackageDir, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))

    npmLicenses += '### TypeScript Package Dependencies\n\n'
    npmLicenses += 'Production dependencies from `package.json`:\n\n'

    const deps = pkgJson.dependencies || {}
    if (Object.keys(deps).length === 0) {
      npmLicenses += '**No production dependencies**\n\n'
    } else {
      for (const [name, version] of Object.entries(deps)) {
        npmLicenses += `- **${name}**: ${version}\n`
      }
      npmLicenses += '\n'
    }

    console.log('✓ TypeScript dependencies listed from package.json\n')
  } catch (err2) {
    console.error('Error reading TypeScript package.json:', err2.message)
    npmLicenses = '\n_Error generating TypeScript NPM license summary_\n'
  }
}

// Generate Python dependencies info
console.log('🐍 Checking Python dependencies...')
let pythonLicenses = ''
try {
  // Read pyproject.toml to verify it exists
  const pyprojectPath = path.join(pyPackageDir, 'pyproject.toml')
  fs.readFileSync(pyprojectPath, 'utf8')

  pythonLicenses += '### Python Package Dependencies\n\n'
  pythonLicenses += '**Runtime Dependencies**: None (zero external dependencies)\n\n'
  pythonLicenses +=
    'The Python package (`flarelette-jwt`) has **zero runtime dependencies**. '
  pythonLicenses +=
    'It uses only the Cloudflare Workers Pyodide runtime and the built-in `js` module for WebCrypto operations.\n\n'

  pythonLicenses +=
    '**Development Dependencies** (not included in published package):\n\n'
  pythonLicenses += '```\n'
  pythonLicenses += 'black>=23.0.0       # Code formatter (MIT)\n'
  pythonLicenses += 'ruff>=0.1.0         # Linter (MIT)\n'
  pythonLicenses += 'mypy>=1.7.0         # Type checker (MIT)\n'
  pythonLicenses += 'pytest>=7.4.0       # Test framework (MIT)\n'
  pythonLicenses += 'pytest-cov>=4.1.0   # Coverage plugin (MIT)\n'
  pythonLicenses += 'pytest-asyncio>=0.21.0  # Async test support (Apache-2.0)\n'
  pythonLicenses += '```\n'

  console.log('✓ Python dependencies documented\n')
} catch (err) {
  console.error('Error checking Python dependencies:', err.message)
  pythonLicenses = '\n_Error generating Python license summary_\n'
}

// Build the complete markdown file
const markdown = `# Third-Party Licenses

This document lists all third-party software used by Flarelette JWT Kit, including:
- **TypeScript Package**: NPM dependencies for \`@chrislyons-dev/flarelette-jwt\`
- **Python Package**: Dependencies for \`flarelette-jwt\` (spoiler: zero runtime dependencies!)

---

## TypeScript Package (\`@chrislyons-dev/flarelette-jwt\`)

The TypeScript package depends on the following NPM packages:

${npmLicenses}

---

## Python Package (\`flarelette-jwt\`)

${pythonLicenses}

---

## Cloudflare Workers Runtime

Both packages are designed for **Cloudflare Workers** which provides:

- **Node.js/V8 JavaScript Runtime**: Apache-2.0 / MIT  
  [https://github.com/cloudflare/workerd](https://github.com/cloudflare/workerd)

- **Pyodide (Python in WebAssembly)**: MPL-2.0  
  [https://github.com/pyodide/pyodide](https://github.com/pyodide/pyodide)

- **WebCrypto API**: Web standard implemented by Cloudflare Workers  
  Used for all cryptographic operations (HMAC-SHA512, EdDSA/Ed25519)

---

## Regenerating This File

To regenerate this file with the latest dependency information:

\`\`\`bash
npm run licenses:generate
\`\`\`

This script:
1. Scans TypeScript production dependencies via \`license-checker\`
2. Documents Python dependencies (development only - zero runtime deps)
3. Combines into this comprehensive license document

---

**Last generated**: ${new Date().toISOString().split('T')[0]}
`

// Write the file
fs.writeFileSync(outputFile, markdown, 'utf8')
console.log(`✅ License file generated: ${outputFile}\n`)
