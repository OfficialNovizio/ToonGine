// src/dashboard/ui/src/pages/TokenBurn.tsx — Token Burn Engine (DSA-driven, repo-scoped)
// Replaces TokenIntel.tsx. Reads from Supabase ring buffer snapshots (O(1)).
// YVON OS design ethics: glass-morphism, dark theme, Inter font.

import React, { useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import type {
  ActivityRun, Snapshot, ProviderLedger, ProjectInfo,
} from '../../../../plugins/supabase'

/* ── Design tokens (YVON OS) ───────────────────────────────────── */
const C = {
  accent: '#00d4ff', green: '#10b981', yellow: '#f59e0b', red: '#ef4444',
  purple: '#8b5cf6', pink: '#ec4899',
  text: '#e4e8f0', muted: '#5a6478', dim: '#3a3f4a',
  glass: 'rgba(255,255,255,0.04)', glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0a0e17',
}

const CARD: React.CSSProperties = {
  background: C.glass, border: `1px solid ${C.glassBorder}`,
  borderRadius: 14, padding: 20, backdropFilter: 'blur(16px)',
}

const SECTION: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: C.muted,
  textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 12,
}

/* ── Types ─────────────────────────────────────────────────────── */
type Granularity = 'hour' | 'day' | 'month'

interface DashboardData {
  repoId: string
  projects: ProjectInfo[]
  snapshots: Snapshot[]
  activity: ActivityRun[]
  providers: ProviderLedger[]
  leaderboard: ActivityRun[]
  loading: boolean
}

/* ── Sub-components ────────────────────────────────────────────── */

function KpiCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string
}) {
  return (
    <div style={CARD}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent || C.text, letterSpacing: -0.5 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function PeriodSelector({ value, onChange }: { value: Granularity; onChange: (g: Granularity) => void }) {
  const opts: { key: Granularity; label: string }[] = [
    { key: 'hour', label: '24H' },
    { key: 'day', label: '7D' },
    { key: 'month', label: '30D' },
  ]
  return (
    <div style={{ display: 'flex', gap: 2, background: C.glass, borderRadius: 10, padding: 3, width: 'fit-content', border: `1px solid ${C.glassBorder}` }}>
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          style={{
            border: 'none', background: value === o.key ? 'rgba(0,212,255,0.10)' : 'transparent',
            color: value === o.key ? C.accent : C.muted, borderRadius: 8,
            padding: '6px 16px', fontSize: 12, fontWeight: value === o.key ? 600 : 400,
            cursor: 'pointer',
          }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function RepoSelector({ projects, active, onChange }: {
  projects: ProjectInfo[]; active: string; onChange: (repo: string) => void
}) {
  if (projects.length <= 1) {
    return <span style={{ fontSize: 12, color: C.muted, fontFamily: 'SF Mono, monospace' }}>{active}</span>
  }
  return (
    <select value={active} onChange={e => onChange(e.target.value)}
      style={{
        background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 8,
        color: C.text, fontSize: 12, padding: '5px 10px', fontFamily: 'SF Mono, monospace',
        cursor: 'pointer',
      }}>
      {projects.map(p => (
        <option key={p.repo_id} value={p.repo_id}>{p.repo_id}</option>
      ))}
    </select>
  )
}

function HourlyBurn({ snapshots }: { snapshots: Snapshot[] }) {
  const max = Math.max(...snapshots.map(s => s.tokens_total), 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
        {snapshots.map((s, i) => {
          const h = Math.max((s.tokens_total / max) * 100, 2)
          const isNow = i === new Date().getHours()
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{
                width: '100%', height: `${h}%`, borderRadius: '2px 2px 0 0',
                background: isNow ? C.accent : `rgba(0,212,255,${0.15 + (s.tokens_total / max) * 0.85})`,
                transition: 'height 0.3s ease',
                cursor: 'pointer',
              }} title={`${s.period_start}: ${(s.tokens_total / 1000).toFixed(1)}K tokens`} />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.dim, marginTop: 4 }}>
        <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
      </div>
    </div>
  )
}

function ProviderCard({ provider, isCurrent }: { provider: ProviderLedger; isCurrent: boolean }) {
  const pctUsed = provider.balance_start > 0
    ? Math.min((provider.total_spent / provider.balance_start) * 100, 100)
    : 0
  const stateColors: Record<string, string> = {
    active: C.green, activated: C.accent, low: C.yellow, depleted: C.red, switched: C.purple,
  }
  return (
    <div style={{ ...CARD, opacity: isCurrent ? 1 : 0.5, borderColor: isCurrent ? 'rgba(0,212,255,0.15)' : C.glassBorder }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? C.accent : C.purple }}>{provider.provider}</span>
        <span style={{
          padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
          background: (stateColors[provider.state] || C.muted) + '20',
          color: stateColors[provider.state] || C.muted,
        }}>{provider.state}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11 }}>
        <span style={{ color: C.muted }}>Spent</span><span style={{ color: C.text, fontWeight: 500 }}>${provider.total_spent.toFixed(2)}</span>
        <span style={{ color: C.muted }}>Balance</span><span style={{ color: pctUsed > 70 ? C.red : C.green, fontWeight: 500 }}>${provider.balance_current.toFixed(2)}</span>
        <span style={{ color: C.muted }}>Cost/1K</span><span style={{ color: C.text, fontWeight: 500, fontFamily: 'SF Mono, monospace' }}>${provider.avg_cost_per_1k.toFixed(5)}</span>
        <span style={{ color: C.muted }}>Efficiency</span><span style={{ color: C.green, fontWeight: 500 }}>{provider.efficiency_pct.toFixed(2)}%</span>
      </div>
      {isCurrent && provider.balance_start > 0 && (
        <>
          <div style={{ height: 6, borderRadius: 3, background: C.glass, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: `${pctUsed}%`, height: '100%', borderRadius: 3, background: pctUsed > 70 ? C.red : pctUsed > 40 ? C.yellow : C.green, transition: 'width 0.4s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted, marginTop: 3 }}>
            <span>Used {pctUsed.toFixed(0)}%</span><span>${provider.balance_current.toFixed(2)} left</span>
          </div>
        </>
      )}
    </div>
  )
}

function LeaderboardTable({ runs }: { runs: ActivityRun[] }) {
  const [sortBy, setSortBy] = useState<'cost_usd' | 'tokens_in' | 'duration_ms'>('cost_usd')
  const sorted = [...runs].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number))
  const labels: Record<string, string> = { cost_usd: 'Cost ▼', tokens_in: 'Tokens ▼', duration_ms: 'Duration ▼' }
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {Object.entries(labels).map(([k, v]) => (
          <button key={k} onClick={() => setSortBy(k as typeof sortBy)}
            style={{
              border: 'none', background: 'transparent', color: sortBy === k ? C.accent : C.muted,
              fontSize: 10, fontWeight: 600, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
            {v}
          </button>
        ))}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {sorted.slice(0, 5).map((r, i) => (
            <tr key={r.run_id || i} style={{ borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
              <td style={{ padding: '6px 4px', fontSize: 12, color: i === 0 ? C.red : i === 1 ? C.yellow : C.text, fontWeight: 500 }}>{r.agent_name}</td>
              <td style={{ padding: '6px 4px', fontSize: 11, color: C.muted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.task}</td>
              <td style={{ padding: '6px 4px', fontSize: 11, color: C.red, textAlign: 'right', fontFamily: 'SF Mono, monospace' }}>${r.cost_usd.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActivityFeed({ runs }: { runs: ActivityRun[] }) {
  return (
    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
      {runs.slice(0, 10).map(r => (
        <div key={r.run_id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.02)`, fontSize: 12,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: r.status === 'completed' ? C.green : C.red }} />
          <span style={{ color: C.accent, fontWeight: 600, minWidth: 60 }}>{r.agent_name}</span>
          <span style={{ color: C.muted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.task}</span>
          <span style={{ color: C.dim, fontSize: 10, fontFamily: 'SF Mono, monospace' }}>{(r.tokens_in / 1000).toFixed(1)}K</span>
          <span style={{ color: r.cost_usd > 0.05 ? C.red : C.muted, fontSize: 10, fontFamily: 'SF Mono, monospace' }}>${r.cost_usd.toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────── */

export default function TokenBurn() {
  const [granularity, setGranularity] = useState<Granularity>('hour')
  const [activeRepo, setActiveRepo] = useState<string>('')

  // Poll all data sources
  const projectsPoll = usePolling<ProjectInfo[]>('/api/toongine/projects', 60000)
  const snapshotsPoll = usePolling<Snapshot[]>(`/api/toongine/snapshots?granularity=${granularity}&repo=${activeRepo}`, 15000)
  const activityPoll = usePolling<ActivityRun[]>(`/api/toongine/activity?repo=${activeRepo}`, 10000)
  const providersPoll = usePolling<ProviderLedger[]>(`/api/toongine/providers?repo=${activeRepo}`, 30000)
  const leaderboardPoll = usePolling<ActivityRun[]>(`/api/toongine/leaderboard?repo=${activeRepo}`, 15000)

  const projects = projectsPoll.data || []
  const snapshots = snapshotsPoll.data || []
  const activity = activityPoll.data || []
  const providers = providersPoll.data || []
  const leaderboard = leaderboardPoll.data || []

  // Set initial repo from first project
  if (!activeRepo && projects.length > 0) {
    setActiveRepo(projects[0].repo_id)
  }

  const currentProvider = providers.find(p => p.is_current)
  const previousProvider = providers.find(p => !p.is_current)

  // Compute KPIs from snapshots
  const todayTokens = snapshots.reduce((s, sn) => s + sn.tokens_total, 0)
  const todayCost = snapshots.reduce((s, sn) => s + sn.cost_total, 0)
  const activeNow = activity.filter(a => {
    const t = new Date(a.created_at).getTime()
    return Date.now() - t < 300_000 // active in last 5 min
  }).length
  const avgEfficiency = snapshots.length > 0
    ? snapshots.reduce((s, sn) => s + sn.efficiency_pct, 0) / snapshots.length
    : 99.97

  const loading = snapshotsPoll.loading && activityPoll.loading

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>💰 Token Burn</h2>
          <RepoSelector projects={projects} active={activeRepo} onChange={setActiveRepo} />
        </div>
        <PeriodSelector value={granularity} onChange={setGranularity} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: C.muted, padding: 60 }}>Loading…</div>
      ) : (
        <>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
            <KpiCard label="Tokens Burned" value={`${(todayTokens / 1000).toFixed(1)}K`} sub={granularity === 'hour' ? 'Today' : granularity === 'day' ? 'This week' : 'This month'} accent={C.accent} />
            <KpiCard label="Cost" value={`$${todayCost.toFixed(2)}`} />
            <KpiCard label="Active Now" value={String(activeNow)} sub="last 5 min" accent={C.green} />
            <KpiCard label="TOON Efficiency" value={`${avgEfficiency.toFixed(2)}%`} sub="compression ratio" accent={C.green} />
            <KpiCard label="Credits" value={currentProvider ? `$${currentProvider.balance_current.toFixed(2)}` : '—'} sub={currentProvider ? `${currentProvider.provider}` : 'no provider'} accent={C.yellow} />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={CARD}>
              <div style={SECTION}>Hourly Burn · from ring buffer</div>
              <HourlyBurn snapshots={snapshots.filter(s => s.granularity === 'hour')} />
              <div style={{ fontSize: 10, color: C.dim, marginTop: 6 }}>
                Peak: {snapshots.length > 0 ? new Date(snapshots.reduce((a,b) => a.tokens_total > b.tokens_total ? a : b).period_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'} · {snapshots.filter(s => s.tokens_total > 0).length} active hours
              </div>
            </div>
            <div style={CARD}>
              <div style={SECTION}>Active Now</div>
              <ActivityFeed runs={activity.filter(a => {
                const t = new Date(a.created_at).getTime()
                return Date.now() - t < 3600_000
              })} />
            </div>
          </div>

          {/* Leaderboard + Providers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div style={CARD}>
              <div style={SECTION}>Cost Leaderboard · Top 5</div>
              <LeaderboardTable runs={leaderboard} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentProvider && <ProviderCard provider={currentProvider} isCurrent />}
              {previousProvider && <ProviderCard provider={previousProvider} isCurrent={false} />}
              {currentProvider && previousProvider && (
                <div style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>
                  <span style={{ color: C.green, fontWeight: 700 }}>↓ {((1 - currentProvider.avg_cost_per_1k / Math.max(previousProvider.avg_cost_per_1k, 0.00001)) * 100).toFixed(2)}%</span> cheaper than {previousProvider.provider}
                </div>
              )}
            </div>
          </div>

          {/* Ring buffer status */}
          <div style={{ ...CARD, textAlign: 'center', fontSize: 11, color: C.dim }}>
            ⚡ Reading from snapshot ring buffer — {snapshots.length} pre-computed slots · O(1) load · {granularity} granularity
            {snapshots.length === 0 && <span style={{ color: C.yellow }}> · No snapshots yet — run activity to populate</span>}
          </div>
        </>
      )}
    </div>
  )
}
