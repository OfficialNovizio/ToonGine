// src/toon/v3/resolver.ts — Runtime TOON Resolver
//
// Single entry point for ALL file reads. Agents, CIE, and middleware go through
// this resolver instead of raw fs — it serves compressed .toon/ versions first,
// falls back to .archive/, and only hits original files as last resort.
//
// Architecture:
//   resolve(path) → .toon/ (compressed) → .archive/ (original) → raw path
//
// Usage:
//   import { resolve } from 'toongine/toon/v3/resolver'
//   const memory = resolve('agent-department/CEO/marcus/MEMORY.md')
//   const docs   = resolve('docs/novizio/CONTEXT.md', 'llm')
//   const docs   = resolve('docs/novizio/CONTEXT.md', 'human')

import { existsSync, readFileSync } from 'fs'
import { join, relative, extname } from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReadMode = 'llm' | 'human' | 'auto'

export interface ResolveResult {
  content: string
  source: 'toon' | 'archive' | 'original' | 'not-found'
  path: string
  compressedSize: number
  originalSize: number
}

// ─── Path Mapping ─────────────────────────────────────────────────────────────

const PATH_MAP: Record<string, { toon: string; archive: string }> = {
  'agent-department': { toon: '.toon/memory/agent-department', archive: '.toon/.archive' },
  'agent-memory':     { toon: '.toon/memory/agent-memory',     archive: '.toon/.archive' },
  'docs':             { toon: '.toon/docs',                    archive: '.toon/.archive' },
  'graphify-out':     { toon: '.toon/graphs',                  archive: '.toon/.archive' },
  'CLAUDE.md':        { toon: '.toon/project/CLAUDE.md',       archive: '.toon/.archive' },
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const resolveCache = new Map<string, ResolveResult>()
const CACHE_TTL = 60000 // 1 minute

function cacheKey(path: string, mode: ReadMode): string {
  return `${mode}:${path}`
}

// ─── Main Resolver ────────────────────────────────────────────────────────────

export function resolve(
  relativePath: string,
  mode: ReadMode = 'auto',
  projectRoot: string = process.cwd()
): ResolveResult {
  // Strip leading / if present
  const cleanPath = relativePath.replace(/^\//, '')
  
  // Check cache
  const key = cacheKey(cleanPath, mode)
  const cached = resolveCache.get(key)
  if (cached) return cached

  let result: ResolveResult

  // ── Tier 1: .toon/ compressed version ───────────────────────────────────
  if (mode === 'llm' || mode === 'auto') {
    const toonPath = toToonPath(cleanPath, projectRoot)
    if (toonPath && existsSync(toonPath)) {
      try {
        const content = readFileSync(toonPath, 'utf-8')
        const originalSize = getOriginalSize(cleanPath, projectRoot)
        result = {
          content,
          source: 'toon',
          path: toonPath,
          compressedSize: content.length,
          originalSize,
        }
        resolveCache.set(key, result)
        setTimeout(() => resolveCache.delete(key), CACHE_TTL)
        return result
      } catch { /* fall through */ }
    }
  }

  // ── Tier 2: .archive/ original backup ───────────────────────────────────
  if (mode === 'human' || mode === 'auto') {
    const archivePath = getLatestArchive(cleanPath, projectRoot)
    if (archivePath && existsSync(archivePath)) {
      try {
        const content = readFileSync(archivePath, 'utf-8')
        result = {
          content,
          source: 'archive',
          path: archivePath,
          compressedSize: content.length,
          originalSize: content.length,
        }
        resolveCache.set(key, result)
        setTimeout(() => resolveCache.delete(key), CACHE_TTL)
        return result
      } catch { /* fall through */ }
    }
  }

  // ── Tier 3: Original file ───────────────────────────────────────────────
  const fullPath = join(projectRoot, cleanPath)
  if (existsSync(fullPath)) {
    try {
      const content = readFileSync(fullPath, 'utf-8')
      result = {
        content,
        source: 'original',
        path: fullPath,
        compressedSize: content.length,
        originalSize: content.length,
      }
      resolveCache.set(key, result)
      setTimeout(() => resolveCache.delete(key), CACHE_TTL)
      return result
    } catch { /* fall through */ }
  }

  // ── Not found ────────────────────────────────────────────────────────────
  result = {
    content: '',
    source: 'not-found',
    path: cleanPath,
    compressedSize: 0,
    originalSize: 0,
  }
  return result
}

// ─── Bulk Resolve (for CIE/middleware) ────────────────────────────────────────

export function resolveMany(
  paths: string[],
  mode: ReadMode = 'llm',
  projectRoot?: string
): ResolveResult[] {
  return paths.map(p => resolve(p, mode, projectRoot))
}

// ─── Path Helpers ─────────────────────────────────────────────────────────────

function toToonPath(relativePath: string, root: string): string | null {
  for (const [prefix, mapping] of Object.entries(PATH_MAP)) {
    if (relativePath.startsWith(prefix)) {
      const rel = relativePath.slice(prefix.length).replace(/^\//, '')
      const toonRel = rel.replace(/\.md$/, '.toon').replace(/\.json$/, '.json')
      
      if (prefix === 'CLAUDE.md') return join(root, mapping.toon)
      
      return join(root, mapping.toon, toonRel)
    }
  }
  
  // Generic fallback: try .toon/memory/ or .toon/docs/
  if (relativePath.endsWith('.md')) {
    const toonPath = join(root, '.toon', relativePath.replace(/\.md$/, '.toon'))
    if (existsSync(toonPath)) return toonPath
  }
  
  return null
}

function getLatestArchive(relativePath: string, root: string): string | null {
  const archiveRoot = join(root, '.toon', '.archive')
  if (!existsSync(archiveRoot)) return null
  
  try {
    const { readdirSync } = require('fs')
    const dirs = readdirSync(archiveRoot, { withFileTypes: true })
      .filter((d: any) => d.isDirectory())
      .map((d: any) => d.name)
      .sort()
      .reverse() // newest first
    
    for (const dir of dirs) {
      const candidate = join(archiveRoot, dir, relativePath)
      if (existsSync(candidate)) return candidate
    }
  } catch { /* no archive */ }
  
  return null
}

function getOriginalSize(relativePath: string, root: string): number {
  const fullPath = join(root, relativePath)
  if (!existsSync(fullPath)) {
    // Try archive
    const archivePath = getLatestArchive(relativePath, root)
    if (archivePath) {
      try {
        const { statSync } = require('fs')
        return statSync(archivePath).size
      } catch { return 0 }
    }
    return 0
  }
  try {
    const { statSync } = require('fs')
    return statSync(fullPath).size
  } catch {
    return 0
  }
}

// ─── Clear Cache ──────────────────────────────────────────────────────────────

export function clearResolveCache(): void {
  resolveCache.clear()
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function resolverStats(): {
  cacheSize: number
  savings: { totalOriginal: number; totalCompressed: number; percent: number }
} {
  let totalOriginal = 0
  let totalCompressed = 0
  
  for (const [, result] of resolveCache) {
    totalOriginal += result.originalSize
    totalCompressed += result.compressedSize
  }
  
  return {
    cacheSize: resolveCache.size,
    savings: {
      totalOriginal,
      totalCompressed,
      percent: totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0,
    },
  }
}
