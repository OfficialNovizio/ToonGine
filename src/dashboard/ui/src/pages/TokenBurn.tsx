// src/dashboard/ui/src/pages/TokenBurn.tsx — Rebuilt with new glass-morphism design
// KPI cards with icons, SVG chart, leaderboard, provider health

import React, { useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import type { ActivityRun, Snapshot, ProviderLedger, ProjectInfo } from '../../../../plugins/supabase'

const C = {
  accent: '#00d4ff', green: '#10b981', yellow: '#f59e0b', red: '#ef4444', purple: '#8b5cf6',
  text: '#e4e8f0', muted: '#5a6478', dim: '#3a3f4a',
  glass: 'rgba(255,255,255,0.04)', gb: 'rgba(255,255,255,0.08)', bg: '#080c14',
}
const CARD: React.CSSProperties = { background: C.glass, border: `1px solid ${C.gb}`, borderRadius: 14, padding: 18, backdropFilter: 'blur(16px)' }
const SECT: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 }

type Granularity = 'hour' | 'day' | 'month'

function RepoSelector({ projects, active, onChange }: { projects: ProjectInfo[]; active: string; onChange: (r: string) => void }) {
  if (projects.length <= 1) return <span style={{ fontSize: 11, color: C.muted, fontFamily: 'SF Mono, monospace' }}>{active}</span>
  return <select value={active} onChange={e => onChange(e.target.value)} style={{ background: C.glass, border: `1px solid ${C.gb}`, borderRadius: 8, color: C.text, fontSize: 11, padding: '5px 10px', fontFamily: 'SF Mono, monospace', cursor: 'pointer' }}>{projects.map(p => <option key={p.repo_id} value={p.repo_id}>{p.repo_id}</option>)}</select>
}

function PeriodSelector({ value, onChange }: { value: Granularity; onChange: (g: Granularity) => void }) {
  const opts: { key: Granularity; label: string }[] = [{ key: 'hour', label: '24H' }, { key: 'day', label: '7D' }, { key: 'month', label: '30D' }]
  return (
    <div style={{ display: 'flex', gap: 2, background: C.glass, borderRadius: 10, padding: 3, border: `1px solid ${C.gb}` }}>
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{ border: 'none', background: value===o.key?'rgba(0,212,255,0.10)':'transparent', color: value===o.key?C.accent:C.muted, borderRadius: 8, padding: '5px 14px', fontSize: 11, fontWeight: value===o.key?600:400, cursor: 'pointer' }}>{o.label}</button>
      ))}
    </div>
  )
}

