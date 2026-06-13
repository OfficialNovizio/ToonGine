"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFile = exports.resolverStats = exports.clearResolveCache = exports.resolveMany = exports.resolve = exports.bpeDecode = exports.bpeEncode = exports.trainBPE = exports.stem = exports.createV3Engine = exports.compile = exports.strip = exports.expandWithDictionary = exports.parseDictionaryBlock = exports.decodeToonResponse = exports.ABBREV_MAP = exports.generateDictionaryString = exports.encodePrompt = exports.encodeMemory = exports.encodeDocument = exports.toonifyHermes = exports.compressHermesSkill = exports.computeHermesSessionDelta = exports.compressHermesMemory = exports.autoToonMiddleware = exports.toonifyAll = exports.injectToon = exports.scanProject = exports.runHealthChecks = exports.metrics = exports.injectDashboard = exports.stopDashboard = exports.startDashboard = exports.createMCPClient = exports.invalidateConfig = exports.getConfig = exports.jaccardEstimate = exports.minhashSignature = exports.blastRadius = exports.ContextPriorityQueue = exports.TfidfIndex = exports.BloomFilter = exports.computeDelta = exports.getOrCreateState = exports.dictToLine = exports.buildDictionary = exports.compress = exports.toon = exports.classifyTask = exports.buildCieContext = void 0;
exports.pushToHermes = exports.syncWithHermes = exports.docStats = exports.getHumanPath = exports.getToonPath = exports.readDocForHuman = exports.readDocsForLLM = exports.readDoc = exports.writeMany = exports.deleteFile = void 0;
exports.createEngine = createEngine;
// ─── Main engine ──────────────────────────────────────────────────────────────
var cie_1 = require("./cie");
Object.defineProperty(exports, "buildCieContext", { enumerable: true, get: function () { return cie_1.buildCieContext; } });
Object.defineProperty(exports, "classifyTask", { enumerable: true, get: function () { return cie_1.classifyTask; } });
// ─── TOON compression ─────────────────────────────────────────────────────────
var toon_1 = require("./toon/toon");
Object.defineProperty(exports, "toon", { enumerable: true, get: function () { return toon_1.toon; } });
var compressor_1 = require("./toon/compressor");
Object.defineProperty(exports, "compress", { enumerable: true, get: function () { return compressor_1.compress; } });
Object.defineProperty(exports, "buildDictionary", { enumerable: true, get: function () { return compressor_1.buildDictionary; } });
Object.defineProperty(exports, "dictToLine", { enumerable: true, get: function () { return compressor_1.dictToLine; } });
var delta_1 = require("./toon/delta");
Object.defineProperty(exports, "getOrCreateState", { enumerable: true, get: function () { return delta_1.getOrCreateState; } });
Object.defineProperty(exports, "computeDelta", { enumerable: true, get: function () { return delta_1.computeDelta; } });
// ─── Algorithms ───────────────────────────────────────────────────────────────
var algorithms_1 = require("./cie/algorithms");
Object.defineProperty(exports, "BloomFilter", { enumerable: true, get: function () { return algorithms_1.BloomFilter; } });
Object.defineProperty(exports, "TfidfIndex", { enumerable: true, get: function () { return algorithms_1.TfidfIndex; } });
Object.defineProperty(exports, "ContextPriorityQueue", { enumerable: true, get: function () { return algorithms_1.ContextPriorityQueue; } });
Object.defineProperty(exports, "blastRadius", { enumerable: true, get: function () { return algorithms_1.blastRadius; } });
Object.defineProperty(exports, "minhashSignature", { enumerable: true, get: function () { return algorithms_1.minhashSignature; } });
Object.defineProperty(exports, "jaccardEstimate", { enumerable: true, get: function () { return algorithms_1.jaccardEstimate; } });
// ─── Config ───────────────────────────────────────────────────────────────────
var config_1 = require("./adapters/config");
Object.defineProperty(exports, "getConfig", { enumerable: true, get: function () { return config_1.getConfig; } });
Object.defineProperty(exports, "invalidateConfig", { enumerable: true, get: function () { return config_1.invalidateConfig; } });
// ─── MCP ──────────────────────────────────────────────────────────────────────
var mcp_client_1 = require("./adapters/mcp-client");
Object.defineProperty(exports, "createMCPClient", { enumerable: true, get: function () { return mcp_client_1.createMCPClient; } });
// ─── Dashboard ─────────────────────────────────────────────────────────────────
var dashboard_1 = require("./dashboard");
Object.defineProperty(exports, "startDashboard", { enumerable: true, get: function () { return dashboard_1.startDashboard; } });
Object.defineProperty(exports, "stopDashboard", { enumerable: true, get: function () { return dashboard_1.stopDashboard; } });
var inject_1 = require("./dashboard/inject");
Object.defineProperty(exports, "injectDashboard", { enumerable: true, get: function () { return inject_1.injectDashboard; } });
// ─── Metrics ───────────────────────────────────────────────────────────────────
var collector_1 = require("./metrics/collector");
Object.defineProperty(exports, "metrics", { enumerable: true, get: function () { return collector_1.metrics; } });
var health_checks_1 = require("./metrics/health-checks");
Object.defineProperty(exports, "runHealthChecks", { enumerable: true, get: function () { return health_checks_1.runHealthChecks; } });
// ─── TOON Auto-Conversion ──────────────────────────────────────────────────────
// One call: toonifyAll(projectRoot) — scans, injects, compresses everything.
var auto_1 = require("./toon/auto");
Object.defineProperty(exports, "scanProject", { enumerable: true, get: function () { return auto_1.scanProject; } });
Object.defineProperty(exports, "injectToon", { enumerable: true, get: function () { return auto_1.injectToon; } });
Object.defineProperty(exports, "toonifyAll", { enumerable: true, get: function () { return auto_1.toonifyAll; } });
var middleware_1 = require("./toon/auto/middleware");
Object.defineProperty(exports, "autoToonMiddleware", { enumerable: true, get: function () { return middleware_1.autoToonMiddleware; } });
var hermes_bridge_1 = require("./toon/auto/hermes-bridge");
Object.defineProperty(exports, "compressHermesMemory", { enumerable: true, get: function () { return hermes_bridge_1.compressHermesMemory; } });
Object.defineProperty(exports, "computeHermesSessionDelta", { enumerable: true, get: function () { return hermes_bridge_1.computeHermesSessionDelta; } });
Object.defineProperty(exports, "compressHermesSkill", { enumerable: true, get: function () { return hermes_bridge_1.compressHermesSkill; } });
Object.defineProperty(exports, "toonifyHermes", { enumerable: true, get: function () { return hermes_bridge_1.toonifyHermes; } });
var encoder_1 = require("./toon/auto/encoder");
Object.defineProperty(exports, "encodeDocument", { enumerable: true, get: function () { return encoder_1.encodeDocument; } });
Object.defineProperty(exports, "encodeMemory", { enumerable: true, get: function () { return encoder_1.encodeMemory; } });
Object.defineProperty(exports, "encodePrompt", { enumerable: true, get: function () { return encoder_1.encodePrompt; } });
Object.defineProperty(exports, "generateDictionaryString", { enumerable: true, get: function () { return encoder_1.generateDictionaryString; } });
Object.defineProperty(exports, "ABBREV_MAP", { enumerable: true, get: function () { return encoder_1.ABBREV_MAP; } });
var decoder_1 = require("./toon/auto/decoder");
Object.defineProperty(exports, "decodeToonResponse", { enumerable: true, get: function () { return decoder_1.decodeToonResponse; } });
Object.defineProperty(exports, "parseDictionaryBlock", { enumerable: true, get: function () { return decoder_1.parseDictionaryBlock; } });
Object.defineProperty(exports, "expandWithDictionary", { enumerable: true, get: function () { return decoder_1.expandWithDictionary; } });
// ─── TOON v2 — Structure Stripper ─────────────────────────────────────────────
var stripper_1 = require("./toon/v2/stripper");
Object.defineProperty(exports, "strip", { enumerable: true, get: function () { return stripper_1.strip; } });
// ─── TOON v3 — Query-Aware Progressive Engine ────────────────────────────────
var compile_1 = require("./toon/v3/compile");
Object.defineProperty(exports, "compile", { enumerable: true, get: function () { return compile_1.compile; } });
var engine_1 = require("./toon/v3/engine");
Object.defineProperty(exports, "createV3Engine", { enumerable: true, get: function () { return engine_1.createEngine; } });
var stemmer_1 = require("./toon/v3/stemmer");
Object.defineProperty(exports, "stem", { enumerable: true, get: function () { return stemmer_1.stem; } });
var bpe_1 = require("./toon/v3/bpe");
Object.defineProperty(exports, "trainBPE", { enumerable: true, get: function () { return bpe_1.trainBPE; } });
Object.defineProperty(exports, "bpeEncode", { enumerable: true, get: function () { return bpe_1.encode; } });
Object.defineProperty(exports, "bpeDecode", { enumerable: true, get: function () { return bpe_1.decode; } });
var resolver_1 = require("./toon/v3/resolver");
Object.defineProperty(exports, "resolve", { enumerable: true, get: function () { return resolver_1.resolve; } });
Object.defineProperty(exports, "resolveMany", { enumerable: true, get: function () { return resolver_1.resolveMany; } });
Object.defineProperty(exports, "clearResolveCache", { enumerable: true, get: function () { return resolver_1.clearResolveCache; } });
Object.defineProperty(exports, "resolverStats", { enumerable: true, get: function () { return resolver_1.resolverStats; } });
var sync_writer_1 = require("./toon/v3/sync-writer");
Object.defineProperty(exports, "writeFile", { enumerable: true, get: function () { return sync_writer_1.writeFile; } });
Object.defineProperty(exports, "deleteFile", { enumerable: true, get: function () { return sync_writer_1.deleteFile; } });
Object.defineProperty(exports, "writeMany", { enumerable: true, get: function () { return sync_writer_1.writeMany; } });
var dual_docs_1 = require("./toon/v3/dual-docs");
Object.defineProperty(exports, "readDoc", { enumerable: true, get: function () { return dual_docs_1.readDoc; } });
Object.defineProperty(exports, "readDocsForLLM", { enumerable: true, get: function () { return dual_docs_1.readDocsForLLM; } });
Object.defineProperty(exports, "readDocForHuman", { enumerable: true, get: function () { return dual_docs_1.readDocForHuman; } });
Object.defineProperty(exports, "getToonPath", { enumerable: true, get: function () { return dual_docs_1.getToonPath; } });
Object.defineProperty(exports, "getHumanPath", { enumerable: true, get: function () { return dual_docs_1.getHumanPath; } });
Object.defineProperty(exports, "docStats", { enumerable: true, get: function () { return dual_docs_1.docStats; } });
// ─── Hermes ────────────────────────────────────────────────────────────────────
var hermes_sync_1 = require("./adapters/hermes-sync");
Object.defineProperty(exports, "syncWithHermes", { enumerable: true, get: function () { return hermes_sync_1.syncWithHermes; } });
Object.defineProperty(exports, "pushToHermes", { enumerable: true, get: function () { return hermes_sync_1.pushToHermes; } });
function createEngine(options = {}) {
    const config = require('./adapters/config').getConfig();
    return {
        config,
        cie: {
            buildContext: (params) => require('./cie').buildCieContext(params),
        },
        toon: {
            dense: require('./toon/toon').toon.dense,
            compress: require('./toon/compressor').compress,
            delta: require('./toon/delta').createDeltaTracker,
        },
        agents: {
            getPersonality: (agentId) => require('./agents/personalities').getPersonalityExtension(agentId),
        },
        version: '1.0.0',
    };
}
//# sourceMappingURL=index.js.map