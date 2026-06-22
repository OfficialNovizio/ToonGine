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

// ── Helpers ────────────────────────────────────────────────────────────────────
const mkdir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

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
state.hasAgents = fs.existsSync(path.join(cwd, '.toon', 'agents'))

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
  const agentDest = path.join(cwd, '.toon', 'agents')
  if (fs.existsSync(agentSrc)) {
    const agentCount = copyDir(agentSrc, agentDest, false)
    const deptCount = fs.readdirSync(agentDest).filter(d => 
      fs.statSync(path.join(agentDest, d)).isDirectory()
    ).length
    console.log(`  ✅ ${agentCount} agent files · ${deptCount} departments deployed`)
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
        mkdir(docsDest)
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

  // ── Inject Agent Dashboard into host project ────────────────────────────
  try {
    const { injectDashboard } = require('../dist/dashboard/inject')
    const result = injectDashboard(cwd)
    if (result.created.length > 0) {
      console.log(`  📊 Dashboard injected: ${result.created.join(', ')}`)
    }
    if (result.updated.length > 0) {
      console.log(`  🔄 Nav updated: ${result.updated.join(', ')}`)
    }
    if (result.errors.length > 0) {
      console.log(`  ⚠️  ${result.errors.join('; ')}`)
    }
    if (result.dashboardPath) {
      console.log(`  🌐 Dashboard: ${result.dashboardPath}`)
    }
  } catch (e) {
    console.log('  ⚠️  Dashboard injection skipped (build first)')
  }

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

    // ── Auto-register MCP server with Hermes ──────────────────────────
    try {
      const os = require('os')
      const hermesConfigPath = path.join(os.homedir(), '.hermes', 'config.yaml')

      if (fs.existsSync(hermesConfigPath)) {
        const configContent = fs.readFileSync(hermesConfigPath, 'utf-8')
        // Check if already registered
        if (!configContent.includes('toongine-graph')) {
          // Use Python for safe YAML merge (one-liner)
          const mcpServerPath = path.join(cwd, '.toon', 'hermes', 'mcp-server.py').replace(/\\/g, '/')
          const projectRoot = cwd.replace(/\\/g, '/')
          execSync(
            `python3 -c "
import yaml, os
p = os.path.expanduser('${hermesConfigPath}')
with open(p) as f: c = yaml.safe_load(f) or {}
c.setdefault('mcp_servers', {})['toongine-graph'] = {
    'command': 'python3',
    'args': ['${mcpServerPath}', '${projectRoot}'],
    'timeout': 30,
    'connect_timeout': 15
}
with open(p, 'w') as f: yaml.dump(c, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
print('OK')
"`, { stdio: 'pipe', timeout: 10000 }
          )
          console.log('  🔌 MCP graph tools auto-registered with Hermes')
          console.log('     Restart Hermes to activate 5 graph tools')
        } else {
          console.log('  ✅ MCP already registered with Hermes')
        }
      }
    } catch (e) {
      // Hermes not installed or config not found — skip silently
    }
  }

  if (needsIntegrate) {
    console.log('\n  🔌 Running: npx toongine integrate\n')
    try {
      execSync(`node "${cliPath}" integrate`, { cwd, stdio: 'inherit' })
    } catch (e) {
      console.log(`  ⚠️  integrate failed: ${e.message} — continuing with config setup`)
    }
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

  // Detect repo from git remote (shared across all config sections)
  let repoId = 'unknown/unknown'
  let name = 'unknown'
  let owner = 'unknown'
  let toongineVersion = '0.0.0'
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8', timeout: 3000 }).trim()
    const match = remote.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/)
    if (match) {
      owner = match[1]
      name = match[2]
      repoId = `${owner}/${name}`
    }
  } catch {}
  // Read ToonGine version from own package.json
  try {
    toongineVersion = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')).version
  } catch {}

  // ── Register project in ToonGine Supabase (Token Burn Engine) ─────
  try {
    const supabaseUrl = 'https://mcejxdjrwzjxafciuely.supabase.co'
    const supabaseKey = process.env.TOONGINE_SUPABASE_KEY || ''

    // Write .toongine.json for the plugin
    const cfg = { repo: repoId, supabase_url: supabaseUrl, created_at: new Date().toISOString() }
    fs.writeFileSync(path.join(cwd, '.toongine.json'), JSON.stringify(cfg, null, 2))
    console.log(`  📋 Project registered: ${repoId}`)

    // Upsert into Supabase
    if (supabaseKey && repoId !== 'unknown/unknown') {
      const https = require('https')
      const payload = JSON.stringify({ repo_id: repoId, repo_name: name, owner, last_active_at: new Date().toISOString() })
      const req = https.request({
        hostname: 'mcejxdjrwzjxafciuely.supabase.co',
        path: '/rest/v1/toongine_projects?on_conflict=repo_id',
        method: 'POST',
        headers: {
          'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates',
          'Content-Length': Buffer.byteLength(payload),
        },
      }, (res) => {
        if (res.statusCode === 201 || res.statusCode === 200) console.log('  🗄️  Synced to ToonGine Supabase')
      })
      req.write(payload)
      req.end()
    }
  } catch {}

  // ── Write .toon/config.json (tracked in git — project identity) ─────────
  try {
    const toonDir = path.join(cwd, '.toon')
    mkdir(toonDir)
    const configPath = path.join(toonDir, 'config.json')
    const projectConfig = {
      repo_id: repoId,
      name: name,
      owner: owner,
      created_at: new Date().toISOString(),
      version: toongineVersion,
    }
    fs.writeFileSync(configPath, JSON.stringify(projectConfig, null, 2))
    console.log('  📋 .toon/config.json written (project identity)')
  } catch (e) {
    console.log(`  ⚠️  config.json write skipped: ${e.message}`)
  }

  // ── Smart .gitignore: track config + agents, ignore cache/graph ─────────
  try {
    const giPath = path.join(cwd, '.gitignore')
    let giContent = fs.existsSync(giPath) ? fs.readFileSync(giPath, 'utf-8') : ''

    const toKeep = [
      '!.toon/config.json',
      '!.toon/agents/',
      '!.toon/agents/**/MEMORY.md',
      '!.toon/docs/',
    ]

    const toIgnore = [
      '.toon/cache/',
      '.toon/graph/*.db',
      '.toon/snapshots/',
      '.toon/tmp/',
    ]

    // Ensure .toon/ is ignored first (base rule)
    if (!giContent.match(/^\.toon[\/\n]/m)) {
      giContent += '\n# ToonGine — project identity tracked, telemetry ignored\n.toon/\n'
    }

    // Add unignore rules for tracked files
    for (const rule of toKeep) {
      if (!giContent.includes(rule)) {
        giContent += `${rule}\n`
      }
    }

    // Add explicit ignore for transient files
    for (const rule of toIgnore) {
      if (!giContent.includes(rule)) {
        giContent += `${rule}\n`
      }
    }

    fs.writeFileSync(giPath, giContent.trimEnd() + '\n')
    console.log('  📝 .gitignore updated — config + agents tracked, cache ignored')
  } catch (e) {
    console.log(`  ⚠️  .gitignore update skipped: ${e.message}`)
  }

  console.log('')
} catch (e) {
  console.log(`  ⚠️  Auto-configuration skipped: ${e.message}`)
  console.log('  Run manually: npx toongine integrate\n')
}
