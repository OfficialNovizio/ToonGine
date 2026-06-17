"use strict";
// src/toon/v4/hermes-gateway.ts
// Hermes MCP Gateway — exposes unified graph tools to all agents at runtime.
// Tools: toon_graph_explore, toon_graph_callers, toon_graph_impact, toon_graph_search, toon_graph_status
Object.defineProperty(exports, "__esModule", { value: true });
exports.HermesGraphGateway = exports.GRAPH_MCP_TOOLS = void 0;
exports.createGraphGateway = createGraphGateway;
const fs_1 = require("fs");
const path_1 = require("path");
const unified_graph_1 = require("./unified-graph");
// ─── Tool Definitions ─────────────────────────────────────────────────────────
exports.GRAPH_MCP_TOOLS = [
    {
        name: 'toon_graph_explore',
        description: 'Explore the code knowledge graph with a natural language query. Returns relevant symbols, their source, and relationships.',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'What to explore (e.g., "auth flow", "database connection")' },
                limit: { type: 'number', description: 'Max results (default 10)' },
            },
            required: ['query'],
        },
    },
    {
        name: 'toon_graph_callers',
        description: 'Find all callers of a symbol (who calls this function/class/method).',
        inputSchema: {
            type: 'object',
            properties: {
                symbol: { type: 'string', description: 'Symbol name to find callers for' },
                limit: { type: 'number', description: 'Max results (default 20)' },
            },
            required: ['symbol'],
        },
    },
    {
        name: 'toon_graph_impact',
        description: 'Analyze blast radius — what code is affected by changing a symbol. Returns call chain up to 3 levels deep.',
        inputSchema: {
            type: 'object',
            properties: {
                symbol: { type: 'string', description: 'Symbol to analyze impact for' },
                depth: { type: 'number', description: 'Max depth (default 3)' },
            },
            required: ['symbol'],
        },
    },
    {
        name: 'toon_graph_search',
        description: 'Full-text search across all graph nodes (files, symbols, communities).',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query (FTS5 syntax)' },
                limit: { type: 'number', description: 'Max results (default 20)' },
            },
            required: ['query'],
        },
    },
    {
        name: 'toon_graph_status',
        description: 'Get graph health — node/edge counts, tool coverage, staleness, language breakdown.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
];
// ─── Gateway ──────────────────────────────────────────────────────────────────
class HermesGraphGateway {
    constructor(projectRoot) {
        this.unified = null;
        this.projectRoot = projectRoot;
    }
    // Initialize graph connection
    init() {
        const dbPath = (0, path_1.join)(this.projectRoot, '.toon', 'graph', 'unified.db');
        if (!(0, fs_1.existsSync)(dbPath))
            return false;
        this.unified = new unified_graph_1.UnifiedGraph(dbPath);
        return true;
    }
    // Handle MCP tool calls
    handleToolCall(toolName, args) {
        if (!this.unified)
            return JSON.stringify({ error: 'Graph not initialized — run npx toongine init' });
        switch (toolName) {
            case 'toon_graph_explore': {
                const query = args.query || '';
                const limit = args.limit || 10;
                const results = this.unified.search(query, limit);
                return JSON.stringify({
                    results: results.map(r => ({
                        name: r.name,
                        kind: r.kind,
                        file: r.file_path,
                        language: r.language,
                        source: r.tool_source,
                    })),
                    count: results.length,
                });
            }
            case 'toon_graph_callers': {
                const symbol = args.symbol || '';
                const limit = args.limit || 20;
                // Find nodes matching the symbol name
                const matches = this.unified.search(symbol, 1);
                if (matches.length === 0)
                    return JSON.stringify({ error: `Symbol not found: ${symbol}` });
                const callers = this.unified.findCallers(matches[0].id, limit);
                return JSON.stringify({
                    symbol: matches[0].name,
                    callers: callers.map(c => ({
                        name: c.name,
                        kind: c.kind,
                        file: c.file_path,
                        edge: c.edge_kind,
                    })),
                    count: callers.length,
                });
            }
            case 'toon_graph_impact': {
                const symbol = args.symbol || '';
                const depth = args.depth || 3;
                const matches = this.unified.search(symbol, 1);
                if (matches.length === 0)
                    return JSON.stringify({ error: `Symbol not found: ${symbol}` });
                const impacted = this.unified.impact(matches[0].id, depth);
                return JSON.stringify({
                    symbol: matches[0].name,
                    impactedCount: impacted.length,
                    depth,
                });
            }
            case 'toon_graph_search': {
                const query = args.query || '';
                const limit = args.limit || 20;
                const results = this.unified.search(query, limit);
                return JSON.stringify({
                    results: results.map(r => r.name),
                    count: results.length,
                });
            }
            case 'toon_graph_status': {
                const stats = this.unified.stats();
                return JSON.stringify(stats);
            }
            default:
                return JSON.stringify({ error: `Unknown tool: ${toolName}` });
        }
    }
    // Get tool definitions for MCP registration
    getTools() {
        return exports.GRAPH_MCP_TOOLS;
    }
    close() {
        this.unified?.close();
    }
}
exports.HermesGraphGateway = HermesGraphGateway;
// ─── Convenience ──────────────────────────────────────────────────────────────
function createGraphGateway(projectRoot) {
    const gw = new HermesGraphGateway(projectRoot);
    gw.init();
    return gw;
}
//# sourceMappingURL=hermes-gateway.js.map