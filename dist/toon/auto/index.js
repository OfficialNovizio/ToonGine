"use strict";
// src/toon/auto/index.ts — Auto-TOON public API
//
// One import. Full project TOON-ification.
//
// Usage:
//   import { scanProject, injectToon, toonifyAll } from 'toongine/toon/auto'
//   const result = toonifyAll('/path/to/project')
Object.defineProperty(exports, "__esModule", { value: true });
exports.toonifyHermes = exports.compressHermesSkill = exports.computeHermesSessionDelta = exports.compressHermesMemory = exports.expandWithDictionary = exports.parseDictionaryBlock = exports.decodeToonResponse = exports.ABBREV_MAP = exports.generateDictionaryString = exports.encodePrompt = exports.encodeMemory = exports.encodeDocument = exports.autoToonMiddleware = exports.injectToon = exports.scanProject = void 0;
exports.toonifyAll = toonifyAll;
var scanner_1 = require("./scanner");
Object.defineProperty(exports, "scanProject", { enumerable: true, get: function () { return scanner_1.scanProject; } });
var injector_1 = require("./injector");
Object.defineProperty(exports, "injectToon", { enumerable: true, get: function () { return injector_1.injectToon; } });
var middleware_1 = require("./middleware");
Object.defineProperty(exports, "autoToonMiddleware", { enumerable: true, get: function () { return middleware_1.autoToonMiddleware; } });
var encoder_1 = require("./encoder");
Object.defineProperty(exports, "encodeDocument", { enumerable: true, get: function () { return encoder_1.encodeDocument; } });
Object.defineProperty(exports, "encodeMemory", { enumerable: true, get: function () { return encoder_1.encodeMemory; } });
Object.defineProperty(exports, "encodePrompt", { enumerable: true, get: function () { return encoder_1.encodePrompt; } });
Object.defineProperty(exports, "generateDictionaryString", { enumerable: true, get: function () { return encoder_1.generateDictionaryString; } });
Object.defineProperty(exports, "ABBREV_MAP", { enumerable: true, get: function () { return encoder_1.ABBREV_MAP; } });
var decoder_1 = require("./decoder");
Object.defineProperty(exports, "decodeToonResponse", { enumerable: true, get: function () { return decoder_1.decodeToonResponse; } });
Object.defineProperty(exports, "parseDictionaryBlock", { enumerable: true, get: function () { return decoder_1.parseDictionaryBlock; } });
Object.defineProperty(exports, "expandWithDictionary", { enumerable: true, get: function () { return decoder_1.expandWithDictionary; } });
var hermes_bridge_1 = require("./hermes-bridge");
Object.defineProperty(exports, "compressHermesMemory", { enumerable: true, get: function () { return hermes_bridge_1.compressHermesMemory; } });
Object.defineProperty(exports, "computeHermesSessionDelta", { enumerable: true, get: function () { return hermes_bridge_1.computeHermesSessionDelta; } });
Object.defineProperty(exports, "compressHermesSkill", { enumerable: true, get: function () { return hermes_bridge_1.compressHermesSkill; } });
Object.defineProperty(exports, "toonifyHermes", { enumerable: true, get: function () { return hermes_bridge_1.toonifyHermes; } });
const scanner_2 = require("./scanner");
const injector_2 = require("./injector");
const hermes_bridge_2 = require("./hermes-bridge");
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * TOON-ify an entire project in one call.
 * Detects project type, scans all data shapes, injects TOON everywhere,
 * compresses documents and memories, and bridges Hermes if present.
 */
function toonifyAll(projectRoot) {
    console.log('\n  🔍 Scanning project for TOON-ification...\n');
    // 1. Scan
    const scan = (0, scanner_2.scanProject)(projectRoot);
    console.log(`  📊 Found ${scan.schemas.length} data shapes`);
    console.log(`  📁 ${scan.documentPaths.length} documents`);
    console.log(`  🧠 ${scan.memoryPaths.length} agent memories`);
    console.log(`  🔌 ${scan.injectionPoints.length} injection points`);
    // 2. Inject
    console.log('\n  💉 Injecting TOON middleware...\n');
    const injection = (0, injector_2.injectToon)(scan);
    for (const f of injection.created) {
        console.log(`  ✅ Created: ${f}`);
    }
    for (const f of injection.injected) {
        console.log(`  ✅ Injected: ${f}`);
    }
    for (const f of injection.skipped) {
        console.log(`  ⏭️  Skipped: ${f}`);
    }
    for (const e of injection.errors) {
        console.log(`  ⚠️  Error: ${e}`);
    }
    // 3. Hermes bridge
    let hermesResult;
    const hermesHome = (0, path_1.join)(process.env.HOME || '/root', '.hermes');
    if ((0, fs_1.existsSync)(hermesHome)) {
        console.log('\n  🔗 Hermes detected — bridging TOON...\n');
        hermesResult = (0, hermes_bridge_2.toonifyHermes)(projectRoot);
        console.log(`  ✅ ${hermesResult.memoriesCompressed} memories compressed`);
        console.log(`  ✅ ${hermesResult.skillsCompressed} skills compressed`);
        console.log(`  ✅ Session delta: ${hermesResult.sessionsDeltaEnabled ? 'enabled' : 'disabled'}`);
    }
    // 4. Summary
    const summary = [
        `\n  ═══════════════════════════════════════════`,
        `  ✅ Project TOON-ified!`,
        `  ═══════════════════════════════════════════`,
        ``,
        `  📊 ${scan.schemas.length} TOON schemas generated`,
        `  📁 ${injection.summary.documentsTooned} documents compressed → .toon/docs/`,
        `  🧠 ${injection.summary.memoriesTooned} memories compressed → .toon/memory/`,
        `  🔌 ${injection.summary.injectionPointsHit} injection points wired`,
        `  💰 ~${scan.estimatedTokenSavings}% estimated token savings`,
        ``,
        `  📂 .toon/ directory created with:`,
        `     schemas.toon     — Auto-detected data schemas`,
        `     dictionary.toon  — Project abbreviation dictionary`,
        `     docs/*.toon      — TOON-compressed documentation`,
        `     memory/*.toon    — TOON-compressed agent memories`,
        `     v3/engine.bin    — Query-aware progressive engine ${injection.summary.v3Compiled ? '✅ compiled' : '(not compiled)'}`,
        ``,
        `  🚀 What happens now (automatic, no code changes):`,
        `     • Every Claude call: prompt compressed ${scan.estimatedTokenSavings}%`,
        `     • V3 engine: ${injection.summary.v3Compiled ? 'Query-aware progressive loading (90%+ savings)' : 'Classic TOON compression'}`,
        `     • Every API response: TOON format via Accept header`,
        `     • Every doc injection: TOON-compressed context`,
        `     • Every memory load: TOON-compressed entries`,
        hermesResult ? `     • Hermes sessions: delta-compressed (93% on repeats)` : '',
        `     • Hermes skills: TOON-compressed for prompt injection`,
        ``,
        `  Run: npm run build   (verify nothing broke)`,
        `  Run: npx toongine doctor  (health check)`,
        ``,
    ].filter(Boolean).join('\n');
    console.log(summary);
    return {
        scan,
        injection,
        hermes: hermesResult,
        summary,
    };
}
//# sourceMappingURL=index.js.map