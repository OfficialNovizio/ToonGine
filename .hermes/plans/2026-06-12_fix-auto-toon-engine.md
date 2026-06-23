# Auto-TOON Engine — Complete Fix Plan

> **For Hermes:** Execute tasks sequentially. Commit after each. Verify before moving on.

**Goal:** Fix all 12 gaps so `npx yvon integrate` auto-wires a working, high-compression TOON pipeline that actually delivers 40-80% token savings.

**Architecture:** Fix in 3 layers — (1) Engine: make middleware + injector produce real TOON output, (2) Routing: wire all middleware output into the Claude API call, (3) Verification: end-to-end test with real API call.

**Tech Stack:** TypeScript, Node.js, Next.js 15, Anthropic SDK, file I/O

---

## LAYER 1: Engine Fixes (yvon-engine)

### Task 1: Fix memory compressor — actually TOON-encode, not just rename

**Objective:** `injector.ts` currently writes raw markdown with `.toon` extension. Fix to actually encode.

**Files:**
- Modify: `/root/yvon-engine/src/toon/auto/injector.ts` — `compressMemories()` function
- Create: `/root/yvon-engine/src/toon/auto/encoder.ts` — TOON encoding engine

**Step 1:** Create the TOON encoder that converts structured text into pipe-delimited TOON format.

