// scripts/inspect-pack-py.js
import { readdirSync, statSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const pyPackageDir = path.join(projectRoot, 'packages', 'flarelette-jwt-py')
const distDir = path.join(pyPackageDir, 'dist')

// 1. Find newest wheel or tar.gz
const archives = readdirSync(distDir)
  .filter(f => f.endsWith('.whl') || f.endsWith('.tar.gz'))
  .map(f => ({ f, mtime: statSync(path.join(distDir, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime)

if (archives.length === 0) {
  console.error('❌ No Python packages found in packages/flarelette-jwt-py/dist/.')
  console.error('   Run `python -m build` in packages/flarelette-jwt-py first.')
  process.exit(1)
}

const wheel = archives.find(a => a.f.endsWith('.whl'))
const tarball = archives.find(a => a.f.endsWith('.tar.gz'))

// Prefer wheel over tarball
const archive = wheel || tarball
const archivePath = path.join(distDir, archive.f)

// 2. Create isolated temp folder
const tempDir = mkdtempSync(path.join(tmpdir(), 'flarelette-jwt-py-install-'))
console.log(`📦 Installing Python package ${archive.f} → ${tempDir}`)

// 3. Create virtual environment and install the package
console.log('\n🐍 Creating virtual environment...')
try {
  execSync(`python -m venv venv`, { cwd: tempDir, stdio: 'inherit' })
} catch (err) {
  console.error('❌ Failed to create virtual environment', err)
  process.exit(1)
}

const isWindows = process.platform === 'win32'
const pythonBin = isWindows
  ? path.join(tempDir, 'venv', 'Scripts', 'python.exe')
  : path.join(tempDir, 'venv', 'bin', 'python')
const pipBin = isWindows
  ? path.join(tempDir, 'venv', 'Scripts', 'pip.exe')
  : path.join(tempDir, 'venv', 'bin', 'pip')

console.log('\n📥 Installing package...')
try {
  execSync(`"${pipBin}" install "${archivePath}"`, {
    cwd: tempDir,
    stdio: 'inherit',
  })
} catch (err) {
  console.error('❌ Failed to install package', err)
  process.exit(1)
}

// 4. List installed files
console.log('\n📋 Listing installed package files:')
try {
  execSync(`"${pipBin}" show -f flarelette-jwt`, {
    cwd: tempDir,
    stdio: 'inherit',
  })
} catch (err) {
  console.warn('⚠️ Could not list package files', err)
}

// 5. Smoke test - verify package structure (check files exist, don't import Workers-only code)
console.log('\n🚀 Running package structure validation:')
const testScript = `
import sys
import os
from pathlib import Path

print(f"Python version: {sys.version}")

# Test: Check if package files are installed correctly
try:
    # Find the site-packages directory in this virtual environment
    # In a venv, site-packages is in Lib/site-packages (Windows) or lib/pythonX.Y/site-packages (Unix)
    site_packages = None
    for path_str in sys.path:
        path = Path(path_str)
        if 'site-packages' in str(path):
            site_packages = path
            break
    
    if not site_packages:
        print(f"❌ Could not find site-packages in sys.path")
        print(f"   sys.path = {sys.path}")
        sys.exit(1)
    
    package_location = site_packages / 'flarelette_jwt'
    
    if not package_location.exists():
        print(f"❌ Package not found at: {package_location}")
        print(f"   site-packages: {site_packages}")
        sys.exit(1)
    
    print(f"✅ Package found at: {package_location}")
    
    # Check that expected module files exist
    expected_modules = ['__init__.py', 'env.py', 'high.py', 'sign.py', 'verify.py', 'secret.py', 'util.py', 'adapters.py']
    missing = []
    for module_file in expected_modules:
        module_path = package_location / module_file
        if module_path.exists():
            print(f"✅ Module file '{module_file}' exists")
        else:
            print(f"❌ Module file '{module_file}' not found")
            missing.append(module_file)
    
    if missing:
        print(f"\\n❌ Missing module files: {', '.join(missing)}")
        sys.exit(1)
    
    print("\\n✅ Package structure is valid")
    print("⚠️  Note: This package requires Cloudflare Workers Pyodide runtime")
    print("   (imports from 'js' module are only available in Workers environment)")
    
except Exception as e:
    print(f"❌ Package validation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
`

const testFile = path.join(tempDir, 'test_import.py')
import { writeFileSync } from 'node:fs'
writeFileSync(testFile, testScript)

try {
  execSync(`"${pythonBin}" test_import.py`, { cwd: tempDir, stdio: 'inherit' })
  console.log('\n✅ Python package smoke test passed')
} catch (err) {
  console.error('❌ Python package smoke test failed', err)
  process.exit(1)
}

// 6. Keep temp dir for manual inspection
console.log(`\n🧹 Temp directory remains for inspection:\n${tempDir}`)
console.log('Delete it manually when done.')
