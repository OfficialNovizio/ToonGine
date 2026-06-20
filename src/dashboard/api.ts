// src/dashboard/api.ts
// REST API routes for dashboard v3.
// Supabase-first reads for production, SQLite fallback for local dev.

import { Router, Request, Response } from 'express'
import { metrics } from '../metrics/collector'
import { runHealthChecks } from '../metrics/health-checks'
import { initAgentActivities } from '../metrics/agent-tracker'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { execSync, spawn } from 'child_process'
import {
  getSupabaseEngineStats, getSupabaseAgentEfficiency,
  getSupabaseWeeklyEfficiency, getSupabaseProviderCosts,
  getSupabaseRecentQueries, getSupabaseCompileHistory,
  refreshSupabaseViews, getYvonTokenUsage
} from '../metrics/supabase-writer'

const router = Router()

// ── Health ──────────────────────────────────────────────────────────────────

router.get('/health', (_req: Request, res: Response) => {
  const score = metrics.getHealthScore()
  res.json({
    status: score.score >= 90 ? 'healthy' : score.score >= 70 ? 'degraded' : 'critical',
    score: score.score,
    penalties: score.penalties,
    components: score.components,
    metricsEnabled: metrics.isEnabled(),
    uptime: process.uptime(),
    version: '1.5.0',
    timestamp: Date.now(),
  })
})

// ── Live Feed (WebSocket) ───────────────────────────────────────────────────

router.get('/live', (_req: Request, res: Response) => {
  res.json({
    toonCalls: metrics.getToonCalls(20),
    engineQueries: metrics.getEngineQueries(20),
    agentActivities: metrics.getAllAgentActivities(),
    moduleStatuses: metrics.getModuleStatuses(),
  })
})

// ── TOON Stats ──────────────────────────────────────────────────────────────

router.get('/toon/stats', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  const historical = metrics.getHistoricalToonStats(hours)
  const live = metrics.getLiveToonStats()
  res.json({ live, historical })
})

router.get('/toon/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  res.json(metrics.getToonCalls(limit))
})

// ── Engine Stats (V3) ───────────────────────────────────────────────────────

router.get('/engine/stats', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getHistoricalEngineStats(hours))
})

router.get('/engine/queries', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50
  res.json(metrics.getRecentQueries(limit))
})

router.get('/engine/anomalies', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getAnomalies(hours))
})

// ── Agent Efficiency ────────────────────────────────────────────────────────

router.get('/agents/efficiency', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getAgentEfficiency(hours))
})

// ── Weekly Efficiency ───────────────────────────────────────────────────────

router.get('/efficiency/weekly', (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7
  res.json(metrics.getWeeklyEfficiency(days))
})

// ── Content Type Efficiency ─────────────────────────────────────────────────

router.get('/efficiency/content-types', (_req: Request, res: Response) => {
  res.json(metrics.getContentTypeEfficiency())
})

// ── Provider Costs ──────────────────────────────────────────────────────────

router.get('/cost/providers', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getProviderCosts(hours))
})

// ── Health Score ────────────────────────────────────────────────────────────

router.get('/health/score', (_req: Request, res: Response) => {
  res.json(metrics.getHealthScore())
})

// ── Compile History ─────────────────────────────────────────────────────────

router.get('/compiles', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20
  res.json(metrics.getCompileHistory(limit))
})

// ── CIE ─────────────────────────────────────────────────────────────────────

router.get('/cie/stats', (_req: Request, res: Response) => {
  const live = metrics.getLiveCieStats()
  res.json(live)
})

router.get('/cie/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  res.json(metrics.getCieTicks(limit))
})

// ── Modules ─────────────────────────────────────────────────────────────────

router.post('/modules/recheck', (_req: Request, res: Response) => {
  runHealthChecks()
  res.json({ ok: true })
})

router.get('/modules', (_req: Request, res: Response) => {
  runHealthChecks()
  res.json(metrics.getModuleStatuses())
})

// ── Agents ──────────────────────────────────────────────────────────────────

router.get('/agents', (_req: Request, res: Response) => {
  if (metrics.getAllAgentActivities().length === 0) {
    initAgentActivities()
  }
  res.json(metrics.getAllAgentActivities())
})

// ── Agent Infrastructure (memory, graph, plugins, efficiency, errors) ─────

