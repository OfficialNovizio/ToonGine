"use strict";
// src/toon/v4/auto-activate.ts
// One command to rule them all: npx toongine init
// Auto-detects project state, installs tools, builds graph, starts watchers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const fs_1 = require("fs");
const path_1 = require("path");
const unified_graph_1 = require("./unified-graph");
const index_1 = require("./ingesters/index");
const tool_installer_1 = require("./tool-installer");
const watcher_1 = require("./watcher");
function activate(projectRoot) {
    const start = Date.now();
    const errors = [];
    // ─── 1. Ensure .toon/ structure ────────────────────────────────────────
    const toonDir = (0, path_1.join)(projectRoot, '.toon');
    const graphDir = (0, path_1.join)(toonDir, 'graph');
    const toolsDir = (0, path_1.join)(toonDir, 'tools');
    if (!(0, fs_1.existsSync)(toonDir))
        (0, fs_1.mkdirSync)(toonDir, { recursive: true });
    if (!(0, fs_1.existsSync)(graphDir))
        (0, fs_1.mkdirSync)(graphDir, { recursive: true });
    if (!(0, fs_1.existsSync)(toolsDir))
        (0, fs_1.mkdirSync)(toolsDir, { recursive: true });
    // ─── 2. Detect project state ───────────────────────────────────────────
    const isEmpty = isProjectEmpty(projectRoot);
    // ─── 3. Install/verify tools ───────────────────────────────────────────
    const tools = (0, tool_installer_1.ensureAllTools)(projectRoot);
    // ─── 4. Build unified graph ────────────────────────────────────────────
    let graphNodes = 0;
    let graphEdges = 0;
    if (!isEmpty) {
        const unified = (0, unified_graph_1.createUnifiedGraph)(projectRoot);
        try {
            const report = (0, index_1.ingestAll)(unified, projectRoot);
            graphNodes = report.unifiedStats.nodeCount;
            graphEdges = report.unifiedStats.edgeCount;
            for (const r of report.results) {
                if (r.errors.length > 0) {
                    errors.push(`${r.tool}: ${r.errors.join('; ')}`);
                }
            }
        }
        catch (err) {
            errors.push(`graph build failed: ${err.message}`);
        }
        unified.close();
    }
    else {
        // Empty project — create empty schema
        const unified = (0, unified_graph_1.createUnifiedGraph)(projectRoot);
        unified.close();
    }
    // ─── 5. Start watchers ─────────────────────────────────────────────────
    const watchers = (0, watcher_1.startWatcher)(projectRoot);
    return {
        projectRoot,
        isEmpty,
        tools,
        graphNodes,
        graphEdges,
        watchers,
        durationMs: Date.now() - start,
        errors,
    };
}
function deactivate(projectRoot) {
    (0, watcher_1.stopAllWatchers)();
}
function isProjectEmpty(root) {
    try {
        const entries = (0, fs_1.readdirSync)(root);
        // Filter out common non-code dirs
        const codeDirs = entries.filter(e => {
            if (e.startsWith('.'))
                return false;
            if (['node_modules', 'dist', '.next', 'graphify-out'].includes(e))
                return false;
            const full = (0, path_1.join)(root, e);
            try {
                return (0, fs_1.statSync)(full).isDirectory();
            }
            catch {
                return false;
            }
        });
        // Check if any directory has source files
        for (const dir of codeDirs) {
            const files = (0, fs_1.readdirSync)((0, path_1.join)(root, dir));
            if (files.some(f => /\.(ts|tsx|js|jsx|py|md)$/.test(f)))
                return false;
        }
        return true;
    }
    catch {
        return true;
    }
}
//# sourceMappingURL=auto-activate.js.map