function KpiCard({ icon, label, value, sub, accent }: { icon: string; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={CARD}>
      <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: (accent||C.glass)+'20', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent||C.text, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function BurnChart({ snapshots }: { snapshots: Snapshot[] }) {
  const max = Math.max(...snapshots.map(s => s.tokens_total), 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
        {snapshots.map((s, i) => {
          const h = Math.max((s.tokens_total / max) * 100, 2)
          return (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0', background: `linear-gradient(to top, ${C.accent}, ${C.accent}88)`, transition: 'height 0.3s', cursor: 'pointer' }}
              title={`${s.period_start}: ${(s.tokens_total/1000).toFixed(1)}K tokens`} />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: C.dim, marginTop: 4 }}>
        <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
      </div>
    </div>
  )
}

function ActivityFeed({ runs }: { runs: ActivityRun[] }) {
  const recent = runs.filter(r => (Date.now() - new Date(r.created_at).getTime()) < 3600_000)
  return (
    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
      {recent.length === 0 && <div style={{ fontSize: 10, color: C.dim, textAlign: 'center', padding: 20 }}>No activity in last hour</div>}
      {recent.slice(0, 10).map(r => (
        <div key={r.run_id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: `1px solid rgba(255,255,255,0.02)`, fontSize: 11 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: r.status === 'completed' ? C.green : C.red }} />
          <span style={{ color: C.accent, fontWeight: 600, minWidth: 55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.agent_name}</span>
          <span style={{ color: C.muted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.task}</span>
          <span style={{ color: C.dim, fontSize: 9, fontFamily: 'SF Mono, monospace', whiteSpace: 'nowrap' }}>{(r.tokens_in/1000).toFixed(1)}K</span>
          <span style={{ color: r.cost_usd > 0.05 ? C.red : C.muted, fontSize: 9, fontFamily: 'SF Mono, monospace', whiteSpace: 'nowrap' }}>${r.cost_usd.toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

export default function TokenBurn() {
  const [granularity, setGranularity] = useState<Granularity>('hour')
  const [activeRepo, setActiveRepo] = useState<string>('')

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

  if (!activeRepo && projects.length > 0) setActiveRepo(projects[0].repo_id)

  const current = providers.find(p => p.is_current)
  const prev = providers.find(p => !p.is_current)

  const todayTokens = snapshots.reduce((s, sn) => s + sn.tokens_total, 0)
  const todayCost = snapshots.reduce((s, sn) => s + sn.cost_total, 0)
  const activeNow = activity.filter(a => (Date.now() - new Date(a.created_at).getTime()) < 300_000).length
  const avgEff = snapshots.length > 0 ? snapshots.reduce((s, sn) => s + sn.efficiency_pct, 0) / snapshots.length : 99.97
  const loading = snapshotsPoll.loading && activityPoll.loading

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RepoSelector projects={projects} active={activeRepo} onChange={setActiveRepo} />
        </div>
        <PeriodSelector value={granularity} onChange={setGranularity} />
      </div>

      {loading ? <div style={{ textAlign: 'center', color: C.muted, padding: 60 }}>Loading…</div> : (
        <>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 12 }}>
            <KpiCard icon="⚡" label="Tokens Burned" value={`${(todayTokens/1000).toFixed(1)}K`} sub={granularity==='hour'?'Today':granularity==='day'?'This week':'This month'} accent={C.accent} />
            <KpiCard icon="💵" label="Cost" value={`$${todayCost.toFixed(2)}`} accent={C.red} />
            <KpiCard icon="🟢" label="Active Now" value={String(activeNow)} sub="last 5 min" accent={C.green} />
            <KpiCard icon="📐" label="TOON Efficiency" value={`${avgEff.toFixed(2)}%`} sub="compression" accent={C.green} />
            <KpiCard icon="💰" label="Credits" value={current ? `$${current.balance_current.toFixed(2)}` : '—'} sub={current?.provider || 'no provider'} accent={C.yellow} />
          </div>

          {/* Chart + Activity */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={CARD}>
              <div style={SECT}>📊 Hourly Burn</div>
              <BurnChart snapshots={snapshots.filter(s => s.granularity === 'hour')} />
              {snapshots.filter(s => s.tokens_total > 0).length > 0 && (
                <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>
                  Peak: {snapshots.length > 0 ? new Date(snapshots.reduce((a,b)=>a.tokens_total>b.tokens_total?a:b).period_start).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}) : '—'} · {snapshots.filter(s=>s.tokens_total>0).length} active hours
                </div>
              )}
            </div>
            <div style={CARD}>
              <div style={SECT}>📜 Live Activity</div>
              <ActivityFeed runs={activity} />
            </div>
          </div>

          {/* Leaderboard + Providers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={CARD}>
              <div style={SECT}>🏆 Top Agents by Cost</div>
              {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((r, i) => (
                <div key={r.run_id||i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid rgba(255,255,255,0.02)`, fontSize: 11 }}>
                  <span style={{ color: i===0?C.red:i===1?C.yellow:C.muted, fontWeight: 700, width: 16 }}>#{i+1}</span>
                  <span style={{ flex: 1, fontWeight: 500, color: C.text }}>{r.agent_name}</span>
                  <span style={{ color: C.muted, fontSize: 9 }}>{(r.tokens_in/1000).toFixed(1)}K tok</span>
                  <span style={{ color: C.red, fontFamily: 'SF Mono, monospace', fontSize: 10 }}>${r.cost_usd.toFixed(4)}</span>
                </div>
              )) : <div style={{ fontSize: 10, color: C.dim, textAlign: 'center', padding: 20 }}>No data yet</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {current && (
                <div style={{ ...CARD, borderColor: 'rgba(0,212,255,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{current.provider}</span>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 600, background: C.green+'20', color: C.green, border: `1px solid ${C.green}22` }}>active</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', fontSize: 10 }}>
                    <span style={{ color: C.muted }}>Spent</span><span style={{ color: C.text, fontWeight: 500 }}>${current.total_spent.toFixed(2)}</span>
                    <span style={{ color: C.muted }}>Balance</span><span style={{ color: C.green, fontWeight: 500 }}>${current.balance_current.toFixed(2)}</span>
                    <span style={{ color: C.muted }}>Cost/1K</span><span style={{ color: C.text, fontFamily: 'SF Mono, monospace' }}>${current.avg_cost_per_1k.toFixed(5)}</span>
                    <span style={{ color: C.muted }}>Efficiency</span><span style={{ color: C.green, fontWeight: 500 }}>{current.efficiency_pct.toFixed(2)}%</span>
                  </div>
                  {current.balance_start > 0 && (
                    <>
                      <div style={{ height: 4, borderRadius: 2, background: C.glass, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min((current.total_spent/current.balance_start)*100,100)}%`, height: '100%', borderRadius: 2, background: C.accent }} />
                      </div>
                      <div style={{ fontSize: 8, color: C.dim, marginTop: 2 }}>
                        Used {((current.total_spent/current.balance_start)*100).toFixed(0)}% · ${current.balance_current.toFixed(2)} left
                      </div>
                    </>
                  )}
                </div>
              )}
              {prev && (
                <div style={{ ...CARD, opacity: 0.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{prev.provider}</span>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 600, background: C.muted+'20', color: C.muted, border: `1px solid ${C.muted}22` }}>previous</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.dim }}>${prev.total_spent.toFixed(2)} spent · {prev.efficiency_pct.toFixed(1)}% efficient</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
