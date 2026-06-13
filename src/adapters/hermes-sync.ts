// src/adapters/hermes-sync.ts — Hermes memory sync module
//
// Reads/writes ~/.hermes/memories/ files for bidirectional
// context synchronization between ToonGine and Hermes Agent.
//
//   syncWithHermes()     → read USER.md + MEMORY.md, return synced context
//   pushToHermes(...)    → write memories back to Hermes
//
// Dependencies: Node.js fs module only.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getConfig } from './config'

// ─── Path resolution ──────────────────────────────────────────────────────────

function getHermesPaths() {
  const dir = getConfig().hermesMemoryDir
  return {
    dir,
    userFile: join(dir, 'USER.md'),
    memoryFile: join(dir, 'MEMORY.md'),
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HermesSyncContext {
  /** Raw content of USER.md (user identity, preferences, bio) */
  userProfile: string
  /** Raw content of MEMORY.md (persistent agent memory) */
  agentMemory: string
  /** Whether the sync was successful */
  success: boolean
  /** Paths read */
  filesRead: string[]
  /** Any errors encountered */
  errors: string[]
  /** Combined token-efficient context string for injection */
  contextString: string
}

export interface HermesPushResult {
  success: boolean
  memoriesWritten: number
  bytesWritten: number
  errors: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeRead(path: string): { content: string; error: string | null } {
  try {
    if (!existsSync(path)) {
      return { content: '', error: `File not found: ${path}` }
    }
    const content = readFileSync(path, 'utf-8')
    return { content, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { content: '', error: `Read error: ${msg}` }
  }
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Synchronize context from Hermes memory files.
 *
 * Reads USER.md (user identity/preferences) and MEMORY.md (persistent
 * agent memory) from ~/.hermes/memories/. Returns a structured context
 * object suitable for injecting into agent system prompts.
 *
 * The `contextString` field is pre-formatted for LLM injection with
 * minimal token overhead.
 */
export function syncWithHermes(): HermesSyncContext {
  const errors: string[] = []
  const filesRead: string[] = []

  const { userFile, memoryFile } = getHermesPaths()

  const userResult = safeRead(userFile)
  if (userResult.error) {
    errors.push(`USER.md: ${userResult.error}`)
  } else if (userResult.content) {
    filesRead.push(userFile)
  }

  const memoryResult = safeRead(memoryFile)
  if (memoryResult.error) {
    errors.push(`MEMORY.md: ${memoryResult.error}`)
  } else if (memoryResult.content) {
    filesRead.push(memoryFile)
  }

  const userProfile = userResult.content
  const agentMemory = memoryResult.content
  const success = errors.length === 0 || filesRead.length > 0

  // Build a compact context string for LLM injection
  const contextParts: string[] = []

  if (userProfile) {
    const truncated = userProfile.length > 2000
      ? userProfile.slice(0, 2000) + '\n... (truncated)'
      : userProfile
    contextParts.push(`--- USER PROFILE ---\n${truncated}`)
  }

  if (agentMemory) {
    const truncated = agentMemory.length > 3000
      ? agentMemory.slice(0, 3000) + '\n... (truncated)'
      : agentMemory
    contextParts.push(`--- AGENT MEMORY ---\n${truncated}`)
  }

  return {
    userProfile,
    agentMemory,
    success,
    filesRead,
    errors,
    contextString: contextParts.join('\n\n'),
  }
}

/**
 * Push memories back to the Hermes memory system.
 *
 * Each string in `memories` is appended to MEMORY.md as a dated entry.
 * Creates the ~/.hermes/memories/ directory if it doesn't exist.
 *
 * Returns a result with count of memories written and total bytes.
 */
export function pushToHermes(memories: string[]): HermesPushResult {
  const errors: string[] = []

  const { dir, memoryFile, userFile } = getHermesPaths()

  // Ensure the memories directory exists
  try {
    ensureDir(dir)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      memoriesWritten: 0,
      bytesWritten: 0,
      errors: [`Failed to create directory: ${msg}`],
    }
  }

  // Build entry lines with timestamps
  const now = new Date().toISOString()
  const entries = memories.map((m, i) =>
    `[${now}#${i + 1}] ${m.trim()}`
  )
  const block = '\n' + entries.join('\n') + '\n'
  const bytes = Buffer.byteLength(block, 'utf-8')

  // Append to MEMORY.md
  try {
    const existing = existsSync(memoryFile)
      ? readFileSync(memoryFile, 'utf-8')
      : '# Hermes Agent Memory\n\nPersistent memories synced from ToonGine.\n'

    writeFileSync(memoryFile, existing + block, 'utf-8')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      memoriesWritten: 0,
      bytesWritten: 0,
      errors: [`Write error: ${msg}`],
    }
  }

  // Also touch USER.md if it doesn't exist (template)
  if (!existsSync(userFile)) {
    try {
      writeFileSync(userFile, '# User Profile\n\nNo profile configured yet.\n', 'utf-8')
    } catch {
      // Non-critical; USER.md template creation can fail silently
    }
  }

  return {
    success: true,
    memoriesWritten: memories.length,
    bytesWritten: bytes,
    errors,
  }
}

/**
 * Clear all Hermes memory (resets MEMORY.md).
 * USE WITH CAUTION — this is irreversible.
 */
export function clearHermesMemory(): { success: boolean; error: string | null } {
  try {
    const { dir, memoryFile } = getHermesPaths()
    ensureDir(dir)
    writeFileSync(memoryFile, '# Hermes Agent Memory\n\nCleared and reset.\n', 'utf-8')
    return { success: true, error: null }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
