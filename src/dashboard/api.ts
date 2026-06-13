// src/dashboard/api.ts
// REST API routes for dashboard v3.
// Supabase-first reads for production, SQLite fallback for local dev.

import { Router, Request, Response } from 'express'
import { metrics } from '../metrics/collector'
import { runHealthChecks } from '../metrics/health-checks'
import { initAgentActivities } from '../metrics/agent-tracker'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  getSupabaseEngineStats, getSupabaseAgentEfficiency,
  getSupabaseWeeklyEfficiency, getSupabaseProviderCosts,
  getSupabaseRecentQueries, getSupabaseCompileHistory,
  refreshSupabaseViews
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