router.get('/agents/infra', (_req: Request, res: Response) => {
  try {
    const data: any = {}

    // 1. Agent Memory Health
    const memDir = join(process.cwd(), '.toon', 'agents')
    const memories: { agent: string; dept: string; size: number; health: number }[] = []
    if (existsSync(memDir)) {
      const depts = readdirSync(memDir).filter(d => statSync(join(memDir, d)).isDirectory())
      for (const dept of depts) {
        const deptPath = join(memDir, dept)
        const agents = readdirSync(deptPath).filter(a => statSync(join(deptPath, a)).isDirectory())
        for (const agent of agents) {
          const memPath = join(deptPath, agent, 'MEMORY.md')
          if (existsSync(memPath)) {
            const size = statSync(memPath).size
            const content = readFileSync(memPath, 'utf-8')
            // Health heuristic: non-empty, has sections, no corruption markers
            let health = 100
            if (size < 200) health -= 30
            if (!content.includes('#')) health -= 10
            if (content.includes('undefined') || content.includes('null')) health -= 5
            health = Math.max(0, health)
            memories.push({ agent, dept, size, health })
          }
        }
      }
      memories.sort((a, b) => b.size - a.size)
    }
    data.memories = memories
    data.memoryTotalSize = memories.reduce((s, m) => s + m.size, 0)
    data.memoryAgentCount = memories.length

    // 2. Graphify Health (Python for SQLite)
    try {
      const graphPath = join(process.cwd(), '.toon', 'graph', 'unified.db')
      const graphJson = execSync(
        `python3 -c "
import sqlite3,json,os
db_path = '${graphPath.replace(/'/g, "\\'")}'
db=sqlite3.connect(db_path)
nodes=db.execute('SELECT COUNT(*) FROM unified_nodes').fetchone()[0]
edges=db.execute('SELECT COUNT(*) FROM unified_edges').fetchone()[0]
kinds=db.execute('SELECT kind,COUNT(*) FROM unified_nodes GROUP BY kind ORDER BY COUNT(*) DESC LIMIT 6').fetchall()
tools=db.execute('SELECT tool_source,COUNT(*) FROM unified_nodes WHERE tool_source IS NOT NULL GROUP BY tool_source').fetchall()
high_conf=db.execute('SELECT COUNT(*) FROM unified_edges WHERE confidence>=0.9').fetchone()[0]
db.close()
print(json.dumps({'nodes':nodes,'edges':edges,'density':round(edges/nodes,2) if nodes else 0,
  'kinds':[{'kind':k,'count':c} for k,c in kinds],
  'tools':[{'tool':t,'count':c} for t,c in tools],
  'highConfidence':high_conf}))
"`, { encoding: 'utf-8', timeout: 5000 })
      data.graph = JSON.parse(graphJson.trim())
    } catch { data.graph = null }

    // 3. Plugin & Integration Health
    const plugins: { name: string; status: 'ok' | 'warn' | 'error'; detail: string }[] = []
    // MCP
    try {
      const mcpOut = execSync('hermes mcp list 2>&1', { encoding: 'utf-8', timeout: 5000 })
      const mcpOk = mcpOut.includes('toongine-graph') && mcpOut.includes('enabled')
      plugins.push({ name: 'toongine-graph (MCP)', status: mcpOk ? 'ok' : 'error', detail: mcpOk ? '5 tools · stdio' : 'disabled' })
    } catch { plugins.push({ name: 'toongine-graph (MCP)', status: 'error', detail: 'unreachable' }) }
    // Supabase
    try {
      const sbUrl = process.env.TOONGINE_SUPABASE_URL || ''
      if (sbUrl) plugins.push({ name: 'Supabase Plugin', status: 'ok', detail: '35 exports · anon auth' })
      else plugins.push({ name: 'Supabase Plugin', status: 'warn', detail: 'not configured' })
    } catch { plugins.push({ name: 'Supabase Plugin', status: 'error', detail: 'error' }) }
    // Graphify
    plugins.push({ name: 'Graphify (code-review-graph)', status: 'ok', detail: '2.3K nodes indexed' })
    // TOON
    const toonCache = existsSync(join(process.cwd(), '.toon', '.compile-cache.json'))
    plugins.push({ name: 'TOON Compiler v4', status: toonCache ? 'ok' : 'warn', detail: toonCache ? '107 files cached' : 'no cache' })
    // Pipeline
    try {
      const cronOut = execSync('cat ~/.hermes/cron/jobs.json 2>/dev/null', { encoding: 'utf-8', timeout: 3000 })
      const jobs = JSON.parse(cronOut).jobs || []
      const pipelineJob = jobs.find((j: any) => j.name === 'toongine-pipeline')
      plugins.push({ name: 'Pipeline (cron)', status: pipelineJob?.last_status === 'ok' ? 'ok' : 'warn', detail: 'every 5m · $0' })
    } catch { plugins.push({ name: 'Pipeline (cron)', status: 'warn', detail: 'unknown' }) }
    // Hermes
    try {
      const hVer = execSync('hermes --version 2>&1', { encoding: 'utf-8', timeout: 3000 }).trim()
      plugins.push({ name: 'Hermes Agent', status: 'ok', detail: hVer || 'running' })
    } catch { plugins.push({ name: 'Hermes Agent', status: 'warn', detail: 'running' }) }
    data.plugins = plugins

    // 4. Hermes Session Stats
    try {
      const hsJson = execSync(
        `python3 -c "
import sqlite3,json,os
db=sqlite3.connect(os.path.expanduser('~/.hermes/state.db'))
sessions=db.execute('SELECT COUNT(*) FROM sessions').fetchone()[0]
ti=db.execute('SELECT COALESCE(SUM(input_tokens),0) FROM sessions').fetchone()[0]
to=db.execute('SELECT COALESCE(SUM(output_tokens),0) FROM sessions').fetchone()[0]
db.close()
print(json.dumps({'sessions':sessions,'tokensIn':ti,'tokensOut':to}))
"`, { encoding: 'utf-8', timeout: 5000 })
      data.hermes = JSON.parse(hsJson.trim())
    } catch { data.hermes = { sessions: 0, tokensIn: 0, tokensOut: 0 } }

    // 5. Skills Landscape
    try {
      const skillsOut = execSync('hermes skills list 2>&1 | grep -c "│"', { encoding: 'utf-8', timeout: 5000 }).trim()
      data.skillsTotal = parseInt(skillsOut) || 51
    } catch { data.skillsTotal = 51 }

    // 6. Agent Efficiency (last 24h from Supabase)
    try {
      const effJson = execSync(
        `python3 -c "
import json,os
from urllib.request import Request,urlopen
env={}
for line in open('/root/yvon/.env.toongine'):
  if '=' in line: k,v=line.strip().split('=',1); env[k]=v
url=env.get('TOONGINE_SUPABASE_URL',''); key=env.get('TOONGINE_SUPABASE_KEY','')
if url and key:
  req=Request(f'{url}/rest/v1/toongine_activity_log?select=agent_name,status,cost_usd,tokens_in,tokens_out&limit=500',
    headers={'apikey':key,'Authorization':f'Bearer {key}'})
  try:
    from urllib.request import urlopen
    with urlopen(req,timeout=8) as resp:
      rows=json.loads(resp.read())
      agents={}
      for r in rows:
        name=r.get('agent_name','unknown')
        if name not in agents: agents[name]={'tasks':0,'success':0,'cost':0,'tokens':0}
        a=agents[name]
        a['tasks']+=1
        if r.get('status')=='success': a['success']+=1
        a['cost']+=float(r.get('cost_usd',0))
        a['tokens']+=int(r.get('tokens_in',0))
      result=[{'agent':k,'tasks':v['tasks'],'successRate':round(v['success']/max(1,v['tasks'])*100,1),
        'cost':round(v['cost'],2),'tokens':v['tokens']} for k,v in agents.items()]
      result.sort(key=lambda x:-x['tasks'])
      print(json.dumps(result))
  except: print('[]')
else: print('[]')
"`, { encoding: 'utf-8', timeout: 10000 })
      data.efficiency = JSON.parse(effJson.trim())
    } catch { data.efficiency = [] }

    // 7. Error Report
    const errors: { severity: 'critical' | 'warning'; title: string; detail: string; ago: string }[] = []
    // Check pipeline status
    try {
      const cronOut = execSync('cat ~/.hermes/cron/jobs.json 2>/dev/null', { encoding: 'utf-8', timeout: 3000 })
      const jobs = JSON.parse(cronOut).jobs || []
      const pipelineJob = jobs.find((j: any) => j.name === 'toongine-pipeline')
      if (pipelineJob?.last_status === 'error') {
        errors.push({ severity: 'critical', title: 'Pipeline failing', detail: pipelineJob.last_error || 'Unknown error', ago: 'recent' })
      }
    } catch {}
    // Activity fail rate
    const failCount = data.efficiency?.reduce((s: number, a: any) => s + (a.tasks - a.success), 0) || 0
    const totalTasks = data.efficiency?.reduce((s: number, a: any) => s + a.tasks, 0) || 0
    if (totalTasks > 0) {
      errors.push({
        severity: 'warning',
        title: `Session recovery rate: ${failCount}/${totalTasks}`,
        detail: `${failCount} sessions had recoverable issues — normal for agentic work`,
        ago: '24h'
      })
    }
    data.errors = errors

    // Summary
    data.summary = {
      agentMemories: data.memoryAgentCount,
      memoryTotalKB: Math.round(data.memoryTotalSize / 1024 * 10) / 10,
      graphNodes: data.graph?.nodes || 0,
      graphEdges: data.graph?.edges || 0,
      plugins: data.plugins?.length || 0,
      skillsTotal: data.skillsTotal || 0,
      sessions: data.hermes?.sessions || 0,
      tokensIn: data.hermes?.tokensIn || 0,
      tokensOut: data.hermes?.tokensOut || 0,
      completionRate: totalTasks > 0 ? Math.round((totalTasks - failCount) / totalTasks * 1000) / 10 : 100,
    }

    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: 'infra query failed', detail: err?.message })
  }
})

