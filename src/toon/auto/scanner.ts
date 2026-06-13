// src/toon/auto/scanner.ts — Project Scanner & Schema Auto-Detection
//
// Phase 1 of auto-TOONification. Analyzes the project to:
// 1. Discover all data shapes (TypeScript interfaces, API responses, DB models)
// 2. Auto-generate TOON schemas for each shape
// 3. Build project-specific dictionary (venture names, agent IDs, statuses, terms)
// 4. Map injection points (where TOON should be wired)
//
// This is the "brain" — runs once during `toongine integrate`, then the generated
// config drives all subsequent TOON compression automatically.

import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiscoveredSchema {
  type: string           // e.g. 'decision', 'task', 'venture', 'session'
  source: string         // file where the shape was discovered
  fields: { name: string; abbr: string; type: string }[]
  sampleCount: number    // how many instances found
  occurrences: number    // how many places this shape is used
}

export interface ProjectDictionary {
  ventures: Record<string, number>
  agents: Record<string, number>
  statuses: Record<string, number>
  actions: Record<string, number>
  commonTerms: Record<string, string>  // "approve" → "ap", "competitor" → "cp", etc.
}

export interface InjectionPoint {
  type: 'claude-route' | 'api-route' | 'document-store' | 'memory-store' | 'config'
  path: string           // file path to inject into
  action: 'wrap' | 'replace' | 'add-middleware' | 'create-schema'
  details: string        // what specifically to do
}

export interface ProjectScan {
  projectRoot: string
  projectType: 'nextjs-app' | 'nextjs-pages' | 'vite' | 'express' | 'unknown'
  schemas: DiscoveredSchema[]
  dictionary: ProjectDictionary
  injectionPoints: InjectionPoint[]
  documentPaths: string[]        // paths to docs that should be TOON-compressed
  memoryPaths: string[]          // paths to agent memory files
  totalDataShapes: number
  estimatedTokenSavings: number  // percentage
}

// ─── Scanner ──────────────────────────────────────────────────────────────────

export function scanProject(projectRoot: string): ProjectScan {
  const scan: ProjectScan = {
    projectRoot,
    projectType: detectProjectType(projectRoot),
    schemas: [],
    dictionary: buildEmptyDictionary(),
    injectionPoints: [],
    documentPaths: [],
    memoryPaths: [],
    totalDataShapes: 0,
    estimatedTokenSavings: 0,
  }

  // 1. Detect project type
  scan.projectType = detectProjectType(projectRoot)

  // 2. Scan for TypeScript interfaces (data shapes)
  const tsInterfaces = scanTypeScriptInterfaces(projectRoot)
  for (const iface of tsInterfaces) {
    const schema = interfaceToSchema(iface)
    if (schema) {
      scan.schemas.push(schema)
    }
  }

  // 3. Scan API routes for response shapes
  const apiShapes = scanApiRoutes(projectRoot)
  for (const shape of apiShapes) {
    // Merge with existing or add new
    const existing = scan.schemas.find(s => s.type === shape.type)
    if (existing) {
      existing.occurrences += shape.occurrences
      existing.sampleCount += shape.sampleCount
    } else {
      scan.schemas.push(shape)
    }
  }

  // 4. Build dictionary from discovered data
  scan.dictionary = buildDictionary(projectRoot, scan.schemas)

  // 5. Find document and memory paths
  scan.documentPaths = findDocuments(projectRoot)
  scan.memoryPaths = findMemories(projectRoot)

  // 6. Map injection points
  scan.injectionPoints = mapInjectionPoints(scan)

  // 7. Estimate savings
  scan.totalDataShapes = scan.schemas.length
  scan.estimatedTokenSavings = estimateSavings(scan)

  return scan
}

// ─── Project Type Detection ───────────────────────────────────────────────────

function detectProjectType(root: string): ProjectScan['projectType'] {
  if (existsSync(join(root, 'app', 'layout.tsx')) || existsSync(join(root, 'app', 'layout.js')))
    return 'nextjs-app'
  if (existsSync(join(root, 'pages', '_app.tsx')) || existsSync(join(root, 'pages', '_app.js')))
    return 'nextjs-pages'
  if (existsSync(join(root, 'vite.config.ts')) || existsSync(join(root, 'vite.config.js')))
    return 'vite'
  if (existsSync(join(root, 'server.ts')) || existsSync(join(root, 'app.ts')))
    return 'express'
  return 'unknown'
}

