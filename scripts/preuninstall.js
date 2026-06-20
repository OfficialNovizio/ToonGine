#!/usr/bin/env node
// preuninstall hook for toongine
// When npm uninstall toongine is run, clean up generated files.

const fs = require('fs')
const path = require('path')

const cwd = process.env.INIT_CWD || process.cwd()
const ownPkg = path.join(__dirname, '..', 'package.json')

// Guard: skip if uninstalling toongine itself (dev)
if (fs.existsSync(ownPkg)) {
  try {
    const own = JSON.parse(fs.readFileSync(ownPkg, 'utf-8'))
    if (own.name === 'toongine' && cwd === path.resolve(__dirname, '..')) {
      process.exit(0)
    }
  } catch {}
}

const parentPkg = path.join(cwd, 'package.json')
if (!fs.existsSync(parentPkg)) process.exit(0)

console.log('\n  🧹 toongine: Cleaning up...\n')

// Remove injected dashboard pages
const injectedPaths = [
  'app/toongine',
  'pages/toongine',
  'app/settings/dashboard',
  'pages/settings',
  'src/pages/ToonGine.tsx',
  'public/toongine.html',
]

for (const p of injectedPaths) {
  const full = path.join(cwd, p)
  try {
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true })
      console.log(`  ✓ Removed ${p}`)
    }
  } catch {}
}

// Remove .toon directory
const toonDir = path.join(cwd, '.toon')
if (fs.existsSync(toonDir)) {
  try {
    fs.rmSync(toonDir, { recursive: true, force: true })
    console.log('  ✓ Removed .toon/')
  } catch (e) {
    console.log(`  ⚠️  Could not remove .toon/: ${e.message}`)
  }
}

// Remove config file
const configPath = path.join(cwd, 'toongine.config.json')
if (fs.existsSync(configPath)) {
  try {
    fs.unlinkSync(configPath)
    console.log('  ✓ Removed toongine.config.json')
  } catch {}
}

// Remove .toongine.json
const toongineJson = path.join(cwd, '.toongine.json')
if (fs.existsSync(toongineJson)) {
  try {
    fs.unlinkSync(toongineJson)
    console.log('  ✓ Removed .toongine.json')
  } catch {}
}

console.log('\n  ✅ Cleanup complete\n')
