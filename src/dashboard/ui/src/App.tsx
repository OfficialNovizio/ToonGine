import { useState, useEffect, useCallback } from 'react'
import { TokenBurn } from '../../TokenBurn'
import { ProjectHealth } from '../../ProjectHealth'
import { AgentMemory } from '../../AgentMemory'
import type { TokenBurnData, ProjectHealthData, AgentMemoryData } from '../../types'

type Tab = 'memory' | 'burn' | 'health'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'memory',  label: 'Agent Memory',  emoji: '🕵️' },
  { id: 'burn',    label: 'Token Burn',    emoji: '🔥' },
  { id: 'health',  label: 'Health',        emoji: '🧬' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('memory')
  const [burnData, setBurnData] = useState<TokenBurnData | null>(null)
  const [healthData, setHealthData] = useState<ProjectHealthData | null>(null)
  const [memoryData, setMemoryData] = useState<AgentMemoryData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [burnRes, healthRes, memRes] = await Promise.all([
        fetch('/api/token-burn'), fetch('/api/project-health'), fetch('/api/agents/infra'),
      ])
      const [burn, health, mem] = await Promise.all([burnRes.json(), healthRes.json(), memRes.json()])

      // Map API shapes → component types
      setBurnData({
        tokenUsage: (burn.timeline || []).reduce((acc: any[], r: any) => {
          const date = r.time?.slice(0, 10); const prev = acc.find(a => a.date === date)
          prev ? (prev.tokens += r.tokens) : acc.push({ date, tokens: r.tokens }); return acc
        }, []),
        costTrend: (burn.timeline || []).reduce((acc: any[], r: any) => {
          const date = r.time?.slice(0, 10); const prev = acc.find(a => a.date === date)
          prev ? (prev.cost += r.cost) : acc.push({ date, cost: r.cost }); return acc
        }, []),
        costByDept: (burn.byAgent || []).map((a: any) => ({ department: a.agentId, percentage: a.percentOfTotal, tokens: a.tokens, cost: a.cost })),
        perAgentBurn: (burn.byAgent || []).map((a: any) => ({ agent: a.agentId, tokens: a.tokens, cost: a.cost })).sort((a:any,b:any) => b.tokens - a.tokens),
        providerHealth: (burn.byProvider || []).map((p: any) => ({ provider: p.provider, usagePercent: p.percentOfTotal, balance: null, configured: true })),
      })
      setHealthData({
        kpi: {
          toonAvg: health.toonQuality?.length > 0 ? health.toonQuality.reduce((s: number, q: any) => s + q.savingsPercent, 0) / health.toonQuality.length : 0,
          bundleSize: health.codebase?.compressionPercent || 0, apiSuccess: health.promptQuality?.reduction || 0, issuesOpen: 0, issuesCritical: 0,
        },
        toonQuality: (health.toonQuality || []).map((q: any) => ({ category: q.type, percent: q.savingsPercent, grade: q.grade })),
        savingsTrend: health.savingsTrend?.map((s: any) => ({ date: s.day, percent: s.avgSavings })) || [],
        topKMatch: { chunksMatched: health.topKMatch?.avgChunksMatched || 0, chunksInjected: health.topKMatch?.avgChunksInjected || 0, l1: 0, l2: 0, ref: 0 },
        codebase: { lastCompile: '—', duration: '—', files: 0, chunks: 0, terms: 0, bpe: 0, corpusSize: '—', compressedSize: '—', compressionPercent: 0, delta: '—', tsErrors: 0 },
        apiHealth: { status200: 95, status400: 5, status500: 0, total24h: 0, errors: 0, topError: '' },
        promptQuality: { avgContext: '—', avgInjected: '—', reduction: 0, cacheHits: 0, bestAgent: '—', worstAgent: '—' },
        issues: [], docCoverage: [],
      })
      setMemoryData({
        memories: mem.memories || [], memoryTotalSize: mem.memoryTotalSize || 0, memoryAgentCount: mem.memoryAgentCount || 0,
        graph: mem.graph || null, plugins: mem.plugins || [], hermes: mem.hermes || { sessions: 0, tokensIn: 0, tokensOut: 0 },
        skillsTotal: mem.skillsTotal || 0,
        agentEfficiency: (burn.byAgent || []).map((a: any) => ({ agent: a.agentId, calls: a.calls, successRate: 95, avgTokens: Math.round(a.tokens / Math.max(1, a.calls)), avgCost: a.cost / Math.max(1, a.calls) })),
      })
    } catch { /* dashboard will show empty states */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e17', color: '#e4e8f0', fontFamily: 'Inter, system-ui, sans-serif', padding: 16 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t.id ? 'rgba(94,224,255,0.15)' : 'transparent',
              color: tab === t.id ? '#5ee0ff' : 'rgba(228,232,240,0.5)',
              transition: 'all 0.2s',
            }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#5a6478' }}>Loading...</div>
        : tab === 'memory' ? <AgentMemory data={memoryData!} />
        : tab === 'burn'   ? <TokenBurn data={burnData!} />
        : <ProjectHealth data={healthData!} />}
    </div>
  )
}
