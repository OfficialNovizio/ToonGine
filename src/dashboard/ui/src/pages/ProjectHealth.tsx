// src/dashboard/ui/src/pages/ProjectHealth.tsx — Project Health Intelligence Engine
// YVON OS design ethics: glass-morphism, dark theme, Inter font.
// DSA: Ring Buffer + Sliding Window + Priority Queue + Linear Regression + Rule Engine

import React, { useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import type {
  CodebaseSnapshot, ApiHealthEntry, IssueEntry,
  HealthEvent, Recommendation, HealthScore, ProjectInfo,
} from '../../../../plugins/supabase'

/* ── Design tokens (YVON OS) ───────────────────────────────────── */
const C = {
  accent: '#00d4ff', green: '#10b981', yellow: '#f59e0b', red: '#ef4444',
  purple: '#8b5cf6', pink: '#ec4899',
  text: '#e4e8f0', muted: '#5a6478', dim: '#3a3f4a',
  glass: 'rgba(255,255,255,0.04)', glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#080c14',
}
const CARD: React.CSSProperties = {
  background: C.glass, border: `1px solid ${C.glassBorder}`,
  borderRadius: 14, padding: 18, backdropFilter: 'blur(16px)',
}
const SECT: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, color: C.muted,
  textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 10,
}

/* ── Sub-components ────────────────────────────────────────────── */

function RepoSelector({ projects, active, onChange }: {
  projects: ProjectInfo[]; active: string; onChange: (r: string) => void
}) {
  if (projects.length <= 1) {
    return <span style={{ fontSize: 11, color: C.muted, fontFamily: 'SF Mono, monospace' }}>{active}</span>
  }
  return (
    <select value={active} onChange={e => onChange(e.target.value)}
      style={{
        background: C.glass, border: `1px solid ${C.glassBorder}`, borderRadius: 8,
        color: C.text, fontSize: 11, padding: '5px 10px',
        fontFamily: 'SF Mono, monospace', cursor: 'pointer',
      }}>
      {projects.map(p => <option key={p.repo_id} value={p.repo_id}>{p.repo_id}</option>)}
    </select>
  )
}

