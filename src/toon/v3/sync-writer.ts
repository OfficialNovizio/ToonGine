// src/toon/v3/sync-writer.ts — Write-Back Interceptor
//
// When any LLM (Claude, Hermes, etc.) creates or modifies a file, this
// interceptor ensures writes flow to ALL three locations simultaneously:
//
//   1. Originals (human-readable .md for the user)
//   2. .toon/ (compressed .toon for the LLM)
//   3. engine.bin (reindexed chunk for query matching)
//
// Usage:
//   import { writeFile } from 'toongine/toon/v3/sync-writer'
//   writeFile('agent-department/CEO/marcus/MEMORY.md', newContent)
//   writeFile('docs/novizio/CONTEXT.md', newContent, 'both')

import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { join, dirname, extname } from 'path'
import { strip } from '../v2/stripper'
import { compile } from './compile'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WriteTarget = 'originals' | 'toon' | 'both'

export interface WriteResult {
  written: {
    original: string | null
    toon: string | null
  }
  reindexed: boolean
  error?: string
}

// ─── Path Detection ───────────────────────────────────────────────────────────

const TOONABLE_PREFIXES = [
  'agent-department/',
  'agent-memory/',
  'docs/',
  '.toon/graphify/',
  '.toon/codegraph/',
  'CLAUDE.md',
]

function isToonable(path: string): boolean {
  return TOONABLE_PREFIXES.some(p => path.startsWith(p))
}

function toToonFilename(originalPath: string): string {
  return originalPath.replace(/\.md$/, '.toon').replace(/\.json$/, '.json')
}

// ─── Main Writer ──────────────────────────────────────────────────────────────

export function writeFile(
  relativePath: string,
  content: string,
  target: WriteTarget = 'both',
  projectRoot: string = process.cwd()
): WriteResult {
  const result: WriteResult = {
    written: { original: null, toon: null },
    reindexed: false,
  }

  const fullPath = join(projectRoot, relativePath)

  try {
    // ── Write to originals ─────────────────────────────────────────────────
    if (target === 'originals' || target === 'both') {
      mkdirSync(dirname(fullPath), { recursive: true })
      writeFileSync(fullPath, content, 'utf-8')
      result.written.original = relativePath
    }

    // ── Write to .toon/ (compressed) ───────────────────────────────────────
    if ((target === 'toon' || target === 'both') && isToonable(relativePath)) {
      const toonPath = getToonPath(relativePath, projectRoot)
      if (toonPath) {
        const compressed = compressForToon(content, relativePath)
        mkdirSync(dirname(toonPath), { recursive: true })
        writeFileSync(toonPath, compressed, 'utf-8')
        result.written.toon = toonPath.replace(projectRoot + '/', '')
      }

      // ── Attempt reindex of engine.bin ────────────────────────────────────
      try {
        const engineBin = join(projectRoot, '.toon', 'v3', 'engine.bin')
        if (existsSync(engineBin)) {
          compile({ projectRoot, maxMergeIterations: 256 })
          result.reindexed = true
        }
      } catch { /* reindex is best-effort */ }
    }
  } catch (e: any) {
    result.error = e.message
  }

  return result
}

// ─── Delete Handler ───────────────────────────────────────────────────────────

export function deleteFile(
  relativePath: string,
  projectRoot: string = process.cwd()
): WriteResult {
  const result: WriteResult = {
    written: { original: null, toon: null },
    reindexed: false,
  }

  const fullPath = join(projectRoot, relativePath)
  const toonPath = getToonPath(relativePath, projectRoot)

  try {
    // Remove from originals
    if (existsSync(fullPath)) {
      unlinkSync(fullPath)
      result.written.original = `${relativePath} (deleted)`
    }

    // Remove from .toon/
    if (toonPath && existsSync(toonPath)) {
      unlinkSync(toonPath)
      result.written.toon = `${toonPath.replace(projectRoot + '/', '')} (deleted)`
    }

    // Reindex
    try {
      const engineBin = join(projectRoot, '.toon', 'v3', 'engine.bin')
      if (existsSync(engineBin)) {
        compile({ projectRoot, maxMergeIterations: 256 })
        result.reindexed = true
      }
    } catch { /* best-effort */ }
  } catch (e: any) {
    result.error = e.message
  }

  return result
}

// ─── Bulk Write ───────────────────────────────────────────────────────────────

export function writeMany(
  files: { path: string; content: string }[],
  target: WriteTarget = 'both',
  projectRoot?: string
): WriteResult[] {
  return files.map(f => writeFile(f.path, f.content, target, projectRoot))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToonPath(relativePath: string, root: string): string | null {
  if (relativePath.startsWith('agent-department/')) {
    return join(root, '.toon', 'agents', toToonFilename(relativePath))
  }
  if (relativePath.startsWith('agent-memory/')) {
    return join(root, '.toon', 'memory', toToonFilename(relativePath))
  }
  if (relativePath.startsWith('docs/')) {
    return join(root, '.toon', 'docs', toToonFilename(relativePath))
  }
  if (relativePath.startsWith('.toon/graphs/')) {
    return join(root, '.toon', 'graphs', toToonFilename(relativePath))
  }
  if (relativePath === 'CLAUDE.md') {
    return join(root, '.toon', 'project', 'CLAUDE.md')
  }

  // Generic: try .toon/ mirror
  return join(root, '.toon', toToonFilename(relativePath))
}

function compressForToon(content: string, path: string): string {
  const stripped = strip(content)
  const ext = extname(path)
  const header = `#TOON src=${path} compressed=${new Date().toISOString()} savings=${stripped.savingsPercent}%\n`

  if (ext === '.json') {
    // JSON: keep as-is but wrap with TOON header
    return header + content
  }

  // Markdown: use stripped version (30-60% smaller)
  const best = stripped.output.length < content.length ? stripped.output : content
  return header + best.slice(0, 50000)
}
