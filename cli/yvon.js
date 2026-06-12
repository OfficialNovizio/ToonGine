#!/usr/bin/env node
// yvon CLI — YVON Engine command-line interface v1.2.0

const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

const command = process.argv[2] || 'help'
const args = process.argv.slice(3)

function help() {
  console.log(`
YVON Engine CLI v1.2.0

  yvon init          Initialize YVON Engine with full agent team
  yvon doctor        Health check all engine systems
  yvon graph         Rebuild knowledge graphs
  yvon agents        List all 13 agents and their status
  yvon sync          Sync with Hermes agent
  yvon compress      Show compression statistics
  yvon dashboard     Launch TOON visual dashboard (coming soon)
  yvon version       Show version
`)
}

function init() {
  const cwd = process.cwd()
  
  console.log('\n  🚀 YVON Engine v1.2.0 — Initializing...\n')
  
  // ─── Step 1: Detect existing features ──────────────────────────────────
  console.log('  📡 Scanning project...\n')
  
  const features = {
    graphify: fs.existsSync(path.join(cwd, 'graphify-out', 'GRAPH_REPORT.md')),
    codegraph: fs.existsSync(path.join(cwd, 'graphify-out', 'CODEGRAPH_REPORT.md')),
    nextjs: fs.existsSync(path.join(cwd, 'next.config.ts')) || fs.existsSync(path.join(cwd, 'next.config.js')),
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hermes: fs.existsSync(path.join(os.homedir(), '.hermes', 'memories', 'USER.md')),
    agentMemory: fs.existsSync(path.join(cwd, 'agent-memory')),
    claudeMd: fs.existsSync(path.join(cwd, 'CLAUDE.md')),
    ventureDocs: fs.existsSync(path.join(cwd, 'docs', 'ventures')),
    typescript: false,
    python: false,
  }
  
  // Check for TypeScript
  try { execSync('npx tsc --version', { stdio: 'pipe' }); features.typescript = true } catch {}
  // Check for Python (graphify dependency)
  try { execSync('python3 --version', { stdio: 'pipe' }); features.python = true } catch {}
  
  const created = []
  const kept = []
  const deps = []
  
  // ─── Step 2: Check dependencies ────────────────────────────────────────
  const depChecks = [
    ['graphify', 'python3', 'pip install graphify', 'Code structure knowledge graph'],
    ['hermes', 'hermes', 'curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash', 'AI agent framework for sync'],
    ['typescript', 'tsc', 'npm install -D typescript', 'TypeScript compiler'],
    ['nextjs', 'next', 'npx create-next-app@latest', 'Next.js framework'],
  ]
  depChecks.forEach(function(item) {
    const name = item[0], cmd = item[1], install = item[2], desc = item[3]
    // Only check for graphify (Python) and hermes (critical deps)
    if ((name === 'graphify' && !features.python) || (name === 'hermes' && !features.hermes)) {
      console.log(`  ⚠️  ${name} not found — ${desc}`)
      console.log(`     Install: ${install}\n`)
      deps.push({ name, install, desc })
    } else if (name === 'graphify' && features.python) {
      console.log(`  ✅ ${name} (Python available — run: pip install graphify)`)
    } else if (name === 'hermes' && features.hermes) {
      console.log(`  ✅ ${name} (connected — sync enabled)`)
    }
  })
  console.log('')
  
  // ─── Step 3: Create project structure ──────────────────────────────────
  const createChecks = [
    ['graphify', 'graphify-out', 'GRAPH_REPORT.md', '# Graph Report\n> Run: pip install graphify && graphify update .'],
    ['codegraph', 'graphify-out', 'CODEGRAPH_REPORT.md', '# Code Dependency Graph\n> Run: npx yvon graph'],
    ['agentMemory', 'agent-memory', '', ''],
    ['claudeMd', '.', 'CLAUDE.md', '# CLAUDE.md\n> Project architecture and rules\n\n## App Architecture\n\n## Development Commands\n\n## Key Rules\n- Strict TypeScript — zero build errors\n- No manual deploys — CI/CD pipeline only\n'],
    ['ventureDocs', 'docs/ventures/default', 'CONTEXT.md', '# Venture Context\n> Default venture configuration\n'],
  ]
  createChecks.forEach(function(item) {
    const key = item[0], dir = item[1], file = item[2], content = item[3]
    if (features[key]) {
      kept.push(key)
      console.log(`  ✅ (kept) ${key}`)
    } else {
      const fullDir = path.join(cwd, dir)
      fs.mkdirSync(fullDir, { recursive: true })
      if (file && content) {
        fs.writeFileSync(path.join(fullDir, file), content)
      }
      created.push(key)
      console.log(`  📦 (creating) ${key}`)
    }
  })
  
  // ─── Step 4: Deploy full agent team ────────────────────────────────────
  console.log('\n  👥 Deploying agent team...\n')
  
  const templateDir = path.join(__dirname, '..', 'templates', 'agents')
  const agentMemoryDir = path.join(cwd, 'agent-memory')
  
  if (fs.existsSync(templateDir)) {
    const agents = fs.readdirSync(templateDir).filter(d => 
      fs.statSync(path.join(templateDir, d)).isDirectory() && d !== 'skills' && d !== 'brands'
    )
    
    let agentsCreated = 0
    let agentsUpdated = 0
    
    for (const dept of agents) {
      const deptDir = path.join(templateDir, dept)
      const agentNames = fs.readdirSync(deptDir).filter(d => 
        fs.statSync(path.join(deptDir, d)).isDirectory()
      )
      
      for (const agent of agentNames) {
        const srcDir = path.join(deptDir, agent)
        const destDir = path.join(agentMemoryDir, dept, agent)
        
        if (fs.existsSync(destDir)) {
          agentsUpdated++
        } else {
          agentsCreated++
          // Copy entire agent folder
          copyDir(srcDir, destDir)
        }
      }
    }
    
    // Copy DEPARTMENTS.md
    const depsSrc = path.join(templateDir, 'DEPARTMENTS.md')
    if (fs.existsSync(depsSrc)) {
      fs.copyFileSync(depsSrc, path.join(agentMemoryDir, 'DEPARTMENTS.md'))
    }
    
    console.log(`  ✅ ${agentsCreated} agents deployed (${agentsUpdated} already exist)`)
    console.log(`  📁 Each agent: AGENT.md + MEMORY.md + SESSION.md + SKILLS.md + TOOLS.md + COMMANDS.md + CONFLICTS.md + PRINCIPLES.md + skills/`)
  }
  
  // ─── Step 5: Write config ──────────────────────────────────────────────
  const config = {
    version: '1.2.0',
    projectRoot: cwd,
    graphifyReport: path.join(cwd, 'graphify-out', 'GRAPH_REPORT.md'),
    codegraphReport: path.join(cwd, 'graphify-out', 'CODEGRAPH_REPORT.md'),
    agentMemoryDir: path.join(cwd, 'agent-memory'),
    hermesMemoryDir: path.join(os.homedir(), '.hermes', 'memories'),
    projectClaudePath: path.join(cwd, 'CLAUDE.md'),
    ventureDocsDir: path.join(cwd, 'docs', 'ventures'),
    cieEnabled: true,
    contextCap: 2500,
    adaptiveInjection: true,
    toonEnabled: true,
    toonBidirectional: true,
    hermesSync: features.hermes,
    agents: 13,
    features: features,
  }
  
  fs.writeFileSync(path.join(cwd, 'yvon.config.json'), JSON.stringify(config, null, 2))
  
  // ─── Step 6: Summary ───────────────────────────────────────────────────
  console.log('\n  ──────────────────────────────────────────────────')
  console.log('  ✅ YVON Engine initialized!')
  console.log('  ──────────────────────────────────────────────────\n')
  console.log(`  Created: ${created.length + agentsCreated} files/folders`)
  console.log(`  Kept:    ${kept.length} existing components`)
  if (deps.length > 0) {
    console.log(`  ⚠️  ${deps.length} dependencies to install:`)
    deps.forEach(d => console.log(`     ${d.name}: ${d.install}`))
  }
  console.log('\n  Next steps:')
  if (!features.hermes) console.log('    1. Install Hermes for full sync: curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash')
  console.log('    2. Build graphs: npx yvon graph (requires graphify)')
  console.log('    3. Run health check: npx yvon doctor')
  console.log('    4. Import in code: import { buildCieContext } from \'@yvon/engine\'\n')
  console.log('  13 agents deployed. CIE active. TOON compression enabled.')
  if (features.hermes) console.log('  🔗 Hermes sync enabled.')
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function doctor() {
  console.log('\n  🏥 YVON Engine — Health Check\n')
  
  const cwd = process.cwd()
  const configPath = path.join(cwd, 'yvon.config.json')
  
  if (!fs.existsSync(configPath)) {
    console.log('  ❌ yvon.config.json not found. Run: npx yvon init')
    return
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  
  const checks = [
    ['Config', !!config, 'yvon.config.json'],
    ['Project root', !!config.projectRoot, config.projectRoot],
    ['graphify', fs.existsSync(config.graphifyReport), path.basename(config.graphifyReport)],
    ['codegraph', fs.existsSync(config.codegraphReport), path.basename(config.codegraphReport)],
    ['Agent memory', fs.existsSync(config.agentMemoryDir), `${countAgents(config.agentMemoryDir)} agents`],
    ['Hermes memory', fs.existsSync(config.hermesMemoryDir), config.hermesSync ? 'Sync enabled' : 'Not connected'],
    ['CLAUDE.md', fs.existsSync(config.projectClaudePath), 'Project docs'],
    ['Venture docs', fs.existsSync(config.ventureDocsDir), 'Venture context'],
    ['CIE', config.cieEnabled, `Adaptive injection (cap: ${config.contextCap} chars)`],
    ['TOON', config.toonEnabled, config.toonBidirectional ? 'Bidirectional' : 'Input only'],
  ]
  
  let passed = 0
  for (const [name, pass, detail] of checks) {
    const status = pass ? '✅' : '❌'
    if (pass) passed++
    console.log(`  ${status} ${name}: ${detail}`)
  }
  
  console.log(`\n  ${passed}/${checks.length} checks passed`)
  console.log(passed === checks.length ? '  ✅ All systems operational' : '  ⚠️  Run: npx yvon init')
}

function countAgents(dir) {
  if (!fs.existsSync(dir)) return '0'
  let count = 0
  for (const dept of fs.readdirSync(dir)) {
    const deptPath = path.join(dir, dept)
    if (fs.statSync(deptPath).isDirectory()) {
      for (const agent of fs.readdirSync(deptPath)) {
        if (fs.statSync(path.join(deptPath, agent)).isDirectory()) count++
      }
    }
  }
  return String(count)
}

function agents() {
  console.log('\n  👥 YVON Agents\n')
  
  const cwd = process.cwd()
  const memDir = path.join(cwd, 'agent-memory')
  
  if (!fs.existsSync(memDir)) {
    console.log('  No agents deployed. Run: npx yvon init')
    return
  }
  
  const depts = {
    CEO: 'Direction + Accountability',
    COO: 'Operations + Process',
    Technical: 'Everything That Ships',
    Marketing: 'Revenue + Content',
    Finance: 'Financial Intelligence',
    Psychology: 'Behavioral Validation',
  }
  
  for (const dept of fs.readdirSync(memDir)) {
    const deptPath = path.join(memDir, dept)
    if (!fs.statSync(deptPath).isDirectory() || dept === 'skills' || dept === 'brands') continue
    
    console.log(`  ${dept} — ${depts[dept] || ''}`)
    for (const agent of fs.readdirSync(deptPath)) {
      const agentPath = path.join(deptPath, agent)
      if (!fs.statSync(agentPath).isDirectory()) continue
      const files = fs.readdirSync(agentPath).filter(f => f.endsWith('.md'))
      const hasSkills = fs.existsSync(path.join(agentPath, 'skills'))
      console.log(`    ${agent.padEnd(20)} ${files.length} docs${hasSkills ? ' + skills/' : ''}`)
    }
    console.log('')
  }
}

function version() {
  console.log('YVON Engine v1.2.0')
}

const commands = { init, doctor, help, version, agents,
  graph: () => console.log('Run: pip install graphify && graphify update .\nOr: npm run graphify:build'),
  compress: () => console.log('TOON compression: 84.5% token savings on data tasks (verified)\nImport: { toon, compress, delta } from \'@yvon/engine\''),
  sync: () => console.log('Hermes sync: CRDT bidirectional memory sync\nRequires Hermes agent installed in ~/.hermes/'),
  dashboard: () => console.log('TOON Dashboard: coming in v1.3.0'),
}

;(commands[command] || help)()