// ─── TypeScript Interface Scanner ─────────────────────────────────────────────

interface RawInterface {
  name: string
  file: string
  fields: { name: string; type: string; optional: boolean }[]
}

function scanTypeScriptInterfaces(root: string): RawInterface[] {
  const interfaces: RawInterface[] = []
  const scanDir = (dir: string) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) { scanDir(full) }
      else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        try {
          const content = readFileSync(full, 'utf-8')
          const found = extractInterfaces(content, full)
          interfaces.push(...found)
        } catch {}
      }
    }
  }
  scanDir(root)
  return interfaces
}

function extractInterfaces(content: string, filePath: string): RawInterface[] {
  const results: RawInterface[] = []
  // Match: export interface Foo { ... } or interface Foo { ... }
  const ifaceRe = /(?:export\s+)?interface\s+(\w+)\s*\{([^}]*)\}/gs
  let match
  while ((match = ifaceRe.exec(content)) !== null) {
    const name = match[1]
    const body = match[2]
    const fields: { name: string; type: string; optional: boolean }[] = []

    // Extract fields: fieldName: type; or fieldName?: type;
    const fieldRe = /(\w+)(\?)?\s*:\s*([^;]+);/g
    let fMatch
    while ((fMatch = fieldRe.exec(body)) !== null) {
      fields.push({
        name: fMatch[1],
        type: fMatch[3].trim(),
        optional: !!fMatch[2],
      })
    }

    if (fields.length >= 3) { // Only meaningful interfaces (3+ fields)
      results.push({ name, file: filePath, fields })
    }
  }
  return results
}

// ─── Interface → TOON Schema ──────────────────────────────────────────────────

function interfaceToSchema(iface: RawInterface): DiscoveredSchema | null {
  // Map known interface names to TOON types
  const typeMap: Record<string, string> = {
    decision: 'decision', Decision: 'decision', DecisionRecord: 'decision',
    task: 'task', Task: 'task', TaskItem: 'task',
    venture: 'venture', Venture: 'venture', VentureData: 'venture',
    session: 'session', Session: 'session', AgentSession: 'session',
    competitor: 'competitor', Competitor: 'competitor', CompetitorData: 'competitor',
    agent: 'agent', Agent: 'agent', AgentData: 'agent',
    document: 'document', Doc: 'document', KnowledgeEntry: 'document',
    memory: 'memory', Memory: 'memory', MemoryEntry: 'memory',
  }

  const toonType = typeMap[iface.name]
  if (!toonType) return null

  // Auto-generate abbreviations for each field
  const fields = iface.fields.map((f, i) => ({
    name: f.name,
    // Abbreviation: first char + consonant pattern, or just incrementing letters
    abbr: autoAbbreviate(f.name, iface.fields, i),
    type: mapTypeScriptType(f.type),
  }))

  return {
    type: toonType,
    source: relative(process.cwd(), iface.file),
    fields,
    sampleCount: 1,
    occurrences: 1,
  }
}

function autoAbbreviate(name: string, allFields: { name: string }[], index: number): string {
  // Strategy: use first 1-2 chars, avoid collisions
  const simple = name.slice(0, 2).toLowerCase()
  const collisions = allFields.filter((f, i) => i !== index && f.name.slice(0, 2).toLowerCase() === simple)
  if (collisions.length === 0) return simple

  // Fallback: first char of each word in camelCase/snake_case
  const words = name.replace(/([A-Z])/g, '_$1').split('_').filter(Boolean)
  const abbr = words.map(w => w[0].toLowerCase()).join('')
  if (abbr.length >= 2) return abbr.slice(0, 3)

  // Last resort: use index-based letter
  return String.fromCharCode(97 + index) // a, b, c, ...
}

