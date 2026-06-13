"use strict";
// src/dashboard/api.ts
// REST API routes for dashboard v3.
// Supabase-first reads for production, SQLite fallback for local dev.
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerSimulatorRoutes = providerSimulatorRoutes;
const express_1 = require("express");
const collector_1 = require("../metrics/collector");
const health_checks_1 = require("../metrics/health-checks");
const agent_tracker_1 = require("../metrics/agent-tracker");
const fs_1 = require("fs");
const path_1 = require("path");
const router = (0, express_1.Router)();
// ── Health ──────────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
    const score = collector_1.metrics.getHealthScore();
    res.json({
        status: score.score >= 90 ? 'healthy' : score.score >= 70 ? 'degraded' : 'critical',
        score: score.score,
        penalties: score.penalties,
        components: score.components,
        metricsEnabled: collector_1.metrics.isEnabled(),
        uptime: process.uptime(),
        version: '1.5.0',
        timestamp: Date.now(),
    });
});
// ── Live Feed (WebSocket) ───────────────────────────────────────────────────
router.get('/live', (_req, res) => {
    res.json({
        toonCalls: collector_1.metrics.getToonCalls(20),
        engineQueries: collector_1.metrics.getEngineQueries(20),
        agentActivities: collector_1.metrics.getAllAgentActivities(),
        moduleStatuses: collector_1.metrics.getModuleStatuses(),
    });
});
// ── TOON Stats ──────────────────────────────────────────────────────────────
router.get('/toon/stats', (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    const historical = collector_1.metrics.getHistoricalToonStats(hours);
    const live = collector_1.metrics.getLiveToonStats();
    res.json({ live, historical });
});
router.get('/toon/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    res.json(collector_1.metrics.getToonCalls(limit));
});
// ── Engine Stats (V3) ───────────────────────────────────────────────────────
router.get('/engine/stats', (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    res.json(collector_1.metrics.getHistoricalEngineStats(hours));
});
router.get('/engine/queries', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(collector_1.metrics.getRecentQueries(limit));
});
router.get('/engine/anomalies', (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    res.json(collector_1.metrics.getAnomalies(hours));
});
// ── Agent Efficiency ────────────────────────────────────────────────────────
router.get('/agents/efficiency', (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    res.json(collector_1.metrics.getAgentEfficiency(hours));
});
// ── Weekly Efficiency ───────────────────────────────────────────────────────
router.get('/efficiency/weekly', (req, res) => {
    const days = parseInt(req.query.days) || 7;
    res.json(collector_1.metrics.getWeeklyEfficiency(days));
});
// ── Content Type Efficiency ─────────────────────────────────────────────────
router.get('/efficiency/content-types', (_req, res) => {
    res.json(collector_1.metrics.getContentTypeEfficiency());
});
// ── Provider Costs ──────────────────────────────────────────────────────────
router.get('/cost/providers', (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    res.json(collector_1.metrics.getProviderCosts(hours));
});
// ── Health Score ────────────────────────────────────────────────────────────
router.get('/health/score', (_req, res) => {
    res.json(collector_1.metrics.getHealthScore());
});
// ── Compile History ─────────────────────────────────────────────────────────
router.get('/compiles', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(collector_1.metrics.getCompileHistory(limit));
});
// ── CIE ─────────────────────────────────────────────────────────────────────
router.get('/cie/stats', (_req, res) => {
    const live = collector_1.metrics.getLiveCieStats();
    res.json(live);
});
router.get('/cie/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    res.json(collector_1.metrics.getCieTicks(limit));
});
// ── Modules ─────────────────────────────────────────────────────────────────
router.post('/modules/recheck', (_req, res) => {
    (0, health_checks_1.runHealthChecks)();
    res.json({ ok: true });
});
router.get('/modules', (_req, res) => {
    (0, health_checks_1.runHealthChecks)();
    res.json(collector_1.metrics.getModuleStatuses());
});
// ── Agents ──────────────────────────────────────────────────────────────────
router.get('/agents', (_req, res) => {
    if (collector_1.metrics.getAllAgentActivities().length === 0) {
        (0, agent_tracker_1.initAgentActivities)();
    }
    res.json(collector_1.metrics.getAllAgentActivities());
});
// ── Cost ────────────────────────────────────────────────────────────────────
router.get('/cost', (req, res) => {
    const hours = parseInt(req.query.hours) || 24;
    res.json(collector_1.metrics.getHistoricalCostSummary(hours));
});
// ── Config (toongine.config.json) ───────────────────────────────────────────────
router.get('/config', (_req, res) => {
    const configPath = (0, path_1.join)(process.cwd(), 'toongine.config.json');
    if ((0, fs_1.existsSync)(configPath)) {
        res.json(JSON.parse((0, fs_1.readFileSync)(configPath, 'utf-8')));
    }
    else {
        res.json({
            dashboard: { showInSettings: true, autoStartOnDev: true, port: 4200, theme: 'dark' }
        });
    }
});
exports.default = router;
// ─── Provider Simulator (separate router) ────────────────────────────────────
function providerSimulatorRoutes() {
    const r = (0, express_1.Router)();
    // Provider pricing (per 1M tokens)
    const PRICING = {
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
    };
    // Tokenizer overhead factors (how much each provider inflates TOON text)
    const TOKENIZER = {
        deepseek: 1.0,
        anthropic: 1.18, // 18% more tokens
        openai: 1.09, // 9% more tokens
    };
    r.post('/simulate', (req, res) => {
        const { provider, model, agentId, monthlyQueries, avgInputTokens, avgOutputTokens } = req.body;
        const pricing = PRICING[provider]?.[model];
        if (!pricing)
            return res.status(400).json({ error: `Unknown provider/model: ${provider}/${model}` });
        // Get current usage from SQLite
        const currentCost = collector_1.metrics.getHistoricalCostSummary(720); // 30 days
        const engineStats = collector_1.metrics.getHistoricalEngineStats(720);
        const q = monthlyQueries || engineStats.totalQueries || 500;
        const inTok = avgInputTokens || 3000;
        const outTok = avgOutputTokens || 800;
        const tokFactor = TOKENIZER[provider] || 1.0;
        const monthlyCost = ((q * inTok * tokFactor) / 1000000) * pricing.input +
            ((q * outTok * tokFactor) / 1000000) * pricing.output;
        const currentMonthly = currentCost.totalSpent || 0;
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
        });
    });
    r.get('/providers', (_req, res) => {
        const providers = {};
        for (const [p, models] of Object.entries(PRICING)) {
            providers[p] = Object.keys(models);
        }
        res.json(providers);
    });
    return r;
}
//# sourceMappingURL=api.js.map