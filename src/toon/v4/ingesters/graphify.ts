// src/toon/v4/ingesters/graphify.ts
// Ingests from safishamsi/graphify (JSON) into unified graph.

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { UnifiedGraph } from '../unified-graph'
import { UnifiedNode, UnifiedEdge, IngestionResult, nodeId } from '../bridge-types'

interface GraphifyNode {
  id: string | number
  label: string
  type?: string
  community?: number | string
  file_path?: string
  language?: string
  metadata?: Record<string, any>
}

interface GraphifyEdge {
  source: string | number
  target: string | number
  kind?: string
  confidence?: number
}

interface GraphifyGraph {
  nodes: GraphifyNode[]
  links?: GraphifyEdge[]      // graphify uses 'links' not 'edges'
  edges?: GraphifyEdge[]      // fallback
  communities?: { id: number | string; name: string; nodes?: (string | number)[] }[]
}

export function ingestGraphify(
  unified: UnifiedGraph,
  projectRoot: string,
): IngestionResult {
  const start = Date.now()
  const errors: string[] = []
  const jsonPath = join(projectRoot, 'graphify-out', 'graph.json')

  if (!existsSync(jsonPath)) {
    return {
      tool: 'graphify',
      nodesIngested: 0,
      edgesIngested: 0,
      nodesDeduped: 0,
      errors: ['graph.json not found — run graphify .'],
      durationMs: Date.now() - start,
    }
  }

  try {
    const raw = readFileSync(jsonPath, 'utf-8')
    const graph: GraphifyGraph = JSON.parse(raw)

    // ─── Build community map ────────────────────────────────────────────
    const communityMap = new Map<string, string>()
    if (graph.communities) {
      for (const c of graph.communities) {
        const cName = c.name || `community-${c.id}`
        if (c.nodes) {
          for (const nId of c.nodes) {
            communityMap.set(String(nId), cName)
          }
        }
      }
    }

    // ─── Convert nodes ──────────────────────────────────────────────────
    const nodes: UnifiedNode[] = graph.nodes.map((gn: GraphifyNode) => {
      const label = gn.label || gn.id?.toString() || 'unknown'
      return {
        id: nodeId(label, 'graphify'),
        name: label.replace(projectRoot + '/', '').slice(0, 200),
        qualified_name: label,
        kind: gn.type || 'Unknown',
        file_path: gn.file_path || null,
        language: gn.language || null,
        community: communityMap.get(String(gn.id)) || null,
        tool_source: 'graphify',
        tool_node_id: String(gn.id),
        extra: gn.metadata || {},
      }
    })

    // ─── Convert edges ──────────────────────────────────────────────────
    const rawEdges = graph.links || graph.edges || []
    const edges: UnifiedEdge[] = []
    if (rawEdges.length > 0) {
      for (const ge of rawEdges) {
        // Look up source and target labels from nodes
        const srcNode = graph.nodes.find(n => String(n.id) === String(ge.source))
        const tgtNode = graph.nodes.find(n => String(n.id) === String(ge.target))
        if (!srcNode || !tgtNode) continue

        edges.push({
          source_id: nodeId(srcNode.label || String(ge.source), 'graphify'),
          target_id: nodeId(tgtNode.label || String(ge.target), 'graphify'),
          kind: ge.kind || 'REFERENCES',
          confidence: ge.confidence || 1.0,
          tool_source: 'graphify',
          extra: {},
        })
      }
    }

    const result = unified.ingest('graphify', nodes, edges)
    result.errors = errors
    return result
  } catch (err: any) {
    return {
      tool: 'graphify',
      nodesIngested: 0,
      edgesIngested: 0,
      nodesDeduped: 0,
      errors: [err.message],
      durationMs: Date.now() - start,
    }
  }
}
