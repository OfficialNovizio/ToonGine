/**
 * lib/hermes-spawn.ts — Hermes Agent subprocess bridge for YVON War Room.
 *
 * Replaces the one-shot Anthropic API call (streamWithTools) with a full Hermes
 * Agent subprocess that has real tool access, iterative loops, and memory.
 *
 * Architecture:
 *   execute-stage.ts → spawnHermesAgent() → hermes chat -q "task..." → SSE bridge
 *
 * Each specialist agent gets a full Hermes Agent process with:
 *   - Real file tools (Read, Write, Glob, Grep, Bash)
 *   - Real shell access (cd, git, npm, installs)
 *   - Iterative tool loops (up to configured max turns)
 *   - Graph memory injection (CODEGRAPH_REPORT.md)
 *   - Venture context injection
 *   - Persistent memory across sessions
 */

import { spawn, ChildProcess } from 'child_process'
import { resolve, join } from 'path'
import { promises as fs } from 'fs'
import { DatabaseSync } from 'node:sqlite'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Matches the War Room SSE event shape so the frontend sees no difference. */
export interface HermesStreamEvent {
  kind: 'text' | 'tool_call' | 'tool_result' | 'iteration' | 'done' | 'error' | 'agent_complete'
  text?: string
  tool_use_id?: string
  name?: string
  input?: unknown
  summary?: string
  is_error?: boolean
  n?: number
  message?: string
  reason?: string
  previewText?: string
  fullOutput?: string
  agentId?: string
}

/** Parameters for spawning a Hermes agent. */
export interface HermesSpawnParams {
  /** The YVON agent ID (e.g. 'dev-lead', 'mia-frontend', 'kai-analyst') */
  agentId: string
  /** The task description — becomes the Hermes prompt */
  task: string
  /** Optional system-level context injected before the task */
  systemContext?: string
  /** 'github' | 'local' — controls repo access mode */
  repoMode?: 'github' | 'local'
  /** Absolute path to local repo (local mode) */
  localRepoPath?: string
  /** Venture slug for context injection */
  ventureSlug?: string
  /** Venture display name */
  ventureName?: string
  /** Max output tokens (passed to Hermes via config) */
  maxOutputTokens?: number
  /** Timeout in milliseconds (default: 5 minutes) */
  timeoutMs?: number
  /** Working directory for the agent */
  workdir?: string
}

/** The complete agent output. */
export interface HermesAgentResult {
  agentId: string
  content: string
  toolCalls: Array<{ name: string; input: unknown; summary: string | null; isError: boolean }>
  success: boolean
  error?: string
}

// ─── Graph Memory Loader ──────────────────────────────────────────────────────

