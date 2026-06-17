// src/toon/v4/ingesters/code-review-graph.ts
// Ingests from tirth8205/code-review-graph (SQLite) into unified graph.
// Ingests ALL node types (File, Function, Class, etc.) so edges resolve.

import Database from 'better-sqlite3'
import { existsSync } from 'fs'
import { join } from 'path'
import { UnifiedGraph } from '../unified-graph'
import { UnifiedNode, UnifiedEdge, IngestionResult, nodeId } from '../bridge-types'

export function ingestCodeReviewGraph(
  unified: UnifiedGraph,
  projectRoot: string,
): IngestionResult {
  const start = Date.now()
  const errors: string[] = []
  const dbPath = join(projectRoot, '.code-review-graph', 'graph.db')

  if (!existsSync(dbPath)) {
    return {
      tool: 'code-review-graph',
      nodesIngested: 0,
      edgesIngested: 0,
      nodesDeduped: 0,
      errors: ['graph.db not found — run code-review-graph build'],
      durationMs: Date.now() - start,
    }
  }

  const sourceDb = new Database(dbPath, { readonly: true })

  try {
    // ─── Ingest ALL nodes (File, Function, Class, Variable, etc.) ───────
    const allRows = sourceDb.prepare(`SELECT * FROM nodes`).all() as any[]

    const nodes: UnifiedNode[] = allRows.map((row: any) => ({
      id: nodeId(row.qualified_name || row.name, 'code-review-graph'),
      name: (row.name || row.qualified_name || '').replace(projectRoot + '/', ''),
      qualified_name: row.qualified_name || row.file_path || row.name || '',
      kind: row.kind || 'Unknown',
      file_path: row.file_path?.replace(projectRoot + '/', '') || null,
      language: row.language || null,
      community: null,
      tool_source: 'code-review-graph' as const,
      tool_node_id: String(row.id),
      extra: { signature: row.signature, file_hash: row.file_hash },
    }))

    // ─── Ingest Import edges ────────────────────────────────────────────
    // Only include edges where BOTH source and target nodes exist
    const nodeIdSet = new Set(nodes.map(n => n.id))

    const edgeRows = sourceDb.prepare(`
      SELECT * FROM edges WHERE kind = 'IMPORTS_FROM' AND confidence > 0.5
    `).all() as any[]

    const edges: UnifiedEdge[] = []
    for (const e of edgeRows) {
      const sourceId = nodeId(e.source_qualified, 'code-review-graph')
      const targetId = nodeId(e.target_qualified, 'code-review-graph')

      // Skip edges to external packages (no corresponding node)
      if (!nodeIdSet.has(targetId)) continue

      edges.push({
        source_id: sourceId,
        target_id: targetId,
        kind: 'IMPORTS_FROM',
        confidence: e.confidence || 1.0,
        tool_source: 'code-review-graph',
        extra: { file_path: e.file_path, line: e.line },
      })
    }

    sourceDb.close()

    // ─── Ingest into unified ────────────────────────────────────────────
    const result = unified.ingest('code-review-graph', nodes, edges)
    result.errors = errors
    return result
  } catch (err: any) {
    sourceDb.close()
    return {
      tool: 'code-review-graph',
      nodesIngested: 0,
      edgesIngested: 0,
      nodesDeduped: 0,
      errors: [err.message],
      durationMs: Date.now() - start,
    }
  }
}
