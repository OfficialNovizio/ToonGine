"use strict";
// src/toon/v4/ingesters/code-review-graph.ts
// Ingests from tirth8205/code-review-graph (SQLite) into unified graph.
// Ingests ALL node types (File, Function, Class, etc.) so edges resolve.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestCodeReviewGraph = ingestCodeReviewGraph;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = require("fs");
const path_1 = require("path");
const bridge_types_1 = require("../bridge-types");
function ingestCodeReviewGraph(unified, projectRoot) {
    const start = Date.now();
    const errors = [];
    const dbPath = (0, path_1.join)(projectRoot, '.code-review-graph', 'graph.db');
    if (!(0, fs_1.existsSync)(dbPath)) {
        return {
            tool: 'code-review-graph',
            nodesIngested: 0,
            edgesIngested: 0,
            nodesDeduped: 0,
            errors: ['graph.db not found — run code-review-graph build'],
            durationMs: Date.now() - start,
        };
    }
    const sourceDb = new better_sqlite3_1.default(dbPath, { readonly: true });
    try {
        // ─── Ingest ALL nodes (File, Function, Class, Variable, etc.) ───────
        const allRows = sourceDb.prepare(`SELECT * FROM nodes`).all();
        const nodes = allRows.map((row) => ({
            id: (0, bridge_types_1.nodeId)(row.qualified_name || row.name, 'code-review-graph'),
            name: (row.name || row.qualified_name || '').replace(projectRoot + '/', ''),
            qualified_name: row.qualified_name || row.file_path || row.name || '',
            kind: row.kind || 'Unknown',
            file_path: row.file_path?.replace(projectRoot + '/', '') || null,
            language: row.language || null,
            community: null,
            tool_source: 'code-review-graph',
            tool_node_id: String(row.id),
            extra: { signature: row.signature, file_hash: row.file_hash },
        }));
        // ─── Ingest Import edges ────────────────────────────────────────────
        // Only include edges where BOTH source and target nodes exist
        const nodeIdSet = new Set(nodes.map(n => n.id));
        const edgeRows = sourceDb.prepare(`
      SELECT * FROM edges WHERE kind = 'IMPORTS_FROM' AND confidence > 0.5
    `).all();
        const edges = [];
        for (const e of edgeRows) {
            const sourceId = (0, bridge_types_1.nodeId)(e.source_qualified, 'code-review-graph');
            const targetId = (0, bridge_types_1.nodeId)(e.target_qualified, 'code-review-graph');
            // Skip edges to external packages (no corresponding node)
            if (!nodeIdSet.has(targetId))
                continue;
            edges.push({
                source_id: sourceId,
                target_id: targetId,
                kind: 'IMPORTS_FROM',
                confidence: e.confidence || 1.0,
                tool_source: 'code-review-graph',
                extra: { file_path: e.file_path, line: e.line },
            });
        }
        sourceDb.close();
        // ─── Ingest into unified ────────────────────────────────────────────
        const result = unified.ingest('code-review-graph', nodes, edges);
        result.errors = errors;
        return result;
    }
    catch (err) {
        sourceDb.close();
        return {
            tool: 'code-review-graph',
            nodesIngested: 0,
            edgesIngested: 0,
            nodesDeduped: 0,
            errors: [err.message],
            durationMs: Date.now() - start,
        };
    }
}
//# sourceMappingURL=code-review-graph.js.map