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
