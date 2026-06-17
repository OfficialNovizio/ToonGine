"use strict";
// src/toon/v4/ingesters/codegraph.ts
// Ingests from colbymchenry/codegraph (MCP/CLI) into unified graph.
// Uses codegraph CLI for extraction (codegraph explore/status).
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestCodegraph = ingestCodegraph;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const bridge_types_1 = require("../bridge-types");
function ingestCodegraph(unified, projectRoot) {
    const start = Date.now();
    const errors = [];
    // Check if codegraph is installed
    try {
        (0, child_process_1.execSync)('which codegraph', { stdio: 'pipe' });
    }
    catch {
        return {
            tool: 'codegraph',
            nodesIngested: 0,
            edgesIngested: 0,
            nodesDeduped: 0,
            errors: ['codegraph CLI not found — install via: npm i -g @colbymchenry/codegraph'],
            durationMs: Date.now() - start,
        };
    }
    // Check if project has been indexed
    const dbPath = (0, path_1.join)(projectRoot, '.codegraph', 'codegraph.db');
    if (!(0, fs_1.existsSync)(dbPath)) {
        return {
            tool: 'codegraph',
            nodesIngested: 0,
            edgesIngested: 0,
            nodesDeduped: 0,
            errors: ['codegraph not initialized — run: codegraph init'],
            durationMs: Date.now() - start,
        };
    }
    try {
        // ─── Get status ─────────────────────────────────────────────────────
        const statusOut = (0, child_process_1.execSync)('codegraph status --json', {
            cwd: projectRoot,
            stdio: 'pipe',
            timeout: 15000,
        }).toString();
        let stats = {};
        try {
            stats = JSON.parse(statusOut);
        }
        catch { /* non-JSON output */ }
        // ─── Get file list ──────────────────────────────────────────────────
        const filesOut = (0, child_process_1.execSync)('codegraph files --json', {
            cwd: projectRoot,
            stdio: 'pipe',
            timeout: 15000,
        }).toString();
        let files = [];
        try {
            const parsed = JSON.parse(filesOut);
            files = Array.isArray(parsed) ? parsed : (parsed.files || []);
        }
        catch { /* skip file list */ }
        // ─── Create file nodes ──────────────────────────────────────────────
        const nodes = files.map((f) => ({
            id: (0, bridge_types_1.nodeId)(f, 'codegraph'),
            name: f,
            qualified_name: f,
            kind: 'File',
            file_path: f,
            language: detectLanguage(f),
            community: null,
            tool_source: 'codegraph',
            tool_node_id: null,
            extra: {},
        }));
        // ─── Create edges from codegraph explore on major symbols ────────────
        const edges = [];
        // For now, file-level edges only — deep symbol extraction via codegraph MCP at runtime
        // (codegraph's SQLite schema is different from code-review-graph)
        const result = unified.ingest('codegraph', nodes, edges);
        result.errors = errors;
        return result;
    }
    catch (err) {
        return {
            tool: 'codegraph',
            nodesIngested: 0,
            edgesIngested: 0,
            nodesDeduped: 0,
            errors: [err.stderr?.toString() || err.message],
            durationMs: Date.now() - start,
        };
    }
}
function detectLanguage(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
        ts: 'typescript', tsx: 'typescript',
        js: 'javascript', jsx: 'javascript',
        py: 'python',
        rs: 'rust',
        go: 'go',
        java: 'java',
        rb: 'ruby',
        cs: 'csharp',
        php: 'php',
        swift: 'swift',
        kt: 'kotlin',
        scala: 'scala',
        dart: 'dart',
        lua: 'lua',
        r: 'r',
        vue: 'vue',
        svelte: 'svelte',
        astro: 'astro',
        css: 'css',
        html: 'html',
        md: 'markdown',
        json: 'json',
        yml: 'yaml', yaml: 'yaml',
        sql: 'sql',
        sh: 'bash', bash: 'bash',
    };
    return langMap[ext || ''] || null;
}
//# sourceMappingURL=codegraph.js.map