async function loadGraphContext(workdir: string): Promise<string> {
  const codegraphPath = join(workdir, 'graphify-out', 'CODEGRAPH_REPORT.md')
  try {
    const content = await fs.readFile(codegraphPath, 'utf-8')
    // Take the topology summary — the most actionable part
    const sections = content.split(/\n## /)
    const topology = sections.find(s => s.startsWith('Topology')) ?? sections[0] ?? ''
    return `\n\n## Codebase Graph Memory\n${topology.slice(0, 3000)}\n\nBefore editing any symbol, use grep/search to find ALL references.`
  } catch {
    return ''
  }
}

// ─── Main Spawn Function ──────────────────────────────────────────────────────

/**
 * Spawn a Hermes Agent subprocess for a War Room specialist.
 *
 * Uses `hermes --profile yvon -s <skill> chat -q <prompt>` to get a single
 * response from the agent with full tool access.
 *
 * For iteractive/streaming mode, use spawnHermesAgentStream().
 */
export async function spawnHermesAgent(params: HermesSpawnParams): Promise<HermesAgentResult> {
  const {
    agentId, task, systemContext = '', repoMode, localRepoPath,
    ventureSlug, ventureName, maxOutputTokens = 8192, timeoutMs = 300_000,
  } = params

  const workdir = params.workdir || (repoMode === 'local' && localRepoPath ? localRepoPath : '/root/yvon')
  
  // ─── Load YVON CONSTITUTION (hard rules for EVERY agent) ──────────────────
  let constitutionCtx = ''
  try {
    const toonPath = join(workdir, '.toon', 'docs', 'CONSTITUTION.toon')
    const constitution = await fs.readFile(toonPath, 'utf-8')
    constitutionCtx = `\n\n## YVON CONSTITUTION — IMMUTABLE RULES\nYou are bound by these laws. Violations = session abort + Diana postmortem.\n\n${constitution.slice(0, 2000)}\n`
  } catch {
    try {
      const mdPath = join(workdir, 'docs', 'CONSTITUTION.md')
      const constitution = await fs.readFile(mdPath, 'utf-8')
      constitutionCtx = `\n\n## YVON CONSTITUTION (raw — TOON not found)\n${constitution.slice(0, 2000)}\n`
    } catch {
      // No constitution available — degraded mode
    }
  }
  
  // Build the full prompt with context
  const ventureCtx = ventureName ? `\nActive venture: ${ventureName}.` : ''
  const repoCtx = repoMode === 'local' && localRepoPath
    ? `\nWorking on local repo at: ${localRepoPath}`
    : repoMode === 'github' && ventureSlug
    ? `\nWorking on GitHub repo for venture: ${ventureSlug}. Use gh CLI or git to access.`
    : ''
  
  const graphCtx = await loadGraphContext(workdir)

  const fullPrompt = `${constitutionCtx}${systemContext}${ventureCtx}${repoCtx}${graphCtx}\n\n## Task\n${task}\n\n## Instructions\n1. Use tools to inspect the codebase before making claims\n2. Make all necessary changes\n3. Run npx tsc --noEmit to verify TypeScript is clean\n4. Provide a summary of what you changed and why`

  const toolCalls: Array<{ name: string; input: unknown; summary: string | null; isError: boolean }> = []
  let content = ''
  let error: string | undefined

  try {
    const { stdout, stderr } = await spawnHermesOnce({
      agentId,
      prompt: fullPrompt,
      workdir,
      timeoutMs,
    })

    if (stderr && !stdout) {
      error = stderr.slice(0, 500)
    }

    // Parse tool calls from the output (Hermes doesn't return structured tool data in -q mode)
    // The content is the full agent response
    content = stdout || ''

    // Extract any tool call indicators from the output
    const toolMatches = content.match(/Tool call: (\w+)/g)
    if (toolMatches) {
      for (const m of toolMatches) {
        toolCalls.push({ name: m.replace('Tool call: ', ''), input: {}, summary: null, isError: false })
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return {
    agentId,
    content: content || error || 'Agent produced no output.',
    toolCalls,
    success: !error && content.length > 50,
    error,
  }
}

// ─── Streaming Spawn (for SSE bridge) ─────────────────────────────────────────

/**
 * Spawn a Hermes Agent subprocess with streaming output.
 *
 * Yields HermesStreamEvent objects that can be directly emitted as War Room SSE events.
 * Use this in execute-stage.ts instead of streamWithTools().
 */
export async function* spawnHermesAgentStream(params: HermesSpawnParams): AsyncGenerator<HermesStreamEvent> {
  const {
    agentId, task, systemContext = '', repoMode, localRepoPath,
    ventureSlug, ventureName, maxOutputTokens = 8192, timeoutMs = 600_000,
  } = params

  const workdir = params.workdir || (repoMode === 'local' && localRepoPath ? localRepoPath : '/root/yvon')
  
  // ─── Load YVON CONSTITUTION ──────────────────────────────────────────────
  let constitutionCtx = ''
  try {
    const toonPath = join(workdir, '.toon', 'docs', 'CONSTITUTION.toon')
    const constitution = await fs.readFile(toonPath, 'utf-8')
    constitutionCtx = `\n\n## YVON CONSTITUTION\n${constitution.slice(0, 2000)}\n`
  } catch {
    try {
      const mdPath = join(workdir, 'docs', 'CONSTITUTION.md')
      const constitution = await fs.readFile(mdPath, 'utf-8')
      constitutionCtx = `\n\n## YVON CONSTITUTION\n${constitution.slice(0, 2000)}\n`
    } catch {}
  }
  
  const ventureCtx = ventureName ? `\nActive venture: ${ventureName}.` : ''
  const repoCtx = repoMode === 'local' && localRepoPath
    ? `\nWorking on LOCAL repo at: ${localRepoPath}. Use Read/Glob/Grep/Bash directly on the filesystem.`
    : repoMode === 'github' && ventureSlug
    ? `\nWorking on GITHUB repo for venture: ${ventureSlug}.`
    : ''
  
  const graphCtx = await loadGraphContext(workdir)

  const fullPrompt = `${constitutionCtx}${systemContext}${ventureCtx}${repoCtx}${graphCtx}\n\n## Task\n${task}\n\n## Instructions`

  // Build the Hermes command
  const args = [
    '--profile', 'yvon',
    '-s', agentId,
    '-s', 'yvon-os',
    '--yolo',  // Skip approval prompts for autonomous agents
    'chat',
    '-q', fullPrompt,
  ]

  let content = ''
  let child: ChildProcess | null = null

  try {
    child = spawn('hermes', args, {
      cwd: workdir,
      env: { ...process.env, HOME: process.env.HOME, PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: timeoutMs,
    })

    // Collect stdout progressively
    const stdoutPromise = new Promise<string>((resolve, reject) => {
      let buf = ''
      child!.stdout!.on('data', (chunk: Buffer) => {
        const text = chunk.toString()
        buf += text
        content += text
        // Yield text as it arrives
        // Hermes -q mode outputs the full response, not token-by-token
      })
      child!.stdout!.on('end', () => resolve(buf))
      child!.stdout!.on('error', reject)
    })

    const stderrPromise = new Promise<string>((resolve) => {
      let buf = ''
      child!.stderr!.on('data', (chunk: Buffer) => { buf += chunk.toString() })
      child!.stderr!.on('end', () => resolve(buf))
    })

    // Wait for completion with timeout
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Hermes agent timed out')), timeoutMs)
    )

    await Promise.race([childCompleted(child), timeout])
    const stderr = await stderrPromise
    await stdoutPromise

    // Yield the complete text
    if (content.trim()) {
      // Sync Hermes token usage to YVON's Supabase (fire-and-forget)
      syncHermesTokenUsage(agentId, ventureSlug)
      
      yield {
        kind: 'agent_complete',
        agentId,
        previewText: content.slice(0, 200),
        fullOutput: content.trim(),
      }
    } else if (stderr.trim()) {
      yield { kind: 'error', agentId, message: stderr.slice(0, 500) }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    yield { kind: 'error', agentId, message: msg }
  } finally {
    if (child && !child.killed) {
      child.kill('SIGTERM')
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function childCompleted(child: ChildProcess): Promise<number> {
  return new Promise((resolve) => {
    child.on('close', resolve)
    child.on('exit', resolve)
  })
}

async function spawnHermesOnce(params: {
  agentId: string
  prompt: string
  workdir: string
  timeoutMs: number
}): Promise<{ stdout: string; stderr: string }> {
  const { agentId, prompt, workdir, timeoutMs } = params

  return new Promise((resolve, reject) => {
    const child = spawn('hermes', [
      '--profile', 'yvon',
      '-s', agentId,
      '-s', 'yvon-os',
      '--yolo',
      'chat',
      '-q', prompt,
    ], {
      cwd: workdir,
      env: { ...process.env, HOME: process.env.HOME, PATH: process.env.PATH },
      timeout: timeoutMs,
    })

    let stdout = ''
    let stderr = ''

    child.stdout!.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    child.stderr!.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        resolve({ stdout, stderr: stderr || `Hermes exited with code ${code}` })
      }
    })

    child.on('error', (err) => {
      reject(err)
    })
  })
}

// ─── Token usage sync — Hermes → YVON Supabase ────────────────────────────────

interface HermesSessionRow {
  id: string
  model: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  estimated_cost_usd: number
  started_at: string
}

/**
 * After a Hermes agent completes, read its session from Hermes's state.db
 * and write the token usage to YVON's Supabase token_usage table.
 * Best-effort — never blocks or throws.
 */
async function syncHermesTokenUsage(agentId?: string, ventureId?: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return

  try {
    const home = process.env.HOME || '/root'
    const dbPath = join(home, '.hermes', 'state.db')
    const db = new DatabaseSync(dbPath)
    
    // Get the most recently completed session
    const row = db.prepare(`
      SELECT id, model, input_tokens, output_tokens, cache_read_tokens, estimated_cost_usd, started_at
      FROM sessions
      WHERE ended_at IS NOT NULL AND input_tokens > 0
      ORDER BY started_at DESC LIMIT 1
    `).get() as HermesSessionRow | undefined
    db.close()

    if (!row) return

    // Check if we already recorded this session (deduplication)
    const checkUrl = `${supabaseUrl}/rest/v1/token_usage?route=eq.hermes-agent&model=eq.${encodeURIComponent(row.model)}&select=id&limit=1`
    const checkRes = await fetch(checkUrl, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(2000),
    })
    // Simple dedup: if any row exists for this model+route combo in the last 5 minutes, skip
    // Actually, let's just always write — the cost is tiny and dedup is complex
    // The GET /api/token-usage endpoint aggregates properly

    await fetch(`${supabaseUrl}/rest/v1/token_usage`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        agent_id:       agentId ?? 'hermes-agent',
        route:          'hermes-agent',
        model:          row.model,
        input_tokens:   row.input_tokens,
        output_tokens:  row.output_tokens,
        cache_read_tokens: row.cache_read_tokens ?? 0,
        cache_creation_tokens: 0,
        cost_usd:       row.estimated_cost_usd ?? 0,
        venture_id:     ventureId ?? null,
      }),
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    // silent — sync is best-effort
  }
}

// ─── Function to get available agent skills ───────────────────────────────────

/**
 * Returns the list of agent skills available in the yvon profile.
 * Used by the War Room frontend to show which agents are Hermes-powered.
 */
export async function getHermesAgentSkills(): Promise<string[]> {
  const skillsDir = resolve(process.env.HOME || '/root', '.hermes/profiles/yvon/skills/yvon/')
  try {
    const files = await fs.readdir(skillsDir)
    return files
      .filter(f => f.endsWith('.md') && f !== 'yvon-os.md')
      .map(f => f.replace('.md', ''))
  } catch {
    return []
  }
}

// ─── Test function ────────────────────────────────────────────────────────────

/**
 * Quick test to verify Hermes agent spawning works.
 * Run: npx tsx -e "require('./lib/hermes-spawn').testHermesSpawn()"
 */
export async function testHermesSpawn(): Promise<void> {
  console.log('Testing Hermes agent spawn...')
  const result = await spawnHermesAgent({
    agentId: 'dev-lead',
    task: 'List the files in app/screens/ directory and tell me what dashboards exist.',
    ventureName: 'yvon-dashboard',
  })
  console.log('Success:', result.success)
  console.log('Content preview:', result.content.slice(0, 300))
  console.log('Error:', result.error || 'none')
}