function mapTypeScriptType(tsType: string): string {
  const t = tsType.toLowerCase().trim()
  if (t.includes('string')) return 'string'
  if (t.includes('number') || t.includes('int')) return 'number'
  if (t.includes('boolean')) return 'boolean'
  if (t.includes('null') || t.includes('undefined')) return 'null'
  if (t.includes('date')) return 'date'
  return 'string'
}

// ─── API Route Scanner ────────────────────────────────────────────────────────

function scanApiRoutes(root: string): DiscoveredSchema[] {
  const schemas: DiscoveredSchema[] = []
  const apiDir = join(root, 'app', 'api')
  if (!existsSync(apiDir)) return schemas

  const scanDir = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) { scanDir(full) }
      else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        try {
          const content = readFileSync(full, 'utf-8')
          const found = extractApiShapes(content, full, root)
          schemas.push(...found)
        } catch {}
      }
    }
  }
  scanDir(apiDir)
  return schemas
}

function extractApiShapes(content: string, filePath: string, root: string): DiscoveredSchema[] {
  const results: DiscoveredSchema[] = []

  // Detect: .from('table_name') — Supabase table shapes
  const sbRe = /\.from\(['"](\w+)['"]\)/g
  let match
  while ((match = sbRe.exec(content)) !== null) {
    results.push({
      type: match[1],
      source: relative(root, filePath),
      fields: [],
      sampleCount: 0,
      occurrences: 1,
    })
  }

  // Detect: res.json({ ... }) — response shapes
  const jsonRe = /res\.json\(\s*\{([^}]+)\}/g
  while ((match = jsonRe.exec(content)) !== null) {
    const shapeName = filePath.split('/').slice(-3, -1).join('_')
    results.push({
      type: shapeName,
      source: relative(root, filePath),
      fields: [],
      sampleCount: 1,
      occurrences: 1,
    })
  }

  return results
}

// ─── Dictionary Builder ───────────────────────────────────────────────────────

function buildEmptyDictionary(): ProjectDictionary {
  return {
    ventures: {},
    agents: {},
    statuses: {},
    actions: {},
    commonTerms: {},
  }
}

function buildDictionary(root: string, schemas: DiscoveredSchema[]): ProjectDictionary {
  const dict = buildEmptyDictionary()

  // Auto-detect ventures from config
  const configPath = join(root, 'toongine.config.json')
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      if (config.ventures) {
        Object.entries(config.ventures as Record<string, any>).forEach(([slug, data], i) => {
          dict.ventures[slug] = i
        })
      }
    } catch {}
  }

  // Hard-coded defaults that work for YVON and similar projects
  dict.ventures['novizio'] = dict.ventures['novizio'] ?? 0
  dict.ventures['hourbour'] = dict.ventures['hourbour'] ?? 1
  dict.ventures['yvon-dashboard'] = dict.ventures['yvon-dashboard'] ?? 2

  // Common agents
  const defaultAgents = ['marcus', 'diana', 'dev', 'raj', 'mia', 'quinn', 'kai', 'lena', 'rio', 'nate', 'atlas', 'pixel', 'felix']
  defaultAgents.forEach((a, i) => { dict.agents[a] = dict.agents[a] ?? i })

  // Statuses
  dict.statuses['today'] = 0
  dict.statuses['this-week'] = 1
  dict.statuses['critical'] = 2
  dict.statuses['low'] = 3

  // Actions
  dict.actions['approved'] = 0
  dict.actions['deferred'] = 1
  dict.actions['rejected'] = 2
  dict.actions['pending'] = 3

  // Common term abbreviations (bidirectional word compression)
  dict.commonTerms = {
    'approve': 'ap', 'approved': 'ap', 'approval': 'ap',
    'competitor': 'cp', 'competitors': 'cp',
    'campaign': 'cg', 'campaigns': 'cg',
    'review': 'rv', 'reviewed': 'rv',
    'security': 'sec',
    'social': 'soc', 'social media': 'soc',
    'analytics': 'anl',
    'strategy': 'str',
    'newsletter': 'nl',
    'newsletter_issue': 'nli',
    'production': 'prd',
    'pipeline': 'pl',
    'decision': 'dec',
    'venture': 'vtr',
    'agent': 'agt',
    'session': 'ses',
    'memory': 'mem',
    'document': 'doc',
    'knowledge': 'knw',
    'context': 'ctx',
    'response': 'rsp',
    'generate': 'gen',
    'content': 'cnt',
    'marketing': 'mkt',
    'finance': 'fin',
    'technical': 'tec',
    'development': 'dev',
    'deployment': 'dpl',
    'configuration': 'cfg',
  }

  return dict
}

