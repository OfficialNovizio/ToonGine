"use strict";
// src/toon/v4/unified-graph.ts
// Unified knowledge graph — single SQLite database ingesting from all 3 tools.
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedGraph = void 0;
exports.createUnifiedGraph = createUnifiedGraph;
const unified_schema_1 = require("./unified-schema");
const fs_1 = require("fs");
const path_1 = require("path");
// Lazy-load better-sqlite3 (optional dependency — N/A on Windows)
let Database = null;
function getSQLite() {
    if (Database)
        return Database;
    try {
        Database = require('better-sqlite3');
        return Database;
    }
    catch {
        throw new Error('better-sqlite3 is not available. Install it: npm install better-sqlite3\n' +
            'This is an optional dependency and may fail on Windows without build tools.');
    }
}
// ─── UnifiedGraph Class ──────────────────────────────────────────────────────
class UnifiedGraph {
    constructor(dbPath) {
        this.dbPath = dbPath;
        const SQLite = getSQLite();
        this.db = new SQLite(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
    }
    // ─── Initialize schema ──────────────────────────────────────────────────
    initialize() {
        this.db.exec(unified_schema_1.UNIFIED_SCHEMA);
    }
    // ─── Ingest nodes ───────────────────────────────────────────────────────
    ingestNodes(nodes) {
        let count = 0;
        const stmt = this.db.prepare(unified_schema_1.SQL.upsertNode);
        const insertMany = this.db.transaction((batch) => {
            for (const n of batch) {
                stmt.run(n.id, n.name, n.qualified_name, n.kind, n.file_path || null, n.language || null, n.community || null, n.tool_source, n.tool_node_id || null, JSON.stringify(n.extra || {}));
                count++;
            }
        });
        insertMany(nodes);
        return count;
    }
    // ─── Ingest edges ───────────────────────────────────────────────────────
    ingestEdges(edges) {
        let count = 0;
        const stmt = this.db.prepare(unified_schema_1.SQL.upsertEdge);
        const insertMany = this.db.transaction((batch) => {
            for (const e of batch) {
                stmt.run(e.source_id, e.target_id, e.kind, e.confidence, e.tool_source, JSON.stringify(e.extra || {}));
                count++;
            }
        });
        insertMany(edges);
        return count;
    }
    // ─── Ingest with dedup tracking ─────────────────────────────────────────
    ingest(tool, nodes, edges) {
        const start = Date.now();
        const before = this.db.prepare('SELECT COUNT(*) as c FROM unified_nodes').get();
        const nIngested = this.ingestNodes(nodes);
        const eIngested = this.ingestEdges(edges);
        const after = this.db.prepare('SELECT COUNT(*) as c FROM unified_nodes').get();
        const deduped = (before.c + nodes.length) - after.c;
        // Rebuild FTS5 index
        this.db.exec("INSERT INTO nodes_fts(nodes_fts) VALUES('rebuild')");
        // Update metadata
        this.db.prepare(unified_schema_1.SQL.setMeta).run('last_built', new Date().toISOString());
        this.db.prepare(unified_schema_1.SQL.setMeta).run(`tool_${tool}_version`, 'latest');
        return {
            tool,
            nodesIngested: nIngested - deduped,
            edgesIngested: eIngested,
            nodesDeduped: deduped,
            errors: [],
            durationMs: Date.now() - start,
        };
    }
    // ─── Stats ──────────────────────────────────────────────────────────────
    stats() {
        const nodeCount = this.db.prepare(unified_schema_1.SQL.countNodes).get().c;
        const edgeCount = this.db.prepare(unified_schema_1.SQL.countEdges).get().c;
        const fileCount = this.db.prepare(unified_schema_1.SQL.countFiles).get().c;
        const communityCount = this.db.prepare('SELECT COUNT(DISTINCT community) as c FROM unified_nodes WHERE community IS NOT NULL').get().c;
        const langRows = this.db.prepare(unified_schema_1.SQL.languageBreakdown).all();
        const toolRows = this.db.prepare(unified_schema_1.SQL.toolBreakdown).all();
        const languageBreakdown = {};
        for (const r of langRows)
            languageBreakdown[r.language] = r.c;
        const toolBreakdown = {};
        for (const r of toolRows)
            toolBreakdown[r.tool_source] = r.c;
        const lastBuiltRow = this.db.prepare(unified_schema_1.SQL.getMeta).get('last_built');
        const lastBuilt = lastBuiltRow?.value || null;
        const stale = lastBuilt
            ? (Date.now() - new Date(lastBuilt).getTime()) > 60000
            : true;
        return {
            nodeCount,
            edgeCount,
            fileCount,
            communityCount,
            languageBreakdown,
            toolBreakdown,
            lastBuilt,
            stale,
        };
    }
    // ─── Query ──────────────────────────────────────────────────────────────
    search(query, limit = 20) {
        const rows = this.db.prepare(unified_schema_1.SQL.search).all(query, limit);
        return rows.map(this.rowToNode);
    }
    findByFilePattern(pattern, limit = 50) {
        const rows = this.db.prepare(unified_schema_1.SQL.findByFilePattern).all(pattern, limit);
        return rows.map(this.rowToNode);
    }
    findCallers(nodeId, limit = 20) {
        return this.db.prepare(unified_schema_1.SQL.findCallers).all(nodeId, limit);
    }
    findCallees(nodeId, limit = 20) {
        return this.db.prepare(unified_schema_1.SQL.findCallees).all(nodeId, limit);
    }
    // ─── Impact analysis — recursive callers ────────────────────────────────
    impact(nodeId, maxDepth = 3) {
        const visited = new Set();
        const queue = [{ id: nodeId, depth: 0 }];
        while (queue.length > 0) {
            const { id, depth } = queue.shift();
            if (visited.has(id) || depth >= maxDepth)
                continue;
            visited.add(id);
            const callers = this.db.prepare('SELECT source_id FROM unified_edges WHERE target_id = ? LIMIT 50').all(id);
            for (const c of callers) {
                if (!visited.has(c.source_id)) {
                    queue.push({ id: c.source_id, depth: depth + 1 });
                }
            }
        }
        return Array.from(visited);
    }
    // ─── Close ──────────────────────────────────────────────────────────────
    close() {
        this.db.close();
    }
    // ─── Helpers ────────────────────────────────────────────────────────────
    rowToNode(row) {
        return {
            id: row.id,
            name: row.name,
            qualified_name: row.qualified_name,
            kind: row.kind,
            file_path: row.file_path,
            language: row.language,
            community: row.community,
            tool_source: row.tool_source,
            tool_node_id: row.tool_node_id,
            extra: JSON.parse(row.extra || '{}'),
        };
    }
}
exports.UnifiedGraph = UnifiedGraph;
// ─── Factory ────────────────────────────────────────────────────────────────
function createUnifiedGraph(projectRoot) {
    const graphDir = (0, path_1.join)(projectRoot, '.toon', 'graph');
    if (!(0, fs_1.existsSync)(graphDir)) {
        (0, fs_1.mkdirSync)(graphDir, { recursive: true });
    }
    const dbPath = (0, path_1.join)(graphDir, 'unified.db');
    const graph = new UnifiedGraph(dbPath);
    graph.initialize();
    return graph;
}
//# sourceMappingURL=unified-graph.js.map