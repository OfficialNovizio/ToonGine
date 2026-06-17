// src/toon/v4/context-builder.ts
// Assembles per-agent context by merging agent data + graph intelligence.
// Uses V4 stratified delivery: stat header + top-N relevant + delta refs.

import { UnifiedGraph } from './unified-graph'
import { StratifiedPayload } from './stratify'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentContextRequest {
  agentId: string
  agentDept: string
  agentLevel: number
  query?: string         // optional natural-language query
  maxTokens?: number     // default 100
}

export interface GraphContextPayload {
  // Layer 1: Stat header (always, ~30 tokens)
  statHeader: string

  // Layer 2: Top-N relevant symbols (~50 tokens)
  topSymbols: string

  // Layer 3: Delta refs (~10 tokens, expandable)
  deltaRef: string
  deltaRefs: Record<string, string>  // hash → full data

  // Meta
  totalTokens: number
  isStale: boolean
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildAgentContext(
  unified: UnifiedGraph,
  request: AgentContextRequest,
): GraphContextPayload {
  const maxTokens = request.maxTokens || 100
  const stats = unified.stats()

  // ─── Layer 1: Stat header (~30 tokens) ──────────────────────────────────
  const parts: string[] = []

  // Core stats
  parts.push(`[GRAPH:${stats.nodeCount}n/${stats.edgeCount.toLocaleString()}e/${stats.fileCount}f`)

  // Staleness indicator
  if (stats.stale) {
    const staleSeconds = stats.lastBuilt
      ? Math.round((Date.now() - new Date(stats.lastBuilt).getTime()) / 1000)
      : 999
    parts[0] += ` STALE:${staleSeconds}s`
  }

  // Tool coverage
  const toolsWithData = Object.entries(stats.toolBreakdown)
    .filter(([, c]) => c > 0)
    .map(([t]) => t.replace('code-review-graph', 'crg').replace('graphify', 'gf').replace('codegraph', 'cg'))
  parts[0] += ` ${toolsWithData.join('+')}`

  parts[0] += ']'

  // Language breakdown (compact)
  const topLangs = Object.entries(stats.languageBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([l, c]) => `${l.slice(0, 4)}:${c}`)
  if (topLangs.length > 0) {
    parts[0] += ` [LANG:${topLangs.join(',')}]`
  }

  const statHeader = parts.join(' | ')

  // ─── Layer 2: Top-N relevant to agent (~50 tokens) ──────────────────────
  let topSymbols = ''

  // Find files relevant to agent's department
  const deptPattern = `%${request.agentDept.toLowerCase()}%`
  const relevantNodes = unified.findByFilePattern(deptPattern, 10)

  if (relevantNodes.length > 0) {
    const lines: string[] = []
    // Show top 5 hub files (most edges)
    const withEdges = relevantNodes.filter(n => {
      const callers = unified.findCallers(n.id, 1)
      return callers.length > 0
    })

    const topNodes = (withEdges.length >= 3 ? withEdges : relevantNodes).slice(0, 5)
    for (const n of topNodes) {
      const callers = unified.findCallers(n.id, 1)
      const refCount = callers.length
      lines.push(`${n.kind.slice(0, 4)}:${n.name.slice(0, 40)} ←${refCount}`)
    }

    topSymbols = `[TOP:${request.agentDept.slice(0, 6)}] ` + lines.join(' | ')
  }

  // ─── Layer 3: Delta refs (~10 tokens) ───────────────────────────────────
  const remainingNodes = stats.nodeCount - relevantNodes.length
  const deltaRef = remainingNodes > 0
    ? `[REF:rest] (${remainingNodes} more nodes expandable)`
    : ''

  // Build expandable refs map
  const deltaRefs: Record<string, string> = {}
  if (remainingNodes > 0) {
    // Store full query capabilities as a compact reference
    deltaRefs['rest'] = JSON.stringify({
      queryCapabilities: ['search', 'callers', 'callees', 'impact'],
      nodeCount: remainingNodes,
      tools: Object.keys(stats.toolBreakdown),
    })
  }

  // ─── Token budget enforcement ───────────────────────────────────────────
  const headerTokens = Math.round(statHeader.length / 3.5)
  const topTokens = topSymbols ? Math.round(topSymbols.length / 3.5) : 0
  const deltaTokens = Math.round(deltaRef.length / 3.5)
  let totalTokens = headerTokens + topTokens + deltaTokens

  // Adaptive shrink if over budget
  if (totalTokens > maxTokens) {
    // Truncate top symbols
    if (topSymbols.length > 60) {
      topSymbols = topSymbols.slice(0, 60) + '...'
      totalTokens = headerTokens + Math.round(60 / 3.5) + deltaTokens
    }
  }

  return {
    statHeader,
    topSymbols,
    deltaRef,
    deltaRefs,
    totalTokens: Math.min(totalTokens, maxTokens),
    isStale: stats.stale,
  }
}

// ─── Format for LLM injection ────────────────────────────────────────────────

export function formatContextForLLM(ctx: GraphContextPayload): string {
  const lines: string[] = []

  if (ctx.statHeader) {
    lines.push(`## Graph Intelligence${ctx.isStale ? ' ⚠️ STALE' : ''}`)
    lines.push(ctx.statHeader)
  }

  if (ctx.topSymbols) {
    lines.push('')
    lines.push(ctx.topSymbols)
  }

  if (ctx.deltaRef) {
    lines.push('')
    lines.push(ctx.deltaRef)
  }

  return lines.join('\n')
}
