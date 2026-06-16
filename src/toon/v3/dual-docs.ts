// src/toon/v3/dual-docs.ts — Dual-Version Document Manager
//
// Every document exists in TWO versions:
//   1. HUMAN version → full markdown (originals/ or .archive/)
//   2. LLM version   → stripped TOON (.toon/docs/ or .toon/project/)
//
// This module serves the right version based on who's asking.
//
// Usage:
//   import { readDoc } from 'toongine/toon/v3/dual-docs'
//   const human = readDoc('docs/novizio/CONTEXT.md', 'human')
//   const llm   = readDoc('docs/novizio/CONTEXT.md', 'llm')
//   const stats = docStats()  // how much we're saving

import { resolve, resolveMany, ResolveResult, ReadMode } from './resolver'

// ─── Main API ─────────────────────────────────────────────────────────────────

/**
 * Read a document in the requested mode.
 * - 'human': full markdown from originals or .archive/
 * - 'llm':   compressed TOON from .toon/
 * - 'auto':  .toon/ first, fallback to originals
 */
export function readDoc(
  path: string,
  mode: ReadMode = 'auto',
  projectRoot?: string
): ResolveResult {
  return resolve(path, mode, projectRoot)
}

/**
 * Read multiple docs at once (for batch injection).
 * Always returns LLM-optimized versions.
 */
export function readDocsForLLM(
  paths: string[],
  projectRoot?: string
): { path: string; content: string; savings: number }[] {
  const results = resolveMany(paths, 'llm', projectRoot)
  return results.map(r => ({
    path: r.path,
    content: r.content,
    savings: r.originalSize > 0
      ? Math.round((1 - r.compressedSize / r.originalSize) * 100)
      : 0,
  }))
}

/**
 * Read a doc for human viewing.
 */
export function readDocForHuman(
  path: string,
  projectRoot?: string
): ResolveResult {
  return resolve(path, 'human', projectRoot)
}

// ─── Path Helpers ─────────────────────────────────────────────────────────────

/**
 * Get the .toon/ path for a given original path.
 */
export function getToonPath(originalPath: string): string {
  if (originalPath.startsWith('agent-department/')) {
    return `.toon/memory/${originalPath.replace(/\.md$/, '.toon')}`
  }
  if (originalPath.startsWith('agent-memory/')) {
    return `.toon/memory/${originalPath.replace(/\.md$/, '.toon')}`
  }
  if (originalPath.startsWith('docs/')) {
    return `.toon/docs/${originalPath.replace(/\.md$/, '.toon')}`
  }
  if (originalPath.startsWith('.toon/graphify/')) {
    return `.toon/graphify/${originalPath.replace(/\.md$/, '.toon').replace(/\.json$/, '.json')}`
  }
  if (originalPath.startsWith('.toon/codegraph/')) {
    return `.toon/codegraph/${originalPath.replace(/\.md$/, '.toon')}`
  }
  if (originalPath === 'CLAUDE.md') {
    return '.toon/project/CLAUDE.md'
  }
  return `.toon/${originalPath.replace(/\.md$/, '.toon')}`
}

/**
 * Get the original path for a .toon/ path.
 */
export function getHumanPath(toonPath: string): string {
  return toonPath
    .replace(/^\.toon\/docs\//, 'docs/')
    .replace(/^\.toon\/agents\//, 'agent-department/')
    .replace(/^\.toon\/memory\/agent-memory\//, 'agent-memory/')
    .replace(/^\.toon\/graphify\//, '.toon/graphify/')
    .replace(/^\.toon\/codegraph\//, '.toon/codegraph/')
    .replace(/^\.toon\/project\//, '')
    .replace(/\.toon$/, '.md')
}

// ─── Stats ────────────────────────────────────────────────────────────────────

import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export interface DualDocStats {
  totalDocs: number
  totalHumanSize: number
  totalToonSize: number
  savingsPercent: number
  breakdown: {
    agentMemory: { count: number; humanSize: number; toonSize: number }
    docs: { count: number; humanSize: number; toonSize: number }
    graphs: { count: number; humanSize: number; toonSize: number }
    project: { count: number; humanSize: number; toonSize: number }
  }
}

export function docStats(projectRoot: string = process.cwd()): DualDocStats {
  const stats: DualDocStats = {
    totalDocs: 0,
    totalHumanSize: 0,
    totalToonSize: 0,
    savingsPercent: 0,
    breakdown: {
      agentMemory: { count: 0, humanSize: 0, toonSize: 0 },
      docs: { count: 0, humanSize: 0, toonSize: 0 },
      graphs: { count: 0, humanSize: 0, toonSize: 0 },
      project: { count: 0, humanSize: 0, toonSize: 0 },
    },
  }

  function countDir(toonDir: string, humanDir: string, key: keyof typeof stats.breakdown) {
    const tDir = join(projectRoot, toonDir)
    if (!existsSync(tDir)) return

    let toonFiles = 0; let toonSize = 0
    function walkToon(dir: string) {
      if (!existsSync(dir)) return
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name)
        if (entry.isDirectory()) { walkToon(p) }
        else if (entry.name.endsWith('.toon')) {
          toonFiles++
          try { toonSize += statSync(p).size } catch {}
        }
      }
    }
    walkToon(tDir)

    let humanFiles = 0; let humanSize = 0
    const hDir = join(projectRoot, humanDir)
    if (existsSync(hDir)) {
      function walkHuman(dir: string) {
        if (!existsSync(dir)) return
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, entry.name)
          if (entry.isDirectory()) { walkHuman(p) }
          else if (entry.name.endsWith('.md') || entry.name.endsWith('.json')) {
            humanFiles++
            try { humanSize += statSync(p).size } catch {}
          }
        }
      }
      walkHuman(hDir)
    }

    stats.breakdown[key] = {
      count: toonFiles || humanFiles,
      humanSize,
      toonSize,
    }
    stats.totalDocs += toonFiles || humanFiles
    stats.totalHumanSize += humanSize
    stats.totalToonSize += toonSize
  }

  countDir('.toon/agents', 'agent-department', 'agentMemory')
  countDir('.toon/memory/agent-memory', 'agent-memory', 'agentMemory')
  countDir('.toon/docs', 'docs', 'docs')
  countDir('.toon/graphify', '.toon/graphify', 'graphs')
  countDir('.toon/codegraph', '.toon/codegraph', 'graphs')

  // Project configs
  const projectToon = join(projectRoot, '.toon', 'project', 'CLAUDE.md')
  const projectOrig = join(projectRoot, 'CLAUDE.md')
  if (existsSync(projectToon)) {
    stats.breakdown.project.count = 1
    try { stats.breakdown.project.toonSize = statSync(projectToon).size } catch {}
  }
  if (existsSync(projectOrig)) {
    stats.breakdown.project.count = Math.max(stats.breakdown.project.count, 1)
    try { stats.breakdown.project.humanSize = statSync(projectOrig).size } catch {}
  }
  stats.totalHumanSize += stats.breakdown.project.humanSize
  stats.totalToonSize += stats.breakdown.project.toonSize

  stats.savingsPercent = stats.totalHumanSize > 0
    ? Math.round((1 - stats.totalToonSize / stats.totalHumanSize) * 100)
    : 0

  return stats
}
