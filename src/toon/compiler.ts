// src/toon/compiler.ts — TOON Compiler
// Converts .md source files → .toon LLM-optimized files
//
// Four-phase pipeline:
//   1. Structural parse (headers, lists, tables, code blocks)
//   2. Schema detection (key-value, narrative, table, frontmatter)
//   3. Abbreviation dictionary (project-specific)
//   4. V3 indexing (semantic terms → inverted index)
//
// Usage:
//   import { compileFile, compileAll, CompileResult } from './compiler'
//   const result = compileFile('agent-department/CEO/marcus/MEMORY.md', '/root/yvon')

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompileResult {
  sourcePath: string
  destPath: string
  sourceSize: number
  compressedSize: number
  savingsPercent: number
  durationMs: number
  sections: number
  abbreviationsApplied: number
  error?: string
}

export interface CompileAllResult {
  totalFiles: number
  compiled: number
  errors: number
  totalSourceSize: number
  totalCompressedSize: number
  overallSavingsPercent: number
  durationMs: number
  results: CompileResult[]
}

interface Section {
  type: 'header' | 'list' | 'table' | 'code' | 'narrative' | 'frontmatter' | 'empty'
  level?: number
  content: string
  compressed: string
}

// ─── Abbreviation Dictionary ───────────────────────────────────────────────────

const DEFAULT_DICT: Record<string, string> = {
  'agent-department': 'AGD',
  'Chief Executive Officer': 'CEO',
  'Chief Operating Officer': 'COO',
  'Strategic direction': 'STRAT_DIR',
  'implementation': 'IMPL',
  'architecture': 'ARCH',
  'performance': 'PERF',
  'development': 'DEV',
  'production': 'PROD',
  'deployment': 'DEPLOY',
  'configuration': 'CONFIG',
  'documentation': 'DOCS',
  'verification': 'VERIFY',
  'validation': 'VALID',
  'integration': 'INTEG',
  'authentication': 'AUTH',
  'authorization': 'AUTHZ',
  'database': 'DB',
  'Supabase': 'SB',
  'TypeScript': 'TS',
  'JavaScript': 'JS',
  'Next.js': 'NXJS',
  'Vercel': 'VRC',
  'DeepSeek': 'DS',
  'Hermes': 'HRM',
  'ToonGine': 'TN',
  'Context Intelligence Engine': 'CIE',
  'non-negotiable': 'NON_NEG',
  'without': 'W/O',
  'with': 'W/',
  'between': 'BTWN',
  'because': 'BC',
  'therefore': 'THRF',
  'however': 'HWVR',
  'additionally': 'ALSO',
  'specifically': 'SPEC',
  'immediately': 'IMMED',
  'automatically': 'AUTO',
  'significantly': 'SIG',
  'approximately': '~',
  'minimum': 'MIN',
  'maximum': 'MAX',
  'required': 'REQ',
  'optional': 'OPT',
  'recommended': 'REC',
  'forbidden': 'BAN',
  'guaranteed': 'GUAR',
  'session': 'SESS',
  'memory': 'MEM',
  'context': 'CTX',
  'token': 'TOK',
  'budget': 'BUD',
  'cost': 'COST',
  'savings': 'SAV',
  'compression': 'CMP',
  'injection': 'INJ',
  'pipeline': 'PIPE',
  'workflow': 'WORKFL',
  'decision': 'DEC',
  'approval': 'APPR',
  'rejection': 'REJ',
  'condition': 'COND',
  'strategy': 'STRAT',
  'operation': 'OPS',
  'execution': 'EXEC',
  'analysis': 'ANAL',
  'synthesis': 'SYNTH',
  'research': 'RSCH',
  'market': 'MKT',
  'competitor': 'COMP',
  'revenue': 'REV',
  'finance': 'FIN',
  'legal': 'LGL',
  'compliance': 'CMPL',
  'security': 'SEC',
  'audit': 'AUD',
  'quality': 'QA',
  'testing': 'TEST',
  'bug': 'BUG',
  'error': 'ERR',
  'warning': 'WARN',
  'critical': 'CRIT',
  'priority': 'PRIO',
  'deadline': 'DL',
  'milestone': 'MS',
  'sprint': 'SPR',
  'roadmap': 'MAP',
  'venture': 'VENT',
  'Novizio': 'NOV',
  'Hourbour': 'HBR',
  'YVON': 'YVN',
  'dashboard': 'DASH',
  'component': 'CMPT',
  'layout': 'LO',
  'design': 'DSGN',
  'brand': 'BRND',
  'content': 'CNT',
  'marketing': 'MKTG',
  'analytics': 'ANLT',
  'social': 'SOC',
  'email': 'EML',
  'campaign': 'CAMP',
  'conversion': 'CONV',
  'funnel': 'FNL',
  'growth': 'GRW',
  'retention': 'RET',
  'churn': 'CHRN',
  'model': 'MDL',
  'provider': 'PROV',
  'prompt': 'PRMP',
  'response': 'RSP',
  'streaming': 'STRM',
  'completion': 'CMPL',
  'temperature': 'TEMP',
  'repository': 'REPO',
  'branch': 'BR',
  'commit': 'CMT',
  'merge': 'MRG',
  'deploy': 'DPLY',
  'rollback': 'RB',
  'migration': 'MGR',
  'schema': 'SCHM',
  'index': 'IDX',
  'query': 'QRY',
  'cache': 'CCH',
}

