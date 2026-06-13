#!/usr/bin/env node
// Postinstall hook for toongine
// AUTO-TOONIFY: When installed as a dependency, automatically toon-ify the
// parent project, wire CIE, inject dashboard, compile v3 engine.
//
// This only runs for the PARENT project, not when toongine installs itself.
// Detection: if package.json's name is NOT "toongine", we're a dependency.

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ── Guard: only run when installed as a dependency ───────────────────────────
const cwd = process.env.INIT_CWD || process.cwd()
const ownPkg = path.join(__dirname, '..', 'package.json')
const parentPkg = path.join(cwd, 'package.json')

// If we're installing toongine itself (dev/CI), skip
if (fs.existsSync(ownPkg)) {
  try {
    const own = JSON.parse(fs.readFileSync(ownPkg, 'utf-8'))
    if (own.name === 'toongine' && cwd === path.resolve(__dirname, '..')) {
      // We ARE toongine — building ourselves. Skip.
      process.exit(0)
    }
  } catch {}
}

// If no parent package.json, nothing to TOON-ify
if (!fs.existsSync(parentPkg)) {
  process.exit(0)
}

// ── Detect what the parent project already has ────────────────────────────────
console.log('\n  🔍 toongine: Detecting project state...\n')

const state = {
  hasCIE: false,
  hasTOON: false,
  hasV3: false,
  hasDashboard: false,
  hasConfig: false,
  hasAgents: false,
  isNextJS: false,
  isVite: false,
}

// Check for CIE wiring
const claudeRoute = path.join(cwd, 'app', 'api', 'claude', 'route.ts')
if (fs.existsSync(claudeRoute)) {
  const content = fs.readFileSync(claudeRoute, 'utf-8')
  state.hasCIE = content.includes('buildCieContext') || content.includes('toongine/cie')
  state.hasTOON = content.includes('autoToonMiddleware') || content.includes('toongine/toon')
}

// Check for v3 engine
state.hasV3 = fs.existsSync(path.join(cwd, '.toon', 'v3', 'engine.bin'))

// Check for dashboard injection
state.hasDashboard = fs.existsSync(path.join(cwd, 'app', 'settings', 'dashboard', 'page.tsx'))

// Check for toongine config
state.hasConfig = fs.existsSync(path.join(cwd, 'toongine.config.json'))

// Check for agents
state.hasAgents = fs.existsSync(path.join(cwd, 'agent-department')) || 
                  fs.existsSync(path.join(cwd, 'agent-memory'))

// Detect framework
state.isNextJS = fs.existsSync(path.join(cwd, 'next.config.ts')) || 
                 fs.existsSync(path.join(cwd, 'next.config.js'))
state.isVite = fs.existsSync(path.join(cwd, 'vite.config.ts')) || 
               fs.existsSync(path.join(cwd, 'vite.config.js'))

// ── Report detected state ────────────────────────────────────────────────────
console.log(`  CIE wired:      ${state.hasCIE ? '✅' : '❌'}`)
console.log(`  TOON wired:     ${state.hasTOON ? '✅' : '❌'}`)
console.log(`  V3 engine:      ${state.hasV3 ? '✅' : '❌'}`)
console.log(`  Dashboard:      ${state.hasDashboard ? '✅' : '❌'}`)
console.log(`  Agents:         ${state.hasAgents ? '✅' : '❌'}`)
console.log(`  Framework:      ${state.isNextJS ? 'Next.js' : state.isVite ? 'Vite' : 'other'}`)

// ── Determine what needs to be done ──────────────────────────────────────────
const needsInit = !state.hasConfig
const needsIntegrate = !state.hasCIE || !state.hasTOON || !state.hasV3 || !state.hasDashboard
const needsV3 = state.hasTOON && !state.hasV3

if (!needsInit && !needsIntegrate && !needsV3) {
  console.log('\n  ✅ All systems already configured. Nothing to do.\n')
  process.exit(0)
}

// ── Auto-integrate ───────────────────────────────────────────────────────────
console.log('\n  ⚡ Auto-configuring toongine...\n')

