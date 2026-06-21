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
exports.getHumanPath = exports.getToonPath = exports.readDocForHuman = exports.readDocsForLLM = exports.readDoc = exports.writeMany = exports.deleteFile = exports.writeFile = exports.resolverStats = exports.clearResolveCache = exports.resolveMany = exports.resolve = exports.bpeDecode = exports.bpeEncode = exports.trainBPE = exports.stem = exports.createV3Engine = exports.compile = exports.expandWithDictionary = exports.parseDictionaryBlock = exports.decodeToonResponse = exports.ABBREV_MAP = exports.generateDictionaryString = exports.encodePrompt = exports.encodeMemory = exports.encodeDocument = exports.toonifyHermes = exports.compressHermesSkill = exports.computeHermesSessionDelta = exports.compressHermesMemory = exports.autoToonMiddleware = exports.toonifyAll = exports.injectToon = exports.scanProject = exports.runHealthChecks = exports.metrics = exports.injectDashboard = exports.ToonGineDashboard = exports.createMCPClient = exports.invalidateConfig = exports.getConfig = exports.jaccardEstimate = exports.minhashSignature = exports.blastRadius = exports.ContextPriorityQueue = exports.TfidfIndex = exports.BloomFilter = exports.toon = exports.classifyTask = exports.buildCieContext = void 0;
exports.pushToHermes = exports.syncWithHermes = exports.docStats = void 0;
exports.createEngine = createEngine;
// ─── Main engine ──────────────────────────────────────────────────────────────
var cie_1 = require("./cie");
Object.defineProperty(exports, "buildCieContext", { enumerable: true, get: function () { return cie_1.buildCieContext; } });
Object.defineProperty(exports, "classifyTask", { enumerable: true, get: function () { return cie_1.classifyTask; } });
// ─── TOON compression ─────────────────────────────────────────────────────────
var toon_1 = require("./toon/toon");
Object.defineProperty(exports, "toon", { enumerable: true, get: function () { return toon_1.toon; } });
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
var ToonGineDashboard_1 = require("./dashboard/ToonGineDashboard");
Object.defineProperty(exports, "ToonGineDashboard", { enumerable: true, get: function () { return ToonGineDashboard_1.ToonGineDashboard; } });
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
// ─── Engine creator ───────────────────────────────────────────────────────────
const config_2 = require("./adapters/config");
const cie_2 = require("./cie");
const toon_2 = require("./toon/toon");
const personalities_1 = require("./agents/personalities");
const package_json_1 = require("../package.json");
function createEngine(options = {}) {
    const config = (0, config_2.getConfig)();
    return {
        config,
        cie: {
            buildContext: (params) => (0, cie_2.buildCieContext)(params),
        },
        toon: {
            dense: toon_2.toon.dense,
        },
        agents: {
            getPersonality: (agentId) => (0, personalities_1.getPersonalityExtension)(agentId),
        },
        version: package_json_1.version,
    };
}
//# sourceMappingURL=index.js.map