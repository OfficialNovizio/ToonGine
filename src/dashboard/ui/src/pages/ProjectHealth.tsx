// src/dashboard/ui/src/pages/ProjectHealth.tsx — Rebuilt with new glass-morphism design
// SVG rings, proper KPI cards, dark glass theme

import React, { useState } from 'react'
import { usePolling } from '../hooks/usePolling'
import type { CodebaseSnapshot, ApiHealthEntry, IssueEntry, HealthEvent, Recommendation, HealthScore, ProjectInfo } from '../../../../plugins/supabase'

const C = {
  accent: '#00d4ff', green: '#10b981', yellow: '#f59e0b', red: '#ef4444', purple: '#8b5cf6',
  text: '#e4e8f0', muted: '#5a6478', dim: '#3a3f4a',
  glass: 'rgba(255,255,255,0.04)', gb: 'rgba(255,255,255,0.08)', bg: '#080c14',
}
const CARD: React.CSSProperties = { background: C.glass, border: `1px solid ${C.gb}`, borderRadius: 14, padding: 18, backdropFilter: 'blur(16px)' }
const SECT: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 }

function SVGScoreRing({ score, size = 90, label }: { score: number; size?: number; label: string }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? C.green : score >= 50 ? C.yellow : C.red
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: -size + 14, color }}>{score}%</div>
      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  )
}