try {
  // ── Step 0: Deploy agent templates (always) ────────────────────────────────
  console.log('  👥 Deploying agent system...\n')
  const templateRoot = path.join(__dirname, '..', 'templates')
  
  function copyDir(src, dest, overwrite = false) {
    if (!fs.existsSync(src)) return 0
    let count = 0
    mkdir(dest)
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, entry.name)
      const d = path.join(dest, entry.name)
      if (entry.isDirectory()) {
        count += copyDir(s, d, overwrite)
      } else if (overwrite || !fs.existsSync(d)) {
        fs.copyFileSync(s, d)
        count++
      }
    }
    return count
  }

  // Deploy agents (never overwrite existing user-modified agent files)
  const agentSrc = path.join(templateRoot, 'agents')
  const agentDest = path.join(cwd, 'agent-department')
  if (fs.existsSync(agentSrc)) {
    const agentCount = copyDir(agentSrc, agentDest, false)
    const deptCount = fs.readdirSync(agentDest).filter(d => 
      fs.statSync(path.join(agentDest, d)).isDirectory()
    ).length
    console.log(`  ✅ ${agentCount} agent files · ${deptCount} departments deployed`)
  }

  // Deploy lib (agent spawner — overwrite for updates)
  const libSrc = path.join(templateRoot, 'lib')
  const libDest = path.join(cwd, 'lib')
  if (fs.existsSync(libSrc)) {
    copyDir(libSrc, libDest, true)
    console.log('  ✅ lib/hermes-spawn.ts deployed')
  }

  // Deploy council API
  const apiSrc = path.join(templateRoot, 'api')
  const apiDest = path.join(cwd, 'app', 'api')
  if (fs.existsSync(apiSrc)) {
    copyDir(apiSrc, apiDest, true)
    console.log('  ✅ Council API deployed')
  }

  // Deploy council screen
  const screenSrc = path.join(templateRoot, 'screens')
  const screenDest = path.join(cwd, 'app')
  if (fs.existsSync(screenSrc)) {
    copyDir(screenSrc, screenDest, true)
    console.log('  ✅ Advisory Council UI deployed')
  }

  // Deploy foundation docs (CONSTITUTION + ENGINE)
  const docsSrc = path.join(templateRoot, 'docs')
  const docsDest = path.join(cwd, 'docs')
  const toonDest = path.join(cwd, '.toon', 'docs')
  if (fs.existsSync(docsSrc)) {
    for (const f of fs.readdirSync(docsSrc)) {
      const s = path.join(docsSrc, f)
      if (f.endsWith('.toon')) {
        mkdir(toonDest)
        if (!fs.existsSync(path.join(toonDest, f))) {
          fs.copyFileSync(s, path.join(toonDest, f))
        }
      } else {
        if (!fs.existsSync(path.join(docsDest, f))) {
          fs.copyFileSync(s, path.join(docsDest, f))
        }
      }
    }
    console.log('  ✅ CONSTITUTION + ENGINE deployed')
  }

  // Generate Hermes skills
  try {
    const { generateHermesSkills } = require('../dist/agents/hermes-generator')
    const results = generateHermesSkills(cwd)
    console.log(`  ✅ ${results.filter(r => r.written).length} Hermes skills generated`)
  } catch (e) {
    console.log('  ⚠️  Hermes skill generation skipped (dev only)')
  }

  console.log('')
  // Find the toongine CLI
  const cliPath = path.join(__dirname, '..', 'cli', 'toongine.js')
  if (!fs.existsSync(cliPath)) {
    console.log('  ⚠️  CLI not found — skipping auto-configuration')
    console.log('  Run manually: npx toongine integrate\n')
    process.exit(0)
  }

  if (needsInit) {
    console.log('  📦 Running: npx toongine init\n')
    execSync(`node "${cliPath}" init`, { cwd, stdio: 'inherit' })
  }

  if (needsIntegrate) {
    console.log('\n  🔌 Running: npx toongine integrate\n')
    execSync(`node "${cliPath}" integrate`, { cwd, stdio: 'inherit' })
  } else if (needsV3) {
    console.log('\n  🧠 Rebuilding V3 engine...\n')
    // Just recompile v3 without full reintegration
    try {
      const { compile } = require('../dist/toon/v3/compile')
      const result = compile({ projectRoot: cwd, maxMergeIterations: 512 })
      console.log(`  ✅ V3 engine: ${result.chunkCount} chunks · ${result.indexSize} terms · ${result.bpeTokens} BPE tokens\n`)
    } catch (e) {
      console.log(`  ⚠️  V3 compile failed: ${e.message}`)
      console.log('  Run: npx toongine integrate  to rebuild\n')
    }
  }

  console.log('  ✅ toongine auto-configuration complete!\n')
} catch (e) {
  console.log(`  ⚠️  Auto-configuration skipped: ${e.message}`)
  console.log('  Run manually: npx toongine integrate\n')
}
