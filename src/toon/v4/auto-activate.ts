// src/toon/v4/auto-activate.ts
// One command to rule them all: npx toongine init
// Auto-detects project state, installs tools, builds graph, starts watchers.

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs'
import { join } from 'path'
import { UnifiedGraph, createUnifiedGraph } from './unified-graph'
import { ingestAll } from './ingesters/index'
import { ensureAllTools } from './tool-installer'
import { startWatcher, stopAllWatchers, WatcherStatus } from './watcher'
import { BridgeConfig } from './bridge-types'

export interface ActivationReport {
  projectRoot: string
  isEmpty: boolean
  tools: BridgeConfig['tools']
  graphNodes: number
  graphEdges: number
  watchers: WatcherStatus[]
  durationMs: number
  errors: string[]
}

export function activate(projectRoot: string): ActivationReport {
  const start = Date.now()
  const errors: string[] = []

  // ─── 1. Ensure .toon/ structure ────────────────────────────────────────
  const toonDir = join(projectRoot, '.toon')
  const graphDir = join(toonDir, 'graph')
  const toolsDir = join(toonDir, 'tools')
  const hermesDir = join(toonDir, 'hermes')

  if (!existsSync(toonDir)) mkdirSync(toonDir, { recursive: true })
  if (!existsSync(graphDir)) mkdirSync(graphDir, { recursive: true })
  if (!existsSync(toolsDir)) mkdirSync(toolsDir, { recursive: true })
  if (!existsSync(hermesDir)) mkdirSync(hermesDir, { recursive: true })

  // ─── 1a. Deploy MCP server into .toon/hermes/ ─────────────────────────
  const mcpDest = join(hermesDir, 'mcp-server.py')
  if (!existsSync(mcpDest)) {
    // Try multiple source locations (dev vs npm-installed)
    const sources = [
      join(projectRoot, 'src', 'toon', 'v4', 'mcp-server.py'),
      join(projectRoot, 'node_modules', 'toongine', 'dist', 'toon', 'v4', 'mcp-server.py'),
    ]
    for (const src of sources) {
      if (existsSync(src)) {
        try {
          copyFileSync(src, mcpDest)
          // Make executable
          const { chmodSync } = require('fs')
          try { chmodSync(mcpDest, 0o755) } catch {}
        } catch (err: any) {
          errors.push(`MCP server deploy failed: ${err.message}`)
        }
        break
      }
    }
  }

  // ─── 2. Detect project state ───────────────────────────────────────────
  const isEmpty = isProjectEmpty(projectRoot)

  // ─── 3. Install/verify tools ───────────────────────────────────────────
  const tools = ensureAllTools(projectRoot)

  // ─── 4. Build unified graph ────────────────────────────────────────────
  let graphNodes = 0
  let graphEdges = 0

  if (!isEmpty) {
    const unified = createUnifiedGraph(projectRoot)
    try {
      const report = ingestAll(unified, projectRoot)
      graphNodes = report.unifiedStats.nodeCount
      graphEdges = report.unifiedStats.edgeCount

      for (const r of report.results) {
        if (r.errors.length > 0) {
          errors.push(`${r.tool}: ${r.errors.join('; ')}`)
        }
      }
    } catch (err: any) {
      errors.push(`graph build failed: ${err.message}`)
    }
    unified.close()
  } else {
    // Empty project — create empty schema
    const unified = createUnifiedGraph(projectRoot)
    unified.close()
  }

  // ─── 5. Start watchers ─────────────────────────────────────────────────
  const watchers = startWatcher(projectRoot)

  return {
    projectRoot,
    isEmpty,
    tools,
    graphNodes,
    graphEdges,
    watchers,
    durationMs: Date.now() - start,
    errors,
  }
}

export function deactivate(projectRoot: string): void {
  stopAllWatchers()
}

function isProjectEmpty(root: string): boolean {
  try {
    const entries = readdirSync(root)
    // Filter out common non-code dirs
    const codeDirs = entries.filter(e => {
      if (e.startsWith('.')) return false
      if (['node_modules', 'dist', '.next', 'graphify-out'].includes(e)) return false
      const full = join(root, e)
      try {
        return statSync(full).isDirectory()
      } catch { return false }
    })

    // Check if any directory has source files
    for (const dir of codeDirs) {
      const files = readdirSync(join(root, dir))
      if (files.some(f => /\.(ts|tsx|js|jsx|py|md)$/.test(f))) return false
    }

    return true
  } catch {
    return true
  }
}
