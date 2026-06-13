// src/toon/auto/middleware.ts — TOON Auto-Compression Middleware
//
// Runtime middleware. Every Claude/LLM call passes through this automatically
// after `toongine integrate` wires it in. No manual code changes needed.
//
// What it does on EVERY call:
// 1. Compress user prompt (dictionary substitution + template matching)
// 2. Inject project dictionary into system prompt
// 3. Load and inject relevant TOON-compressed documents
// 4. Load and inject TOON-compressed agent memory
// 5. Add TOON output format instruction for data tasks
//
// Zero overhead when TOON is disabled (single boolean check).

import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { encodePrompt, ABBREV_MAP, abbreviateText } from './encoder'
import { toon } from '../toon'
import { createEngine } from '../v3/engine'
import type { V3Engine } from '../v3/engine'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ToonContext {
  compressedUserMessage: string
  dictionary: string
  relevantDocs: string
  relevantMemory: string
  outputInstruction: string
  stats: {
    originalLength: number
    compressedLength: number
    savingsPercent: number
    docsInjected: number
    memoryEntries: number
  }
}

export interface ToonMiddlewareOptions {
  systemPrompt: string
  userMessage: string
  agentId?: string | null
  ventureId?: string | null
  projectRoot?: string
}

// ─── Caches ───────────────────────────────────────────────────────────────────

let _dictionaryCache: string | null = null
let _dictionaryCacheTime = 0
const DICT_CACHE_TTL = 300000 // 5 minutes

let _termMapCache: Record<string, string> | null = null

let _v3Engine: V3Engine | null = null
let _v3EngineLoaded = false

// ─── Main Middleware ──────────────────────────────────────────────────────────

export function autoToonMiddleware(options: ToonMiddlewareOptions): ToonContext {
  const root = options.projectRoot || process.cwd()
  
  // ─── Set env vars for metrics tracking (ALWAYS ON v2.0) ─────────────────
  if (options.agentId) process.env.YVON_AGENT_ID = options.agentId
  if (options.ventureId) process.env.YVON_VENTURE_ID = options.ventureId
  process.env.YVON_PROVIDER = process.env.YVON_PROVIDER || 'deepseek'
  process.env.YVON_MODEL = process.env.YVON_MODEL || process.env.ANTHROPIC_MODEL || 'claude-sonnet'
  
  // ─── V3 Engine (query-aware progressive loading) ──────────────────────────
  if (!_v3EngineLoaded) {
    const v3Path = join(root, '.toon', 'v3', 'engine.bin')
    if (existsSync(v3Path)) {
      try {
        _v3Engine = createEngine(v3Path)
        _v3Engine.load()
        _v3EngineLoaded = true
      } catch { /* v3 unavailable, fall back to v2 */ }
    }
    _v3EngineLoaded = true
  }

  // If v3 engine is available, use it for document/memory matching
  if (_v3Engine) {
    return middlewareV3(options, root)
  }

  // ─── V2 Fallback ────────────────────────────────────────────────────────
  return middlewareV2(options, root)
}

// ─── V3 Middleware (query-aware engine) ──────────────────────────────────────

function middlewareV3(options: ToonMiddlewareOptions, root: string): ToonContext {
  const engine = _v3Engine!
  const dict = loadDictionary(root)
  
  // Run v3 engine process
  const result = engine.process({
    systemPrompt: options.systemPrompt,
    userMessage: options.userMessage,
    agentId: options.agentId,
    ventureId: options.ventureId,
    sessionId: undefined, // TODO: wire session tracking
  })
  
  return {
    compressedUserMessage: result.compressedUserMessage || options.userMessage,
    dictionary: dict,
    relevantDocs: result.docContext || '',
    relevantMemory: result.memoryContext || '',
    outputInstruction: shouldUseToonOutput(options.userMessage)
      ? '\n[TOON OUTPUT FORMAT: Respond using pipe-delimited fields. One record per line. No markdown, no prose. Fields: type|id|value1|value2|...]'
      : '',
    stats: {
      originalLength: options.userMessage.length,
      compressedLength: result.compressedUserMessage.length,
      savingsPercent: Math.round((1 - result.compressedUserMessage.length / Math.max(1, options.userMessage.length)) * 100),
      docsInjected: result.stats.docsInjected,
      memoryEntries: result.stats.memoryEntries,
    },
  }
}

// ─── V2 Middleware (classic TOON) ────────────────────────────────────────────

