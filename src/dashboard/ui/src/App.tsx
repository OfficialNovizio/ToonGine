import { useState, useEffect } from 'react';
import { usePolling } from './hooks/usePolling';
import { useWebSocket } from './hooks/useWebSocket';
import TokenBurn from './pages/TokenBurn';
import ProjectHealth from './pages/ProjectHealth';

/* ─── Design tokens ─── */
const colors = {
  bg: '#0a0e17',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  text: '#e4e8f0',
  muted: '#5a6478',
  accent: '#00d4ff',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  dim: '#3a3f4a',
};

const CARD: React.CSSProperties = {
  background: colors.glass,
  border: `1px solid ${colors.glassBorder}`,
  borderRadius: 14,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  padding: 20,
};

const glassCard: React.CSSProperties = CARD;

const SECT: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: colors.muted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 };

const glassPanel: React.CSSProperties = {
  ...glassCard,
  padding: 24,
};

/* ─── Shared sub-components ─── */

function StatBadge({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || colors.text }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0' }}>{children}</h2>;
}

function LoadingSpinner() {
  return <p style={{ textAlign: 'center', color: colors.muted, padding: 40 }}>Loading...</p>;
}

/* ─── Sub-tab definitions for Agents ─── */

type AgentSubTab = 'memory' | 'burn' | 'health';

/* ─── Page: Overview ─── */

function OverviewPage() {
  const health = usePolling<any>('/api/health', 10000);
  const live = useWebSocket('ws://localhost:3000/api/live');
  const stats = usePolling<any>('/api/engine/stats?hours=24', 15000);

  const h = health.data;
  const l = live.liveData;
  const s = stats.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <div style={glassCard}><StatBadge label="Health Score" value={h?.score ?? '—'} color={h?.score >= 80 ? colors.green : h?.score >= 50 ? colors.yellow : colors.red} /></div>
        <div style={glassCard}><StatBadge label="TOON Calls" value={l?.toonCalls ?? '—'} color={colors.accent} /></div>
        <div style={glassCard}><StatBadge label="Queries" value={l?.engineQueries ?? '—'} color={colors.accent} /></div>
        <div style={glassCard}><StatBadge label="Active Agents" value={l?.agentActivities ?? '—'} color={colors.purple} /></div>
        <div style={glassCard}><StatBadge label="Savings" value={s?.avgSavingsPercent != null ? `${s.avgSavingsPercent}%` : '—'} color={colors.green} /></div>
      </div>

      {l?.moduleStatuses && l.moduleStatuses.length > 0 && (
        <div style={glassPanel}>
          <SectionTitle>Module Status</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {l.moduleStatuses.map((m: any, i: number) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.glassBorder}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: m.connected ? colors.green : colors.red }} />
                <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: 11, color: colors.muted }}>{m.details}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {s?.byAgent && Object.keys(s.byAgent).length > 0 && (
        <div style={glassPanel}>
          <SectionTitle>By Agent (24h)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(s.byAgent).map(([agent, d]: [string, any]) => (
              <div key={agent} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{agent}</span>
                <span style={{ fontSize: 13, color: colors.muted }}>{d.queries} queries · {d.avgSavingsPercent ?? d.avgSavings}% saved</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!h && !l && !s && <LoadingSpinner />}
    </div>
  );
}

/* ─── Page: Efficiency ─── */

function EfficiencyPage() {
  const weekly = usePolling<any>('/api/efficiency/weekly?days=7', 20000);
  const contentTypes = usePolling<any>('/api/efficiency/content-types', 20000);
  const w = weekly.data;
  const c = contentTypes.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={glassPanel}>
        <SectionTitle>Weekly Efficiency</SectionTitle>
        {w ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {w.map((day: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 500, minWidth: 90 }}>{day.day}</span>
                <span style={{ fontSize: 13, color: colors.muted }}>{day.queries} queries</span>
                <span style={{ fontSize: 13, color: colors.muted }}>{day.activeAgents} agents</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.green }}>{day.avgSavings}% saved</span>
              </div>
            ))}
          </div>
        ) : <LoadingSpinner />}
      </div>
      <div style={glassPanel}>
        <SectionTitle>Content Type Efficiency</SectionTitle>
        {c ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {c.map((ct: any, i: number) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.glassBorder}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{ct.type}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
                  <span style={{ color: colors.muted }}>Raw:</span><span>{ct.rawBytes?.toLocaleString()} B</span>
                  <span style={{ color: colors.muted }}>TOON:</span><span>{ct.toonBytes?.toLocaleString()} B</span>
                  <span style={{ color: colors.muted }}>Savings:</span><span style={{ fontWeight: 600, color: ct.grade === 'A' || ct.savingsPercent > 70 ? colors.green : ct.savingsPercent > 40 ? colors.yellow : colors.red }}>{ct.savingsPercent}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : <LoadingSpinner />}
      </div>
    </div>
  );
}