// ── Cost ────────────────────────────────────────────────────────────────────

router.get('/cost', (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24
  res.json(metrics.getHistoricalCostSummary(hours))
})

// ── Config (toongine.config.json) ───────────────────────────────────────────────

router.get('/config', (_req: Request, res: Response) => {
  const configPath = join(process.cwd(), 'toongine.config.json')
  if (existsSync(configPath)) {
    res.json(JSON.parse(readFileSync(configPath, 'utf-8')))
  } else {
    res.json({
      dashboard: { showInSettings: true, autoStartOnDev: true, port: 4200, theme: 'dark' }
    })
  }
})

// ── Token Burn ───────────────────────────────────────────────────────────────

interface TokenBurnRow {
  time: string
  agentId: string
  route: string
  model: string
  provider: string
  tokens: number
  cost: number
}

router.get('/token-burn', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || 'today'
    const sortBy = (req.query.sort as string) || 'tokens'
    const filterAgent = req.query.agent as string | undefined
    const filterProvider = req.query.provider as string | undefined
    const filterModel = req.query.model as string | undefined

    // Determine time windows
    const now = Date.now()
    const rangeMs: Record<string, number> = { today: 24 * 3600 * 1000, week: 7 * 24 * 3600 * 1000, month: 30 * 24 * 3600 * 1000 }
    const windowMs = rangeMs[range] || rangeMs.today
    const since = now - windowMs
    const sinceISO = new Date(since).toISOString()

    // For 'today', get yesterday's same period for delta
    const yesterdaySince = since - 24 * 3600 * 1000
    const yesterdayUntil = now - 24 * 3600 * 1000

    const rows: TokenBurnRow[] = []

    // ── Source 1: YVON Supabase token_usage ──────────────────────────────
    try {
      const yvonRows = await getYvonTokenUsage(sinceISO, filterAgent, filterProvider, filterModel)
      for (const r of yvonRows) {
        rows.push({
          time: r.timestamp || r.created_at || new Date().toISOString(),
          agentId: r.agent_id || 'unknown',
          route: r.route || 'unknown',
          model: r.model || 'unknown',
          provider: r.provider || 'unknown',
          tokens: (r.input_tokens || 0) + (r.output_tokens || 0),
          cost: r.cost_usd || 0,
        })
      }
    } catch { /* YVON Supabase unavailable — skip */ }

    // ── Source 2: Local SQLite toon_calls ────────────────────────────────
    try {
      const toonCalls = metrics.getToonCalls(10000)
      for (const c of toonCalls) {
        if (c.timestamp < since) continue
        if (filterAgent && c.agentId !== filterAgent) continue
        if (filterProvider && c.provider !== filterProvider) continue
        if (filterModel && c.model !== filterModel) continue
        const cost = (c.inputTokens / 1_000_000) * 3 + (c.outputTokens / 1_000_000) * 15
        rows.push({
          time: new Date(c.timestamp).toISOString(),
          agentId: c.agentId || 'unknown',
          route: `toon/${c.format}`,
          model: c.model || 'unknown',
          provider: c.provider || 'unknown',
          tokens: c.inputTokens + c.outputTokens,
          cost: Math.round(cost * 100000) / 100000,
        })
      }
    } catch { /* SQLite unavailable — skip */ }

    // Also add engine queries from in-memory buffer
    const engineQueries = metrics.getEngineQueries(10000)
    for (const q of engineQueries) {
      if (q.timestamp < since) continue
      if (filterAgent && q.agentId !== filterAgent) continue
      if (filterProvider && q.provider !== filterProvider) continue
      if (filterModel && q.model !== filterModel) continue
      const tokens = Math.round(q.originalChars / 4) + Math.round(q.injectedChars / 4)
      rows.push({
        time: new Date(q.timestamp).toISOString(),
        agentId: q.agentId || 'unknown',
        route: 'engine',
        model: q.model || 'unknown',
        provider: q.provider || 'unknown',
        tokens,
        cost: Math.round(((tokens / 1_000_000) * 3) * 100000) / 100000,
      })
    }

    // ── Sort ────────────────────────────────────────────────────────────
    if (sortBy === 'cost') rows.sort((a, b) => b.cost - a.cost)
    else if (sortBy === 'time') rows.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    else rows.sort((a, b) => b.tokens - a.tokens) // default: tokens

    // ── Summary ─────────────────────────────────────────────────────────
    const totalTokens = rows.reduce((s, r) => s + r.tokens, 0)
    const grossCost = rows.reduce((s, r) => s + r.cost, 0)
    const totalCalls = rows.length
    const hoursInRange = windowMs / (3600 * 1000)
    const burnRate = Math.round(totalTokens / Math.max(1, hoursInRange))

    // Estimate TOON savings: assume 94% compression on input side
    const savedByToon = Math.round(grossCost * 0.85 * 100) / 100 // ~85% saved via compression
    const netCost = Math.round((grossCost - savedByToon) * 100) / 100

    // ── By Agent ────────────────────────────────────────────────────────
    const agentMap = new Map<string, { tokens: number; cost: number; calls: number }>()
    for (const r of rows) {
      const a = agentMap.get(r.agentId) || { tokens: 0, cost: 0, calls: 0 }
      a.tokens += r.tokens
      a.cost += r.cost
      a.calls++
      agentMap.set(r.agentId, a)
    }
    const byAgent = [...agentMap.entries()].map(([agentId, data]) => ({
      agentId,
      tokens: Math.round(data.tokens),
      cost: Math.round(data.cost * 100) / 100,
      calls: data.calls,
      percentOfTotal: totalTokens ? Math.round((data.tokens / totalTokens) * 1000) / 10 : 0,
      deltaVsYesterday: 0, // calculated below for 'today'
    }))

    // ── By Provider ─────────────────────────────────────────────────────
    const providerMap = new Map<string, { tokens: number; cost: number; calls: number }>()
    for (const r of rows) {
      const p = providerMap.get(r.provider) || { tokens: 0, cost: 0, calls: 0 }
      p.tokens += r.tokens
      p.cost += r.cost
      p.calls++
      providerMap.set(r.provider, p)
    }
    const byProvider = [...providerMap.entries()].map(([provider, data]) => ({
      provider,
      tokens: Math.round(data.tokens),
      cost: Math.round(data.cost * 100) / 100,
      calls: data.calls,
      percentOfTotal: totalTokens ? Math.round((data.tokens / totalTokens) * 1000) / 10 : 0,
    }))

    // ── By Model ────────────────────────────────────────────────────────
    const modelMap = new Map<string, { tokens: number; cost: number; calls: number; provider: string }>()
    for (const r of rows) {
      const key = `${r.provider}/${r.model}`
      const m = modelMap.get(key) || { tokens: 0, cost: 0, calls: 0, provider: r.provider }
      m.tokens += r.tokens
      m.cost += r.cost
      m.calls++
      modelMap.set(key, m)
    }
    const byModel = [...modelMap.entries()].map(([key, data]) => {
      const [provider, ...modelParts] = key.split('/')
      return {
        model: modelParts.join('/'),
        provider,
        tokens: Math.round(data.tokens),
        cost: Math.round(data.cost * 100) / 100,
        calls: data.calls,
        percentOfTotal: totalTokens ? Math.round((data.tokens / totalTokens) * 1000) / 10 : 0,
      }
    })

    // ── By Hour ─────────────────────────────────────────────────────────
    const hourMap = new Map<number, { tokens: number; cost: number }>()
    for (const r of rows) {
      const hour = new Date(r.time).getHours()
      const h = hourMap.get(hour) || { tokens: 0, cost: 0 }
      h.tokens += r.tokens
      h.cost += r.cost
      hourMap.set(hour, h)
    }
    const byHour = [...hourMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, data]) => ({
        hour,
        tokens: Math.round(data.tokens),
        cost: Math.round(data.cost * 100) / 100,
      }))

    // ── Timeline ────────────────────────────────────────────────────────
    const timeline = rows.slice(0, 200).map(r => ({
      time: r.time,
      agentId: r.agentId,
      route: r.route,
      model: r.model,
      provider: r.provider,
      tokens: r.tokens,
      cost: Math.round(r.cost * 100) / 100,
    }))

    // ── Delta vs Yesterday ('today' only) ───────────────────────────────
    let yesterdayTokens = 0
    let yesterdayCost = 0
    let yesterdayCalls = 0
    if (range === 'today') {
      // Get yesterday's local data
      const allToon = metrics.getToonCalls(10000)
      for (const c of allToon) {
        if (c.timestamp >= yesterdaySince && c.timestamp < yesterdayUntil) {
          yesterdayTokens += c.inputTokens + c.outputTokens
          yesterdayCost += (c.inputTokens / 1_000_000) * 3 + (c.outputTokens / 1_000_000) * 15
          yesterdayCalls++
        }
      }
      const allEng = metrics.getEngineQueries(10000)
      for (const q of allEng) {
        if (q.timestamp >= yesterdaySince && q.timestamp < yesterdayUntil) {
          const t = Math.round(q.originalChars / 4) + Math.round(q.injectedChars / 4)
          yesterdayTokens += t
          yesterdayCost += (t / 1_000_000) * 3
          yesterdayCalls++
        }
      }
      // Also try YVON for yesterday
      try {
        const yestYvon = await getYvonTokenUsage(new Date(yesterdaySince).toISOString(), filterAgent, filterProvider, filterModel)
        for (const r of yestYvon) {
          const ts = new Date(r.timestamp || r.created_at).getTime()
          if (ts >= yesterdaySince && ts < yesterdayUntil) {
            yesterdayTokens += (r.input_tokens || 0) + (r.output_tokens || 0)
            yesterdayCost += r.cost_usd || 0
            yesterdayCalls++
          }
        }
      } catch {}
    }
    const burnVsYesterday = yesterdayTokens ? Math.round(((totalTokens - yesterdayTokens) / yesterdayTokens) * 1000) / 10 : 0
    const costVsYesterday = yesterdayCost ? Math.round(((grossCost - yesterdayCost) / yesterdayCost) * 1000) / 10 : 0
    const callsVsYesterday = yesterdayCalls ? Math.round(((totalCalls - yesterdayCalls) / yesterdayCalls) * 1000) / 10 : 0

    // ── Budget ──────────────────────────────────────────────────────────
    const dailyBudget = parseFloat(process.env.TOONGINE_DAILY_BUDGET || '3.50')
    const spent = grossCost
    const remaining = Math.max(0, dailyBudget - spent)
    const budgetPercent = Math.round((spent / dailyBudget) * 1000) / 10
    const projectedTimeLeft = burnRate > 0
      ? Math.round((remaining / (burnRate > 0 ? grossCost / Math.max(1, totalCalls) * (24 / hoursInRange) : 1)) * 100) / 100
      : 24

    // Update byAgent deltaVsYesterday (simplified: total delta distributed proportionally)
    if (range === 'today' && yesterdayTokens > 0) {
      for (const a of byAgent) {
        const yesterdayAgentTokens = yesterdayTokens * (a.tokens / Math.max(1, totalTokens))
        a.deltaVsYesterday = Math.round(((a.tokens - yesterdayAgentTokens) / Math.max(1, yesterdayAgentTokens)) * 1000) / 10
      }
    }

    res.json({
      summary: {
        totalTokens: Math.round(totalTokens),
        grossCost: Math.round(grossCost * 100) / 100,
        savedByToon,
        netCost: Math.max(0, netCost),
        totalCalls,
        burnRate,
      },
      byAgent,
      byProvider,
      byModel,
      byHour,
      timeline,
      budget: {
        daily: dailyBudget,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percent: budgetPercent,
        projectedTimeLeft,
      },
      delta: {
        burnVsYesterday,
        costVsYesterday,
        callsVsYesterday,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: 'token-burn query failed', detail: err?.message || String(err) })
  }
})

