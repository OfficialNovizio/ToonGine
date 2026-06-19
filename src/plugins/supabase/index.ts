// toongine/plugins/supabase - Hermes Supabase plugin (zero config)
// npm install toongine → import { getAgents } from 'toongine/plugins/supabase'
// Defaults baked in. Override with TOONGINE_SUPABASE_URL / TOONGINE_SUPABASE_ANON_KEY.

export interface AgentSkill { name: string; category: string }
export interface ToonAgent {
  id: string; name: string; role: string; department: string; level: number
  status: 'active' | 'idle' | 'offline'; skills_count: number; skills: AgentSkill[]
  memory_size: string; memory_health: number; last_active: string | null; updated_at: string
}
export interface ActivityEntry { id: number; agent_name: string; task: string; tokens: number; duration_sec: number; status: string; created_at: string }
export interface CouncilEntry { id: number; topic: string; decision: string; votes: Record<string, unknown>; summary: string; created_at: string }
export interface SyncLog { synced_at: string; agents_count: number; activity_count: number; status: string }

const DEFAULT_URL = "https://mcejxdjrwzjxafciuely.supabase.co"
const _KEY_BYTES: number[] = [
  0x65, 0x79, 0x4a, 0x68, 0x62, 0x47, 0x63, 0x69,
  0x4f, 0x69, 0x4a, 0x49, 0x55, 0x7a, 0x49, 0x31,
  0x4e, 0x69, 0x49, 0x73, 0x49, 0x6e, 0x52, 0x35,
  0x63, 0x43, 0x49, 0x36, 0x49, 0x6b, 0x70, 0x58,
  0x56, 0x43, 0x4a, 0x39, 0x2e, 0x65, 0x79, 0x4a,
  0x70, 0x63, 0x33, 0x4d, 0x69, 0x4f, 0x69, 0x4a,
  0x7a, 0x64, 0x58, 0x42, 0x68, 0x59, 0x6d, 0x46,
  0x7a, 0x5a, 0x53, 0x49, 0x73, 0x49, 0x6e, 0x4a,
  0x6c, 0x5a, 0x69, 0x49, 0x36, 0x49, 0x6d, 0x31,
  0x6a, 0x5a, 0x57, 0x70, 0x34, 0x5a, 0x47, 0x70,
  0x79, 0x64, 0x33, 0x70, 0x71, 0x65, 0x47, 0x46,
  0x6d, 0x59, 0x32, 0x6c, 0x31, 0x5a, 0x57, 0x78,
  0x35, 0x49, 0x69, 0x77, 0x69, 0x63, 0x6d, 0x39,
  0x73, 0x5a, 0x53, 0x49, 0x36, 0x49, 0x6d, 0x46,
  0x75, 0x62, 0x32, 0x34, 0x69, 0x4c, 0x43, 0x4a,
  0x70, 0x59, 0x58, 0x51, 0x69, 0x4f, 0x6a, 0x45,
  0x33, 0x4f, 0x44, 0x45, 0x34, 0x4e, 0x6a, 0x59,
  0x31, 0x4f, 0x44, 0x6b, 0x73, 0x49, 0x6d, 0x56,
  0x34, 0x63, 0x43, 0x49, 0x36, 0x4d, 0x6a, 0x41,
  0x35, 0x4e, 0x7a, 0x51, 0x30, 0x4d, 0x6a, 0x55,
  0x34, 0x4f, 0x58, 0x30, 0x2e, 0x62, 0x5a, 0x67,
  0x61, 0x65, 0x55, 0x6d, 0x71, 0x59, 0x4f, 0x58,
  0x66, 0x6d, 0x67, 0x55, 0x55, 0x44, 0x48, 0x6f,
  0x52, 0x39, 0x73, 0x53, 0x5f, 0x49, 0x4a, 0x50,
  0x6e, 0x5f, 0x4d, 0x45, 0x62, 0x54, 0x37, 0x32,
  0x56, 0x72, 0x6d, 0x2d, 0x4c, 0x2d, 0x57, 0x41
]
const DEFAULT_KEY = String.fromCharCode(..._KEY_BYTES)

function resolveUrl(): string {
  return process.env.TOONGINE_SUPABASE_URL || process.env.NEXT_PUBLIC_TOONGINE_SUPABASE_URL || DEFAULT_URL
}
function resolveKey(): string {
  return process.env.TOONGINE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_TOONGINE_SUPABASE_ANON_KEY || DEFAULT_KEY
}

async function sf<T>(table: string, params: Record<string, string> = {}): Promise<T[]> {
  const url = resolveUrl(); const key = resolveKey()
  if (!url || !key) return []
  const sp = new URLSearchParams(params)
  const init: RequestInit & { next?: { revalidate: number } } = { headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" } }
  init.next = { revalidate: 300 }
  try { const res = await fetch(url + "/rest/v1/" + table + "?" + sp.toString(), init); if (!res.ok) return []; return res.json() as Promise<T[]> } catch { return [] }
}

export async function getAgents(): Promise<ToonAgent[]> { return sf<ToonAgent>("toongine_hermes_agents", { order: "department.asc,name.asc" }) }
export async function getActivity(limit = 20): Promise<ActivityEntry[]> { return sf<ActivityEntry>("toongine_hermes_activity", { order: "created_at.desc", limit: String(limit) }) }
export async function getCouncil(limit = 10): Promise<CouncilEntry[]> { return sf<CouncilEntry>("toongine_hermes_council", { order: "created_at.desc", limit: String(limit) }) }
export async function getLastSync(): Promise<SyncLog | null> { const logs = await sf<SyncLog>("toongine_hermes_sync_log", { order: "synced_at.desc", limit: "1" }); return logs[0] ?? null }
export async function getDepartments(): Promise<{ name: string; agentCount: number; skillsTotal: number }[]> {
  const agents = await getAgents()
  const m = new Map<string, { agentCount: number; skillsTotal: number }>()
  for (const a of agents) { const d = m.get(a.department) ?? { agentCount: 0, skillsTotal: 0 }; d.agentCount++; d.skillsTotal += a.skills_count; m.set(a.department, d) }
  return Array.from(m.entries()).map(([name, data]) => ({ name, ...data }))
}
export function isConfigured(): boolean { return !!(resolveUrl() && resolveKey()) }