/* ─── Page: Agents (with sub-tabs: Memory, Burn, Health) ─── */

function AgentsPage() {
  const [subTab, setSubTab] = useState<AgentSubTab>('memory');
  const infra = usePolling<any>('/api/agents/infra', 15000);
  const d = infra.data;
  const fmt = (n: number) => n?.toLocaleString?.() ?? String(n ?? 0);
  const kb = (b: number) => (b / 1024).toFixed(1);

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: colors.glass, borderRadius: 10, border: `1px solid ${colors.glassBorder}`, width: 'fit-content' }}>
        {[
          { key: 'memory' as AgentSubTab, label: '🧠 Agent Memory' },
          { key: 'burn' as AgentSubTab, label: '💰 Token Burn' },
          { key: 'health' as AgentSubTab, label: '🏥 Health' },
        ].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13,
            background: subTab === t.key ? colors.accent : 'transparent',
            color: subTab === t.key ? colors.bg : colors.muted,
            fontWeight: subTab === t.key ? 600 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Agent Memory (Infrastructure) subtab */}
      {subTab === 'memory' && (
        d ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {/* KPI Strip with icons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <div style={glassCard}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: 'rgba(168,85,247,0.15)', marginBottom: 6 }}>🧠</div>
                <div style={{ fontSize: 9, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Agent Memories</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.purple }}>{d.summary?.agentMemories ?? '—'}</div>
                <div style={{ fontSize: 9, color: colors.dim }}>{d.summary?.memoryTotalKB} KB total</div>
              </div>
              <div style={glassCard}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: 'rgba(34,197,94,0.15)', marginBottom: 6 }}>✓</div>
                <div style={{ fontSize: 9, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Completion</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.green }}>{d.summary?.completionRate != null ? `${d.summary.completionRate}%` : '—'}</div>
                <div style={{ fontSize: 9, color: colors.dim }}>task success</div>
              </div>
              <div style={glassCard}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: 'rgba(59,130,246,0.15)', marginBottom: 6 }}>🔗</div>
                <div style={{ fontSize: 9, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Graph Nodes</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent }}>{fmt(d.summary?.graphNodes)}</div>
                <div style={{ fontSize: 9, color: colors.dim }}>{fmt(d.summary?.graphEdges)} edges</div>
              </div>
              <div style={glassCard}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: 'rgba(245,158,11,0.15)', marginBottom: 6 }}>⭐</div>
                <div style={{ fontSize: 9, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Skills</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.yellow }}>{d.skillsTotal ?? 51}</div>
                <div style={{ fontSize: 9, color: colors.dim }}>loaded</div>
              </div>
              <div style={glassCard}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: 'rgba(236,72,153,0.15)', marginBottom: 6 }}>🔌</div>
                <div style={{ fontSize: 9, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Plugins</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.purple }}>{d.plugins?.length ?? '—'}</div>
                <div style={{ fontSize: 9, color: colors.dim }}>integrations</div>
              </div>
              <div style={glassCard}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: 'rgba(20,184,166,0.15)', marginBottom: 6 }}>📊</div>
                <div style={{ fontSize: 9, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Sessions</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent }}>{fmt(d.hermes?.sessions)}</div>
                <div style={{ fontSize: 9, color: colors.dim }}>{fmt(d.hermes?.tokensIn)} tokens in</div>
              </div>
            </div>

            {/* Row 1: Memory Health + Efficiency */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 12 }}>
              <div style={glassPanel}>
                <div style={{ ...SECT, marginTop: 0 }}>🧠 Memory Health</div>
                {d.memories?.slice(0, 10).map((m: any, i: number) => {
                  const pct = m.health;
                  const barColor = pct >= 90 ? colors.green : pct >= 70 ? colors.yellow : colors.red;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 11 }}>
                      <span style={{ width: 80, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.agent}</span>
                      <span style={{ fontSize: 9, color: colors.muted, width: 45 }}>{m.dept}</span>
                      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ width: 35, textAlign: 'right', fontFamily: 'SF Mono, monospace', fontSize: 9, color: colors.muted }}>{kb(m.size)}K</span>
                      <span style={{ width: 28, textAlign: 'right', fontWeight: 600, fontSize: 10, color: barColor }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <div style={glassPanel}>
                <div style={{ ...SECT, marginTop: 0 }}>⚡ Efficiency</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${colors.glassBorder}` }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.accent }}>{fmt(d.summary?.tokensIn)}</div>
                    <div style={{ fontSize: 8, color: colors.muted, textTransform: 'uppercase' }}>Tokens In</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${colors.glassBorder}` }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.green }}>{fmt(d.summary?.tokensOut)}</div>
                    <div style={{ fontSize: 8, color: colors.muted, textTransform: 'uppercase' }}>Tokens Out</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${colors.glassBorder}` }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.green }}>99.97%</div>
                    <div style={{ fontSize: 8, color: colors.muted, textTransform: 'uppercase' }}>TOON Savings</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${colors.glassBorder}` }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: colors.yellow }}>{d.summary?.completionRate ?? '—'}%</div>
                    <div style={{ fontSize: 8, color: colors.muted, textTransform: 'uppercase' }}>Success Rate</div>
                  </div>
                </div>
                {/* Inline errors */}
                {d.errors?.length > 0 && (
                  <div style={{ padding: 10, background: 'rgba(239,68,68,0.05)', borderRadius: 8, borderLeft: `3px solid ${colors.red}` }}>
                    {d.errors.slice(0, 3).map((e: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 6, fontSize: 10, padding: '2px 0' }}>
                        <span style={{ color: e.severity === 'critical' ? colors.red : colors.yellow, flexShrink: 0 }}>●</span>
                        <span style={{ color: colors.muted, flex: 1 }}>{e.title}: {e.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Graph + Plugin Health */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 12 }}>
              <div style={glassPanel}>
                <div style={{ ...SECT, marginTop: 0 }}>🔗 Knowledge Graph</div>
                {d.graph ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
                      <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                        <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
                        <circle cx={50} cy={50} r={40} fill="none" stroke={colors.accent} strokeWidth={6} strokeDasharray={251.3} strokeDashoffset={62.8} strokeLinecap="round" />
                      </svg>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: colors.accent }}>{d.graph.density || '—'}</div>
                        <div style={{ fontSize: 8, color: colors.muted, textTransform: 'uppercase' }}>DENSITY</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: 1 }}>
                        <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}><div style={{ fontSize: 16, fontWeight: 700, color: colors.purple }}>{fmt(d.graph.nodes)}</div><div style={{ fontSize: 8, color: colors.muted }}>NODES</div></div>
                        <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}><div style={{ fontSize: 16, fontWeight: 700, color: colors.accent }}>{fmt(d.graph.edges)}</div><div style={{ fontSize: 8, color: colors.muted }}>EDGES</div></div>
                        <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}><div style={{ fontSize: 16, fontWeight: 700, color: colors.green }}>{d.graph.highConfidence || '—'}</div><div style={{ fontSize: 8, color: colors.muted }}>HIGH CONF</div></div>
                        <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}><div style={{ fontSize: 16, fontWeight: 700, color: colors.yellow }}>{d.graph.tools?.length || 0}</div><div style={{ fontSize: 8, color: colors.muted }}>TOOLS</div></div>
                      </div>
                    </div>
                    {/* Kind breakdown chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {d.graph.kinds?.map((k: any, i: number) => (
                        <span key={i} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.03)', color: colors.muted, border: `1px solid ${colors.glassBorder}` }}>{k.kind}: {k.count}</span>
                      ))}
                    </div>
                    {d.graph.tools?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                        {d.graph.tools.map((t: any, i: number) => (
                          <span key={i} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 999, background: 'rgba(59,130,246,0.08)', color: colors.accent, border: `1px solid rgba(59,130,246,0.15)` }}>{t.tool}: {t.count}</span>
                        ))}
                      </div>
                    )}
                  </>
                ) : <div style={{fontSize:11,color:colors.muted,textAlign:'center',padding:30}}>Graph data unavailable</div>}
              </div>

              <div style={glassPanel}>
                <div style={{ ...SECT, marginTop: 0 }}>🔌 Plugin Health</div>
                {d.plugins?.map((p: any, i: number) => {
                  const dotColor = p.status === 'ok' ? colors.green : p.status === 'warn' ? colors.yellow : colors.red;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: 11 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, boxShadow: p.status === 'ok' ? `0 0 5px ${dotColor}40` : 'none' }} />
                      <span style={{ flex: 1, fontWeight: 500, color: colors.text }}>{p.name}</span>
                      <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999, fontWeight: 600, background: dotColor + '12', color: dotColor, border: `1px solid ${dotColor}22` }}>{p.status === 'ok' ? 'online' : p.status === 'warn' ? 'degraded' : 'error'}</span>
                      <span style={{ fontSize: 9, color: colors.muted, fontFamily: 'SF Mono, monospace' }}>{p.detail}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Hermes + Error Log */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 12 }}>
              <div style={glassPanel}>
                <div style={{ ...SECT, marginTop: 0 }}>📡 Hermes Connection</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                  <div><span style={{ color: colors.muted }}>Status: </span><span style={{ fontWeight: 600, color: colors.green }}>🟢 Connected</span></div>
                  <div><span style={{ color: colors.muted }}>Version: </span><span style={{ fontWeight: 600, color: colors.text }}>v0.16</span></div>
                  <div><span style={{ color: colors.muted }}>Provider: </span><span style={{ fontWeight: 600, color: colors.text }}>DeepSeek v4</span></div>
                  <div><span style={{ color: colors.muted }}>Model: </span><span style={{ fontWeight: 600, color: colors.text }}>deepseek-v4-pro</span></div>
                  <div><span style={{ color: colors.muted }}>Sessions: </span><span style={{ fontWeight: 600, color: colors.text }}>{fmt(d.hermes?.sessions)}</span></div>
                  <div><span style={{ color: colors.muted }}>Skills: </span><span style={{ fontWeight: 600, color: colors.text }}>{d.skillsTotal}</span></div>
                  <div><span style={{ color: colors.muted }}>Tokens In: </span><span style={{ fontWeight: 600, color: colors.text }}>{fmt(d.hermes?.tokensIn)}</span></div>
                  <div><span style={{ color: colors.muted }}>Gateway: </span><span style={{ fontWeight: 600, color: colors.green }}>Telegram ✓</span></div>
                  <div><span style={{ color: colors.muted }}>Cron Jobs: </span><span style={{ fontWeight: 600, color: colors.text }}>5 active</span></div>
                  <div><span style={{ color: colors.muted }}>State DB: </span><span style={{ fontWeight: 600, color: colors.text }}>{fmt(d.hermes?.sessions)} sessions</span></div>
                </div>
              </div>

              <div style={glassPanel}>
                <div style={{ ...SECT, marginTop: 0 }}>📋 Error Log</div>
                {d.errors?.length > 0 ? (
                  <>
                    <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                      {d.errors.map((e: any, i: number) => (
                        <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: e.severity === 'critical' ? colors.red : colors.yellow, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: e.severity === 'critical' ? colors.red : colors.yellow }}>{e.title}</span>
                            <span style={{ fontSize: 9, color: colors.muted, marginLeft: 'auto' }}>{e.ago}</span>
                          </div>
                          <div style={{ fontSize: 9, color: colors.muted, marginTop: 1, paddingLeft: 11 }}>{e.detail}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 9 }}>
                      <span style={{ color: colors.red }}>{d.errors.filter((e: any) => e.severity === 'critical').length} critical</span>
                      <span style={{ color: colors.yellow }}>{d.errors.filter((e: any) => e.severity === 'warning').length} warnings</span>
                      <span style={{ color: colors.green, marginLeft: 'auto' }}>monitored</span>
                    </div>
                  </>
                ) : <div style={{ color: colors.green, fontSize: 11, textAlign: 'center', padding: 30 }}>✅ No errors detected</div>}
              </div>
            </div>
          </div>
        ) : <LoadingSpinner />
      )}

      {/* Token Burn subtab */}
      {subTab === 'burn' && <TokenBurn />}

      {/* Health subtab */}
      {subTab === 'health' && <ProjectHealth />}
    </div>
  );
}

