// src/toon/v4/tool-installer.ts
// Auto-installs all 3 graph tools inside .toon/tools/.
// Idempotent — skips if already installed.

import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { BridgeConfig } from './bridge-types'

export interface ToolStatus {
  name: string
  installed: boolean
  path: string
  version: string
  error?: string
}

export function detectTools(projectRoot: string): ToolStatus[] {
  return [
    detectCodeReviewGraph(),
    detectGraphify(),
    detectCodegraph(projectRoot),
  ]
}

function detectCodeReviewGraph(): ToolStatus {
  try {
    const out = execSync('code-review-graph --version 2>/dev/null || python3 -c "import code_review_graph" 2>&1', { stdio: 'pipe', timeout: 5000 }).toString()
    return { name: 'code-review-graph', installed: true, path: 'pip global', version: extractVersion(out) }
  } catch {
    return { name: 'code-review-graph', installed: false, path: '', version: '', error: 'not installed — pip install code-review-graph' }
  }
}

function detectGraphify(): ToolStatus {
  try {
    const out = execSync('graphify --version 2>/dev/null || pipx runpip graphifyy show 2>&1', { stdio: 'pipe', timeout: 5000 }).toString()
    return { name: 'graphify', installed: true, path: 'pipx global', version: extractVersion(out) }
  } catch {
    return { name: 'graphify', installed: false, path: '', version: '', error: 'not installed — pipx install graphifyy' }
  }
}

function detectCodegraph(projectRoot: string): ToolStatus {
  try {
    const out = execSync('codegraph version 2>/dev/null || npx @colbymchenry/codegraph version 2>&1', { stdio: 'pipe', timeout: 5000 }).toString()
    return { name: 'codegraph', installed: true, path: 'npm global', version: extractVersion(out) }
  } catch {
    // Check if installed locally
    const localPath = join(projectRoot, '.toon', 'tools', 'codegraph')
    if (existsSync(join(localPath, 'package.json'))) {
      return { name: 'codegraph', installed: true, path: localPath, version: 'local' }
    }
    return { name: 'codegraph', installed: false, path: '', version: '', error: 'not installed — npm i -g @colbymchenry/codegraph' }
  }
}

export function installCodegraph(projectRoot: string): ToolStatus {
  const toolsDir = join(projectRoot, '.toon', 'tools')
  if (!existsSync(toolsDir)) mkdirSync(toolsDir, { recursive: true })

  const dest = join(toolsDir, 'codegraph')

  // Skip if already installed
  if (existsSync(join(dest, 'package.json'))) {
    return { name: 'codegraph', installed: true, path: dest, version: 'local' }
  }

  try {
    execSync(`npm install --prefix "${dest}" @colbymchenry/codegraph 2>&1 || curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh 2>&1`, {
      stdio: 'pipe',
      timeout: 60_000,
    })
    return { name: 'codegraph', installed: true, path: dest, version: 'latest' }
  } catch (err: any) {
    return { name: 'codegraph', installed: false, path: dest, version: '', error: err.stderr?.toString() || err.message }
  }
}

export function ensureAllTools(projectRoot: string): BridgeConfig['tools'] {
  const results = detectTools(projectRoot)

  // Auto-install codegraph if missing (the others are typically installed via pip)
  if (!results.find(r => r.name === 'codegraph')?.installed) {
    const r = installCodegraph(projectRoot)
    const idx = results.findIndex(t => t.name === 'codegraph')
    if (idx >= 0) results[idx] = r
  }

  const toolMap: BridgeConfig['tools'] = {} as any
  for (const r of results) {
    toolMap[r.name as keyof BridgeConfig['tools']] = {
      installed: r.installed,
      path: r.path,
      status: r.installed ? 'ok' : 'missing',
    }
  }
  return toolMap
}

function extractVersion(out: string): string {
  const m = out.match(/(\d+\.\d+\.\d+)/)
  return m ? m[1] : 'unknown'
}