function middlewareV2(options: ToonMiddlewareOptions, root: string): ToonContext {
  const dict = loadDictionary(root)
  const termMap = loadTermMap(root)

  // 1. Compress user message
  const compressed = compressText(options.userMessage, termMap)

  // 2. Load relevant TOON documents
  const docs = findRelevantToonDocs(root, options.userMessage, options.agentId)

  // 3. Load agent memory in TOON format
  const memory = loadAgentMemory(root, options.agentId)

  // 4. Output format instruction for data-heavy tasks
  const outputInst = shouldUseToonOutput(options.userMessage)
    ? '\n[TOON OUTPUT FORMAT: Respond using pipe-delimited fields. One record per line. No markdown, no prose. Fields: type|id|value1|value2|...]'
    : ''

  return {
    compressedUserMessage: compressed,
    dictionary: dict,
    relevantDocs: docs,
    relevantMemory: memory,
    outputInstruction: outputInst,
    stats: {
      originalLength: options.userMessage.length,
      compressedLength: compressed.length,
      savingsPercent: Math.round((1 - compressed.length / Math.max(1, options.userMessage.length)) * 100),
      docsInjected: docs ? docs.split('\n').filter(l => l.startsWith('S|')).length : 0,
      memoryEntries: memory ? memory.split('\n').filter(l => l.startsWith('M|')).length : 0,
    },
  }
}

// ─── Dictionary Loader ────────────────────────────────────────────────────────

function loadDictionary(root: string): string {
  const now = Date.now()
  if (_dictionaryCache && (now - _dictionaryCacheTime) < DICT_CACHE_TTL) {
    return _dictionaryCache
  }

  const dictPath = join(root, '.toon', 'dictionary.toon')
  if (!existsSync(dictPath)) {
    return generateInlineDictionary()
  }

  try {
    const content = readFileSync(dictPath, 'utf-8')
    const lines = content.split('\n').filter(l => l.startsWith('DICT '))
    _dictionaryCache = lines.join('\n')
    _dictionaryCacheTime = now
    return _dictionaryCache
  } catch {
    return generateInlineDictionary()
  }
}

function loadTermMap(root: string): Record<string, string> {
  if (_termMapCache) return _termMapCache

  // Try loading from .toon/dictionary.toon
  const dictPath = join(root, '.toon', 'dictionary.toon')
  if (existsSync(dictPath)) {
    try {
      const content = readFileSync(dictPath, 'utf-8')
      const dictTerms: Record<string, string> = {}
      for (const line of content.split('\n')) {
        if (line.startsWith('DICT t=')) {
          const terms = line.replace('DICT t=', '')
          for (const pair of terms.split('|')) {
            const [term, abbr] = pair.split(':')
            if (term && abbr) dictTerms[term] = abbr
          }
        }
      }
      if (Object.keys(dictTerms).length > 0) {
        _termMapCache = dictTerms
        return _termMapCache
      }
    } catch {}
  }

  // Use comprehensive ABBREV_MAP from encoder
  _termMapCache = ABBREV_MAP
  return _termMapCache
}

// getBuiltinTermMap removed — replaced by ABBREV_MAP from encoder

function generateInlineDictionary(): string {
  return `DICT v=novizio:0|hourbour:1|yvon-dashboard:2
DICT a=marcus:0|diana:1|dev:2|raj:3|mia:4|quinn:5|kai:6|lena:7|rio:8|nate:9|atlas:10|pixel:11|felix:12
DICT s=today:0|this-week:1|critical:2|low:3
DICT x=approved:0|deferred:1|rejected:2|pending:3`
}

// ─── Text Compressor ──────────────────────────────────────────────────────────

function compressText(text: string, _termMap: Record<string, string>): string {
  // Step 1: Detect and TOON-encode structured data blocks (JSON arrays, objects)
  const structuredBlocks = extractStructuredBlocks(text)
  if (structuredBlocks.length > 0) {
    let result = text
    for (const block of structuredBlocks) {
      try {
        const parsed = JSON.parse(block.text)
        const arr = Array.isArray(parsed) ? parsed : [parsed]
        const schemaType = block.hint || inferSchema(arr[0])
        const encoded = toon.dense(arr, schemaType)
        result = result.replace(block.text, `[TOON:${schemaType}]\n${encoded}\n[/TOON:${schemaType}]`)
      } catch {
        // Not valid JSON — fall through to abbreviation
      }
    }
    // Abbreviate the remaining free text portions
    return abbreviateText(result)
      .replace(/\s+/g, ' ').trim()
      .replace(/please note that /gi, '')
      .replace(/I would like to /gi, '')
  }

  // Step 2: Try structured prompt encoding (lists, key-value, tables)
  const result = encodePrompt(text)
  if (result.records.length > 1) {
    return result.compressed
  }

  // Step 3: Fallback — comprehensive abbreviation
  return abbreviateText(text)
    .replace(/\s+/g, ' ').trim()
    .replace(/please note that /gi, '')
    .replace(/I would like to /gi, '')
    .replace(/can you please /gi, '')
    .replace(/could you /gi, '')
    .replace(/I need you to /gi, '')
    .replace(/I want you to /gi, '')
    .replace(/would you be able to /gi, '')
}