```typescript
// src/toon/auto/encoder.ts — Real TOON Encoding Engine
//
// Three encoding modes:
//   - SCHEMA: strict schema-based encoding (types, agents, decisions)
//   - DOCUMENT: section-based encoding (markdown docs → TOON)
//   - MEMORY: key-value encoding (agent MEMORY.md → TOON)
//
// The dictionary is used for abbreviation lookup during encoding.

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export interface ToonDoc {
  sections: ToonSection[]
  raw: string
  compressed: string
  savingsPercent: number
}

export interface ToonSection {
  type: string     // 'decision', 'task', 'config', 'text'
  records: string[] // TOON pipe-delimited records
}

export interface ToonMemory {
  agentId: string
  entries: string[] // Memory|key|value TOON records
  compressed: string
  savingsPercent: number
}

/**
 * Encode a markdown document into TOON format.
 * Preserves structure (headers → section type, paragraphs → records).
 */
export function encodeDocument(content: string, title: string = ''): ToonDoc {
  const sections: ToonSection[] = []
  const lines = content.split('\n')
  
  let currentType = 'text'
  let currentLines: string[] = []
  let currentHeader = ''
  
  function flush() {
    if (currentLines.length === 0) return
    const records = encodeLinesToToon(currentLines, currentType, currentHeader)
    sections.push({ type: currentType, records })
    currentLines = []
    currentHeader = ''
  }
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Headers become section types
    if (trimmed.match(/^#{1,4}\s/)) {
      flush()
      currentType = classifyHeader(trimmed)
      currentHeader = trimmed.replace(/^#+\s*/, '')
      continue
    }
    
    // Bullet points, numbered lists
    if (trimmed.match(/^[\-\*\d+\.]\s/)) {
      currentLines.push(trimmed.replace(/^[\-\*\d+\.]\s*/, ''))
      continue
    }
    
    // Regular text
    currentLines.push(trimmed)
  }
  flush()
  
  const allRecords = sections.flatMap(s => s.records)
  const compressed = allRecords.join('\n')
  
  return {
    sections,
    raw: content,
    compressed,
    savingsPercent: Math.round((1 - compressed.length / Math.max(1, content.length)) * 100)
  }
}

/**
 * Encode agent MEMORY.md into TOON key-value records.
 */
export function encodeMemory(content: string, agentId: string): ToonMemory {
  const entries: string[] = []
  const lines = content.split('\n')
  
  let currentSection = ''
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Section headers become section keys
    if (trimmed.match(/^#{1,3}\s/)) {
      currentSection = trimmed.replace(/^#+\s*/, '').toLowerCase().replace(/\s+/g, '_')
      continue
    }
    
    // Key-value pairs
    if (trimmed.includes(':')) {
      const [key, ...rest] = trimmed.split(':')
      const value = rest.join(':').trim()
      const k = abbreviate(key.trim())
      const v = abbreviateValue(value)
      entries.push(`M|${currentSection}|${k}|${v}`)
      continue
    }
    
    // Bullet points
    if (trimmed.match(/^[\-\*]\s/)) {
      const text = trimmed.replace(/^[\-\*]\s*/, '')
      entries.push(`M|${currentSection}|item|${abbreviateValue(text)}`)
      continue
    }
    
    // Regular text
    entries.push(`M|${currentSection}|text|${abbreviateValue(trimmed)}`)
  }
  
  const compressed = entries.join('\n')
  
  return {
    agentId,
    entries,
    compressed,
    savingsPercent: Math.round((1 - compressed.length / Math.max(1, content.length)) * 100)
  }
}

/**
 * Encode structured data (decisions, tasks, types) into typed TOON records.
 */
export function encodeStructured(data: Record<string, any>[], schema: string): string {
  const lines: string[] = []
  const prefix = schema.slice(0, 1).toUpperCase()
  
  for (const item of data) {
    const values = Object.values(item).map(v => {
      if (v === null || v === undefined) return '-'
      if (typeof v === 'boolean') return v ? '1' : '0'
      return String(v).replace(/\|/g, '\\|').replace(/\n/g, '\\n')
    })
    lines.push(`${prefix}|${values.join('|')}`)
  }
  
  return lines.join('\n')
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function classifyHeader(header: string): string {
  const h = header.toLowerCase()
  if (h.includes('decision')) return 'decision'
  if (h.includes('task') || h.includes('todo')) return 'task'
  if (h.includes('config') || h.includes('setup')) return 'config'
  if (h.includes('goal') || h.includes('objective')) return 'goal'
  if (h.includes('context') || h.includes('background')) return 'context'
  if (h.includes('memory') || h.includes('notes') || h.includes('log')) return 'memory'
  if (h.includes('plan') || h.includes('strategy')) return 'plan'
  if (h.includes('result') || h.includes('output') || h.includes('response')) return 'result'
  return 'text'
}

function encodeLinesToToon(lines: string[], type: string, header: string): string[] {
  const records: string[] = []
  const abbrev = abbreviate(header || '')
  
  if (type === 'text' && lines.length === 1) {
    const text = abbreviateValue(lines[0])
    return [`T|${abbrev}|${text}`]
  }
  
  let idx = 0
  for (const line of lines) {
    records.push(`T|${abbrev}|${idx}|${abbreviateValue(line)}`)
    idx++
  }
  
  return records
}

const ABBREV_MAP: Record<string, string> = {
  // Section abbreviations
  'overview': 'ov', 'context': 'ct', 'background': 'bg', 'goals': 'gl',
  'objectives': 'oj', 'tasks': 'tk', 'decisions': 'dc', 'results': 'rs',
  'notes': 'nt', 'logs': 'lg', 'configuration': 'cf', 'setup': 'su',
  'architecture': 'ar', 'dependencies': 'dp', 'deployment': 'dy',
  'strategy': 'st', 'planning': 'pn', 'execution': 'ex', 'review': 'rv',
  // Content abbreviations
  'venture': 'vt', 'agent': 'ag', 'system': 'sy', 'prompt': 'pm',
  'response': 'rp', 'user': 'us', 'session': 'sn', 'token': 'tk',
  'model': 'md', 'provider': 'pr', 'api': 'ap', 'database': 'db',
  'supabase': 'sb', 'nextjs': 'nx', 'typescript': 'ts', 'vercel': 'vc',
  'react': 'rc', 'tailwind': 'tw', 'component': 'cp', 'route': 'rt',
  'middleware': 'mw', 'function': 'fn', 'interface': 'if', 'type': 'tp',
  'novizio': 'nz', 'hourbour': 'hb', 'yvon': 'yv',
  'marcus': 'mc', 'diana': 'dn', 'kai': 'ka', 'lena': 'ln', 'rio': 'ro',
  'dev': 'dv', 'raj': 'rj', 'mia': 'mi', 'quinn': 'qn', 'felix': 'fx',
  'marketing': 'mk', 'technical': 'tc', 'finance': 'fi', 'ceo': 'ce',
  'analysis': 'al', 'report': 'rp', 'dashboard': 'db',
  'implementation': 'im', 'integration': 'ig', 'optimization': 'op',
  'error': 'er', 'warning': 'wn', 'success': 'sc', 'failure': 'fl',
  'performance': 'pf', 'security': 'sc', 'quality': 'ql',
  'content': 'cn', 'social': 'sl', 'email': 'em', 'ads': 'ad',
  'competitor': 'cr', 'market': 'mr', 'trend': 'tn', 'insight': 'in',
}

function abbreviate(text: string): string {
  const key = text.toLowerCase().replace(/[^a-z0-9]/g, '')
  return ABBREV_MAP[key] || text.slice(0, 4)
}

function abbreviateValue(text: string): string {
  // Apply abbreviation map to words in the text
  let result = text
  for (const [full, abbr] of Object.entries(ABBREV_MAP)) {
    // Only replace whole words
    const regex = new RegExp(`\\b${full}\\b`, 'gi')
    result = result.replace(regex, abbr)
  }
  return result
}
```