function ScoreRing({ score, trend }: { score: number; trend: string }) {
  const color = score >= 80 ? C.green : score >= 50 ? C.yellow : C.red
  const deg = (score / 100) * 270
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 120, height: 120, borderRadius: '50%', margin: '0 auto 8px',
        background: `conic-gradient(from 0deg, ${color} 0deg, ${color} ${deg}deg, ${C.glass} ${deg}deg, ${C.glass} 360deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', background: C.bg,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 34, fontWeight: 800, color, letterSpacing: -1, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: 'uppercase' }}>
            {score >= 80 ? 'Healthy' : score >= 50 ? 'Degraded' : 'Critical'}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: trend === 'up' ? C.green : trend === 'down' ? C.red : C.muted }}>
        {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'} {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
      </div>
    </div>
  )
}

function InsightCard({ type, icon, children }: { type: 'good' | 'warn' | 'crit' | 'info'; icon: string; children: React.ReactNode }) {
  const colors = { good: C.green, warn: C.yellow, crit: C.red, info: C.accent }
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8, fontSize: 11, lineHeight: 1.5,
      background: colors[type] + '08', border: `1px solid ${colors[type]}22`,
      color: colors[type], display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div>{children}</div>
    </div>
  )
}

function CodebasePanel({ snapshots }: { snapshots: CodebaseSnapshot[] }) {
  const latest = snapshots[snapshots.length - 1]
  const maxErr = Math.max(...snapshots.map(s => s.ts_errors), 1)
  return (
    <div style={CARD}>
      <div style={SECT}>🧬 Codebase · Last {snapshots.length} Samples</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48, marginBottom: 6 }}>
        {snapshots.map((s, i) => {
          const h = s.ts_error_free ? 100 : Math.max(20, 100 - (s.ts_errors / maxErr) * 80)
          return (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0', minHeight: 2,
              background: s.ts_error_free ? 'rgba(52,211,153,0.6)' : 'rgba(248,113,113,0.6)',
              transition: 'height 0.3s',
            }} title={`${s.sampled_at?.slice(0,10)}: ${s.ts_errors} errors`} />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.dim }}>
        {snapshots.slice(0, 7).map((s, i) => <span key={i}>{s.sampled_at?.slice(5,10)}</span>)}
      </div>
      {latest ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0' }}>
            <span style={{ color: C.muted }}>TypeScript errors</span>
            <span style={{ color: latest.ts_error_free ? C.green : C.red, fontWeight: 600 }}>{latest.ts_errors}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0' }}>
            <span style={{ color: C.muted }}>Build</span>
            <span style={{ color: latest.ts_error_free ? C.green : C.red, fontWeight: 500 }}>{latest.ts_error_free ? 'Clean' : 'Failed'} · {(latest.build_duration_ms / 1000).toFixed(1)}s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0' }}>
            <span style={{ color: C.muted }}>Files</span>
            <span style={{ color: C.text, fontWeight: 500 }}>{latest.files_total}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0' }}>
            <span style={{ color: C.muted }}>Outdated deps</span>
            <span style={{ color: latest.outdated_deps > 2 ? C.yellow : C.text, fontWeight: 500 }}>{latest.outdated_deps}</span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: C.dim, textAlign: 'center', padding: '20px 0' }}>No codebase data yet</div>
      )}
      {latest?.ts_error_free && <div style={{ fontSize: 9, color: C.green, marginTop: 6 }}>{snapshots.length} clean samples · streak growing</div>}
    </div>
  )
}

function ApiPanel({ entries }: { entries: ApiHealthEntry[] }) {
  const total = entries.length
  const s200 = entries.filter(e => e.status_code < 400).length
  const s400 = entries.filter(e => e.status_code >= 400 && e.status_code < 500).length
  const s500 = entries.filter(e => e.status_code >= 500).length
  const p95 = entries.length > 0
    ? entries.map(e => e.duration_ms).sort((a, b) => a - b)[Math.floor(entries.length * 0.95)]
    : 0
  const topError = entries.filter(e => e.status_code >= 400).reduce<Record<string, number>>((acc, e) => {
    acc[e.endpoint] = (acc[e.endpoint] || 0) + 1; return acc
  }, {})
  const topEndpoint = Object.entries(topError).sort((a, b) => b[1] - a[1])[0]

  return (
    <div style={CARD}>
      <div style={SECT}>🌐 API Health · Last {total} Requests</div>
      {total > 0 ? (
        <>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${(s200/total)*100}%`, background: C.green }} />
            <div style={{ width: `${(s400/total)*100}%`, background: C.yellow }} />
            <div style={{ width: `${(s500/total)*100}%`, background: C.red }} />
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 10, marginBottom: 10 }}>
            <span style={{ color: C.green }}>● {((s200/total)*100).toFixed(0)}% 2xx</span>
            <span style={{ color: C.yellow }}>● {((s400/total)*100).toFixed(0)}% 4xx</span>
            <span style={{ color: C.red }}>● {((s500/total)*100).toFixed(0)}% 5xx</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' }}>
            <span style={{ color: C.muted }}>P95 latency</span><span style={{ color: C.text }}>{p95}ms</span>
          </div>
          {topEndpoint && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' }}>
              <span style={{ color: C.muted }}>Top error</span><span style={{ color: C.red, fontSize: 10 }}>{topEndpoint[0]}</span>
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 11, color: C.dim, textAlign: 'center', padding: '20px 0' }}>No API data yet</div>
      )}
    </div>
  )
}

