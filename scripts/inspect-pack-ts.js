// scripts/inspect-pack-ts.js
import { readdirSync, statSync, mkdtempSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const tsPackageDir = path.join(projectRoot, 'packages', 'flarelette-jwt-ts')
const distDir = path.join(tsPackageDir, 'dist')

// 1. Find newest tarball
const tgz = readdirSync(distDir)
  .filter(f => f.endsWith('.tgz'))
  .map(f => ({ f, mtime: statSync(path.join(distDir, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)[0]

if (!tgz) {
  console.error(
    '❌ No tarball found in packages/flarelette-jwt-ts/dist/. Run `npm pack` first.'
  )
  process.exit(1)
}

const tarballPath = path.join(distDir, tgz.f)

// 2. Create isolated temp folder
const tempDir = mkdtempSync(path.join(tmpdir(), 'flarelette-jwt-ts-install-'))
console.log(`📦 Installing TypeScript package ${tgz.f} → ${tempDir}`)

// 3. Install the tarball as a dependency
execSync(`npm init -y`, { cwd: tempDir, stdio: 'inherit' })
execSync(`npm install "${tarballPath}" --omit=dev`, {
  cwd: tempDir,
  stdio: 'inherit',
})

// 4. List contents
function list(dir, prefix = '') {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const mark = e.isDirectory() ? '📁' : '📄'
    console.log(`${prefix}${mark} ${e.name}`)
    if (e.isDirectory()) list(path.join(dir, e.name), prefix + '   ')
  }
}
console.log('\n📁 Package contents:')
const nodeModulesPackage = path.join(
  tempDir,
  'node_modules',
  '@chrislyons-dev',
  'flarelette-jwt'
)
if (existsSync(nodeModulesPackage)) {
  list(nodeModulesPackage)
} else {
  console.error('❌ Package not found in node_modules')
}

// 5. Smoke test - import the package
console.log('\n🚀 Running import smoke test:')
const testScript = `
import { sign, verify, generateSecret } from '@chrislyons-dev/flarelette-jwt';

console.log('✅ Imports successful');
console.log('- sign:', typeof sign);
console.log('- verify:', typeof verify);
console.log('- generateSecret:', typeof generateSecret);

// Test secret generation
const secret = generateSecret();
console.log('✅ Generated secret:', secret.substring(0, 20) + '...');
`

const testFile = path.join(tempDir, 'test.mjs')
import { writeFileSync } from 'node:fs'
writeFileSync(testFile, testScript)

try {
  execSync(`node test.mjs`, { cwd: tempDir, stdio: 'inherit' })
  console.log('\n✅ TypeScript package smoke test passed')
} catch (err) {
  console.error('❌ TypeScript package smoke test failed', err)
  process.exit(1)
}

// 6. Check package.json
console.log('\n📋 Checking package.json:')
const packageJsonPath = path.join(nodeModulesPackage, 'package.json')
if (existsSync(packageJsonPath)) {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  console.log('- Name:', pkg.name)
  console.log('- Version:', pkg.version)
  console.log('- Main:', pkg.main)
  console.log('- Module:', pkg.module)
  console.log('- Types:', pkg.types)
  console.log('- Files:', pkg.files)
}

// 7. Keep temp dir for manual inspection
console.log(`\n🧹 Temp directory remains for inspection:\n${tempDir}`)
console.log('Delete it manually when done.')
