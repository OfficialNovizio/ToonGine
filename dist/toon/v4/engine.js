"use strict";
// src/toon/v4/engine.ts — TOON v4 Engine (V3 + Graph Intelligence)
//
// Wraps V3 engine for agent context, but adds V4 graph intelligence layer.
// Agents get: (1) their agent data (V3 engine) + (2) code graph context (V4 bridge).
//
// Usage:
//   import { createV4Engine } from 'toongine/toon/v4/engine'
//   const engine = createV4Engine('/root/yvon')
//   const ctx = engine.buildContext({ agentId: 'marcus-ceo' })
Object.defineProperty(exports, "__esModule", { value: true });
exports.V4Engine = void 0;
exports.createV4Engine = createV4Engine;
const fs_1 = require("fs");
const path_1 = require("path");
const unified_graph_1 = require("./unified-graph");
const context_builder_1 = require("./context-builder");
// ─── Engine ───────────────────────────────────────────────────────────────────
class V4Engine {
    constructor(config) {
        this.unified = null;
        this.projectRoot = config.projectRoot;
        this.config = {
            projectRoot: config.projectRoot,
            enableGraphContext: config.enableGraphContext ?? true,
            maxGraphTokens: config.maxGraphTokens ?? 100,
        };
    }
    initGraph() {
        const dbPath = (0, path_1.join)(this.projectRoot, '.toon', 'graph', 'unified.db');
        if (!(0, fs_1.existsSync)(dbPath))
            return false;
        this.unified = new unified_graph_1.UnifiedGraph(dbPath);
        return true;
    }
    buildContext(request) {
        const agentData = this.loadAgentData(request.agentId);
        const agentTokens = Math.round(agentData.length / 3.5);
        let graphContext = '';
        let graphTokens = 0;
        let graphStale = false;
        const toolsAvailable = [];
        if (this.config.enableGraphContext && this.unified) {
            const ctx = (0, context_builder_1.buildAgentContext)(this.unified, {
                ...request,
                maxTokens: this.config.maxGraphTokens,
            });
            graphContext = (0, context_builder_1.formatContextForLLM)(ctx);
            graphTokens = ctx.totalTokens;
            graphStale = ctx.isStale;
            const stats = this.unified.stats();
            for (const [tool, count] of Object.entries(stats.toolBreakdown)) {
                if (count > 0)
                    toolsAvailable.push(tool);
            }
        }
        return {
            agentData,
            graphContext,
            totalTokens: agentTokens + graphTokens,
            graphTokens,
            agentTokens,
            graphStale,
            toolsAvailable,
        };
    }
    loadAgentData(agentId) {
        const agentDir = (0, path_1.join)(this.projectRoot, '.toon', 'agents');
        if (!(0, fs_1.existsSync)(agentDir))
            return '';
        try {
            for (const dept of (0, fs_1.readdirSync)(agentDir)) {
                const deptPath = (0, path_1.join)(agentDir, dept);
                if (!(0, fs_1.statSync)(deptPath).isDirectory())
                    continue;
                for (const agent of (0, fs_1.readdirSync)(deptPath)) {
                    if (agent.toLowerCase().includes(agentId.toLowerCase().replace(/-/g, ''))) {
                        const memPath = (0, path_1.join)(deptPath, agent, 'MEMORY.md');
                        if ((0, fs_1.existsSync)(memPath)) {
                            return (0, fs_1.readFileSync)(memPath, 'utf-8').slice(0, 5000);
                        }
                    }
                }
            }
        }
        catch { /* agent not found */ }
        return '';
    }
    status() {
        const agentDataSize = this.loadAgentData('marcus-ceo').length;
        const stats = this.unified?.stats();
        const toolsAvailable = [];
        if (stats) {
            for (const [tool, count] of Object.entries(stats.toolBreakdown)) {
                if (count > 0)
                    toolsAvailable.push(tool);
            }
        }
        return { agentDataSize, graphNodes: stats?.nodeCount || 0, graphEdges: stats?.edgeCount || 0, toolsAvailable };
    }
    close() { this.unified?.close(); }
}
exports.V4Engine = V4Engine;
function createV4Engine(projectRoot) {
    const engine = new V4Engine({ projectRoot });
    engine.initGraph();
    return engine;
}
//# sourceMappingURL=engine.js.map