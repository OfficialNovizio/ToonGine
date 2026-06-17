"use strict";
// src/toon/v4/compression-verifier.ts
// Measures TOON V4 compression against the 99% target.
// Compares raw agent data + graph data size vs stratified delivery size.
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureCompression = measureCompression;
const fs_1 = require("fs");
const path_1 = require("path");
const engine_1 = require("./engine");
function measureCompression(projectRoot) {
    // ─── Measure raw data size ──────────────────────────────────────────────
    const agentDir = (0, path_1.join)(projectRoot, '.toon', 'agents');
    const graphDb = (0, path_1.join)(projectRoot, '.toon', 'graph', 'unified.db');
    let agentDataBytes = 0;
    if ((0, fs_1.existsSync)(agentDir)) {
        agentDataBytes = dirSize(agentDir);
    }
    let graphDataBytes = 0;
    if ((0, fs_1.existsSync)(graphDb)) {
        graphDataBytes = (0, fs_1.statSync)(graphDb).size;
    }
    const rawSizeBytes = agentDataBytes + graphDataBytes;
    // ─── Measure compressed delivery ────────────────────────────────────────
    const engine = (0, engine_1.createV4Engine)(projectRoot);
    // Test with representative agents
    const testAgents = [
        { agentId: 'marcus-ceo', agentDept: 'CEO', agentLevel: 1 },
        { agentId: 'kahneman', agentDept: 'Psychology', agentLevel: 2 },
        { agentId: 'dev', agentDept: 'Technical', agentLevel: 3 },
    ];
    const perAgent = [];
    let totalCompressedTokens = 0;
    for (const req of testAgents) {
        const ctx = engine.buildContext(req);
        perAgent.push({
            agentId: req.agentId,
            agentTokens: ctx.agentTokens,
            graphTokens: ctx.graphTokens,
            totalTokens: ctx.totalTokens,
        });
        totalCompressedTokens += ctx.totalTokens;
    }
    engine.close();
    // Average across agents
    const avgTokens = Math.round(totalCompressedTokens / testAgents.length);
    const compressedBytes = avgTokens * 4; // ~4 bytes per token
    const compressionRatio = rawSizeBytes > 0
        ? 1 - (compressedBytes / rawSizeBytes)
        : 1;
    return {
        rawSizeBytes,
        compressedTokens: avgTokens,
        compressedBytes,
        compressionRatio,
        targetMet: compressionRatio >= 0.99,
        breakdown: {
            agentDataBytes,
            graphDataBytes,
            agentTokens: perAgent[0]?.agentTokens || 0,
            graphTokens: perAgent[0]?.graphTokens || 0,
        },
        perAgent,
    };
}
function dirSize(dir) {
    let size = 0;
    try {
        for (const entry of (0, fs_1.readdirSync)(dir, { recursive: true })) {
            const full = (0, path_1.join)(dir, entry);
            try {
                if ((0, fs_1.statSync)(full).isFile()) {
                    size += (0, fs_1.statSync)(full).size;
                }
            }
            catch { /* skip */ }
        }
    }
    catch { /* skip */ }
    return size;
}
//# sourceMappingURL=compression-verifier.js.map