function RepoSelector({ projects, active, onChange }: { projects: ProjectInfo[]; active: string; onChange: (r: string) => void }) {
  if (projects.length <= 1) return <span style={{ fontSize: 11, color: C.muted, fontFamily: 'SF Mono, monospace' }}>{active}</span>
  return (
    <select value={active} onChange={e => onChange(e.target.value)}
      style={{ background: C.glass, border: `1px solid ${C.gb}`, borderRadius: 8, color: C.text, fontSize: 11, padding: '5px 10px', fontFamily: 'SF Mono, monospace', cursor: 'pointer' }}>
      {projects.map(p => <option key={p.repo_id} value={p.repo_id}>{p.repo_id}</option>)}
    </select>
  )
}

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
  const latest = snapshots[snapshots.length - 1]
  const totalApi = apiEntries.length
  const s200 = apiEntries.filter(e => e.status_code < 400).length
  const s500 = apiEntries.filter(e => e.status_code >= 500).length
  const p95 = totalApi > 0 ? apiEntries.map(e => e.duration_ms).sort((a,b)=>a-b)[Math.floor(totalApi*0.95)] : 0
  const score = health?.score ?? 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RepoSelector projects={projects} active={activeRepo} onChange={setActiveRepo} />
        </div>
        <span style={{ fontSize: 9, color: C.dim }}>Pipeline every 5m</span>
      </div>

      {loading ? <div style={{ textAlign: 'center', color: C.muted, padding: 60 }}>Computing…</div> : (
        <>
          {/* Score Rings Row */}
          <div style={{ ...CARD, marginBottom: 12 }}>
            <div style={SECT}>❤️ Health Score</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 14, justifyItems: 'center' }}>
              <SVGScoreRing score={score} size={90} label="Overall" />
              <SVGScoreRing score={health?.codebase ?? 0} size={80} label="Codebase" />
              <SVGScoreRing score={health?.api ?? 0} size={80} label="API" />
              <SVGScoreRing score={health?.toon ?? 0} size={80} label="TOON" />
              <SVGScoreRing score={health?.issues ?? 0} size={80} label="Issues" />
            </div>
          </div>

          {/* TOON + Codebase */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={CARD}>
              <div style={SECT}>🧠 TOON Intelligence</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ textAlign: 'center', padding: 10, background: C.glass, borderRadius: 10, border: `1px solid ${C.gb}` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.purple }}>{health?.toon?.toFixed(0) ?? '—'}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>SCORE</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: C.glass, borderRadius: 10, border: `1px solid ${C.gb}` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{health?.codebase?.toFixed(0) ?? '—'}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>CODEBASE</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: C.glass, borderRadius: 10, border: `1px solid ${C.gb}` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{health?.api?.toFixed(0) ?? '—'}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>API</div>
                </div>
                <div style={{ textAlign: 'center', padding: 10, background: C.glass, borderRadius: 10, border: `1px solid ${C.gb}` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: C.yellow }}>{health?.issues?.toFixed(0) ?? '—'}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>ISSUES</div>
                </div>
              </div>
            </div>

            <div style={CARD}>
              <div style={SECT}>📁 Codebase</div>
              {latest ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    <div style={{ textAlign: 'center', padding: 10, background: C.glass, borderRadius: 10, border: `1px solid ${C.gb}` }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{latest.files_total?.toLocaleString()}</div><div style={{ fontSize: 9, color: C.muted }}>FILES</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 10, background: C.glass, borderRadius: 10, border: `1px solid ${C.gb}` }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{latest.lines_total?.toLocaleString()}</div><div style={{ fontSize: 9, color: C.muted }}>LINES</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 10, background: C.glass, borderRadius: 10, border: `1px solid ${C.gb}` }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: latest.ts_error_free ? C.green : C.red }}>{latest.ts_errors}</div><div style={{ fontSize: 9, color: C.muted }}>TS ERRORS</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ color: C.muted }}>Build</span>
                      <span style={{ color: latest.ts_error_free ? C.green : C.red, fontWeight: 500 }}>{latest.ts_error_free ? 'Clean' : 'Failed'} · {((latest.build_duration_ms||0)/1000).toFixed(1)}s</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ color: C.muted }}>Outdated deps</span>
                      <span style={{ color: latest.outdated_deps > 2 ? C.yellow : C.text, fontWeight: 500 }}>{latest.outdated_deps}</span>
                    </div>
                  </div>
                </>
              ) : <div style={{ fontSize:11,color:C.dim,textAlign:'center',padding:'30px 0'}}>No codebase data yet</div>}
            </div>
          </div>

          {/* API Health */}
          <div style={{ ...CARD, marginBottom: 12 }}>
            <div style={SECT}>🌐 API Health · {totalApi} requests</div>
            {totalApi > 0 ? (
              <>
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ width: `${(s200/totalApi)*100}%`, background: C.green }} />
                  <div style={{ width: `${((totalApi-s200-s500)/totalApi)*100}%`, background: C.yellow }} />
                  <div style={{ width: `${(s500/totalApi)*100}%`, background: C.red }} />
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 10, marginBottom: 8 }}>
                  <span style={{ color: C.green }}>● {((s200/totalApi)*100).toFixed(0)}% 2xx</span>
                  <span style={{ color: C.red }}>● {((s500/totalApi)*100).toFixed(0)}% 5xx</span>
                  <span style={{ color: C.muted }}>P95: {p95}ms</span>
                </div>
              </>
            ) : <div style={{ fontSize:11,color:C.dim,textAlign:'center',padding:'20px 0'}}>No API data yet</div>}
          </div>

          {/* Issues + Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={CARD}>
              <div style={SECT}>🐛 Issues · {issues.length} total</div>
              {issues.length > 0 ? issues.slice(0,6).map(i => {
                const sevColor = i.severity <= 2 ? C.red : i.severity === 3 ? C.yellow : C.dim
                const age = Math.round((Date.now() - new Date(i.created_at).getTime()) / 86400000)
                return (
                  <div key={i.id} style={{ display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:`1px solid ${C.gb}`,fontSize:11 }}>
                    <span style={{ width:6,height:6,borderRadius:'50%',background:sevColor,flexShrink:0 }} />
                    <span style={{ flex:1,color:i.severity<=2?C.text:C.muted,fontWeight:i.severity<=2?500:400 }}>{i.title}</span>
                    <span style={{ fontSize:9,padding:'1px 6px',borderRadius:4,background:C.glass,color:C.muted }}>{i.source}</span>
                    <span style={{ fontSize:10,color:age>7?C.yellow:C.dim }}>{age}d</span>
                  </div>
                )
              }) : <div style={{ fontSize:11,color:C.green,textAlign:'center',padding:'20px 0' }}>No open issues 🎉</div>}
            </div>

            <div style={CARD}>
              <div style={SECT}>💡 Recommendations</div>
              {recs.length > 0 ? recs.map(r => {
                const pcolor = r.priority === 0 ? C.red : r.priority === 1 ? C.yellow : C.accent
                return (
                  <div key={r.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${C.gb}` }}>
                    <div style={{ width:24,height:24,borderRadius:'50%',background:pcolor+'20',color:pcolor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0 }}>P{r.priority}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:11,fontWeight:600,color:pcolor }}>{r.title}</div>
                      <div style={{ fontSize:9,color:C.muted,marginTop:2 }}>{r.detail}</div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ fontSize:14,fontWeight:700,color:C.green }}>+{r.impact_points?.toFixed(1)}</div>
                      <div style={{ fontSize:8,color:C.dim }}>health pts</div>
                    </div>
                  </div>
                )
              }) : <div style={{ fontSize:11,color:C.green,textAlign:'center',padding:'20px 0' }}>All caught up</div>}
            </div>
          </div>

          {/* Timeline */}
          <div style={CARD}>
            <div style={SECT}>📅 Health Timeline</div>
            {events.length > 0 ? (
              <div style={{ position:'relative',paddingLeft:20,maxHeight:240,overflowY:'auto' }}>
                <div style={{ position:'absolute',left:8,top:6,bottom:6,width:1,background:C.gb }} />
                {events.slice(0,10).map(e => {
                  const ec = e.event_type === 'error_spike' ? C.red : e.event_type === 'anomaly' ? C.yellow : e.event_type === 'fix'||e.event_type==='recovery' ? C.green : C.accent
                  return (
                    <div key={e.id} style={{ position:'relative',marginBottom:8,fontSize:10 }}>
                      <div style={{ position:'absolute',left:-15,top:3,width:6,height:6,borderRadius:'50%',background:ec }} />
                      <div style={{ fontSize:9,color:C.dim }}>{new Date(e.occurred_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                      <div style={{ fontWeight:600,color:ec }}>{e.title}</div>
                      {e.detail && <div style={{ fontSize:9,color:C.muted }}>{e.detail}</div>}
                    </div>
                  )
                })}
              </div>
            ) : <div style={{ fontSize:11,color:C.dim,textAlign:'center',padding:'20px 0' }}>No events yet</div>}
          </div>
        </>
      )}
    </div>
  )
}