// ─── Phase 1: Structural Parse ─────────────────────────────────────────────────

function parseMarkdown(content: string): Section[] {
  const lines = content.split('\n')
  const sections: Section[] = []
  let currentSection: Section | null = null
  let inCodeBlock = false
  let codeContent = ''
  let codeFence = ''

  for (const line of lines) {
    // Code block handling
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeFence = line.slice(3).trim()
        codeContent = ''
      } else {
        inCodeBlock = false
        sections.push({
          type: 'code',
          content: codeContent,
          compressed: `CODE ${codeFence || ''} ${codeContent.length}CHARS`,
        })
      }
      continue
    }

    if (inCodeBlock) {
      codeContent += line + '\n'
      continue
    }

    // Empty line
    if (line.trim() === '') {
      if (currentSection) {
        sections.push(currentSection)
        currentSection = null
      }
      continue
    }

    // Comment / metadata line (starting with # in content, not header)
    if (line.startsWith('#')) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/)
      if (headerMatch) {
        if (currentSection) sections.push(currentSection)
        sections.push({
          type: 'header',
          level: headerMatch[1].length,
          content: headerMatch[2],
          compressed: headerMatch[2].toUpperCase(),
        })
        currentSection = null
        continue
      }
    }

    // List item
    if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
      if (currentSection && currentSection.type !== 'list') {
        sections.push(currentSection)
        currentSection = null
      }
      if (!currentSection) {
        currentSection = { type: 'list', content: '', compressed: '' }
      }
      const text = line.replace(/^[\s]*[-*+\d.]+\s+/, '')
      currentSection.content += text + '\n'

      // Compress list: strip markdown, keep key info
      const cleaned = text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')
        .replace(/>\s*/g, '')
        .trim()
      currentSection.compressed += cleaned + ' '
      continue
    }

    // Table line
    if (line.includes('|')) {
      if (line.match(/^\|[-|\s]+\|$/)) continue // skip separator
      if (currentSection && currentSection.type !== 'table') {
        sections.push(currentSection)
        currentSection = null
      }
      if (!currentSection) {
        currentSection = { type: 'table', content: '', compressed: '' }
      }
      currentSection.content += line + '\n'
      const cells = line.split('|').map(c => c.trim()).filter(c => c)
      currentSection.compressed += cells.join(' ') + ' '
      continue
    }

    // Frontmatter
    if (line === '---' && sections.length === 0) {
      currentSection = { type: 'frontmatter', content: '', compressed: '' }
      continue
    }
    if (line === '---' && currentSection?.type === 'frontmatter') {
      sections.push(currentSection)
      currentSection = null
      continue
    }

    // Regular text / narrative
    if (!currentSection || currentSection.type !== 'narrative') {
      if (currentSection) sections.push(currentSection)
      currentSection = { type: 'narrative', content: '', compressed: '' }
    }
    currentSection.content += line + '\n'

    // Compress narrative: remove markdown formatting, keep semantic content
    const cleaned = line
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/#+\s*/g, '')
      .replace(/>\s*/g, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .trim()

    if (cleaned) {
      currentSection.compressed += cleaned + ' '
    }
  }

  if (currentSection) sections.push(currentSection)
  return sections
}

// ─── Phase 2: Schema Detection ─────────────────────────────────────────────────