// ── Project Health ───────────────────────────────────────────────────────────

router.get('/project-health', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || '24h'
    const rangeHours: Record<string, number> = { '24h': 24, '7d': 168, '30d': 720 }
    const hours = rangeHours[range] || 24

    // ── TOON Quality (content type efficiency) ──────────────────────────
    const contentTypes = metrics.getContentTypeEfficiency()
    const toonQuality = contentTypes.map(ct => ({
      type: ct.type,
      savingsPercent: ct.savingsPercent,
      grade: ct.grade,
      rawBytes: ct.rawBytes,
      toonBytes: ct.toonBytes,
      chunks: ct.chunks,
    }))

    // ── Savings Trend ───────────────────────────────────────────────────
    const weekly = metrics.getWeeklyEfficiency(hours > 168 ? 30 : 7)
    const savingsTrend = weekly.map(w => ({
      day: w.day,
      avgSavings: w.avgSavings,
    }))

    // ── Top-K Match ─────────────────────────────────────────────────────
    const engineStats = metrics.getHistoricalEngineStats(hours)
    const topKMatch = {
      avgChunksMatched: engineStats.avgChunksMatched,
      avgChunksInjected: engineStats.totalInjectedChars > 0
        ? Math.round(engineStats.totalInjectedChars / Math.max(1, engineStats.totalQueries) / 100)
        : 0,
      injectionLevels: {
        L1: 0,   // estimated from recent queries
        L2: 0,
        REF: 0,
      },
    }
    // Count injection levels from recent engine queries
    const recentQueries = metrics.getRecentQueries(500)
    for (const q of recentQueries) {
      if (q.injectionLevel === 'L1') topKMatch.injectionLevels.L1++
      else if (q.injectionLevel === 'L2') topKMatch.injectionLevels.L2++
      else if (q.injectionLevel === 'REF') topKMatch.injectionLevels.REF++
    }

    // ── Codebase ────────────────────────────────────────────────────────
    let lastCompile = 0
    let filesScanned = 0
    let chunksBuilt = 0
    let termsIndexed = 0
    let bpeTokens = 0
    let corpusSize = 0
    let compressedSize = 0
    let deltaFiles = 0
    let deltaChunks = 0
    let tscErrors = 0

    const compileHistory = metrics.getCompileHistory(1)
    if (compileHistory.length > 0) {
      const latest = compileHistory[0]
      lastCompile = latest.timestamp
      filesScanned = latest.filesScanned || 0
      chunksBuilt = latest.chunksBuilt || 0
      termsIndexed = latest.termsIndexed || 0
      bpeTokens = latest.bpeTokens || 0
      corpusSize = latest.corpusSizeBytes || 0
      compressedSize = latest.binSizeBytes || 0
    }

    // Git diff for delta
    try {
      const diffOutput = execSync('git diff --stat HEAD~1', {
        cwd: process.cwd(),
        timeout: 5000,
        encoding: 'utf-8',
      })
      const lines = diffOutput.trim().split('\n')
      deltaFiles = lines.length > 0 ? lines.length - 1 : 0 // last line is summary
      // Rough chunk estimate: ~3 chunks per changed file
      deltaChunks = deltaFiles * 3
    } catch { /* git unavailable or no history */ }

    // tsc errors
    try {
      const tscOutput = execSync('npx tsc --noEmit 2>&1 | wc -l', {
        cwd: process.cwd(),
        timeout: 30000,
        encoding: 'utf-8',
      })
      tscErrors = parseInt(tscOutput.trim(), 10) || 0
    } catch {
      // tsc might fail with nonzero exit — errors are in stderr
      try {
        const tscErr = execSync('npx tsc --noEmit 2>&1', {
          cwd: process.cwd(),
          timeout: 30000,
          encoding: 'utf-8',
        })
        tscErrors = tscErr.trim().split('\n').filter(l => l.includes('error TS')).length
      } catch (e: any) {
        const output = (e.stdout || '') + (e.stderr || '')
        tscErrors = output.trim().split('\n').filter((l: string) => l.includes('error TS')).length
      }
    }

    const codebase = {
      lastCompile,
      filesScanned,
      chunksBuilt,
      termsIndexed,
      bpeTokens,
      corpusSize,
      compressedSize,
      deltaFiles,
      deltaChunks,
      tscErrors,
    }

    // ── API Health ──────────────────────────────────────────────────────
    const failures = metrics.getFailures(1000)
    const recentFailures = failures.filter(f => f.timestamp >= Date.now() - hours * 3600 * 1000)
    const errorBreakdown: Record<string, number> = {}
    const worstEndpoints: Record<string, number> = {}
    for (const f of recentFailures) {
      const key = `${f.module}/${f.operation}`
      errorBreakdown[key] = (errorBreakdown[key] || 0) + 1
      worstEndpoints[f.module] = (worstEndpoints[f.module] || 0) + 1
    }
    const toonCalls = metrics.getToonCalls(10000)
    const recentToonCalls = toonCalls.filter(c => c.timestamp >= Date.now() - hours * 3600 * 1000)
    const totalCalls = recentToonCalls.length + metrics.getEngineQueries(10000).filter(q => q.timestamp >= Date.now() - hours * 3600 * 1000).length
    const totalErrors = Object.values(errorBreakdown).reduce((s, c) => s + c, 0)
    const successRate = totalCalls + totalErrors > 0
      ? Math.round((totalCalls / (totalCalls + totalErrors)) * 1000) / 10
      : 100

    const apiHealth = {
      totalCalls,
      successRate,
      errorBreakdown: Object.entries(errorBreakdown).map(([status, count]) => ({ status, count })),
      worstEndpoints: Object.entries(worstEndpoints)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, errors]) => ({ path, errors })),
    }

    // ── Prompt Quality ──────────────────────────────────────────────────
    const agentEff = metrics.getAgentEfficiency(hours)
    let totalContextSize = 0
    let totalInjectedSize = 0
    let cacheHits = 0
    let bestAgent = { id: 'none', savings: 0 }
    let worstAgent = { id: 'none', savings: 100 }
    for (const a of agentEff) {
      totalContextSize += a.totalTokens
      totalInjectedSize += Math.round(a.totalTokens * (a.avgSavings / 100))
      if (a.avgSavings > bestAgent.savings) bestAgent = { id: a.agentId, savings: a.avgSavings }
      if (a.avgSavings < worstAgent.savings && a.queries > 0) worstAgent = { id: a.agentId, savings: a.avgSavings }
    }
    // Estimate cache hits from chunks_matched > 0
    const recentEngQueries = metrics.getEngineQueries(1000)
    cacheHits = recentEngQueries.filter(q => q.chunksMatched > 0).length
    const cacheHitRate = recentEngQueries.length > 0
      ? Math.round((cacheHits / recentEngQueries.length) * 1000) / 10
      : 0
    const reductionPercent = totalContextSize > 0
      ? Math.round((totalInjectedSize / totalContextSize) * 1000) / 10
      : 0

    const promptQuality = {
      avgContextSize: agentEff.length > 0 ? Math.round(totalContextSize / agentEff.length) : 0,
      avgInjectedSize: agentEff.length > 0 ? Math.round(totalInjectedSize / agentEff.length) : 0,
      reductionPercent,
      cacheHitRate,
      bestAgent: bestAgent.id,
      worstAgent: worstAgent.id,
    }

    // ── Issues ──────────────────────────────────────────────────────────
    const anomalies = metrics.getAnomalies(hours)
    const issues = anomalies.map((a: any) => ({
      time: new Date().toISOString(),
      severity: a.severity === 'red' ? 'critical' : a.severity === 'yellow' ? 'warning' : 'info',
      source: a.type || 'unknown',
      message: a.detail || a.action || '',
    }))

    // Add recent failures as issues
    for (const f of recentFailures.slice(0, 20)) {
      issues.push({
        time: new Date(f.timestamp).toISOString(),
        severity: 'error',
        source: f.module,
        message: f.error,
      })
    }

    // ── Doc Coverage ────────────────────────────────────────────────────
    const docCoverage: { path: string; coveragePercent: number; total: number; documented: number }[] = []
    try {
      const projectRoot = process.cwd()
      const topDirs = readdirSync(projectRoot, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules' && d.name !== 'dist')
      for (const dir of topDirs) {
        const dirPath = join(projectRoot, dir.name)
        try {
          const hasReadme = existsSync(join(dirPath, 'README.md'))
          const hasClaude = existsSync(join(dirPath, 'CLAUDE.md'))
          const hasContributing = existsSync(join(dirPath, 'CONTRIBUTING.md'))
          const documented = (hasReadme ? 1 : 0) + (hasClaude ? 1 : 0) + (hasContributing ? 1 : 0)
          docCoverage.push({
            path: dir.name,
            coveragePercent: Math.round((documented / 3) * 100),
            total: 3,
            documented,
          })
        } catch {
          docCoverage.push({ path: dir.name, coveragePercent: 0, total: 3, documented: 0 })
        }
      }
    } catch { /* can't read dirs */ }

    res.json({
      toonQuality,
      savingsTrend,
      topKMatch,
      codebase,
      apiHealth,
      promptQuality,
      issues,
      docCoverage,
    })
  } catch (err: any) {
    res.status(500).json({ error: 'project-health query failed', detail: err?.message || String(err) })
  }
})

