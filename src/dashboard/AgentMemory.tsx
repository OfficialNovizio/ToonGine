import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { AgentMemoryData } from './types'

const CHART_COLORS = ['#5ee0ff', '#c08bff', '#5fd0b4', '#ffb693', '#ff8a80', '#a78bfa', '#f59e0b', '#34d399']
const darkStyle = { axis: '#ffffff20', text: '#8892a8', grid: '#ffffff08', tooltip: { bg: '#1a1d28', border: '#ffffff10', text: '#e4e8f0' } }

function statusColor(health: number) { return health >= 90 ? '#34d399' : health >= 70 ? '#5ee0ff' : health >= 50 ? '#f59e0b' : '#f87171' }
function pluginColor(s: 'ok' | 'warn' | 'error') { return s === 'ok' ? '#34d399' : s === 'warn' ? '#f59e0b' : '#f87171' }

function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return <div className="glass-card p-3 text-center">
    <div className="text-[12px] font-bold" style={{ color: color || '#e4e8f0' }}>{value}</div>
    <div className="text-[10px] text-on-surface-variant mt-0.5">{label}</div>
  </div>
}

interface Props { data: AgentMemoryData }

export function AgentMemory({ data }: Props) {
  if (!data) return <div className="text-on-surface-variant text-sm p-8 text-center">No agent memory data. Run agents to populate.</div>
  const totalMemMb = (data.memoryTotalSize / 1024 / 1024).toFixed(1)
  const totalTokensM = ((data.hermes.tokensIn + data.hermes.tokensOut) / 1e6).toFixed(1)

  return <div className="space-y-4">

    {/* ── KPI Row ── */}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatPill label="AGENTS ACTIVE" value={data.memoryAgentCount} color="#5ee0ff" />
      <StatPill label="MEMORY TOTAL" value={`${totalMemMb} MB`} color="#c08bff" />
      <StatPill label="SESSIONS" value={data.hermes.sessions.toLocaleString()} color="#5fd0b4" />
      <StatPill label="TOKENS BURNED" value={`${totalTokensM}M`} color="#ff8a80" />
    </div>

    {/* ── Agent Roster ── */}
    <div className="glass-card p-4">
      <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">🕵️ Agent Roster</div>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {data.memories.map(m => (
          <div key={`${m.dept}/${m.agent}`} className="flex items-center gap-3 rounded-lg bg-white/[0.02] px-3 py-2 text-[12px]">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor(m.health) }} />
            <span className="text-on-surface-variant/50 text-[10px] min-w-[48px]">{m.dept}</span>
            <span className="text-on-surface font-medium flex-1">{m.agent}</span>
            <span className="text-on-surface-variant tabular-nums text-[11px]">{formatBytes(m.size)}</span>
            <div className="w-16 h-1.5 rounded-full bg-white/[0.04]">
              <div className="h-1.5 rounded-full" style={{ width: `${m.health}%`, background: statusColor(m.health) }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ── Graph + Skills ── */}
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {data.graph && (
        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">🧬 Knowledge Graph</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center"><div className="text-lg font-bold text-[#5ee0ff]">{(data.graph.nodes/1000).toFixed(1)}K</div><div className="text-[10px] text-on-surface-variant">Nodes</div></div>
            <div className="text-center"><div className="text-lg font-bold text-[#c08bff]">{(data.graph.edges/1000).toFixed(1)}K</div><div className="text-[10px] text-on-surface-variant">Edges</div></div>
            <div className="text-center"><div className="text-lg font-bold text-[#5fd0b4]">{data.graph.density}</div><div className="text-[10px] text-on-surface-variant">Density</div></div>
          </div>
          <div className="space-y-1 text-[11px]">
            {data.graph.kinds.slice(0,4).map(k => (
              <div key={k.kind} className="flex justify-between"><span className="text-on-surface-variant/70">{k.kind}</span><span className="text-on-surface tabular-nums">{k.count.toLocaleString()}</span></div>
            ))}
            <div className="flex justify-between border-t border-white/[0.04] pt-1 mt-1"><span className="text-on-surface-variant/70">High-confidence edges (≥0.9)</span><span className="text-on-surface tabular-nums">{data.graph.highConfidence.toLocaleString()}</span></div>
          </div>
          <div className="mt-2 text-center"><span className="text-[11px] text-on-surface-variant font-semibold">Skills: </span><span className="text-[11px] text-[#5fd0b4] tabular-nums">{data.skillsTotal}</span></div>
        </div>
      )}

      {/* ── Plugin Health ── */}
      <div className="glass-card p-4">
        <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">🔌 Plugin Health</div>
        <div className="space-y-2">
          {data.plugins.map(p => (
            <div key={p.name} className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pluginColor(p.status) }} />
                <span className="text-on-surface-variant">{p.name}</span>
              </div>
              <span className="text-on-surface-variant/60 text-[11px]">{p.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ── Agent Efficiency (top performers) ── */}
    {data.agentEfficiency.length > 0 && (
      <div className="glass-card p-4">
        <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">📊 Agent Efficiency (top performers)</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.agentEfficiency.slice(0, 8)} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkStyle.grid} />
            <XAxis type="number" tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} />
            <YAxis type="category" dataKey="agent" tick={{ fontSize: 10, fill: darkStyle.text }} width={80} />
            <Tooltip contentStyle={{ background: darkStyle.tooltip.bg, border: `1px solid ${darkStyle.tooltip.border}`, borderRadius: 8, color: darkStyle.tooltip.text, fontSize: 12 }} />
            <Bar dataKey="successRate" fill="#34d399" radius={[0, 4, 4, 0]} name="Success %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}

  </div>
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b/1024).toFixed(1)} KB`
  return `${(b/(1024*1024)).toFixed(1)} MB`
}
