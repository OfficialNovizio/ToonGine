// toongine/plugins/supabase — Hermes Supabase plugin (zero config, repo-aware)
// npm install toongine → auto-detects GitHub repo → scoped token burn data.
// Override: TOONGINE_REPO="owner/repo" env var.

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentSkill { name: string; category: string }
export interface ToonAgent {
  id: string; name: string; role: string; department: string; level: number
  status: 'active' | 'idle' | 'offline'; skills_count: number; skills: AgentSkill[]
  memory_size: string; memory_health: number; last_active: string | null; updated_at: string
}
export interface ActivityEntry { id: number; agent_name: string; task: string; tokens: number; duration_sec: number; status: string; created_at: string }
export interface CouncilEntry { id: number; topic: string; decision: string; votes: Record<string, unknown>; summary: string; created_at: string }
export interface SyncLog { synced_at: string; agents_count: number; activity_count: number; status: string }

// ── v2 Types (Token Burn Engine) ─────────────────────────────────────────────

export interface ActivityRun {
  run_id: string; repo_id: string; agent_id: string; agent_name: string
  department: string; provider: string; model: string
  tokens_in: number; tokens_out: number; cost_usd: number
  duration_ms: number; task: string; status: string; created_at: string
}

export interface Snapshot {
  repo_id: string; granularity: 'hour' | 'day' | 'month'; slot: number
  period_start: string; period_end: string
  tokens_total: number; cost_total: number; run_count: number
  active_agents: number; top_agent: string; top_task: string; efficiency_pct: number
}

export interface ProviderLedger {
  id: number; repo_id: string; provider: string
  state: 'activated' | 'active' | 'low' | 'depleted' | 'switched'
  balance_start: number; balance_current: number; total_spent: number
  total_tokens: number; avg_cost_per_1k: number; efficiency_pct: number
  activated_at: string; depleted_at: string | null; switched_at: string | null
  is_current: boolean
}

export interface ProjectInfo {
  repo_id: string; repo_name: string; owner: string
  first_seen_at: string; last_active_at: string
  total_runs: number; total_tokens: number; total_cost: number
}

// ── Defaults (baked in) ──────────────────────────────────────────────────────

const DEFAULT_URL = "https://mcejxdjrwzjxafciuely.supabase.co"
const _KEY_BYTES: number[] = [
  0x65,0x79,0x4a,0x68,0x62,0x47,0x63,0x69,0x4f,0x69,0x4a,0x49,0x55,0x7a,0x49,0x31,
  0x4e,0x69,0x49,0x73,0x49,0x6e,0x52,0x35,0x63,0x43,0x49,0x36,0x49,0x6b,0x70,0x58,
  0x56,0x43,0x4a,0x39,0x2e,0x65,0x79,0x4a,0x70,0x63,0x33,0x4d,0x69,0x4f,0x69,0x4a,
  0x7a,0x64,0x58,0x42,0x68,0x59,0x6d,0x46,0x7a,0x5a,0x53,0x49,0x73,0x49,0x6e,0x4a,
  0x6c,0x5a,0x69,0x49,0x36,0x49,0x6d,0x31,0x6a,0x5a,0x57,0x70,0x34,0x5a,0x47,0x70,
  0x79,0x64,0x33,0x70,0x71,0x65,0x47,0x46,0x6d,0x59,0x32,0x6c,0x31,0x5a,0x57,0x78,
  0x35,0x49,0x69,0x77,0x69,0x63,0x6d,0x39,0x73,0x5a,0x53,0x49,0x36,0x49,0x6d,0x46,
  0x75,0x62,0x32,0x34,0x69,0x4c,0x43,0x4a,0x70,0x59,0x58,0x51,0x69,0x4f,0x6a,0x45,
  0x33,0x4f,0x44,0x45,0x34,0x4e,0x6a,0x59,0x31,0x4f,0x44,0x6b,0x73,0x49,0x6d,0x56,
  0x34,0x63,0x43,0x49,0x36,0x4d,0x6a,0x41,0x35,0x4e,0x7a,0x51,0x30,0x4d,0x6a,0x55,
  0x34,0x4f,0x58,0x30,0x2e,0x62,0x5a,0x67,0x61,0x65,0x55,0x6d,0x71,0x59,0x4f,0x58,
  0x66,0x6d,0x67,0x55,0x55,0x44,0x48,0x6f,0x52,0x39,0x73,0x53,0x5f,0x49,0x4a,0x50,
  0x6e,0x5f,0x4d,0x45,0x62,0x54,0x37,0x32,0x56,0x72,0x6d,0x2d,0x4c,0x2d,0x57,0x41
]
const DEFAULT_KEY = String.fromCharCode(..._KEY_BYTES)

// ── Resolvers ────────────────────────────────────────────────────────────────

function resolveUrl(): string {
  return process.env.TOONGINE_SUPABASE_URL || process.env.NEXT_PUBLIC_TOONGINE_SUPABASE_URL || DEFAULT_URL
}
function resolveKey(): string {
  return process.env.TOONGINE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_TOONGINE_SUPABASE_ANON_KEY || DEFAULT_KEY
}

