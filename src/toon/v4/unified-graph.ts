// src/toon/v4/unified-graph.ts
// Unified knowledge graph — single SQLite database ingesting from all 3 tools.

import Database from 'better-sqlite3'
import { UNIFIED_SCHEMA, SQL } from './unified-schema'
import {
  UnifiedNode,
  UnifiedEdge,
  UnifiedGraphStats,
  IngestionResult,
  nodeId,
  stableHash,
} from './bridge-types'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// ─── UnifiedGraph Class ──────────────────────────────────────────────────────

export class UnifiedGraph {
  private db: Database.Database
  private dbPath: string

  constructor(dbPath: string) {
    this.dbPath = dbPath
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
  }

  // ─── Initialize schema ──────────────────────────────────────────────────
  initialize(): void {
    this.db.exec(UNIFIED_SCHEMA)
  }

  // ─── Ingest nodes ───────────────────────────────────────────────────────
  ingestNodes(nodes: UnifiedNode[]): number {
    let count = 0
    const stmt = this.db.prepare(SQL.upsertNode)
    const insertMany = this.db.transaction((batch: UnifiedNode[]) => {
      for (const n of batch) {
        stmt.run(
          n.id,
          n.name,
          n.qualified_name,
          n.kind,
          n.file_path || null,
          n.language || null,
          n.community || null,
          n.tool_source,
          n.tool_node_id || null,
          JSON.stringify(n.extra || {}),
        )
        count++
      }
    })
    insertMany(nodes)
    return count
  }

  // ─── Ingest edges ───────────────────────────────────────────────────────
  ingestEdges(edges: UnifiedEdge[]): number {
    let count = 0
    const stmt = this.db.prepare(SQL.upsertEdge)
    const insertMany = this.db.transaction((batch: UnifiedEdge[]) => {
      for (const e of batch) {
        stmt.run(
          e.source_id,
          e.target_id,
          e.kind,
          e.confidence,
          e.tool_source,
          JSON.stringify(e.extra || {}),
        )
        count++
      }
    })
    insertMany(edges)
    return count
  }

  // ─── Ingest with dedup tracking ─────────────────────────────────────────
  ingest(tool: string, nodes: UnifiedNode[], edges: UnifiedEdge[]): IngestionResult {
    const start = Date.now()
    const before = this.db.prepare('SELECT COUNT(*) as c FROM unified_nodes').get() as any

    const nIngested = this.ingestNodes(nodes)
    const eIngested = this.ingestEdges(edges)

    const after = this.db.prepare('SELECT COUNT(*) as c FROM unified_nodes').get() as any
    const deduped = (before.c + nodes.length) - after.c

    // Rebuild FTS5 index
    this.db.exec("INSERT INTO nodes_fts(nodes_fts) VALUES('rebuild')")

    // Update metadata
    this.db.prepare(SQL.setMeta).run('last_built', new Date().toISOString())
    this.db.prepare(SQL.setMeta).run(`tool_${tool}_version`, 'latest')

    return {
      tool,
      nodesIngested: nIngested - deduped,
      edgesIngested: eIngested,
      nodesDeduped: deduped,
      errors: [],
      durationMs: Date.now() - start,
    }
  }

  // ─── Stats ──────────────────────────────────────────────────────────────
  stats(): UnifiedGraphStats {
    const nodeCount = (this.db.prepare(SQL.countNodes).get() as any).c
    const edgeCount = (this.db.prepare(SQL.countEdges).get() as any).c
    const fileCount = (this.db.prepare(SQL.countFiles).get() as any).c
    const communityCount = (this.db.prepare('SELECT COUNT(DISTINCT community) as c FROM unified_nodes WHERE community IS NOT NULL').get() as any).c

    const langRows = this.db.prepare(SQL.languageBreakdown).all() as any[]
    const toolRows = this.db.prepare(SQL.toolBreakdown).all() as any[]

    const languageBreakdown: Record<string, number> = {}
    for (const r of langRows) languageBreakdown[r.language] = r.c

    const toolBreakdown: Record<string, number> = {}
    for (const r of toolRows) toolBreakdown[r.tool_source] = r.c

    const lastBuiltRow = this.db.prepare(SQL.getMeta).get('last_built') as any
    const lastBuilt = lastBuiltRow?.value || null
    const stale = lastBuilt
      ? (Date.now() - new Date(lastBuilt).getTime()) > 60_000
      : true

    return {
      nodeCount,
      edgeCount,
      fileCount,
      communityCount,
      languageBreakdown,
      toolBreakdown,
      lastBuilt,
      stale,
    }
  }

  // ─── Query ──────────────────────────────────────────────────────────────
  search(query: string, limit: number = 20): UnifiedNode[] {
    const rows = this.db.prepare(SQL.search).all(query, limit) as any[]
    return rows.map(this.rowToNode)
  }

  findByFilePattern(pattern: string, limit: number = 50): UnifiedNode[] {
    const rows = this.db.prepare(SQL.findByFilePattern).all(pattern, limit) as any[]
    return rows.map(this.rowToNode)
  }

  findCallers(nodeId: string, limit: number = 20): Array<UnifiedNode & { edge_kind: string }> {
    return this.db.prepare(SQL.findCallers).all(nodeId, limit) as any[]
  }

  findCallees(nodeId: string, limit: number = 20): Array<UnifiedNode & { edge_kind: string }> {
    return this.db.prepare(SQL.findCallees).all(nodeId, limit) as any[]
  }

  // ─── Impact analysis — recursive callers ────────────────────────────────
  impact(nodeId: string, maxDepth: number = 3): string[] {
    const visited = new Set<string>()
    const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }]

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (visited.has(id) || depth >= maxDepth) continue
      visited.add(id)

      const callers = this.db.prepare('SELECT source_id FROM unified_edges WHERE target_id = ? LIMIT 50').all(id) as any[]
      for (const c of callers) {
        if (!visited.has(c.source_id)) {
          queue.push({ id: c.source_id, depth: depth + 1 })
        }
      }
    }

    return Array.from(visited)
  }

  // ─── Close ──────────────────────────────────────────────────────────────
  close(): void {
    this.db.close()
  }

  // ─── Helpers ────────────────────────────────────────────────────────────
  private rowToNode(row: any): UnifiedNode {
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
    }
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createUnifiedGraph(projectRoot: string): UnifiedGraph {
  const graphDir = join(projectRoot, '.toon', 'graph')
  if (!existsSync(graphDir)) {
    mkdirSync(graphDir, { recursive: true })
  }
  const dbPath = join(graphDir, 'unified.db')
  const graph = new UnifiedGraph(dbPath)
  graph.initialize()
  return graph
}
