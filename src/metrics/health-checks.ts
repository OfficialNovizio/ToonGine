// src/metrics/health-checks.ts
// Periodically checks all module connections.

import { metrics } from './collector'
import { getConfig } from '../adapters/config'
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { execSync } from 'child_process'

export function runHealthChecks(): void {
  const config = getConfig()
  const cwd = process.cwd()
  const now = Date.now()

  const claudeKey = process.env.ANTHROPIC_API_KEY
  metrics.setModuleStatus({
    name: 'Claude (Anthropic)',
    connected: !!claudeKey,
    lastCheck: now,
    details: claudeKey ? `API key: ${claudeKey.slice(0, 8)}...` : 'No API key — set ANTHROPIC_API_KEY',
  })

  const dsKey = process.env.DEEPSEEK_API_KEY
  metrics.setModuleStatus({
    name: 'DeepSeek',
    connected: !!dsKey,
    lastCheck: now,
    details: dsKey ? 'API key configured' : 'No API key',
  })

  const hermesOk = existsSync(join(config.hermesMemoryDir, 'USER.md'))
  metrics.setModuleStatus({
    name: 'Hermes Sync',
    connected: hermesOk,
    lastCheck: now,
    details: hermesOk ? 'Memory files found' : 'Not initialized',
  })

  const graphifyOk = existsSync(config.graphifyReport)
  metrics.setModuleStatus({
    name: 'Graphify',
    connected: graphifyOk,
    lastCheck: now,
    details: graphifyOk ? 'Report found' : 'Not built — run: toongine graph',
  })

  const codegraphOk = existsSync(config.codegraphReport)
  metrics.setModuleStatus({
    name: 'CodeGraph',
    connected: codegraphOk,
    lastCheck: now,
    details: codegraphOk ? 'Report found' : 'Not built',
  })

  try {
    const crg = execSync('which code-review-graph 2>/dev/null || echo ""', { encoding: 'utf-8', timeout: 5000, stdio: ['pipe','pipe','pipe'] }).trim()
    metrics.setModuleStatus({
      name: 'Code-Review-Graph',
      connected: !!crg,
      lastCheck: now,
      details: crg ? `Installed: ${crg}` : 'Not installed (fallback active)',
    })
  } catch {
    metrics.setModuleStatus({ name: 'Code-Review-Graph', connected: false, lastCheck: now, details: 'Not installed (fallback active)' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  metrics.setModuleStatus({
    name: 'Supabase',
    connected: !!supabaseUrl,
    lastCheck: now,
    details: supabaseUrl ? `Connected: ${supabaseUrl}` : 'Not configured',
  })

  metrics.setModuleStatus({ name: 'MCP Client', connected: true, lastCheck: now, details: 'Local adapter active' })
  metrics.setModuleStatus({ name: 'TOON Compression', connected: true, lastCheck: now, details: 'Built-in (dense, claude, api, js)' })
  metrics.setModuleStatus({ name: 'CIE Pipeline', connected: true, lastCheck: now, details: 'Built-in (classify → retrieve → rank → inject)' })
}
