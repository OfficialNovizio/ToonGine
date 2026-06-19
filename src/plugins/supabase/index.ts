// toongine/plugins/supabase — Hermes Supabase data plugin
// Ships inside the toongine npm package. Any project:
//
//   import { getAgents, getActivity, isConfigured } from 'toongine/plugins/supabase'
//
// Requires env vars in the consuming project:
//   TOONGINE_SUPABASE_URL       Supabase project URL
//   TOONGINE_SUPABASE_ANON_KEY  Anon/public key (safe for browser)

/**
 * Skill associated with an agent.
 */
export interface AgentSkill {
  name: string
  category: string
}

/**
 * An agent synced from the VPS Hermes instance.
 */
export interface ToonAgent {
  id: string
  name: string
  role: string
  department: string
  level: number
  status: 'active' | 'idle' | 'offline'
  skills_count: number
  skills: AgentSkill[]
  memory_size: string
  memory_health: number
  last_active: string | null
  updated_at: string
}

/**
 * An activity entry from the agent feed.
 */
export interface ActivityEntry {
  id: number
  agent_name: string
  task: string
  tokens: number
  duration_sec: number
  status: string
  created_at: string
}

/**
 * An advisory council decision.
 */
export interface CouncilEntry {
  id: number
  topic: string
  decision: string
  votes: Record<string, unknown>
  summary: string
  created_at: string
}

/**
 * Sync heartbeat log entry.
 */
export interface SyncLog {
  synced_at: string
  agents_count: number
  activity_count: number
  status: string
}

/**
 * Resolve env vars — checks both server-side and Next.js public prefixes.
 */
function resolveUrl(): string {
  return process.env.TOONGINE_SUPABASE_URL
    || process.env.NEXT_PUBLIC_TOONGINE_SUPABASE_URL
    || ''
}
function resolveKey(): string {
  return process.env.TOONGINE_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_TOONGINE_SUPABASE_ANON_KEY
    || ''
}

// ── Low-level fetch ───────────────────────────────────────────────────

async function supabaseFetch<T>(
  table: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const url = resolveUrl()
  const key = resolveKey()

  if (!url || !key) {
    return []
  }

  const searchParams = new URLSearchParams(params)
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  // In Next.js, add cache config for ISR.
  // This is safe to include in non-Next.js — fetch ignores unknown options.
  const init: RequestInit & { next?: { revalidate: number } } = { headers }
  init.next = { revalidate: 300 }

  const res = await fetch(
    `${url}/rest/v1/${table}?${searchParams.toString()}`,
    init,
  )

  if (!res.ok) return []
  return res.json() as Promise<T[]>
}

// ── Public API ────────────────────────────────────────────────────────

/** Get all agents from the ToonGine Supabase backend. */
export async function getAgents(): Promise<ToonAgent[]> {
  return supabaseFetch<ToonAgent>('toongine_hermes_agents', {
    order: 'department.asc,name.asc',
  })
}

/** Get recent agent activity. */
export async function getActivity(limit = 20): Promise<ActivityEntry[]> {
  return supabaseFetch<ActivityEntry>('toongine_hermes_activity', {
    order: 'created_at.desc',
    limit: String(limit),
  })
}

/** Get advisory council decisions. */
export async function getCouncil(limit = 10): Promise<CouncilEntry[]> {
  return supabaseFetch<CouncilEntry>('toongine_hermes_council', {
    order: 'created_at.desc',
    limit: String(limit),
  })
}

/** Get last sync heartbeat. */
export async function getLastSync(): Promise<SyncLog | null> {
  const logs = await supabaseFetch<SyncLog>('toongine_hermes_sync_log', {
    order: 'synced_at.desc',
    limit: '1',
  })
  return logs[0] ?? null
}

/** Aggregate agents grouped by department. */
export async function getDepartments(): Promise<
  { name: string; agentCount: number; skillsTotal: number }[]
> {
  const agents = await getAgents()
  const deptMap = new Map<string, { agentCount: number; skillsTotal: number }>()
  for (const a of agents) {
    const d = deptMap.get(a.department) ?? { agentCount: 0, skillsTotal: 0 }
    d.agentCount++
    d.skillsTotal += a.skills_count
    deptMap.set(a.department, d)
  }
  return Array.from(deptMap.entries()).map(([name, data]) => ({ name, ...data }))
}

/** Returns true if the consuming project has ToonGine Supabase env vars set. */
export function isConfigured(): boolean {
  return !!(resolveUrl() && resolveKey())
}
