// src/toon/v4/compression-verifier.ts
// Measures TOON V4 compression against the 99% target.
// Compares raw agent data + graph data size vs stratified delivery size.

import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { createV4Engine, V4AgentContext } from './engine'
import { AgentContextRequest } from './context-builder'

export interface CompressionReport {
  rawSizeBytes: number
  compressedTokens: number
  compressedBytes: number
  compressionRatio: number     // 1 - compressed/raw
  targetMet: boolean           // >= 0.99
  breakdown: {
    agentDataBytes: number
    graphDataBytes: number
    agentTokens: number
    graphTokens: number
  }
  perAgent: Array<{
    agentId: string
    agentTokens: number
    graphTokens: number
    totalTokens: number
  }>
}

export function measureCompression(projectRoot: string): CompressionReport {
  // ─── Measure raw data size ──────────────────────────────────────────────
  const agentDir = join(projectRoot, '.toon', 'agents')
  const graphDb = join(projectRoot, '.toon', 'graph', 'unified.db')

  let agentDataBytes = 0
  if (existsSync(agentDir)) {
    agentDataBytes = dirSize(agentDir)
  }

  let graphDataBytes = 0
  if (existsSync(graphDb)) {
    graphDataBytes = statSync(graphDb).size
  }

  const rawSizeBytes = agentDataBytes + graphDataBytes

  // ─── Measure compressed delivery ────────────────────────────────────────
  const engine = createV4Engine(projectRoot)

  // Test with representative agents
  const testAgents: AgentContextRequest[] = [
    { agentId: 'marcus-ceo', agentDept: 'CEO', agentLevel: 1 },
    { agentId: 'kahneman', agentDept: 'Psychology', agentLevel: 2 },
    { agentId: 'dev', agentDept: 'Technical', agentLevel: 3 },
  ]

  const perAgent: CompressionReport['perAgent'] = []
  let totalCompressedTokens = 0

  for (const req of testAgents) {
    const ctx = engine.buildContext(req)
    perAgent.push({
      agentId: req.agentId,
      agentTokens: ctx.agentTokens,
      graphTokens: ctx.graphTokens,
      totalTokens: ctx.totalTokens,
    })
    totalCompressedTokens += ctx.totalTokens
  }

  engine.close()

  // Average across agents
  const avgTokens = Math.round(totalCompressedTokens / testAgents.length)
  const compressedBytes = avgTokens * 4 // ~4 bytes per token
  const compressionRatio = rawSizeBytes > 0
    ? 1 - (compressedBytes / rawSizeBytes)
    : 1

  return {
    rawSizeBytes,
    compressedTokens: avgTokens,
    compressedBytes,
    compressionRatio,
    targetMet: compressionRatio >= 0.99,
    breakdown: {
      agentDataBytes,
      graphDataBytes,
      agentTokens: perAgent[0]?.agentTokens || 0,
      graphTokens: perAgent[0]?.graphTokens || 0,
    },
    perAgent,
  }
}

function dirSize(dir: string): number {
  let size = 0
  try {
    for (const entry of readdirSync(dir, { recursive: true })) {
      const full = join(dir, entry as string)
      try {
        if (statSync(full).isFile()) {
          size += statSync(full).size
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return size
}
