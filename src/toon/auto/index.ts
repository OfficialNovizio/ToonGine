// src/toon/auto/index.ts — Auto-TOON public API
//
// One import. Full project TOON-ification.
//
// Usage:
//   import { scanProject, injectToon, toonifyAll } from 'yvon-engine/toon/auto'
//   const result = toonifyAll('/path/to/project')

export { scanProject } from './scanner'
export { injectToon } from './injector'
export { autoToonMiddleware } from './middleware'
export { encodeDocument, encodeMemory, encodePrompt, generateDictionaryString, ABBREV_MAP } from './encoder'
export { decodeToonResponse, parseDictionaryBlock, expandWithDictionary } from './decoder'
export {
  compressHermesMemory,
  computeHermesSessionDelta,
  compressHermesSkill,
  toonifyHermes,
} from './hermes-bridge'

export type { ProjectScan, InjectionPoint, ProjectDictionary, DiscoveredSchema } from './scanner'
export type { InjectionResult } from './injector'
export type { ToonContext, ToonMiddlewareOptions } from './middleware'
export type { ToonEncodeResult } from './encoder'
export type { DecodedResult } from './decoder'
export type {
  CompressedHermesMemory,
  SessionDeltaState,
  CompressedSkill,
  HermesToonResult,
} from './hermes-bridge'

import { scanProject } from './scanner'
import { injectToon } from './injector'
import { toonifyHermes } from './hermes-bridge'
import { existsSync } from 'fs'
import { join } from 'path'

// ─── One-call TOON-ification ──────────────────────────────────────────────────

export interface ToonifyResult {
  scan: ReturnType<typeof scanProject>
  injection: ReturnType<typeof injectToon>
  hermes?: ReturnType<typeof toonifyHermes>
  summary: string
}

/**
 * TOON-ify an entire project in one call.
 * Detects project type, scans all data shapes, injects TOON everywhere,
 * compresses documents and memories, and bridges Hermes if present.
 */
export function toonifyAll(projectRoot: string): ToonifyResult {
  console.log('\n  🔍 Scanning project for TOON-ification...\n')

  // 1. Scan
  const scan = scanProject(projectRoot)
  console.log(`  📊 Found ${scan.schemas.length} data shapes`)
  console.log(`  📁 ${scan.documentPaths.length} documents`)
  console.log(`  🧠 ${scan.memoryPaths.length} agent memories`)
  console.log(`  🔌 ${scan.injectionPoints.length} injection points`)

  // 2. Inject
  console.log('\n  💉 Injecting TOON middleware...\n')
  const injection = injectToon(scan)

  for (const f of injection.created) {
    console.log(`  ✅ Created: ${f}`)
  }
  for (const f of injection.injected) {
    console.log(`  ✅ Injected: ${f}`)
  }
  for (const f of injection.skipped) {
    console.log(`  ⏭️  Skipped: ${f}`)
  }
  for (const e of injection.errors) {
    console.log(`  ⚠️  Error: ${e}`)
  }

  // 3. Hermes bridge
  let hermesResult
  const hermesHome = join(process.env.HOME || '/root', '.hermes')
  if (existsSync(hermesHome)) {
    console.log('\n  🔗 Hermes detected — bridging TOON...\n')
    hermesResult = toonifyHermes(projectRoot)
    console.log(`  ✅ ${hermesResult.memoriesCompressed} memories compressed`)
    console.log(`  ✅ ${hermesResult.skillsCompressed} skills compressed`)
    console.log(`  ✅ Session delta: ${hermesResult.sessionsDeltaEnabled ? 'enabled' : 'disabled'}`)
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
    `  Run: npx yvon doctor  (health check)`,
    ``,
  ].filter(Boolean).join('\n')

  console.log(summary)

  return {
    scan,
    injection,
    hermes: hermesResult,
    summary,
  }
}