function IssuesPanel({ issues }: { issues: IssueEntry[] }) {
  const sevIcons: Record<number, { icon: string; color: string }> = {
    1: { icon: '🔴', color: C.red },
    2: { icon: '🟡', color: C.yellow },
    3: { icon: '🔵', color: C.accent },
    4: { icon: '⚪', color: C.dim },
  }
  return (
    <div style={CARD}>
      <div style={SECT}>🐛 Issues · {issues.length} Open</div>
      {issues.length > 0 ? (
        <div>
          {issues.slice(0, 6).map(i => {
            const s = sevIcons[i.severity] || sevIcons[4]
            const age = Math.round((Date.now() - new Date(i.opened_at).getTime()) / 86400000)
            return (
              <div key={i.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
                borderBottom: `1px solid ${C.glassBorder}`, fontSize: 11,
              }}>
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                <span style={{ flex: 1, color: i.severity <= 2 ? C.text : C.muted, fontWeight: i.severity <= 2 ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</span>
                <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: C.glass, color: C.muted }}>{i.source}</span>
                <span style={{ fontSize: 10, color: age > 7 ? C.yellow : C.dim, whiteSpace: 'nowrap' }}>{age}d</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: C.green, textAlign: 'center', padding: '20px 0' }}>No open issues 🎉</div>
      )}
    </div>
  )
}

function RecommendationsPanel({ recs }: { recs: Recommendation[] }) {
  const priorityStyle: Record<number, { bg: string; color: string }> = {
    0: { bg: C.red + '20', color: C.red },
    1: { bg: C.yellow + '20', color: C.yellow },
    2: { bg: C.accent + '20', color: C.accent },
  }
  return (
    <div style={CARD}>
      <div style={SECT}>💡 What to Fix First</div>
      {recs.length > 0 ? (
        recs.map(r => {
          const p = priorityStyle[r.priority] || priorityStyle[2]
          return (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderBottom: `1px solid ${C.glassBorder}`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: p.bg, color: p.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>P{r.priority}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{r.title}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{r.detail}</div>
                <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{r.effort_minutes} min · {r.category}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>+{r.impact_points.toFixed(1)}</div>
                <div style={{ fontSize: 9, color: C.dim }}>health pts</div>
              </div>
            </div>
          )
        })
      ) : (
        <div style={{ fontSize: 11, color: C.green, textAlign: 'center', padding: '20px 0' }}>All caught up · No recommendations</div>
      )}
    </div>
  )
}

function TimelinePanel({ events }: { events: HealthEvent[] }) {
  const icons: Record<string, { color: string; icon: string }> = {
    commit: { color: C.accent, icon: '●' },
    deploy: { color: C.accent, icon: '●' },
    fix: { color: C.green, icon: '●' },
    recovery: { color: C.green, icon: '●' },
    error_spike: { color: C.red, icon: '●' },
    anomaly: { color: C.yellow, icon: '●' },
    pulse: { color: C.purple, icon: '●' },
  }
  return (
    <div style={CARD}>
      <div style={SECT}>📅 Health Timeline</div>
      {events.length > 0 ? (
        <div style={{ position: 'relative', paddingLeft: 22, maxHeight: 280, overflowY: 'auto' }}>
          <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 1, background: C.glassBorder }} />
          {events.slice(0, 12).map(e => {
            const ic = icons[e.event_type] || icons.commit
            return (
              <div key={e.id} style={{ position: 'relative', marginBottom: 10, fontSize: 11 }}>
                <div style={{
                  position: 'absolute', left: -17, top: 3, width: 8, height: 8, borderRadius: '50%',
                  background: ic.color,
                  boxShadow: e.severity >= 2 ? `0 0 5px ${ic.color}40` : 'none',
                }} />
                <div style={{ fontSize: 10, color: C.dim }}>{new Date(e.occurred_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div style={{ fontWeight: 600, color: ic.color }}>{e.title}</div>
                {e.detail && <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{e.detail}</div>}
                <div style={{ fontSize: 9, color: e.health_impact > 0 ? C.green : e.health_impact < 0 ? C.red : C.dim, marginTop: 1 }}>
                  {e.health_impact !== 0 ? `${e.health_impact > 0 ? '▲ +' : '▼ '}${Math.abs(e.health_impact)} health pts` : 'No impact'}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: C.dim, textAlign: 'center', padding: '20px 0' }}>No events yet</div>
      )}
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────── */

export default function ProjectHealth() {
  const [activeRepo, setActiveRepo] = useState('')

  const projectsPoll = usePolling<ProjectInfo[]>('/api/toongine/projects', 60000)
  const healthPoll = usePolling<HealthScore>(`/api/toongine/health?repo=${activeRepo}`, 30000)
  const snapshotsPoll = usePolling<CodebaseSnapshot[]>(`/api/toongine/codebase?repo=${activeRepo}`, 60000)
  const apiPoll = usePolling<ApiHealthEntry[]>(`/api/toongine/api-health?repo=${activeRepo}`, 30000)
  const issuesPoll = usePolling<IssueEntry[]>(`/api/toongine/issues?repo=${activeRepo}`, 30000)
  const eventsPoll = usePolling<HealthEvent[]>(`/api/toongine/events?repo=${activeRepo}`, 60000)
  const recsPoll = usePolling<Recommendation[]>(`/api/toongine/recommendations?repo=${activeRepo}`, 30000)

  const projects = projectsPoll.data || []
  const health = healthPoll.data
  const snapshots = snapshotsPoll.data || []
  const apiEntries = apiPoll.data || []
  const issues = issuesPoll.data || []
  const events = eventsPoll.data || []
  const recs = recsPoll.data || []

  if (!activeRepo && projects.length > 0) setActiveRepo(projects[0].repo_id)

  const loading = healthPoll.loading

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🏥 Project Health</h2>
          <RepoSelector projects={projects} active={activeRepo} onChange={setActiveRepo} />
        </div>
        <span style={{ fontSize: 10, color: C.dim }}>
          <span style={{ color: C.green, animation: 'pulse 2s infinite' }}>●</span> Recomputed hourly
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: C.muted, padding: 60 }}>Computing health score…</div>
      ) : (
        <>
          {/* Top row: Score + Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, marginBottom: 14 }}>
            <ScoreRing score={health?.score ?? 0} trend={health?.trend_direction ?? 'stable'} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {health && (
                <>
                  <InsightCard type="good" icon="📈">
                    <strong>{health.topInsight}</strong> · Score {health.score}/100 · Codebase: {health.codebase.toFixed(0)} · API: {health.api.toFixed(0)} · TOON: {health.toon.toFixed(0)} · Issues: {health.issues.toFixed(0)}
                  </InsightCard>
                  {health.trend_direction !== 'stable' && (
                    <InsightCard type={health.trend_direction === 'up' ? 'good' : 'warn'} icon={health.trend_direction === 'up' ? '▲' : '▼'}>
                      Health {health.trend_direction === 'up' ? 'improving' : 'declining'} · Trend: {health.trend > 0 ? '+' : ''}{health.trend.toFixed(1)}/week
                      {health.trend > 0 && ` · Projected ${health.projected_next} by next week`}
                    </InsightCard>
                  )}
                </>
              )}
              {!health && <InsightCard type="info" icon="⏳">Waiting for first health computation. Pipeline runs hourly.</InsightCard>}
            </div>
          </div>

          {/* Codebase + API */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <CodebasePanel snapshots={snapshots} />
            <ApiPanel entries={apiEntries} />
          </div>

          {/* Issues + Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <IssuesPanel issues={issues} />
            <RecommendationsPanel recs={recs} />
          </div>

          {/* Timeline */}
          <TimelinePanel events={events} />

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: 10, color: C.dim, marginTop: 14 }}>
            ⚡ 7 DSA structures active · Ring Buffer · Sliding Window · Priority Queue · Linear Regression · Rule Engine
            {events.length === 0 && ' · No events yet — pipeline running hourly'}
          </div>
        </>
      )}
    </div>
  )
}