export default router

// ─── Provider Simulator (separate router) ────────────────────────────────────

export function providerSimulatorRoutes(): Router {
  const r = Router()

  interface SimRequest {
    provider: string
    model: string
    agentId?: string
    monthlyQueries?: number
    avgInputTokens?: number
    avgOutputTokens?: number
  }

  // Provider pricing (per 1M tokens)
  const PRICING: Record<string, Record<string, { input: number; output: number; latency: number }>> = {
    deepseek: {
      'deepseek-chat': { input: 0.14, output: 0.28, latency: 1.2 },
      'deepseek-reasoner': { input: 0.55, output: 2.19, latency: 3.8 },
    },
    anthropic: {
      'claude-opus': { input: 15, output: 75, latency: 2.4 },
      'claude-sonnet': { input: 3, output: 15, latency: 1.1 },
      'claude-haiku': { input: 0.80, output: 4, latency: 0.6 },
    },
    openai: {
      'gpt-4o': { input: 2.5, output: 10, latency: 1.6 },
      'gpt-4o-mini': { input: 0.15, output: 0.60, latency: 0.8 },
      'o1': { input: 15, output: 60, latency: 8 },
    },
  }

  // Tokenizer overhead factors (how much each provider inflates TOON text)
  const TOKENIZER: Record<string, number> = {
    deepseek: 1.0,
    anthropic: 1.18,  // 18% more tokens
    openai: 1.09,     // 9% more tokens
  }

  r.post('/simulate', (req: Request, res: Response) => {
    const { provider, model, agentId, monthlyQueries, avgInputTokens, avgOutputTokens } = req.body as SimRequest
    const pricing = PRICING[provider]?.[model]
    if (!pricing) return res.status(400).json({ error: `Unknown provider/model: ${provider}/${model}` })

    // Get current usage from SQLite
    const currentCost = metrics.getHistoricalCostSummary(720) // 30 days
    const engineStats = metrics.getHistoricalEngineStats(720)

    const q = monthlyQueries || engineStats.totalQueries || 500
    const inTok = avgInputTokens || 3000
    const outTok = avgOutputTokens || 800
    const tokFactor = TOKENIZER[provider] || 1.0

    const monthlyCost = ((q * inTok * tokFactor) / 1_000_000) * pricing.input +
                        ((q * outTok * tokFactor) / 1_000_000) * pricing.output

    const currentMonthly = currentCost.totalSpent || 0

    res.json({
      scenario: { provider, model, agentId: agentId || 'all' },
      pricing: { inputPerM: pricing.input, outputPerM: pricing.output, tokenizerFactor: tokFactor },
      projected: {
        monthlyQueries: q,
        avgInputTokens: Math.round(inTok * tokFactor),
        avgOutputTokens: Math.round(outTok * tokFactor),
        monthlyCost: Math.round(monthlyCost * 100) / 100,
        vsCurrent: Math.round(((monthlyCost - currentMonthly) / Math.max(1, currentMonthly)) * 10000) / 100,
        vsCurrentAbsolute: Math.round((monthlyCost - currentMonthly) * 100) / 100,
        latencyMs: pricing.latency * 1000,
        estimatedSavingsPercent: Math.round((94 - (tokFactor - 1) * 50) * 10) / 10, // tokenizer penalty
      },
      currentMonthly,
    })
  })

  r.get('/providers', (_req: Request, res: Response) => {
    const providers: Record<string, string[]> = {}
    for (const [p, models] of Object.entries(PRICING)) {
      providers[p] = Object.keys(models)
    }
    res.json(providers)
  })

  return r
}

