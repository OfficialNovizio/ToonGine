"use strict";
// src/toon/v4/unified-schema.ts
// SQL schema for the unified knowledge graph.
// Ingested from code-review-graph, graphify, and codegraph.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQL = exports.UNIFIED_SCHEMA = void 0;
exports.UNIFIED_SCHEMA = `
-- Unified nodes table — merged from all 3 tools
CREATE TABLE IF NOT EXISTS unified_nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  qualified_name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'Unknown',
  file_path TEXT,
  language TEXT,
  community TEXT,
  tool_source TEXT NOT NULL,
  tool_node_id TEXT,
  extra TEXT DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Unified edges table
CREATE TABLE IF NOT EXISTS unified_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'REFERENCES',
  confidence REAL DEFAULT 1.0,
  tool_source TEXT NOT NULL,
  extra TEXT DEFAULT '{}',
  FOREIGN KEY (source_id) REFERENCES unified_nodes(id),
  FOREIGN KEY (target_id) REFERENCES unified_nodes(id)
);

-- Full-text search index
CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
  name,
  kind,
  file_path,
  community,
  content='unified_nodes',
  content_rowid='rowid'
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_nodes_file ON unified_nodes(file_path);
CREATE INDEX IF NOT EXISTS idx_nodes_kind ON unified_nodes(kind);
CREATE INDEX IF NOT EXISTS idx_nodes_tool ON unified_nodes(tool_source);
CREATE INDEX IF NOT EXISTS idx_edges_source ON unified_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON unified_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_edges_kind ON unified_edges(kind);
CREATE INDEX IF NOT EXISTS idx_nodes_community ON unified_nodes(community);

-- Metadata table (last build time, tool versions, etc.)
CREATE TABLE IF NOT EXISTS unified_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;
// ─── Prepared Statements (reused across queries) ──────────────────────────
exports.SQL = {
    // Insert with dedup — skip if same id exists from another tool
    upsertNode: `
    INSERT OR IGNORE INTO unified_nodes
      (id, name, qualified_name, kind, file_path, language, community, tool_source, tool_node_id, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    upsertEdge: `
    INSERT OR IGNORE INTO unified_edges
      (source_id, target_id, kind, confidence, tool_source, extra)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    // Stats queries
    countNodes: `SELECT COUNT(*) as c FROM unified_nodes`,
    countEdges: `SELECT COUNT(*) as c FROM unified_edges`,
    countFiles: `SELECT COUNT(DISTINCT file_path) as c FROM unified_nodes WHERE kind = 'File'`,
    languageBreakdown: `
    SELECT language, COUNT(*) as c FROM unified_nodes
    WHERE kind = 'File' AND language IS NOT NULL
    GROUP BY language ORDER BY c DESC
  `,
    toolBreakdown: `
    SELECT tool_source, COUNT(*) as c FROM unified_nodes
    GROUP BY tool_source ORDER BY c DESC
  `,
    // FTS5 search
    search: `
    SELECT n.* FROM unified_nodes n
    JOIN nodes_fts fts ON n.rowid = fts.rowid
    WHERE nodes_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `,
    // Find nodes by file path pattern (for agent department matching)
    findByFilePattern: `
    SELECT * FROM unified_nodes
    WHERE file_path LIKE ?
    LIMIT ?
  `,
    // Find callers (edges pointing TO this node)
    findCallers: `
    SELECT n.*, e.kind as edge_kind
    FROM unified_nodes n
    JOIN unified_edges e ON n.id = e.source_id
    WHERE e.target_id = ?
    LIMIT ?
  `,
    // Find callees (edges FROM this node)
    findCallees: `
    SELECT n.*, e.kind as edge_kind
    FROM unified_nodes n
    JOIN unified_edges e ON n.id = e.target_id
    WHERE e.source_id = ?
    LIMIT ?
  `,
    // Impact analysis — recursive callers up to depth
    setMeta: `INSERT OR REPLACE INTO unified_meta (key, value) VALUES (?, ?)`,
    getMeta: `SELECT value FROM unified_meta WHERE key = ?`,
};
//# sourceMappingURL=unified-schema.js.map