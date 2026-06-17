// src/toon/v4/ingesters/index.ts
// Run all 3 ingesters in parallel and report results.

import { UnifiedGraph } from '../unified-graph'
import { IngestionResult } from '../bridge-types'
import { ingestCodeReviewGraph } from './code-review-graph'
import { ingestGraphify } from './graphify'
import { ingestCodegraph } from './codegraph'

export interface FullIngestionReport {
  projectRoot: string
  results: IngestionResult[]
  totalNodes: number
  totalEdges: number
  totalDeduped: number
  totalErrors: number
  durationMs: number
  unifiedStats: ReturnType<UnifiedGraph['stats']>
}

export function ingestAll(
  unified: UnifiedGraph,
  projectRoot: string,
): FullIngestionReport {
  const start = Date.now()

  // Run all ingestors
  const results: IngestionResult[] = [
    ingestCodeReviewGraph(unified, projectRoot),
    ingestGraphify(unified, projectRoot),
    ingestCodegraph(unified, projectRoot),
  ]

  const totalNodes = results.reduce((s, r) => s + r.nodesIngested, 0)
  const totalEdges = results.reduce((s, r) => s + r.edgesIngested, 0)
  const totalDeduped = results.reduce((s, r) => s + r.nodesDeduped, 0)
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0)
  const unifiedStats = unified.stats()

  return {
    projectRoot,
    results,
    totalNodes,
    totalEdges,
    totalDeduped,
    totalErrors,
    durationMs: Date.now() - start,
    unifiedStats,
  }
}

export { ingestCodeReviewGraph, ingestGraphify, ingestCodegraph }
