"use strict";
// src/metrics/health-checks.ts
// Periodically checks all module connections.
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHealthChecks = runHealthChecks;
const collector_1 = require("./collector");
const config_1 = require("../adapters/config");
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
function runHealthChecks() {
    const config = (0, config_1.getConfig)();
    const cwd = process.cwd();
    const now = Date.now();
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    collector_1.metrics.setModuleStatus({
        name: 'Claude (Anthropic)',
        connected: !!claudeKey,
        lastCheck: now,
        details: claudeKey ? `API key: ${claudeKey.slice(0, 8)}...` : 'No API key — set ANTHROPIC_API_KEY',
    });
    const dsKey = process.env.DEEPSEEK_API_KEY;
    collector_1.metrics.setModuleStatus({
        name: 'DeepSeek',
        connected: !!dsKey,
        lastCheck: now,
        details: dsKey ? 'API key configured' : 'No API key',
    });
    const hermesOk = (0, fs_1.existsSync)((0, path_1.join)(config.hermesMemoryDir, 'USER.md'));
    collector_1.metrics.setModuleStatus({
        name: 'Hermes Sync',
        connected: hermesOk,
        lastCheck: now,
        details: hermesOk ? 'Memory files found' : 'Not initialized',
    });
    const graphifyOk = (0, fs_1.existsSync)(config.graphifyReport);
    collector_1.metrics.setModuleStatus({
        name: 'Graphify',
        connected: graphifyOk,
        lastCheck: now,
        details: graphifyOk ? 'Report found' : 'Not built — run: toongine graph',
    });
    const codegraphOk = (0, fs_1.existsSync)(config.codegraphReport);
    collector_1.metrics.setModuleStatus({
        name: 'CodeGraph',
        connected: codegraphOk,
        lastCheck: now,
        details: codegraphOk ? 'Report found' : 'Not built',
    });
    try {
        const crg = (0, child_process_1.execSync)('which code-review-graph 2>/dev/null || echo ""', { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        collector_1.metrics.setModuleStatus({
            name: 'Code-Review-Graph',
            connected: !!crg,
            lastCheck: now,
            details: crg ? `Installed: ${crg}` : 'Not installed (fallback active)',
        });
    }
    catch {
        collector_1.metrics.setModuleStatus({ name: 'Code-Review-Graph', connected: false, lastCheck: now, details: 'Not installed (fallback active)' });
    }
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    collector_1.metrics.setModuleStatus({
        name: 'Supabase',
        connected: !!supabaseUrl,
        lastCheck: now,
        details: supabaseUrl ? `Connected: ${supabaseUrl}` : 'Not configured',
    });
    collector_1.metrics.setModuleStatus({ name: 'MCP Client', connected: true, lastCheck: now, details: 'Local adapter active' });
    collector_1.metrics.setModuleStatus({ name: 'TOON Compression', connected: true, lastCheck: now, details: 'Built-in (dense, claude, api, js)' });
    collector_1.metrics.setModuleStatus({ name: 'CIE Pipeline', connected: true, lastCheck: now, details: 'Built-in (classify → retrieve → rank → inject)' });
}
//# sourceMappingURL=health-checks.js.map