// ─── Structured Block Detection ───────────────────────────────────────────────

interface StructuredBlock {
  text: string
  hint?: string  // schema type hint from context
}

function extractStructuredBlocks(text: string): StructuredBlock[] {
  const blocks: StructuredBlock[] = []

  // Match JSON arrays: [...]
  const arrayRe = /\[[\s\S]*?\{[\s\S]*?\}[\s\S]*?\]/g
  let match
  while ((match = arrayRe.exec(text)) !== null) {
    blocks.push({ text: match[0] })
  }

  // Match JSON objects: {...} (with at least 3 keys to avoid false positives)
  const objRe = /\{[\s\S]*?"[\s\S]*?":[\s\S]*?,[\s\S]*?"[\s\S]*?":[\s\S]*?,[\s\S]*?"[\s\S]*?":[\s\S]*?\}/g
  while ((match = objRe.exec(text)) !== null) {
    // Avoid duplicates with array matches
    if (!blocks.some(b => b.text.includes(match![0]))) {
      blocks.push({ text: match[0] })
    }
  }

  // Detect schema hints in surrounding text
  for (const block of blocks) {
    const before = text.slice(Math.max(0, text.indexOf(block.text) - 50), text.indexOf(block.text))
    const hintMatch = before.match(/(decisions?|tasks?|agents?|ventures?|competitors?|sessions?)/i)
    if (hintMatch) {
      block.hint = hintMatch[1].toLowerCase().replace(/s$/, '')
    }
  }

  return blocks
}

function inferSchema(obj: Record<string, any>): string {
  const keys = Object.keys(obj)
  if (keys.includes('venture') && keys.includes('agent')) return 'decision'
  if (keys.includes('title') && keys.includes('stage')) return 'task'
  if (keys.includes('slug') && keys.includes('brand_type')) return 'venture'
  if (keys.includes('name') && keys.includes('signal')) return 'competitor'
  if (keys.includes('agent_id') && keys.includes('task')) return 'session'
  return 'generic'
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── Document Loader ──────────────────────────────────────────────────────────

function findRelevantToonDocs(root: string, userMessage: string, agentId?: string | null): string {
  const toonDocDir = join(root, '.toon', 'docs')
  if (!existsSync(toonDocDir)) return ''

  try {
    // Extract keywords from user message
    const words = userMessage.toLowerCase().split(/\s+/)
    const keywords = new Set(words.filter(w => w.length > 3))

    // Find relevant TOON docs
    const relevant: string[] = []
    const docFiles = scanToonFiles(toonDocDir)

    for (const docFile of docFiles.slice(0, 5)) { // Max 5 docs per call
      try {
        const content = readFileSync(docFile, 'utf-8')

        // Simple relevance check: keyword overlap
        const docWords = content.toLowerCase().split(/\s+/)
        const overlap = docWords.filter(w => keywords.has(w)).length

        if (overlap >= 2 || docFile.includes(agentId || '')) {
          relevant.push(content)
        }
      } catch {}
    }

    return relevant.join('\n')
  } catch {
    return ''
  }
}

function scanToonFiles(dir: string): string[] {
  const files: string[] = []
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...scanToonFiles(full))
      } else if (entry.name.endsWith('.toon')) {
        files.push(full)
      }
    }
  } catch {}
  return files
}

// ─── Agent Memory Loader ──────────────────────────────────────────────────────

function loadAgentMemory(root: string, agentId?: string | null): string {
  if (!agentId) return ''

  const toonMemDir = join(root, '.toon', 'memory')
  if (!existsSync(toonMemDir)) return ''

  // Find memory file for this agent
  const files = scanToonFiles(toonMemDir)
  const agentFile = files.find(f => f.includes(agentId))

  if (!agentFile) return ''

  try {
    const content = readFileSync(agentFile, 'utf-8')
    // Return only the most recent entries (last 20 lines)
    const lines = content.split('\n').filter(l => l.startsWith('M|'))
    return lines.slice(-20).join('\n')
  } catch {
    return ''
  }
}

// ─── Output Format Detection ──────────────────────────────────────────────────

function shouldUseToonOutput(userMessage: string): boolean {
  const dataKeywords = [
    'list', 'show', 'get', 'fetch', 'query', 'find', 'search',
    'all', 'every', 'each', 'count', 'how many',
    'filter', 'sort', 'group', 'aggregate',
    'table', 'columns', 'rows', 'data',
    'decisions', 'tasks', 'agents', 'competitors', 'ventures',
    'report', 'summary', 'overview',
  ]

  const lower = userMessage.toLowerCase()
  const matches = dataKeywords.filter(kw => lower.includes(kw))
  return matches.length >= 2 && userMessage.length > 100
}
