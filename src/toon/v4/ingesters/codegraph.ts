// src/toon/v4/ingesters/codegraph.ts
// Ingests from colbymchenry/codegraph (MCP/CLI) into unified graph.
// Uses codegraph CLI for extraction (codegraph explore/status).

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { UnifiedGraph } from '../unified-graph'
import { UnifiedNode, UnifiedEdge, IngestionResult, nodeId } from '../bridge-types'

export function ingestCodegraph(
  unified: UnifiedGraph,
  projectRoot: string,
): IngestionResult {
  const start = Date.now()
  const errors: string[] = []

  // Check if codegraph is installed
  try {
    execSync('which codegraph', { stdio: 'pipe' })
  } catch {
    return {
      tool: 'codegraph',
      nodesIngested: 0,
      edgesIngested: 0,
      nodesDeduped: 0,
      errors: ['codegraph CLI not found — install via: npm i -g @colbymchenry/codegraph'],
      durationMs: Date.now() - start,
    }
  }

  // Check if project has been indexed
  const dbPath = join(projectRoot, '.codegraph', 'codegraph.db')
  if (!existsSync(dbPath)) {
    return {
      tool: 'codegraph',
      nodesIngested: 0,
      edgesIngested: 0,
      nodesDeduped: 0,
      errors: ['codegraph not initialized — run: codegraph init'],
      durationMs: Date.now() - start,
    }
  }

  try {
    // ─── Get status ─────────────────────────────────────────────────────
    const statusOut = execSync('codegraph status --json', {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 15_000,
    }).toString()

    let stats: any = {}
    try { stats = JSON.parse(statusOut) } catch { /* non-JSON output */ }

    // ─── Get file list ──────────────────────────────────────────────────
    const filesOut = execSync('codegraph files --json', {
      cwd: projectRoot,
      stdio: 'pipe',
      timeout: 15_000,
    }).toString()

    let files: string[] = []
    try {
      const parsed = JSON.parse(filesOut)
      files = Array.isArray(parsed) ? parsed : (parsed.files || [])
    } catch { /* skip file list */ }

    // ─── Create file nodes ──────────────────────────────────────────────
    const nodes: UnifiedNode[] = files.map((f: string) => ({
      id: nodeId(f, 'codegraph'),
      name: f,
      qualified_name: f,
      kind: 'File',
      file_path: f,
      language: detectLanguage(f),
      community: null,
      tool_source: 'codegraph' as const,
      tool_node_id: null,
      extra: {},
    }))

    // ─── Create edges from codegraph explore on major symbols ────────────
    const edges: UnifiedEdge[] = []
    // For now, file-level edges only — deep symbol extraction via codegraph MCP at runtime
    // (codegraph's SQLite schema is different from code-review-graph)

    const result = unified.ingest('codegraph', nodes, edges)
    result.errors = errors
    return result
  } catch (err: any) {
    return {
      tool: 'codegraph',
      nodesIngested: 0,
      edgesIngested: 0,
      nodesDeduped: 0,
      errors: [err.stderr?.toString() || err.message],
      durationMs: Date.now() - start,
    }
  }
}

function detectLanguage(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    rb: 'ruby',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    dart: 'dart',
    lua: 'lua',
    r: 'r',
    vue: 'vue',
    svelte: 'svelte',
    astro: 'astro',
    css: 'css',
    html: 'html',
    md: 'markdown',
    json: 'json',
    yml: 'yaml', yaml: 'yaml',
    sql: 'sql',
    sh: 'bash', bash: 'bash',
  }
  return langMap[ext || ''] || null
}
