// src/toon/v4/watcher.ts
// File watcher — auto-rebuilds unified graph on project changes.
// Uses fs.watch with debounce + lock to prevent infinite loops.

import { watch, existsSync, statSync } from 'fs'
import { join } from 'path'
import { createUnifiedGraph } from './unified-graph'
import { ingestAll } from './ingesters/index'

export interface WatcherStatus {
  tool: string
  running: boolean
  pid: number | null
  lastRebuild: string | null
  errors: number
}

let _watchers: Map<string, { watcher: any; status: WatcherStatus; timer: NodeJS.Timeout | null }> = new Map()
let _isBuilding = false

export function startWatcher(projectRoot: string): WatcherStatus[] {
  const statuses: WatcherStatus[] = []

  // Watch source files only
  const watchDir = projectRoot
  if (!existsSync(watchDir)) {
    statuses.push({ tool: 'file-watcher', running: false, pid: null, lastRebuild: null, errors: 1 })
    return statuses
  }

  // Debounce: rebuild after 2 seconds of no changes
  const DEBOUNCE_MS = 2000
  const status: WatcherStatus = {
    tool: 'file-watcher',
    running: true,
    pid: process.pid,
    lastRebuild: null,
    errors: 0,
  }

  try {
    const watcher = watch(watchDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return

      // Only rebuild on source file changes
      if (!/\.(ts|tsx|js|jsx|py|md|css|json|yml|yaml)$/.test(filename)) return
      // Skip generated/build directories
      if (filename.includes('node_modules') || filename.includes('.next') ||
          filename.includes('dist') || filename.includes('.toon') ||
          filename.includes('graphify-out') || filename.includes('.code-review-graph') ||
          filename.includes('.codegraph')) return
      // Rate limit
      if (filename.includes('.lock')) return

      const existing = _watchers.get('file-watcher')
      if (existing?.timer) clearTimeout(existing.timer)

      const timer = setTimeout(() => {
        rebuildGraph(projectRoot, status)
      }, DEBOUNCE_MS)

      if (existing) {
        existing.timer = timer
      }
    })

    _watchers.set('file-watcher', { watcher, status, timer: null })
    statuses.push(status)
  } catch (err: any) {
    status.running = false
    status.errors++
    statuses.push(status)
  }

  return statuses
}

function rebuildGraph(projectRoot: string, status: WatcherStatus): void {
  if (_isBuilding) return // prevent concurrent builds

  _isBuilding = true
  try {
    const unified = createUnifiedGraph(projectRoot)
    ingestAll(unified, projectRoot)
    unified.close()
    status.lastRebuild = new Date().toISOString()
    status.errors = 0
  } catch (err) {
    status.errors++
  } finally {
    _isBuilding = false
  }
}

export function stopAllWatchers(): void {
  for (const [name, entry] of _watchers) {
    entry.watcher.close()
    if (entry.timer) clearTimeout(entry.timer)
    entry.status.running = false
  }
  _watchers.clear()
}

export function getWatcherStatus(): WatcherStatus[] {
  return Array.from(_watchers.values()).map(e => e.status)
}
