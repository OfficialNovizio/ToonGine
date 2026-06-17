// src/toon/v4/engine.ts — TOON v4 Engine (V3 + Graph Intelligence)
//
// Wraps V3 engine for agent context, but adds V4 graph intelligence layer.
// Agents get: (1) their agent data (V3 engine) + (2) code graph context (V4 bridge).
//
// Usage:
//   import { createV4Engine } from 'toongine/toon/v4/engine'
//   const engine = createV4Engine('/root/yvon')
//   const ctx = engine.buildContext({ agentId: 'marcus-ceo' })

import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { UnifiedGraph } from './unified-graph'
import { buildAgentContext, formatContextForLLM, AgentContextRequest } from './context-builder'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface V4EngineConfig {
  projectRoot: string
  enableGraphContext?: boolean   // default true
  maxGraphTokens?: number        // default 100
}

export interface V4AgentContext {
  agentData: string
  graphContext: string
  totalTokens: number
  graphTokens: number
  agentTokens: number
  graphStale: boolean
  toolsAvailable: string[]
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class V4Engine {
  private projectRoot: string
  private config: Required<V4EngineConfig>
  private unified: UnifiedGraph | null = null

  constructor(config: V4EngineConfig) {
    this.projectRoot = config.projectRoot
    this.config = {
      projectRoot: config.projectRoot,
      enableGraphContext: config.enableGraphContext ?? true,
      maxGraphTokens: config.maxGraphTokens ?? 100,
    }
  }

  initGraph(): boolean {
    const dbPath = join(this.projectRoot, '.toon', 'graph', 'unified.db')
    if (!existsSync(dbPath)) return false
    this.unified = new UnifiedGraph(dbPath)
    return true
  }

  buildContext(request: AgentContextRequest): V4AgentContext {
    const agentData = this.loadAgentData(request.agentId)
    const agentTokens = Math.round(agentData.length / 3.5)

    let graphContext = ''
    let graphTokens = 0
    let graphStale = false
    const toolsAvailable: string[] = []

    if (this.config.enableGraphContext && this.unified) {
      const ctx = buildAgentContext(this.unified, {
        ...request,
        maxTokens: this.config.maxGraphTokens,
      })
      graphContext = formatContextForLLM(ctx)
      graphTokens = ctx.totalTokens
      graphStale = ctx.isStale

      const stats = this.unified.stats()
      for (const [tool, count] of Object.entries(stats.toolBreakdown)) {
        if (count > 0) toolsAvailable.push(tool)
      }
    }

    return {
      agentData,
      graphContext,
      totalTokens: agentTokens + graphTokens,
      graphTokens,
      agentTokens,
      graphStale,
      toolsAvailable,
    }
  }

  private loadAgentData(agentId: string): string {
    const agentDir = join(this.projectRoot, '.toon', 'agents')
    if (!existsSync(agentDir)) return ''

    try {
      for (const dept of readdirSync(agentDir)) {
        const deptPath = join(agentDir, dept)
        if (!statSync(deptPath).isDirectory()) continue

        for (const agent of readdirSync(deptPath)) {
          if (agent.toLowerCase().includes(agentId.toLowerCase().replace(/-/g, ''))) {
            const memPath = join(deptPath, agent, 'MEMORY.md')
            if (existsSync(memPath)) {
              return readFileSync(memPath, 'utf-8').slice(0, 5000)
            }
          }
        }
      }
    } catch { /* agent not found */ }

    return ''
  }

  status() {
    const agentDataSize = this.loadAgentData('marcus-ceo').length
    const stats = this.unified?.stats()
    const toolsAvailable: string[] = []
    if (stats) {
      for (const [tool, count] of Object.entries(stats.toolBreakdown)) {
        if (count > 0) toolsAvailable.push(tool)
      }
    }
    return { agentDataSize, graphNodes: stats?.nodeCount || 0, graphEdges: stats?.edgeCount || 0, toolsAvailable }
  }

  close(): void { this.unified?.close() }
}

export function createV4Engine(projectRoot: string): V4Engine {
  const engine = new V4Engine({ projectRoot })
  engine.initGraph()
  return engine
}
