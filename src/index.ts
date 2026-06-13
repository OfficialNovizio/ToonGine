// ToonGine — AI Agent OS Kernel
// 
// One npm install. Full agent team. Automatic TOON-ification.
// 
// toongine provides:
//   - TOON Auto-Conversion: Scans project, auto-wires TOON everywhere (prompts, docs, memory, API)
//   - CIE: Context Intelligence Engine (classify → retrieve → rank → inject)
//   - TOON: Token-Optimized Object Notation (84.5% token savings)
//   - Agents: 13 AI agent personalities
//   - Algorithms: Bloom, MinHash, TF-IDF, BFS, PriorityQueue
//   - Adapters: Config resolver, provider interface, DB interface
//   - Hermes Bridge: TOON-compress Hermes memory, sessions, skills
//
// Usage:
//   import { toonifyAll } from 'toongine/toon/auto'
//   const result = toonifyAll('/path/to/project')

// ─── Main engine ──────────────────────────────────────────────────────────────

export { buildCieContext, classifyTask } from './cie'
export type { CieContext, CieParams, TaskProfile, TaskType } from './cie'

// ─── TOON compression ─────────────────────────────────────────────────────────

export { toon } from './toon/toon'
export { compress, buildDictionary, dictToLine } from './toon/compressor'
export { getOrCreateState, computeDelta } from './toon/delta'

// ─── Algorithms ───────────────────────────────────────────────────────────────

export { BloomFilter, TfidfIndex, ContextPriorityQueue, blastRadius, minhashSignature, jaccardEstimate } from './cie/algorithms'

// ─── Config ───────────────────────────────────────────────────────────────────

export { getConfig, invalidateConfig } from './adapters/config'
export type { EngineConfig } from './adapters/config'

// ─── MCP ──────────────────────────────────────────────────────────────────────

export { createMCPClient } from './adapters/mcp-client'
export type { MCPClient } from './adapters/mcp-client'

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export { startDashboard, stopDashboard } from './dashboard'
export { injectDashboard } from './dashboard/inject'
export type { InjectResult } from './dashboard/inject'

// ─── Metrics ───────────────────────────────────────────────────────────────────

export { metrics } from './metrics/collector'
export { runHealthChecks } from './metrics/health-checks'

// ─── TOON Auto-Conversion ──────────────────────────────────────────────────────
// One call: toonifyAll(projectRoot) — scans, injects, compresses everything.

export { scanProject, injectToon, toonifyAll } from './toon/auto'
export { autoToonMiddleware } from './toon/auto/middleware'
export { compressHermesMemory, computeHermesSessionDelta, compressHermesSkill, toonifyHermes } from './toon/auto/hermes-bridge'
export { encodeDocument, encodeMemory, encodePrompt, generateDictionaryString, ABBREV_MAP } from './toon/auto/encoder'
export { decodeToonResponse, parseDictionaryBlock, expandWithDictionary } from './toon/auto/decoder'
export type { ToonContext, ToonMiddlewareOptions } from './toon/auto/middleware'
export type { ProjectScan, InjectionPoint } from './toon/auto/scanner'
export type { InjectionResult } from './toon/auto/injector'
export type { ToonEncodeResult } from './toon/auto/encoder'
export type { DecodedResult } from './toon/auto/decoder'

// ─── TOON v2 — Structure Stripper ─────────────────────────────────────────────

export { strip } from './toon/v2/stripper'
export type { StripResult } from './toon/v2/stripper'

// ─── TOON v3 — Query-Aware Progressive Engine ────────────────────────────────

export { compile } from './toon/v3/compile'
export type { CompileOptions, CompileResult } from './toon/v3/compile'
export { createEngine as createV3Engine } from './toon/v3/engine'
export type { EngineData, EngineContext, MatchResult, SessionDelta, V3Engine, Chunk } from './toon/v3/engine'
export { stem } from './toon/v3/stemmer'
export { trainBPE, encode as bpeEncode, decode as bpeDecode } from './toon/v3/bpe'
export type { BPETable } from './toon/v3/bpe'
export { resolve, resolveMany, clearResolveCache, resolverStats } from './toon/v3/resolver'
export type { ResolveResult, ReadMode } from './toon/v3/resolver'
export { writeFile, deleteFile, writeMany } from './toon/v3/sync-writer'
export type { WriteTarget, WriteResult } from './toon/v3/sync-writer'
export { readDoc, readDocsForLLM, readDocForHuman, getToonPath, getHumanPath, docStats } from './toon/v3/dual-docs'
export type { DualDocStats } from './toon/v3/dual-docs'

// ─── Hermes ────────────────────────────────────────────────────────────────────

export { syncWithHermes, pushToHermes } from './adapters/hermes-sync'

// ─── Engine creator ───────────────────────────────────────────────────────────

export interface EngineOptions {
  projectRoot?: string
  configPath?: string
  agents?: string[]
  provider?: string
}

export function createEngine(options: EngineOptions = {}) {
  const config = require('./adapters/config').getConfig()
  
  return {
    config,
    cie: {
      buildContext: (params: { agentId: string; task: string; venture?: string }) =>
        require('./cie').buildCieContext(params),
    },
    toon: {
      dense: require('./toon/toon').toon.dense,
      compress: require('./toon/compressor').compress,
      delta: require('./toon/delta').createDeltaTracker,
    },
    agents: {
      getPersonality: (agentId: string) =>
        require('./agents/personalities').getPersonalityExtension(agentId),
    },
    version: '1.0.0',
  }
}
