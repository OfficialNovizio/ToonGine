import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { TokenBurnData } from './types'

const CHART_COLORS = ['#5ee0ff', '#c08bff', '#5fd0b4', '#ffb693', '#ff8a80', '#ffa726', '#abc7ff']
const darkStyle = { axis: '#ffffff20', text: '#8892a8', grid: '#ffffff08', tooltip: { bg: '#1a1d28', border: '#ffffff10', text: '#e4e8f0' } }

interface Props { data: TokenBurnData }

export function TokenBurn({ data }: Props) {
  if (!data) return <div className="text-on-surface-variant text-sm p-8 text-center">No token data available. Run `hermes insights` on the server.</div>

  const avgTokens = data.tokenUsage.length > 0
    ? (data.tokenUsage.reduce((s, d) => s + d.tokens, 0) / data.tokenUsage.length / 1e6).toFixed(0)
    : '—'
  const totalTokens = data.tokenUsage.length > 0
    ? (data.tokenUsage.reduce((s, d) => s + d.tokens, 0) / 1e6).toFixed(0)
    : '—'
  const avgCost = data.costTrend.length > 0
    ? (data.costTrend.reduce((s, d) => s + d.cost, 0) / data.costTrend.length).toFixed(2)
    : '—'
  const projCost = data.costTrend.length > 0
    ? (data.costTrend.reduce((s, d) => s + d.cost, 0) / data.costTrend.length * 30).toFixed(2)
    : '—'

  return (
    <div className="space-y-4">

      {/* ── Row 1+2: Token Usage + Cost Trend (left) | Cost by Dept (right, tall) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">

        {/* Left column — two cards stacked */}
        <div className="flex flex-col gap-4">
          {/* Token Usage 30d */}
          <div className="glass-card p-4">
            <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Token Usage (30d)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.tokenUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkStyle.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} />
                <YAxis tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip contentStyle={{ background: darkStyle.tooltip.bg, border: `1px solid ${darkStyle.tooltip.border}`, borderRadius: 8, color: darkStyle.tooltip.text, fontSize: 12 }} />
                <Line type="monotone" dataKey="tokens" stroke="#5ee0ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-[11px] text-on-surface-variant mt-2">
              Avg: {avgTokens}M/day · Total: {totalTokens}M
            </div>
          </div>

          {/* Cost Trend 30d */}
          <div className="glass-card p-4">
            <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Cost Trend (30d)</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={data.costTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkStyle.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} />
                <YAxis tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} tickFormatter={v => `$${v.toFixed(2)}`} />
                <Tooltip contentStyle={{ background: darkStyle.tooltip.bg, border: `1px solid ${darkStyle.tooltip.border}`, borderRadius: 8, color: darkStyle.tooltip.text, fontSize: 12 }} />
                <Line type="monotone" dataKey="cost" stroke="#f87171" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-[11px] text-on-surface-variant mt-2">
              Avg: ${avgCost}/day · Proj: ${projCost}/mo
            </div>
          </div>
        </div>

        {/* Right column — Cost by Dept (spans both rows) */}
        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Cost by Department</div>
          <div className="space-y-2">
            {data.costByDept.map((d, i) => (
              <div key={d.department}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-on-surface-variant">{d.department}</span>
                  <span className="text-on-surface tabular-nums">{d.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.04]">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${d.percentage}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Per-Agent Burn (full width, progress bars) ── */}
      <div className="glass-card p-4">
        <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Per-Agent Burn (Top Consumers)</div>
        <div className="space-y-2">
          {data.perAgentBurn.map((a, i) => (
            <div key={a.agent}>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-on-surface-variant font-medium">{a.agent}</span>
                <span className="text-on-surface-variant tabular-nums">{(a.tokens / 1000).toFixed(0)}K tok · ${a.cost.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.04]">
                <div className="h-2 rounded-full transition-all" style={{
                  width: `${Math.min(100, (a.tokens / (data.perAgentBurn[0]?.tokens || 1)) * 100)}%`,
                  background: CHART_COLORS[i % CHART_COLORS.length],
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 4: Provider Health (full width) ── */}
      <div className="glass-card p-4">
        <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Provider Health</div>
        <div className="space-y-3">
          {data.providerHealth.map(p => (
            <div key={p.provider}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className={p.configured ? 'text-on-surface' : 'text-on-surface-variant/40'}>{p.provider}</span>
                <span className="tabular-nums text-on-surface-variant">{p.usagePercent}% usage{p.balance != null ? ` · $${p.balance.toFixed(2)} balance` : ' · not configured'}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.04]">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${p.usagePercent}%`, background: p.configured ? '#5ee0ff' : '#ffffff15' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