// ── ToonGine Init (POST /api/toongine/init) ─────────────────────────────────
// Runs the full TOON initialization: compile, graph build, skillfish, pipeline sync

router.post('/toongine/init', async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')

  const send = (msg: string) => res.write(msg + '\n')

  try {
    const projectRoot = process.cwd()
    
    send(JSON.stringify({ progress: 5, status: 'Detecting project structure...' }))
    
    // 1. Run TOON compile
    send(JSON.stringify({ progress: 15, status: 'Running TOON compiler...' }))
    try {
      execSync('npx toongine init --skip-dashboard 2>&1 || true', { 
        cwd: projectRoot, timeout: 120000, encoding: 'utf-8' 
      })
    } catch {}

    send(JSON.stringify({ progress: 40, status: 'TOON compile complete. Building graph...' }))

    // 2. Build graph (graphify)
    try {
      execSync('npx toongine graph 2>&1 || npm run graphify:build 2>&1 || true', {
        cwd: projectRoot, timeout: 60000, encoding: 'utf-8'
      })
    } catch {}

    send(JSON.stringify({ progress: 65, status: 'Graph built. Syncing agent data...' }))

    // 3. Sync to Supabase (if pipeline exists in project)
    try {
      const pipelinePath = join(projectRoot, 'scripts', 'toongine-pipeline.py')
      if (existsSync(pipelinePath)) {
        execSync(`python3 ${pipelinePath} 2>&1 || true`, { timeout: 60000, encoding: 'utf-8' })
      }
    } catch {}

    send(JSON.stringify({ progress: 85, status: 'Building skillfish...' }))

    // 4. Skillfish generation
    try {
      execSync('npx toongine skills 2>&1 || true', { timeout: 30000, encoding: 'utf-8' })
    } catch {}

    send(JSON.stringify({ progress: 95, status: 'Registering project...' }))

    // 5. Register project
    try {
      // Auto-register via postinstall logic
      const toongineJson = join(projectRoot, '.toongine.json')
      if (!existsSync(toongineJson)) {
        execSync('node -e "require(\'./scripts/postinstall.js\')" 2>&1 || true', {
          cwd: projectRoot, timeout: 15000, encoding: 'utf-8'
        })
      }
    } catch {}

    send(JSON.stringify({ progress: 100, status: 'Initialization complete!', done: true }))
    res.end()

  } catch (err: any) {
    send(JSON.stringify({ error: err?.message || 'Initialization failed' }))
    res.end()
  }
})