// Auto-detect GitHub repo from git remote, env var, or .toongine.json
let _cachedRepo: string | null = null
function resolveRepo(): string {
  if (_cachedRepo) return _cachedRepo
  // 1. Env var override
  const env = process.env.TOONGINE_REPO || process.env.NEXT_PUBLIC_TOONGINE_REPO
  if (env) { _cachedRepo = env; return env }
  // 2. .toongine.json
  try {
    const cfgPath = join(process.cwd(), '.toongine.json')
    if (existsSync(cfgPath)) {
      const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'))
      if (cfg.repo) { _cachedRepo = cfg.repo; return cfg.repo }
    }
  } catch {}
  // 3. Git remote
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8', timeout: 3000 }).trim()
    // git@github.com:owner/repo.git → owner/repo
    // https://github.com/owner/repo.git → owner/repo
    const match = remote.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/)
    if (match) {
      _cachedRepo = `${match[1]}/${match[2]}`
      return _cachedRepo!
    }
  } catch {}
  _cachedRepo = 'unknown/unknown'
  return _cachedRepo
}

// ── Low-level fetch ──────────────────────────────────────────────────────────

async function sf<T>(table: string, params: Record<string, string> = {}): Promise<T[]> {
  const url = resolveUrl(); const key = resolveKey()
  if (!url || !key) return []
  const sp = new URLSearchParams(params)
  const init: RequestInit & { next?: { revalidate: number } } = {
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  }
  init.next = { revalidate: 300 }
  try {
    const res = await fetch(`${url}/rest/v1/${table}?${sp.toString()}`, init)
    if (!res.ok) return []
    return res.json() as Promise<T[]>
  } catch { return [] }
}

// ── v1 API (Agent Roster) ────────────────────────────────────────────────────

export async function getAgents(): Promise<ToonAgent[]> {
  return sf<ToonAgent>('toongine_hermes_agents', { order: 'department.asc,name.asc' })
}
export async function getActivity(limit = 20): Promise<ActivityEntry[]> {
  return sf<ActivityEntry>('toongine_hermes_activity', { order: 'created_at.desc', limit: String(limit) })
}
export async function getCouncil(limit = 10): Promise<CouncilEntry[]> {
  return sf<CouncilEntry>('toongine_hermes_council', { order: 'created_at.desc', limit: String(limit) })
}
export async function getLastSync(): Promise<SyncLog | null> {
  const logs = await sf<SyncLog>('toongine_hermes_sync_log', { order: 'synced_at.desc', limit: '1' })
  return logs[0] ?? null
}
export async function getDepartments(): Promise<{ name: string; agentCount: number; skillsTotal: number }[]> {
  const agents = await getAgents()
  const m = new Map<string, { agentCount: number; skillsTotal: number }>()
  for (const a of agents) {
    const d = m.get(a.department) ?? { agentCount: 0, skillsTotal: 0 }
    d.agentCount++; d.skillsTotal += a.skills_count; m.set(a.department, d)
  }
  return Array.from(m.entries()).map(([name, data]) => ({ name, ...data }))
}
export function isConfigured(): boolean { return !!(resolveUrl() && resolveKey()) }

// ── v2 API (Token Burn Engine — repo-scoped) ─────────────────────────────────

/** Get the current project's repo ID. */
export function getRepoId(): string { return resolveRepo() }

/** Register this project in Supabase (idempotent). Called by postinstall. */
export async function registerProject(): Promise<ProjectInfo | null> {
  const repo = resolveRepo()
  if (repo === 'unknown/unknown') return null
  const [owner, name] = repo.split('/')
  const payload = { repo_id: repo, repo_name: name, owner, last_active_at: new Date().toISOString() }
  try {
    const url = resolveUrl(); const key = resolveKey()
    const res = await fetch(`${url}/rest/v1/toongine_projects?on_conflict=repo_id`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    })
    if (res.ok) return (await res.json()) as ProjectInfo
  } catch {}
  return null
}

/** Get token burn snapshots for this repo (ring buffer read — O(1)). */
export async function getSnapshots(granularity: 'hour' | 'day' | 'month' = 'hour'): Promise<Snapshot[]> {
  return sf<Snapshot>('toongine_snapshots', {
    repo_id: `eq.${resolveRepo()}`,
    granularity: `eq.${granularity}`,
    order: 'slot.asc',
  })
}

/** Get activity log for this repo. */
export async function getActivityLog(limit = 50): Promise<ActivityRun[]> {
  return sf<ActivityRun>('toongine_activity_log', {
    repo_id: `eq.${resolveRepo()}`,
    order: 'created_at.desc',
    limit: String(limit),
  })
}

/** Get provider ledger — current + previous providers. */
export async function getProviderLedger(): Promise<ProviderLedger[]> {
  return sf<ProviderLedger>('toongine_provider_ledger', {
    repo_id: `eq.${resolveRepo()}`,
    order: 'is_current.desc,activated_at.desc',
  })
}

/** Get cost leaderboard — most expensive tasks (min-heap Top-K). */
export async function getLeaderboard(limit = 10): Promise<ActivityRun[]> {
  return sf<ActivityRun>('toongine_activity_log', {
    repo_id: `eq.${resolveRepo()}`,
    order: 'cost_usd.desc',
    limit: String(limit),
  })
}

/** Get all registered projects (for project selector dropdown). */
export async function getProjects(): Promise<ProjectInfo[]> {
  return sf<ProjectInfo>('toongine_projects', { order: 'last_active_at.desc' })
}
