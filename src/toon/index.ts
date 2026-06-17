// src/toon/index.ts — TOON public API re-exports

// ─── Core TOON ───────────────────────────────────────────────────────────────
export { toon, SCHEMAS } from './toon'
export type { ToonSchema, ToonField } from './toon'

// ─── v1 Compressor ───────────────────────────────────────────────────────────
export { compress, buildDictionary, dictToLine, compressDecision, matchTemplate, buildSystemBlock } from './compressor'
export type { Dictionary, Template, CompressedBlock, DecisionRecord } from './compressor'

// ─── v1 Delta ────────────────────────────────────────────────────────────────
export { getOrCreateState, computeDelta, formatDeltaForLLM, resetDelta, resetAllDeltas } from './delta'
export type { DeltaState, DeltaChange, DeltaResult } from './delta'

// ─── v2 Structure Stripper ───────────────────────────────────────────────────
export { strip } from './v2/stripper'
export type { StripResult } from './v2/stripper'

// ─── v3 Query-Aware Progressive Engine ───────────────────────────────────────
export { compile } from './v3/compile'
export type { CompileOptions, CompileResult } from './v3/compile'
export { createEngine } from './v3/engine'
export type { EngineData, EngineContext, MatchResult, SessionDelta, V3Engine, Chunk } from './v3/engine'
export { stem } from './v3/stemmer'
export { trainBPE, encode as bpeEncode, decode as bpeDecode } from './v3/bpe'
export type { BPETable } from './v3/bpe'

// ─── v3 Resolver + Sync ─────────────────────────────────────────────────────
export { resolve, resolveMany, clearResolveCache, resolverStats } from './v3/resolver'
export type { ResolveResult, ReadMode } from './v3/resolver'
export { writeFile, deleteFile, writeMany } from './v3/sync-writer'
export type { WriteTarget, WriteResult } from './v3/sync-writer'
export { readDoc, readDocsForLLM, readDocForHuman, getToonPath, getHumanPath, docStats } from './v3/dual-docs'
export type { DualDocStats } from './v3/dual-docs'

// ─── v4 Stratified Context Engine ─────────────────────────────────────────
export { summarize, formatStatHeader, formatTopN, stratify, injectDelta, storeForExpand, expand } from './v4/stratify'
export type { NumericStats, StringStats, StatProfile, StratifiedPayload } from './v4/stratify'

// ─── v4 Graph Intelligence Bridge ─────────────────────────────────────────
export { UnifiedGraph, createUnifiedGraph } from './v4/unified-graph'
export { UNIFIED_SCHEMA, SQL } from './v4/unified-schema'
export { nodeId, stableHash } from './v4/bridge-types'
export type { UnifiedNode, UnifiedEdge, UnifiedGraphStats, IngestionResult, BridgeConfig, MCPToolDef } from './v4/bridge-types'
export { ingestAll, ingestCodeReviewGraph, ingestGraphify, ingestCodegraph } from './v4/ingesters/index'
export type { FullIngestionReport } from './v4/ingesters/index'
export { V4Engine, createV4Engine } from './v4/engine'
export type { V4EngineConfig, V4AgentContext } from './v4/engine'
export { buildAgentContext, formatContextForLLM } from './v4/context-builder'
export type { AgentContextRequest, GraphContextPayload } from './v4/context-builder'
export { activate, deactivate } from './v4/auto-activate'
export type { ActivationReport } from './v4/auto-activate'
export { detectTools, installCodegraph, ensureAllTools } from './v4/tool-installer'
export type { ToolStatus } from './v4/tool-installer'
export { startWatcher, stopAllWatchers, getWatcherStatus } from './v4/watcher'
export type { WatcherStatus } from './v4/watcher'
export { HermesGraphGateway, createGraphGateway, GRAPH_MCP_TOOLS } from './v4/hermes-gateway'
