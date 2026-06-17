// src/toon/v4/bridge-types.ts
// Shared types for the V4 graph intelligence bridge.
// Normalizes schemas from code-review-graph, graphify, and codegraph.

// ─── Unified Node ────────────────────────────────────────────────────────────
export interface UnifiedNode {
  id: string               // stable hash (SHA256 first 16 of qualified_name)
  name: string             // human-readable name
  qualified_name: string   // full path or fully-qualified symbol name
  kind: string             // File | Function | Class | Method | Variable | Route | Community
  file_path: string | null // source file path (relative to project root)
  language: string | null  // typescript | python | javascript | etc.
  community: string | null // community/cluster name
  tool_source: string      // 'code-review-graph' | 'graphify' | 'codegraph'
  tool_node_id: string | null // original node ID from source tool
  extra: Record<string, any>  // tool-specific metadata
}

// ─── Unified Edge ────────────────────────────────────────────────────────────
export interface UnifiedEdge {
  id?: number              // auto-increment
  source_id: string        // unified node id
  target_id: string        // unified node id
  kind: string             // IMPORTS_FROM | CALLS | REFERENCES | EXTENDS | IMPLEMENTS | ROUTES_TO
  confidence: number       // 0.0–1.0
  tool_source: string      // which tool found this edge
  extra: Record<string, any>
}

// ─── Graph Statistics ────────────────────────────────────────────────────────
export interface UnifiedGraphStats {
  nodeCount: number
  edgeCount: number
  fileCount: number
  communityCount: number
  languageBreakdown: Record<string, number>
  toolBreakdown: Record<string, number>  // nodes per tool source
  lastBuilt: string | null               // ISO timestamp
  stale: boolean                         // true if >60s since last sync
}

// ─── Ingestion Result ────────────────────────────────────────────────────────
export interface IngestionResult {
  tool: string
  nodesIngested: number
  edgesIngested: number
  nodesDeduped: number
  errors: string[]
  durationMs: number
}

// ─── Bridge Config ───────────────────────────────────────────────────────────
export interface BridgeConfig {
  version: '4.0.0'
  projectRoot: string
  tools: {
    'code-review-graph': { installed: boolean; path: string; status: 'ok' | 'missing' | 'error' }
    'graphify': { installed: boolean; path: string; status: 'ok' | 'missing' | 'error' }
    'codegraph': { installed: boolean; path: string; status: 'ok' | 'missing' | 'error' }
  }
  watcher: {
    enabled: boolean
    debounceMs: number
    running: boolean
  }
  compression: {
    target: number        // 0.99 = 99%
    achieved: number      // actual last measurement
  }
}

// ─── MCP Tool Definition ─────────────────────────────────────────────────────
export interface MCPToolDef {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required: string[]
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
import { createHash } from 'crypto'

export function stableHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
}

export function nodeId(qualifiedName: string, tool: string): string {
  return stableHash(tool + '::' + qualifiedName)
}
