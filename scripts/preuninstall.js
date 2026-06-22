#!/usr/bin/env node
// preuninstall hook for toongine
// When npm uninstall toongine is run, clean up generated files from the REAL project root.
//
// Problem: npm sometimes doesn't set INIT_CWD for uninstall hooks, so
// process.cwd() points at node_modules/toongine/ instead of the project.
// Fix: walk up from __dirname until we find a package.json that is NOT toongine.

const fs = require('fs')
const path = require('path')

// ── Find the REAL project root ──────────────────────────────────────────────

function findProjectRoot() {
  // npm sets cwd to the project root during lifecycle scripts.
  // That's the most reliable signal. Walk up from cwd to find
  // a non-toongine package.json.
  const startDirs = [
    process.env.INIT_CWD,           // npm v7+: original cwd
    process.cwd(),                   // npm sets this to project root
    path.resolve(__dirname, '..', '..', '..'),  // walk up from scripts/
  ].filter(Boolean)
  
  for (const start of startDirs) {
    let dir = path.resolve(start)
    for (let i = 0; i < 15; i++) {
      const pkgPath = path.join(dir, 'package.json')
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
          if (pkg.name !== 'toongine') return dir
        } catch {}
      }
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  
  // Absolute last resort
  return process.env.INIT_CWD || process.cwd()
}

const projectRoot = findProjectRoot()

// Guard: skip if we ARE the toongine package itself (dev uninstall)
const ownPkgPath = path.resolve(__dirname, '..', 'package.json')
if (fs.existsSync(ownPkgPath)) {
  try {
    const own = JSON.parse(fs.readFileSync(ownPkgPath, 'utf-8'))
    if (own.name === 'toongine' && projectRoot === path.resolve(__dirname, '..')) {
      process.exit(0)
    }
  } catch {}
}

// Guard: project must have its own package.json
const parentPkg = path.join(projectRoot, 'package.json')
if (!fs.existsSync(parentPkg)) process.exit(0)

console.log('\n  🧹 toongine: Cleaning up...\n')

// ── Remove injected dashboard pages ────────────────────────────────────────

const injectedPaths = [
  'app/toongine',
  'pages/toongine',
  'app/settings/dashboard',
  'pages/settings',
  'src/pages/ToonGine.tsx',
  'public/toongine.html',
]

for (const p of injectedPaths) {
  const full = path.join(projectRoot, p)
  try {
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true })
      console.log(`  ✓ Removed ${p}`)
    }
  } catch (e) {
    console.log(`  ⚠️  Could not remove ${p}: ${e.message}`)
  }
}

// ── Remove .toon directory ─────────────────────────────────────────────────

const toonDir = path.join(projectRoot, '.toon')
if (fs.existsSync(toonDir)) {
  try {
    fs.rmSync(toonDir, { recursive: true, force: true })
    console.log('  ✓ Removed .toon/')
  } catch (e) {
    console.log(`  ⚠️  Could not remove .toon/: ${e.message}`)
  }
}

// ── Remove config files ────────────────────────────────────────────────────

const configFiles = [
  'toongine.config.json',
  '.toongine.json',
  '.toongine.lock',
  '.toon-cache.json',
  '.compile-cache.json',
]

for (const f of configFiles) {
  const full = path.join(projectRoot, f)
  if (fs.existsSync(full)) {
    try {
      fs.unlinkSync(full)
      console.log(`  ✓ Removed ${f}`)
    } catch (e) {
      console.log(`  ⚠️  Could not remove ${f}: ${e.message}`)
    }
  }
}

// ── Remove toongine navbar links from common locations ─────────────────────

const navCleanups = [
  { file: 'app/layout.tsx', marker: 'toongine' },
  { file: 'components/Nav/NavBar.tsx', marker: 'toongine' },
  { file: 'src/components/NavBar.tsx', marker: 'toongine' },
]

for (const { file, marker } of navCleanups) {
  const full = path.join(projectRoot, file)
  if (!fs.existsSync(full)) continue
  try {
    let content = fs.readFileSync(full, 'utf-8')
    if (!content.includes(marker)) continue
    
    // Remove lines containing the marker
    const lines = content.split('\n')
    const filtered = lines.filter(l => !l.includes(marker))
    fs.writeFileSync(full, filtered.join('\n'))
    console.log(`  ✓ Removed toongine link from ${file}`)
  } catch (e) {
    console.log(`  ⚠️  Could not clean ${file}: ${e.message}`)
  }
}

console.log('\n  ✅ Cleanup complete\n')
