export { buildCieContext, classifyTask } from './cie';
export type { CieContext, CieParams, TaskProfile, TaskType } from './cie';
export { toon } from './toon/toon';
export { BloomFilter, TfidfIndex, ContextPriorityQueue, blastRadius, minhashSignature, jaccardEstimate } from './cie/algorithms';
export { getConfig, invalidateConfig } from './adapters/config';
export type { EngineConfig } from './adapters/config';
export { createMCPClient } from './adapters/mcp-client';
export type { MCPClient } from './adapters/mcp-client';
export { ToonGineDashboard } from './dashboard/ToonGineDashboard';
export { injectDashboard } from './dashboard/inject';
export type { InjectResult } from './dashboard/inject';
export { metrics } from './metrics/collector';
export { runHealthChecks } from './metrics/health-checks';
export { scanProject, injectToon, toonifyAll } from './toon/auto';
export { autoToonMiddleware } from './toon/auto/middleware';
export { compressHermesMemory, computeHermesSessionDelta, compressHermesSkill, toonifyHermes } from './toon/auto/hermes-bridge';
export { encodeDocument, encodeMemory, encodePrompt, generateDictionaryString, ABBREV_MAP } from './toon/auto/encoder';
export { decodeToonResponse, parseDictionaryBlock, expandWithDictionary } from './toon/auto/decoder';
export type { ToonContext, ToonMiddlewareOptions } from './toon/auto/middleware';
export type { ProjectScan, InjectionPoint } from './toon/auto/scanner';
export type { InjectionResult } from './toon/auto/injector';
export type { ToonEncodeResult } from './toon/auto/encoder';
export type { DecodedResult } from './toon/auto/decoder';
export { compile } from './toon/v3/compile';
export type { CompileOptions, CompileResult } from './toon/v3/compile';
export { createEngine as createV3Engine } from './toon/v3/engine';
export type { EngineData, EngineContext, MatchResult, SessionDelta, V3Engine, Chunk } from './toon/v3/engine';
export { stem } from './toon/v3/stemmer';
export { trainBPE, encode as bpeEncode, decode as bpeDecode } from './toon/v3/bpe';
export type { BPETable } from './toon/v3/bpe';
export { resolve, resolveMany, clearResolveCache, resolverStats } from './toon/v3/resolver';
export type { ResolveResult, ReadMode } from './toon/v3/resolver';
export { writeFile, deleteFile, writeMany } from './toon/v3/sync-writer';
export type { WriteTarget, WriteResult } from './toon/v3/sync-writer';
export { readDoc, readDocsForLLM, readDocForHuman, getToonPath, getHumanPath, docStats } from './toon/v3/dual-docs';
export type { DualDocStats } from './toon/v3/dual-docs';
export { syncWithHermes, pushToHermes } from './adapters/hermes-sync';
export interface EngineOptions {
    projectRoot?: string;
    configPath?: string;
    agents?: string[];
    provider?: string;
}
export declare function createEngine(options?: EngineOptions): {
    config: import("./adapters/config").EngineConfig;
    cie: {
        buildContext: (params: {
            agentId: string;
            task: string;
            venture?: string;
        }) => import("./cie").CieContext;
    };
    toon: {
        dense: (items: Record<string, unknown>[], schemaOrType: import("./toon/toon").ToonSchema | string) => string;
    };
    agents: {
        getPersonality: (agentId: string) => string;
    };
    version: string;
};
//# sourceMappingURL=index.d.ts.map