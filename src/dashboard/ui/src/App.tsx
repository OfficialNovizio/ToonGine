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
};

const glassCard: React.CSSProperties = {
  background: colors.glass,
  border: `1px solid ${colors.glassBorder}`,
  borderRadius: 14,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  padding: 20,
};

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

/* ─── Tab pages ─── */

function OverviewPage() {
  const health = usePolling<any>('/api/health', 10000);
  const live = useWebSocket('ws://localhost:4200/api/live');
  const stats = usePolling<any>('/api/engine/stats?hours=24', 15000);

  const h = health.data;
  const l = live.liveData;
  const s = stats.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <div style={glassCard}>
          <StatBadge label="Health Score" value={h?.score ?? '—'} color={h?.score >= 80 ? colors.green : h?.score >= 50 ? colors.yellow : colors.red} />
        </div>
        <div style={glassCard}>
          <StatBadge label="TOON Calls" value={l?.toonCalls ?? '—'} color={colors.accent} />
        </div>
        <div style={glassCard}>
          <StatBadge label="Queries" value={l?.engineQueries ?? '—'} color={colors.accent} />
        </div>
        <div style={glassCard}>
          <StatBadge label="Active Agents" value={l?.agentActivities ?? '—'} color={colors.purple} />
        </div>
        <div style={glassCard}>
          <StatBadge label="Savings" value={s?.avgSavingsPercent != null ? `${s.avgSavingsPercent}%` : '—'} color={colors.green} />
        </div>
      </div>

      {/* Live modules */}
      {l?.moduleStatuses && l.moduleStatuses.length > 0 && (
        <div style={glassPanel}>
          <SectionTitle>Module Status</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {l.moduleStatuses.map((m: any, i: number) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.glassBorder}`,
                borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: m.connected ? colors.green : colors.red,
                }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By agent breakdown */}
      {s?.byAgent && Object.keys(s.byAgent).length > 0 && (
        <div style={glassPanel}>
          <SectionTitle>By Agent (24h)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(s.byAgent).map(([agent, d]: [string, any]) => (
              <div key={agent} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{agent}</span>
                <span style={{ fontSize: 13, color: colors.muted }}>
                  {d.queries} queries · {d.avgSavingsPercent ?? d.avgSavings}% saved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* If no data yet */}
      {!h && !l && !s && <LoadingSpinner />}
    </div>
  );
}

function EfficiencyPage() {
  const weekly = usePolling<any>('/api/efficiency/weekly?days=7', 20000);
  const contentTypes = usePolling<any>('/api/efficiency/content-types', 20000);

  const w = weekly.data;
  const c = contentTypes.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Weekly trend */}
      <div style={glassPanel}>
        <SectionTitle>Weekly Efficiency</SectionTitle>
        {w ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {w.map((day: any, i: number) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, minWidth: 90 }}>{day.day}</span>
                <span style={{ fontSize: 13, color: colors.muted }}>{day.queries} queries</span>
                <span style={{ fontSize: 13, color: colors.muted }}>{day.activeAgents} agents</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.green }}>{day.avgSavings}% saved</span>
              </div>
            ))}
          </div>
        ) : <LoadingSpinner />}
      </div>

      {/* Content type efficiency */}
      <div style={glassPanel}>
        <SectionTitle>Content Type Efficiency</SectionTitle>
        {c ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {c.map((ct: any, i: number) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.glassBorder}`,
                borderRadius: 10, padding: 16,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{ct.type}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
                  <span style={{ color: colors.muted }}>Raw:</span><span>{ct.rawBytes?.toLocaleString()} B</span>
                  <span style={{ color: colors.muted }}>TOON:</span><span>{ct.toonBytes?.toLocaleString()} B</span>
                  <span style={{ color: colors.muted }}>Savings:</span>
                  <span style={{ fontWeight: 600, color: ct.grade === 'A' || ct.savingsPercent > 70 ? colors.green : ct.savingsPercent > 40 ? colors.yellow : colors.red }}>
                    {ct.savingsPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : <LoadingSpinner />}
      </div>
    </div>
  );
}

function AgentsPage() {
  const agents = usePolling<any[]>('/api/agents/efficiency?hours=24', 15000);
  const a = agents.data;

  const gradeColor = (g: string) => {
    if (!g) return colors.muted;
    if (g.startsWith('A')) return colors.green;
    if (g.startsWith('B')) return colors.accent;
    if (g.startsWith('C')) return colors.yellow;
    return colors.red;
  };

  return (
    <div style={glassPanel}>
      <SectionTitle>Agent Efficiency (24h)</SectionTitle>
      {a ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {a.map((agent: any, i: number) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
              padding: '12px 16px', background: 'rgba(255,255,255,0.025)', borderRadius: 10,
              border: `1px solid ${colors.glassBorder}`,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{agent.agentId}</div>
                <div style={{ fontSize: 11, color: colors.muted }}>{agent.queries} queries · ~${agent.costEstimate?.toFixed(4)} cost</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 13, color: colors.muted }}>{agent.avgSavings}% avg savings</div>
                <span style={{
                  fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 6,
                  background: gradeColor(agent.efficiencyGrade) + '22',
                  color: gradeColor(agent.efficiencyGrade),
                  border: `1px solid ${gradeColor(agent.efficiencyGrade)}44`,
                }}>{agent.efficiencyGrade}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <LoadingSpinner />}
    </div>
  );
}

function ToonPage() {
  const stats = usePolling<any>('/api/engine/stats?hours=24', 10000);
  const queries = usePolling<any[]>('/api/engine/queries?limit=50', 10000);

  const s = stats.data;
  const q = queries.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Stats overview */}
      <div style={glassPanel}>
        <SectionTitle>TOON Compression Stats (24h)</SectionTitle>
        {s ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <StatBadge label="Total Queries" value={s.totalQueries ?? '—'} color={colors.accent} />
            <StatBadge label="Avg Savings" value={s.avgSavingsPercent != null ? `${s.avgSavingsPercent}%` : '—'} color={colors.green} />
            <StatBadge label="Agents" value={Object.keys(s.byAgent || {}).length} color={colors.purple} />
          </div>
        ) : <LoadingSpinner />}

        {/* Savings trend sparkline placeholder */}
        {s?.savingsTrend && s.savingsTrend.length > 0 && (
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>SAVINGS TREND (24H)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
              {s.savingsTrend.map((v: number, i: number) => {
                const max = Math.max(...s.savingsTrend, 1);
                const h = (v / max) * 100;
                return (
                  <div key={i} style={{
                    flex: 1, height: `${Math.max(h, 2)}%`, borderRadius: '2px 2px 0 0',
                    background: `linear-gradient(to top, ${colors.accent}, ${colors.accent}88)`,
                  }} title={`${v}%`} />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent queries */}
      {q && (
        <div style={glassPanel}>
          <SectionTitle>Recent Engine Queries</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.slice(0, 20).map((eq: any, i: number) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 8,
                fontSize: 12,
              }}>
                <span style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {eq.query || eq.prompt || eq.id}
                </span>
                <span style={{ color: colors.muted, marginLeft: 12, whiteSpace: 'nowrap' }}>
                  {eq.agent || eq.agentId} · {eq.savingsPercent ?? eq.avgSavings}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CostPage() {
  const cost = usePolling<any>('/api/cost?hours=24', 10000);
  const providers = usePolling<any[]>('/api/cost/providers?hours=24', 15000);
  const balance = usePolling<any>('/api/cost/balance', 30000);

  const c = cost.data;
  const p = providers.data;
  const b = balance.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Cost summary */}
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

        {/* By model breakdown */}
        {c?.byModel && Object.keys(c.byModel).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: colors.muted }}>BY MODEL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(c.byModel).map(([model, d]: [string, any]) => (
                <div key={model} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 8,
                  fontSize: 13,
                }}>
                  <span style={{ fontWeight: 500 }}>{model}</span>
                  <span style={{ color: colors.red }}>${d.cost?.toFixed(4) ?? d.totalSpent?.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Provider breakdown */}
      {p && (
        <div style={glassPanel}>
          <SectionTitle>Provider Costs</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.map((prov: any, i: number) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{prov.provider}</div>
                  <div style={{ fontSize: 11, color: colors.muted }}>{prov.model} · {prov.calls} calls</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.red }}>${prov.cost?.toFixed(4)}</div>
                  {prov.avgSavings != null && <div style={{ fontSize: 11, color: colors.green }}>{prov.avgSavings}% saved</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SimulatorPage() {
  const providers = usePolling<any[]>('/api/simulator/providers', 30000);
  const [scenario, setScenario] = useState('medium');
  const [pricing, setPricing] = useState('default');
  const [result, setResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  async function runSimulation() {
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await fetch('/api/simulator/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, pricing }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setSimError(err.message);
    } finally {
      setSimLoading(false);
    }
  }

  const p = providers.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={glassPanel}>
        <SectionTitle>Cost Simulator</SectionTitle>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: colors.muted }}>Scenario</span>
            <select value={scenario} onChange={e => setScenario(e.target.value)} style={{
              background: colors.glass, color: colors.text, border: `1px solid ${colors.glassBorder}`,
              borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', outline: 'none',
            }}>
              <option value="low">Low Usage</option>
              <option value="medium">Medium Usage</option>
              <option value="high">High Usage</option>
              <option value="burst">Burst</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, color: colors.muted }}>Pricing</span>
            <select value={pricing} onChange={e => setPricing(e.target.value)} style={{
              background: colors.glass, color: colors.text, border: `1px solid ${colors.glassBorder}`,
              borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer', outline: 'none',
            }}>
              <option value="default">Default</option>
              <option value="premium">Premium</option>
              <option value="budget">Budget</option>
            </select>
          </label>

          <button onClick={runSimulation} disabled={simLoading} style={{
            background: colors.accent, color: colors.bg, border: 'none',
            borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600,
            cursor: simLoading ? 'not-allowed' : 'pointer', opacity: simLoading ? 0.6 : 1,
          }}>
            {simLoading ? 'Running...' : 'Run Simulation'}
          </button>
        </div>

        {simError && <p style={{ color: colors.red, fontSize: 13 }}>{simError}</p>}

        {result && (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <div style={glassCard}>
              <StatBadge label="Projected" value={`$${result.projected?.toFixed(2)}`} color={colors.accent} />
            </div>
            <div style={glassCard}>
              <StatBadge label="Current Monthly" value={`$${result.currentMonthly?.toFixed(2)}`} color={colors.muted} />
            </div>
            {result.pricing && <div style={glassCard}><StatBadge label="Pricing Tier" value={result.pricing} color={colors.purple} /></div>}
          </div>
        )}
      </div>

      {/* Available providers */}
      {p && (
        <div style={glassPanel}>
          <SectionTitle>Available Providers</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {p.map((prov: any, i: number) => (
              <div key={i} style={{
                padding: '12px 16px', background: 'rgba(255,255,255,0.025)',
                borderRadius: 10, border: `1px solid ${colors.glassBorder}`,
                fontSize: 13, fontWeight: 500,
              }}>
                {prov.provider || prov.name || prov}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SystemPage() {
  const health = usePolling<any>('/api/health', 10000);
  const modules = usePolling<any[]>('/api/modules', 10000);
  const anomalies = usePolling<any[]>('/api/engine/anomalies?hours=24', 15000);
  const compiles = usePolling<any[]>('/api/compiles?limit=20', 15000);
  const config = usePolling<any>('/api/config', 30000);

  const h = health.data;
  const m = modules.data;
  const a = anomalies.data;
  const c = compiles.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Health details */}
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

      {/* Modules */}
      {m && (
        <div style={glassPanel}>
          <SectionTitle>Modules</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {m.map((mod: any, i: number) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: mod.status === 'ok' || mod.healthy ? colors.green : mod.status === 'degraded' ? colors.yellow : colors.red,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{mod.name || mod.module}</span>
                </div>
                <span style={{ fontSize: 12, color: colors.muted }}>{mod.status || mod.version || mod.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {a && a.length > 0 && (
        <div style={glassPanel}>
          <SectionTitle>Anomalies (24h)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {a.map((an: any, i: number) => {
              const sevColor = an.severity === 'critical' ? colors.red : an.severity === 'warning' ? colors.yellow : colors.accent;
              return (
                <div key={i} style={{
                  padding: '10px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10,
                  borderLeft: `3px solid ${sevColor}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{an.type}</span>
                    <span style={{ fontSize: 11, color: sevColor, textTransform: 'uppercase' }}>{an.severity}</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.muted }}>{an.detail} · Agent: {an.agent}</div>
                  {an.action && <div style={{ fontSize: 11, color: colors.accent, marginTop: 4 }}>Action: {an.action}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compile records */}
      {c && c.length > 0 && (
        <div style={glassPanel}>
          <SectionTitle>Recent Compiles</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.slice(0, 10).map((rec: any, i: number) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 12px',
                background: 'rgba(255,255,255,0.025)', borderRadius: 8, fontSize: 12,
              }}>
                <span style={{ fontWeight: 500 }}>{rec.id || rec.name || `#${i + 1}`}</span>
                <span style={{ color: colors.muted }}>{rec.status || rec.timestamp || rec.time}</span>
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
  { key: 'tokenburn', label: '💰 Burn' },
  { key: 'health', label: '🏥 Health' },
  { key: 'simulator', label: 'Simulator' },
  { key: 'system', label: '⚙' },
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
      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
            ⚡ ToonGine
          </h1>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>v{version}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: scoreColor,
            }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{healthScore ?? '—'}</span>
          </div>
          <div style={{ fontSize: 12, color: colors.muted }}>
            Uptime: {uptime}
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: colors.glass, borderRadius: 12, padding: 4,
        border: `1px solid ${colors.glassBorder}`,
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              border: 'none',
              background: tab === t.key ? colors.accent : 'transparent',
              color: tab === t.key ? colors.bg : colors.muted,
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Page content */}
      <main>
        {tab === 'overview' && <OverviewPage />}
        {tab === 'efficiency' && <EfficiencyPage />}
        {tab === 'agents' && <AgentsPage />}
        {tab === 'toon' && <ToonPage />}
        {tab === 'cost' && <CostPage />}
        {tab === 'tokenburn' && <TokenBurn />}
        {tab === 'health' && <ProjectHealth />}
        {tab === 'simulator' && <SimulatorPage />}
        {tab === 'system' && <SystemPage />}
      </main>
    </div>
  );
}
