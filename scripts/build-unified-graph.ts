#!/usr/bin/env npx tsx
// Build unified.db from all available graph tool outputs
// Usage: npx tsx scripts/build-unified-graph.ts [project-root]

import { createUnifiedGraph, UnifiedGraph } from '../src/toon/v4/unified-graph'
import { ingestCodeReviewGraph } from '../src/toon/v4/ingesters/code-review-graph'
import { ingestGraphify } from '../src/toon/v4/ingesters/graphify'
import { ingestCodegraph } from '../src/toon/v4/ingesters/codegraph'
import * as fs from 'fs'
import * as path from 'path'

const projectRoot = path.resolve(process.argv[2] || process.cwd())
console.log(`Building unified graph for: ${projectRoot}`)

// Check if data exists
const crgDir = path.join(projectRoot, '.code-review-graph')
const graphifyDir = path.join(projectRoot, 'graphify-out')
const codegraphDir = path.join(projectRoot, '.codegraph')
const engineToon = path.join(projectRoot, 'engine.toon')
const docToon = path.join(projectRoot, 'docs/DOCUMENTATION.toon')

console.log(`  .code-review-graph: ${fs.existsSync(crgDir) ? '✅' : '❌'}`)
console.log(`  graphify-out: ${fs.existsSync(graphifyDir) ? '✅' : '❌'}`)
console.log(`  .codegraph: ${fs.existsSync(codegraphDir) ? '✅' : '❌'}`)
console.log(`  engine.toon: ${fs.existsSync(engineToon) ? '✅' : '❌'}`)
console.log(`  DOCUMENTATION.toon: ${fs.existsSync(docToon) ? '✅' : '❌'}`)

// Create unified graph
const unified = createUnifiedGraph(projectRoot)

// Run ingesters
const results: any[] = []

try {
  const r1 = ingestCodeReviewGraph(unified, projectRoot)
  results.push(r1)
  console.log(`  code-review-graph: ${r1.nodesIngested} nodes, ${r1.edgesIngested} edges` + (r1.errors.length ? ` (${r1.errors.length} errors)` : ''))
} catch (e: any) {
  console.log(`  code-review-graph: ERROR — ${e.message}`)
}

try {
  const r2 = ingestGraphify(unified, projectRoot)
  results.push(r2)
  console.log(`  graphify: ${r2.nodesIngested} nodes, ${r2.edgesIngested} edges` + (r2.errors.length ? ` (${r2.errors.length} errors)` : ''))
} catch (e: any) {
  console.log(`  graphify: ERROR — ${e.message}`)
}

try {
  const r3 = ingestCodegraph(unified, projectRoot)
  results.push(r3)
  console.log(`  codegraph: ${r3.nodesIngested} nodes, ${r3.edgesIngested} edges` + (r3.errors.length ? ` (${r3.errors.length} errors)` : ''))
} catch (e: any) {
  console.log(`  codegraph: ERROR — ${e.message}`)
}

// Stats
const stats = unified.stats()
console.log(`\n📊 Unified Graph:`)
console.log(`  Nodes: ${stats.nodeCount}`)
console.log(`  Edges: ${stats.edgeCount}`)
console.log(`  Files: ${stats.fileCount}`)
console.log(`  Tools: ${JSON.stringify(stats.toolBreakdown)}`)
console.log(`  Languages: ${JSON.stringify(stats.languageBreakdown)}`)
console.log(`  Stale: ${stats.stale}`)

unified.close()
console.log(`\n✅ Done — ${path.join(projectRoot, '.toon', 'graph', 'unified.db')}`)