function detectSchema(section: Section): string {
  if (section.type === 'code') return section.compressed
  if (section.type === 'header') return section.compressed
  if (section.type === 'empty') return ''

  // Key-value detection: "Priority: Strategic direction"
  const kvMatch = section.content.match(/^([A-Za-z\s]+):\s*(.+)/)
  if (kvMatch) {
    const key = kvMatch[1].trim().toUpperCase().replace(/\s+/g, '_')
    const value = kvMatch[2].trim()
    return `${key} ${value}`
  }

  return section.compressed
}

// ─── Phase 3: Abbreviation Dictionary ──────────────────────────────────────────

function applyAbbreviations(text: string, dict: Record<string, string>): { text: string; count: number } {
  let result = text
  let count = 0

  // Sort by longest key first (greedy longest-match)
  const sorted = Object.entries(dict).sort((a, b) => b[0].length - a[0].length)

  for (const [full, abbrev] of sorted) {
    const regex = new RegExp(full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let matches = 0
    result = result.replace(regex, () => {
      matches++
      return abbrev
    })
    count += matches
  }

  return { text: result, count }
}

// ─── Phase 4: V3 Indexing ──────────────────────────────────────────────────────

interface IndexEntry {
  term: string
  docHash: string
  positions: number[]
  score: number
}

function extractIndexTerms(compressed: string, sourcePath: string): IndexEntry[] {
  const words = compressed.split(/[\s,.:;!?()\[\]{}]+/).filter(w => w.length > 2)
  const docHash = crypto.createHash('sha256').update(sourcePath).digest('hex').slice(0, 12)
  const entries: Map<string, IndexEntry> = new Map()

  words.forEach((word, idx) => {
    const term = word.toLowerCase()
    if (entries.has(term)) {
      const entry = entries.get(term)!
      entry.positions.push(idx)
      entry.score = Math.min(1, entry.score + 0.1)
    } else {
      entries.set(term, {
        term,
        docHash,
        positions: [idx],
        score: 0.5,
      })
    }
  })

  return Array.from(entries.values())
}

// ─── Main Compile Functions ─────────────────────────────────────────────────────

export function compileFile(sourcePath: string, projectRoot: string, dict?: Record<string, string>): CompileResult {
  const start = Date.now()
  const fullSourcePath = path.resolve(projectRoot, sourcePath)

  // Guard: skip hand-crafted foundation files
  const foundationFiles = ['docs/CONSTITUTION.md', 'docs/ENGINE.md']
  if (foundationFiles.includes(sourcePath)) {
    const sourceSize = fs.existsSync(fullSourcePath) ? fs.statSync(fullSourcePath).size : 0
    const destBase = sourcePath.replace(/^docs\//, '').replace(/\.md$/, '.toon')
    return {
      sourcePath,
      destPath: `.toon/docs/${destBase}`,
      sourceSize,
      compressedSize: sourceSize,
      savingsPercent: 0,
      durationMs: Date.now() - start,
      sections: 0,
      abbreviationsApplied: 0,
      error: 'SKIPPED: foundation file (hand-crafted TOON)',
    }
  }

  try {
    // Read source
    const content = fs.readFileSync(fullSourcePath, 'utf-8')
    const sourceSize = Buffer.byteLength(content, 'utf-8')

    // Phase 1: Parse
    const sections = parseMarkdown(content)

    // Phase 2: Schema detect + compress
    const compressedSections = sections
      .map(s => detectSchema(s))
      .filter(s => s.trim().length > 0)

    // Phase 3: Apply abbreviations
    const combined = compressedSections.join('\n')
    const dictToUse = dict || DEFAULT_DICT
    const { text: abbreviated, count } = applyAbbreviations(combined, dictToUse)

    // Phase 4: Build index (for V3 engine integration — stored in memory for now)
    const indexEntries = extractIndexTerms(abbreviated, sourcePath)

    // Determine destination path
    let destPath: string
    // Strip any leading .toon/ to prevent double-nesting
    const cleanSource = sourcePath.replace(/^\.toon\//, '')
    if (cleanSource.startsWith('agent-department/') || cleanSource.startsWith('agent-memory/')) {
      destPath = `.toon/memory/${cleanSource.replace(/\.md$/, '.toon')}`
    } else if (cleanSource.startsWith('docs/')) {
      destPath = `.toon/docs/${cleanSource.replace(/^docs\//, '').replace(/\.md$/, '.toon')}`
    } else if (cleanSource === 'CLAUDE.md') {
      destPath = '.toon/project/CLAUDE.toon'
    } else {
      destPath = `.toon/${cleanSource.replace(/\.md$/, '.toon')}`
    }

    const fullDestPath = path.resolve(projectRoot, destPath)
    const dir = path.dirname(fullDestPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Add metadata header
    const metaHeader = [
      `SRC ${sourcePath}`,
      `ORIG_SIZE ${sourceSize}`,
      `SECTIONS ${sections.length}`,
      `ABBREVS ${count}`,
      `INDEX_TERMS ${indexEntries.length}`,
      `COMPILED ${new Date().toISOString()}`,
      `---`,
    ].join('\n')

    fs.writeFileSync(fullDestPath, metaHeader + '\n' + abbreviated, 'utf-8')
    const compressedSize = Buffer.byteLength(abbreviated, 'utf-8')

    const duration = Date.now() - start

    return {
      sourcePath,
      destPath,
      sourceSize,
      compressedSize,
      savingsPercent: sourceSize > 0 ? Math.round((1 - compressedSize / sourceSize) * 100) : 0,
      durationMs: duration,
      sections: sections.length,
      abbreviationsApplied: count,
    }
  } catch (error: any) {
    return {
      sourcePath,
      destPath: '',
      sourceSize: 0,
      compressedSize: 0,
      savingsPercent: 0,
      durationMs: Date.now() - start,
      sections: 0,
      abbreviationsApplied: 0,
      error: error.message,
    }
  }
}

export function compileAll(projectRoot: string, dict?: Record<string, string>): CompileAllResult {
  const start = Date.now()
  const results: CompileResult[] = []

  // Find all .md files in agent-department/ (under .toon/memory/)
  const agentDept = path.join(projectRoot, '.toon', 'memory', 'agent-department')
  const agentMem  = path.join(projectRoot, '.toon', 'memory', 'agent-memory')
  const docsDir = path.join(projectRoot, 'docs')
  const claudeMd = path.join(projectRoot, 'CLAUDE.md')

  function findMdFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return []
    const files: string[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next')
        continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...findMdFiles(full))
      } else if (entry.name.endsWith('.md')) {
        files.push(path.relative(projectRoot, full))
      }
    }
    return files
  }

  // Collect all .md files
  const allFiles: string[] = []
  if (fs.existsSync(agentDept)) allFiles.push(...findMdFiles(agentDept))
  if (fs.existsSync(agentMem)) allFiles.push(...findMdFiles(agentMem))
  if (fs.existsSync(docsDir)) allFiles.push(...findMdFiles(docsDir))
  if (fs.existsSync(claudeMd)) allFiles.push('CLAUDE.md')

  // Compile each file
  for (const file of allFiles) {
    const result = compileFile(file, projectRoot, dict)
    results.push(result)
  }

  const duration = Date.now() - start
  const compiled = results.filter(r => !r.error)
  const errors = results.filter(r => r.error)

  return {
    totalFiles: allFiles.length,
    compiled: compiled.length,
    errors: errors.length,
    totalSourceSize: results.reduce((s, r) => s + r.sourceSize, 0),
    totalCompressedSize: results.reduce((s, r) => s + r.compressedSize, 0),
    overallSavingsPercent: results.reduce((s, r) => s + r.sourceSize, 0) > 0
      ? Math.round((1 - results.reduce((s, r) => s + r.compressedSize, 0) / Math.max(1, results.reduce((s, r) => s + r.sourceSize, 0))) * 100)
      : 0,
    durationMs: duration,
    results,
  }
}

// ─── CLI Entry ─────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]
  const projectRoot = args[1] || process.cwd()

  if (command === 'compile' || command === '--all') {
    console.log('\n  🔨 TOON Compiler — Compiling project...\n')
    const result = compileAll(projectRoot)
    console.log(`  📁 ${result.totalFiles} files found`)
    console.log(`  ✅ ${result.compiled} compiled`)
    if (result.errors > 0) console.log(`  ❌ ${result.errors} errors`)
    console.log(`  📊 ${(result.totalSourceSize / 1024).toFixed(1)} KB → ${(result.totalCompressedSize / 1024).toFixed(1)} KB`)
    console.log(`  💰 ${result.overallSavingsPercent}% overall savings`)
    console.log(`  ⏱️  ${result.durationMs}ms\n`)
    for (const r of result.results.filter(r => r.error)) {
      console.log(`  ⚠️  ${r.sourcePath}: ${r.error}`)
    }
  } else {
    console.log('\n  TOON Compiler v1.0')
    console.log('  Usage:')
    console.log('    npx ts-node src/toon/compiler.ts compile [projectRoot]')
    console.log('    npx ts-node src/toon/compiler.ts --all [projectRoot]\n')
  }
}