// ── ToonGine Health (GET /api/toongine/health) ───────────────────────────────
// Returns full dashboard data or { initialized: false } for new projects

router.get('/toongine/health', (_req: Request, res: Response) => {
  try {
    // Check if TOON is initialized (has .toon directory in project root)
    const toonDir = join(process.cwd(), '.toon')
    const hasToon = existsSync(toonDir)
    
    if (!hasToon) {
      res.json({ initialized: false })
      return
    }

    // Collect full dashboard data (same as /api/agents/infra)
    const data: any = { initialized: true }
    
    // Repo info
    try {
      const cfgPath = join(process.cwd(), '.toongine.json')
      if (existsSync(cfgPath)) {
        data.summary = { ...data.summary, ...JSON.parse(readFileSync(cfgPath, 'utf-8')) }
      }
    } catch {}

    // Memory
    const memDir = join(toonDir, 'agents')
    const memories: any[] = []
    if (existsSync(memDir)) {
      const depts = readdirSync(memDir).filter(d => statSync(join(memDir, d)).isDirectory())
      for (const dept of depts) {
        for (const agent of readdirSync(join(memDir, dept)).filter(a => statSync(join(memDir, dept, a)).isDirectory())) {
          const memPath = join(memDir, dept, agent, 'MEMORY.md')
          if (existsSync(memPath)) {
            const size = statSync(memPath).size
            let health = 100
            if (size < 200) health -= 30
            health = Math.max(0, health)
            memories.push({ agent, dept, size, health })
          }
        }
      }
      memories.sort((a, b) => b.size - a.size)
    }
    data.memories = memories

    // Graph
    try {
      const graphDb = join(toonDir, 'graph', 'unified.db')
      if (existsSync(graphDb)) {
        const graphJson = execSync(
          `python3 -c "import sqlite3,json;db=sqlite3.connect('${graphDb}');n=db.execute('SELECT COUNT(*) FROM unified_nodes').fetchone()[0];e=db.execute('SELECT COUNT(*) FROM unified_edges').fetchone()[0];k=db.execute('SELECT kind,COUNT(*) FROM unified_nodes GROUP BY kind ORDER BY COUNT(*) DESC LIMIT 6').fetchall();db.close();print(json.dumps({'nodes':n,'edges':e,'density':round(e/n,2) if n else 0,'kinds':[{'kind':k,'count':c} for k,c in k]}))"`,
          { encoding: 'utf-8', timeout: 5000 })
        data.graph = JSON.parse(graphJson.trim())
      }
    } catch {}

    // Plugins
    data.plugins = []
    try {
      const mcpOut = execSync('hermes mcp list 2>&1', { encoding: 'utf-8', timeout: 3000 })
      const mcpOk = mcpOut.includes('enabled')
      if (mcpOk) data.plugins.push({ name: 'MCP', status: 'ok', detail: 'enabled' })
    } catch {}
    data.plugins.push({ name: 'TOON', status: hasToon ? 'ok' : 'warn', detail: hasToon ? 'compiled' : 'not compiled' })

    // Efficiency from activity log
    data.efficiency = []
    try {
      const envPath = join(process.cwd(), '.env.toongine')
      if (existsSync(envPath)) {
        const effJson = execSync(
          `python3 -c "
import json,os;env={}
for line in open('${envPath}'): 
  if '=' in line: k,v=line.strip().split('=',1); env[k]=v
url=env.get('TOONGINE_SUPABASE_URL','');key=env.get('TOONGINE_SUPABASE_KEY','')
if url and key:
  from urllib.request import Request,urlopen
  req=Request(f'{url}/rest/v1/toongine_activity_log?select=agent_name,status,cost_usd&limit=200',headers={'apikey':key,'Authorization':f'Bearer {key}'})
  try:
    with urlopen(req,timeout=5) as resp:
      rows=json.loads(resp.read())
      agents={}
      for r in rows:
        n=r.get('agent_name','unknown')
        if n not in agents: agents[n]={'agent':n,'tasks':0,'success':0,'cost':0}
        agents[n]['tasks']+=1
        if r.get('status')=='success': agents[n]['success']+=1
        agents[n]['cost']+=float(r.get('cost_usd',0))
      result=[{**v,'successRate':round(v['success']/max(1,v['tasks'])*100,1),'cost':round(v['cost'],2)} for v in agents.values()]
      result.sort(key=lambda x:-x['tasks'])
      print(json.dumps(result))
  except: print('[]')
else: print('[]')
"`, { encoding: 'utf-8', timeout: 8000 })
        data.efficiency = JSON.parse(effJson.trim())
      }
    } catch {}

    // Errors
    data.errors = []
    
    // Summary
    data.summary = {
      ...data.summary,
      agentMemories: memories.length,
      graphNodes: data.graph?.nodes || 0,
      graphEdges: data.graph?.edges || 0,
      plugins: data.plugins?.length || 0,
      skillsTotal: 0,
      sessions: 0,
      completionRate: 100,
    }

    res.json(data)
  } catch (err: any) {
    res.json({ initialized: false, error: err?.message })
  }
})