/* ─── Page: TOON ─── */

function ToonPage() {
  const stats = usePolling<any>('/api/engine/stats?hours=24', 10000);
  const queries = usePolling<any[]>('/api/engine/queries?limit=50', 10000);
  const s = stats.data;
  const q = queries.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={glassPanel}>
        <SectionTitle>TOON Compression Stats (24h)</SectionTitle>
        {s ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <StatBadge label="Total Queries" value={s.totalQueries ?? '—'} color={colors.accent} />
            <StatBadge label="Avg Savings" value={s.avgSavingsPercent != null ? `${s.avgSavingsPercent}%` : '—'} color={colors.green} />
            <StatBadge label="Agents" value={Object.keys(s.byAgent || {}).length} color={colors.purple} />
          </div>
        ) : <LoadingSpinner />}
        {s?.savingsTrend && s.savingsTrend.length > 0 && (
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>SAVINGS TREND (24H)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
              {s.savingsTrend.map((v: number, i: number) => {
                const max = Math.max(...s.savingsTrend, 1);
                return <div key={i} style={{ flex: 1, height: `${Math.max((v / max) * 100, 2)}%`, borderRadius: '2px 2px 0 0', background: `linear-gradient(to top, ${colors.accent}, ${colors.accent}88)` }} title={`${v}%`} />;
              })}
            </div>
          </div>
        )}
      </div>
      {q && (
        <div style={glassPanel}>
          <SectionTitle>Recent Engine Queries</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.slice(0, 20).map((eq: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.query || eq.prompt || eq.id}</span>
                <span style={{ color: colors.muted, marginLeft: 12, whiteSpace: 'nowrap' }}>{eq.agent || eq.agentId} · {eq.savingsPercent ?? eq.avgSavings}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page: Cost ─── */

function CostPage() {
  const cost = usePolling<any>('/api/cost?hours=24', 10000);
  const providers = usePolling<any[]>('/api/cost/providers?hours=24', 15000);
  const balance = usePolling<any>('/api/cost/balance', 30000);
  const c = cost.data; const p = providers.data; const b = balance.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={glassPanel}>
        <SectionTitle>Cost Summary (24h)</SectionTitle>
        {c ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            <StatBadge label="Total Spent" value={`$${c.totalSpent?.toFixed(4)}`} color={colors.red} />
            <StatBadge label="Total Saved" value={`$${c.totalSaved?.toFixed(4)}`} color={colors.green} />
            <StatBadge label="Net Cost" value={`$${c.netCost?.toFixed(4)}`} color={c.netCost < 0 ? colors.green : colors.red} />
            {b && <StatBadge label="Balance" value={`$${b.balance?.toFixed(2)}`} color={colors.accent} />}
            {b && <StatBadge label="Depletion" value={`${b.depletionDays} days`} color={b.depletionDays > 30 ? colors.green : b.depletionDays > 7 ? colors.yellow : colors.red} />}
          </div>
        ) : <LoadingSpinner />}
        {c?.byModel && Object.keys(c.byModel).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: colors.muted }}>BY MODEL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(c.byModel).map(([model, d]: [string, any]) => (
                <div key={model} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 500 }}>{model}</span><span style={{ color: colors.red }}>${d.cost?.toFixed(4) ?? d.totalSpent?.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {p && (
        <div style={glassPanel}>
          <SectionTitle>Provider Costs</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.map((prov: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{prov.provider}</div><div style={{ fontSize: 11, color: colors.muted }}>{prov.model} · {prov.calls} calls</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 600, color: colors.red }}>${prov.cost?.toFixed(4)}</div>{prov.avgSavings != null && <div style={{ fontSize: 11, color: colors.green }}>{prov.avgSavings}% saved</div>}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page: Simulator ─── */

function SimulatorPage() {
  const providers = usePolling<any[]>('/api/simulator/providers', 30000);
  const [scenario, setScenario] = useState('medium');
  const [pricing, setPricing] = useState('default');
  const [result, setResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  async function runSimulation() {
    setSimLoading(true); setSimError(null);
    try {
      const res = await fetch('/api/simulator/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, pricing }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (err: any) { setSimError(err.message); }
    setSimLoading(false);
  }

  const p = providers.data;
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={glassPanel}>
        <SectionTitle>Cost Simulator</SectionTitle>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={{ fontSize: 12, color: colors.muted }}>Scenario</span>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={{ background: colors.glass, color: colors.text, border: `1px solid ${colors.glassBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
              <option value="low">Low Usage</option><option value="medium">Medium Usage</option><option value="high">High Usage</option><option value="burst">Burst</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={{ fontSize: 12, color: colors.muted }}>Pricing</span>
            <select value={pricing} onChange={e => setPricing(e.target.value)} style={{ background: colors.glass, color: colors.text, border: `1px solid ${colors.glassBorder}`, borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
              <option value="default">Default</option><option value="premium">Premium</option><option value="budget">Budget</option>
            </select>
          </label>
          <button onClick={runSimulation} disabled={simLoading} style={{ background: colors.accent, color: colors.bg, border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: simLoading ? 'not-allowed' : 'pointer', opacity: simLoading ? 0.6 : 1 }}>{simLoading ? 'Running...' : 'Run Simulation'}</button>
        </div>
        {simError && <p style={{ color: colors.red, fontSize: 13 }}>{simError}</p>}
        {result && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <div style={glassCard}><StatBadge label="Projected" value={`$${result.projected?.toFixed(2)}`} color={colors.accent} /></div>
            <div style={glassCard}><StatBadge label="Current Monthly" value={`$${result.currentMonthly?.toFixed(2)}`} color={colors.muted} /></div>
            {result.pricing && <div style={glassCard}><StatBadge label="Pricing Tier" value={result.pricing} color={colors.purple} /></div>}
          </div>
        )}
      </div>
      {p && (
        <div style={glassPanel}>
          <SectionTitle>Available Providers</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {p.map((prov: any, i: number) => (
              <div key={i} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.025)', borderRadius: 10, border: `1px solid ${colors.glassBorder}`, fontSize: 13, fontWeight: 500 }}>{prov.provider || prov.name || prov}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page: System ─── */

function SystemPage() {
  const health = usePolling<any>('/api/health', 10000);
  const modules = usePolling<any[]>('/api/modules', 10000);
  const anomalies = usePolling<any[]>('/api/engine/anomalies?hours=24', 15000);
  const compiles = usePolling<any[]>('/api/compiles?limit=20', 15000);
  const h = health.data; const m = modules.data; const a = anomalies.data; const c = compiles.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {h && (
        <div style={glassPanel}>
          <SectionTitle>Health Details</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <StatBadge label="Score" value={h.score} color={h.score >= 80 ? colors.green : h.score >= 50 ? colors.yellow : colors.red} />
            <StatBadge label="Penalties" value={h.penalties ?? 0} color={colors.red} />
            <StatBadge label="Components" value={h.components ?? '—'} />
            <StatBadge label="Uptime" value={h.uptime ?? '—'} color={colors.accent} />
            <StatBadge label="Version" value={h.version ?? '—'} color={colors.purple} />
          </div>
        </div>
      )}
      {m && (
        <div style={glassPanel}>
          <SectionTitle>Modules</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {m.map((mod: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: mod.status === 'ok' || mod.healthy ? colors.green : mod.status === 'degraded' ? colors.yellow : colors.red }} /><span style={{ fontSize: 13, fontWeight: 500 }}>{mod.name || mod.module}</span></div>
                <span style={{ fontSize: 12, color: colors.muted }}>{mod.status || mod.version || mod.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {a && a.length > 0 && (
        <div style={glassPanel}>
          <SectionTitle>Anomalies (24h)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {a.map((an: any, i: number) => {
              const sevColor = an.severity === 'critical' ? colors.red : an.severity === 'warning' ? colors.yellow : colors.accent;
              return (
                <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10, borderLeft: `3px solid ${sevColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{an.type}</span><span style={{ fontSize: 11, color: sevColor, textTransform: 'uppercase' }}>{an.severity}</span></div>
                  <div style={{ fontSize: 12, color: colors.muted }}>{an.detail} · Agent: {an.agent}</div>
                  {an.action && <div style={{ fontSize: 11, color: colors.accent, marginTop: 4 }}>Action: {an.action}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {c && c.length > 0 && (
        <div style={glassPanel}>
          <SectionTitle>Recent Compiles</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.slice(0, 10).map((rec: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 8, fontSize: 12 }}>
                <span style={{ fontWeight: 500 }}>{rec.id || rec.name || `#${i + 1}`}</span><span style={{ color: colors.muted }}>{rec.status || rec.timestamp || rec.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!h && !m && <LoadingSpinner />}
    </div>
  );
}

/* ─── Main App ─── */

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'efficiency', label: 'Efficiency' },
  { key: 'agents', label: 'Agents' },
  { key: 'toon', label: 'TOON' },
  { key: 'cost', label: 'Cost' },
  { key: 'simulator', label: 'Simulator' },
  { key: 'system', label: '⚙ System' },
] as const;

export default function App() {
  const [tab, setTab] = useState<string>('overview');
  const health = usePolling<any>('/api/health', 15000);
  const h = health.data;
  const healthScore = h?.score;
  const scoreColor = healthScore >= 80 ? colors.green : healthScore >= 50 ? colors.yellow : colors.red;
  const version = h?.version || '—';
  const uptime = h?.uptime || '—';

  return (
    <div style={{ minHeight: '100vh', padding: '16px 20px', maxWidth: 1400, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>⚡ ToonGine</h1><div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>v{version}</div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: scoreColor }} /><span style={{ fontSize: 13, fontWeight: 600 }}>{healthScore ?? '—'}</span></div>
          <div style={{ fontSize: 12, color: colors.muted }}>Uptime: {uptime}</div>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 4, marginBottom: 24, background: colors.glass, borderRadius: 12, padding: 4, border: `1px solid ${colors.glassBorder}`, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ border: 'none', background: tab === t.key ? colors.accent : 'transparent', color: tab === t.key ? colors.bg : colors.muted, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.label}</button>
        ))}
      </nav>

      <main>
        {tab === 'overview' && <OverviewPage />}
        {tab === 'efficiency' && <EfficiencyPage />}
        {tab === 'agents' && <AgentsPage />}
        {tab === 'toon' && <ToonPage />}
        {tab === 'cost' && <CostPage />}
        {tab === 'simulator' && <SimulatorPage />}
        {tab === 'system' && <SystemPage />}
      </main>
    </div>
  );
}