**Step 2:** Update `injector.ts` to use `encodeMemory` and `encodeDocument` instead of raw writes.

**Step 3:** Rebuild and verify.

---

### Task 2: Fix dictionary — generate comprehensive abbreviation map

**Objective:** Replace trivial 4-line dictionary with comprehensive abbreviation map from encoder.

**Files:**
- Modify: `/root/yvon-engine/src/toon/auto/scanner.ts` — `buildDictionary()`

Generate dictionary from the ABBREV_MAP in encoder plus project-specific terms.

---

### Task 3: Fix middleware — add schema-based prompt compression

**Objective:** `autoToonMiddleware` should detect structured data in prompts and encode it TOON, not just swap words.

**Files:**
- Modify: `/root/yvon-engine/src/toon/auto/middleware.ts` — `compressText()`

Add detection for:
- Bullet lists → TOON records
- Key-value pairs → TOON records  
- Tables → TOON records
- Numbered steps → TOON records

---

## LAYER 2: Route Fixes (YVON2.0)

### Task 4: Wire all middleware output into Claude API call

**Objective:** The Claude route calls `autoToonMiddleware` but only uses 2 of 6 outputs. Wire ALL outputs.

**Files:**
- Modify: `/root/yvon/app/api/claude/route.ts` — lines 138-155

Change from:
```ts
const compressedSystem = effectiveSystemPrompt
  ? (toonCtx.dictionary ? toonCtx.dictionary + '\n' : '') + effectiveSystemPrompt
  : effectiveSystemPrompt
const compressedMessage = toonCtx.compressedUserMessage || userMessageFinal
```

To:
```ts
// Build enhanced system prompt with dictionary + docs + memory + output instruction
const toonEnhancements = [
  toonCtx.dictionary ? `[DICTIONARY: ${toonCtx.dictionary}]` : '',
  toonCtx.relevantDocs ? `[RELEVANT DOCS:\n${toonCtx.relevantDocs}\n]` : '',
  toonCtx.relevantMemory ? `[AGENT MEMORY (TOON):\n${toonCtx.relevantMemory}\n]` : '',
  toonCtx.outputInstruction ? toonCtx.outputInstruction : '',
].filter(Boolean).join('\n\n')

const compressedSystem = effectiveSystemPrompt
  ? toonEnhancements + '\n\n' + effectiveSystemPrompt
  : effectiveSystemPrompt

const compressedMessage = toonCtx.compressedUserMessage || userMessageFinal
```

### Task 5: Add TOON output parsing to Claude response

**Objective:** When Claude responds in TOON format, parse it back to readable format.

**Files:**
- Modify: `/root/yvon/app/api/claude/route.ts` — SSE event handler
- Create: `/root/yvon-engine/src/toon/auto/decoder.ts` — TOON → human

Add TOON detection in the SSE stream and expand pipe-delimited records.

---

### Task 6: Update yvon.config.json with TOON settings

**Objective:** Add TOON configuration controls.

**Files:**
- Modify: `/root/yvon-engine/src/toon/auto/injector.ts` — config update
- Modify: `/root/yvon/yvon.config.json`

---

## LAYER 3: Verification

### Task 7: End-to-end test — real Claude call with TOON

**Objective:** Run a Claude call with TOON wired and verify:
- Dictionary is in system prompt
- Documents are injected
- Agent memory is injected  
- Savings are measured
- Response makes sense

**Test:**
```bash
curl -X POST http://localhost:3000/api/claude \
  -H 'Content-Type: application/json' \
  -d '{"agentName":"marcus","systemPrompt":"You are Marcus, CEO.","userMessage":"What competitors should I watch for Novizio?","ventureId":"novizio"}' \
  --no-buffer
```

### Task 8: Full TypeScript build + export verification

**Objective:** Verify 0 errors, all exports correct, all paths resolve.

### Task 9: Git commit + push

**Objective:** Push everything to `OfficialNovizio/YVON-Engine` master.

---

## File Map

| File | Task | Action |
|------|------|--------|
| `yvon-engine/src/toon/auto/encoder.ts` | 1 | Create |
| `yvon-engine/src/toon/auto/decoder.ts` | 5 | Create |
| `yvon-engine/src/toon/auto/injector.ts` | 1,6 | Modify |
| `yvon-engine/src/toon/auto/scanner.ts` | 2 | Modify |
| `yvon-engine/src/toon/auto/middleware.ts` | 3 | Modify |
| `yvon-engine/src/toon/auto/index.ts` | 1,5 | Modify |
| `yvon-engine/src/index.ts` | 1,5 | Modify |
| `yvon/app/api/claude/route.ts` | 4,5 | Modify |
| `yvon/yvon.config.json` | 6 | Modify |