// ─── Document & Memory Scanner ────────────────────────────────────────────────

function findDocuments(root: string): string[] {
  const paths: string[] = []
  const docDirs = ['docs', 'documentation', 'content', 'wiki']
  for (const dir of docDirs) {
    const full = join(root, dir)
    if (existsSync(full)) {
      scanForFiles(full, ['.md', '.mdx', '.txt'], paths)
    }
  }
  return paths
}

function findMemories(root: string): string[] {
  const paths: string[] = []
  const memDirs = ['agent-memory', 'agent-department', 'memories', '.hermes/memories']
  for (const dir of memDirs) {
    const full = join(root, dir)
    if (existsSync(full)) {
      scanForFiles(full, ['.md'], paths)
    }
  }
  return paths
}

function scanForFiles(dir: string, extensions: string[], results: string[]): void {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      scanForFiles(full, extensions, results)
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(full)
    }
  }
}

// ─── Injection Point Mapper ───────────────────────────────────────────────────

function mapInjectionPoints(scan: ProjectScan): InjectionPoint[] {
  const points: InjectionPoint[] = []

  // 1. Claude/LLM route — always inject prompt compression
  const claudePaths = [
    join(scan.projectRoot, 'app', 'api', 'claude', 'route.ts'),
    join(scan.projectRoot, 'app', 'api', 'claude', 'route.tsx'),
    join(scan.projectRoot, 'pages', 'api', 'claude.ts'),
  ]
  for (const p of claudePaths) {
    if (existsSync(p)) {
      points.push({
        type: 'claude-route',
        path: p,
        action: 'add-middleware',
        details: 'TOON prompt compression + document injection + output format',
      })
    }
  }

  // 2. Major API routes — inject TOON response format
  const apiRoutes = ['decision-queue', 'task-board', 'agents', 'competitor', 'venture', 'session-sync', 'dashboard']
  for (const route of apiRoutes) {
    const routePaths = [
      join(scan.projectRoot, 'app', 'api', route, 'route.ts'),
      join(scan.projectRoot, 'app', 'api', route, 'route.tsx'),
    ]
    for (const p of routePaths) {
      if (existsSync(p)) {
        points.push({
          type: 'api-route',
          path: p,
          action: 'add-middleware',
          details: `TOON response format for /api/${route}`,
        })
      }
    }
  }

  // 3. Document store — create .toon/ directory
  if (scan.documentPaths.length > 0) {
    points.push({
      type: 'document-store',
      path: join(scan.projectRoot, '.toon'),
      action: 'create-schema',
      details: `TOON document store with ${scan.documentPaths.length} documents`,
    })
  }

  // 4. Memory store — TOON-compress agent memory
  if (scan.memoryPaths.length > 0) {
    points.push({
      type: 'memory-store',
      path: join(scan.projectRoot, '.toon', 'memory'),
      action: 'create-schema',
      details: `TOON memory store with ${scan.memoryPaths.length} memories`,
    })
  }

  // 5. Config injection
  const configPath = join(scan.projectRoot, 'toongine.config.json')
  points.push({
    type: 'config',
    path: configPath,
    action: 'replace',
    details: 'Add TOON configuration to toongine.config.json',
  })

  return points
}

// ─── Savings Estimator ────────────────────────────────────────────────────────

function estimateSavings(scan: ProjectScan): number {
  let base = 20 // Baseline savings from schema compression

  if (scan.schemas.length >= 3) base += 10
  if (scan.documentPaths.length >= 10) base += 15
  if (scan.memoryPaths.length >= 5) base += 10
  if (scan.injectionPoints.length >= 5) base += 10

  // Claude route injection is the biggest win
  const hasClaudeInjection = scan.injectionPoints.some(p => p.type === 'claude-route')
  if (hasClaudeInjection) base += 15

  return Math.min(base, 85) // Cap at 85%
}
