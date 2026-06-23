# YVON Engine Dashboard v2 — Master Implementation Plan

> **Package:** `yvon-engine` (npm) | **Repo:** `OfficialNovizio/YVON-Engine` | **Branch:** `master`
> **Execute with:** subagent-driven-development skill — one fresh subagent per task.

**Goal:** Replace the 732-line static HTML dashboard (`src/dashboard/index.ts`) with a full monitoring panel: live TOON metrics, per-model cost tracking, module connection status grid, real CIE pipeline visualization, agent activity cards, and searchable knowledge graph — all React + Recharts + D3 with WebSocket live updates.

**Tech Stack:** Express.js (server), React 19 + Vite (frontend), Recharts (charts), D3.js v7 (graph), Tailwind CSS (styling), ws (WebSocket), better-sqlite3 (persistence), TypeScript strict.

---

## Dashboard Layout (Final State)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚡ YVON Engine Dashboard                    🟢 Live · v1.3.0        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────┐  ┌───────────────────────────────────┐ │
│  │ 🔌 CONNECTIONS (3×3)     │  │ 📊 TOON METRICS                    │ │
│  │                          │  │                                    │ │
│  │ 🟢 Claude  🟢 Hermes    │  │   ████████████░░  84.5%          │ │
│  │ 🟢 Graphify  🟢 CodeGrph│  │   Savings gauge                   │ │
│  │ 🟢 CR-Graph  🟠 Supabase│  │   ┌──────────────────────────┐   │ │
│  │ 🟢 MCP      🟢 TOON    │  │   │ ╱╲  24h token savings    │   │ │
│  │ 🟢 CIE                 │  │   │ ╱  ╲    (area chart)    │   │ │
│  │                          │  │   └──────────────────────────┘   │ │
│  │ Click to re-check        │  │                                    │ │
│  └─────────────────────────┘  └───────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────┐  ┌───────────────────────────────────┐ │
│  │ 💰 COST TRACKING         │  │ ⚙️ CIE PIPELINE                   │ │
│  │                          │  │                                    │ │
│  │  [Pie: by model]        │  │  Classified ──→ Retrieved         │ │
│  │  DeepSeek: $0.42        │  │     847    →     3,412          │ │
│  │  Claude:   $1.18        │  │                    ↓               │ │
│  │                          │  │               Injected            │ │
│  │  Total saved: $2.87     │  │                 2,891             │ │
│  │                          │  │                    ↓               │ │
│  │  [Bar: cumulative]      │  │               Filtered            │ │
│  │  ████████░░  this month │  │                 521               │ │
│  └─────────────────────────┘  └───────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ 👥 AGENTS (13 cards, 4 cols)                                     │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                           │ │
│  │  │🟢Dev │ │🟢Raj │ │🟢Mia │ │🟠Quinn│                           │ │
│  │  │1.2K  │ │ 847  │ │2.1K │ │ 312  │                           │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                           │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                           │ │
│  │  │🟢Marcus│🟢Diana│🟢Kai │🟢Lena │                           │ │
│  │  │ 5.4K │ │ 3.2K │ │1.8K │ │2.3K │                           │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                           │ │
│  │  ... (13 cards total, click expands memory details)              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ 🔗 KNOWLEDGE GRAPH (full width)                                  │ │
│  │  [D3 force-directed graph — real codebase]                       │ │
│  │  Search: [______________] 🔍  Zoom: [+] [-] [↺ reset]           │ │
│  │  Node size = hub importance, edge = dependency                   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Data Collection Layer (Metrics + Health)

> **Principle:** Zero overhead when dashboard is off. One boolean check per call.

### Task 1.0: Create `src/metrics/` directory structure

```bash
mkdir -p src/metrics
```

### Task 1.1: Create `src/metrics/types.ts` — All metric type definitions

**File:** Create: `src/metrics/types.ts`

```typescript
// src/metrics/types.ts
// Type definitions for the metrics collection layer.
// All interfaces used by collector.ts, health-checks.ts, store.ts

export interface ToonCall {
  timestamp: number
  model: string              // e.g. 'claude-sonnet-4-6', 'deepseek-v4'
  format: 'dense' | 'claude' | 'api' | 'js'
  inputTokens: number
  outputTokens: number
  bytesBefore: number
  bytesAfter: number
  costSaved: number          // USD
  agentId?: string
}

export interface CiePipelineTick {
  timestamp: number
  taskType: string           // 'backend_bug', 'data_query', 'ops_risk', etc.
  taskLength: number         // character count of user message
  classified: number         // tokens used for classification (0 = zero-token)
  retrieved: number          // items retrieved from knowledge sources
  injected: number           // items injected into context
  filtered: number           // items filtered out (dupes, low relevance)
  latencyMs: number          // total CIE pipeline time
  skipped: boolean           // true if CIE skipped (short task)
}

export interface ModuleStatus {
  name: string               // 'Claude (Anthropic)', 'Hermes Sync', etc.
  connected: boolean
  lastCheck: number          // epoch ms
  details: string            // human-readable status
  latencyMs?: number         // optional ping latency
}

export interface AgentActivity {
  agentId: string            // 'dev-lead', 'marcus-ceo', etc.
  name: string               // display name
  department: string         // 'CEO', 'Technical', 'Marketing', 'Finance'
  status: 'online' | 'idle' | 'offline'
  lastActivity: number       // epoch ms
  totalCalls: number
  tokensUsed: number
  memorySizeBytes: number
}

export interface ToonStats {
  total: number
  totalInputTokens: number
  totalOutputTokens: number
  totalBytesSaved: number
  totalCostSaved: number
  avgSavingsPercent: number
  byModel: Record<string, { calls: number; costSaved: number }>
}

export interface CieStats {
  totalTicks: number
  totalRetrieved: number
  totalInjected: number
  totalFiltered: number
  avgLatencyMs: number
  skipRate: number
}

export interface CostSummary {
  byModel: Record<string, { calls: number; inputTokens: number; outputTokens: number; cost: number }>
  totalSpent: number
  totalSaved: number
  netCost: number
}
```

### Task 1.2: Create `src/metrics/collector.ts` — MetricsCollector singleton

**File:** Create: `src/metrics/collector.ts`

```typescript
// src/metrics/collector.ts
// Singleton metrics collector. Zero overhead when dashboard is off.
// All engine modules call these methods to record events.
// Methods are no-ops when enabled=false (one boolean check).

import type { ToonCall, CiePipelineTick, ModuleStatus, AgentActivity, ToonStats, CieStats, CostSummary } from './types'

class MetricsCollector {
  private enabled = false
  private toonCalls: ToonCall[] = []
  private cieTicks: CiePipelineTick[] = []
  private moduleStatuses: Map<string, ModuleStatus> = new Map()
  private agentActivities: Map<string, AgentActivity> = new Map()

  // ── Lifecycle ────────────────────────────────────────────────────────────

  enable() { this.enabled = true }
  disable() { this.enabled = false }
  isEnabled(): boolean { return this.enabled }

  // ── Recorders ────────────────────────────────────────────────────────────

  recordToonCall(call: ToonCall): void {
    if (!this.enabled) return
    this.toonCalls.push(call)
    if (this.toonCalls.length > 10000) this.toonCalls.shift()
  }

  recordCieTick(tick: CiePipelineTick): void {
    if (!this.enabled) return
    this.cieTicks.push(tick)
    if (this.cieTicks.length > 10000) this.cieTicks.shift()
  }

  setModuleStatus(status: ModuleStatus): void {
    this.moduleStatuses.set(status.name, status)
  }

  setAgentActivity(activity: AgentActivity): void {
    this.agentActivities.set(activity.agentId, activity)
  }

  // ── Queries ──────────────────────────────────────────────────────────────

  getToonStats(): ToonStats {
    const calls = this.toonCalls
    if (calls.length === 0) {
      return { total: 0, totalInputTokens: 0, totalOutputTokens: 0, totalBytesSaved: 0, totalCostSaved: 0, avgSavingsPercent: 0, byModel: {} }
    }
    const byModel: Record<string, { calls: number; costSaved: number }> = {}
    let totalInput = 0, totalOutput = 0, totalBytes = 0, totalCost = 0
    for (const c of calls) {
      totalInput += c.inputTokens
      totalOutput += c.outputTokens
      const bytesSaved = c.bytesBefore - c.bytesAfter
      totalBytes += bytesSaved
      totalCost += c.costSaved
      if (!byModel[c.model]) byModel[c.model] = { calls: 0, costSaved: 0 }
      byModel[c.model].calls++
      byModel[c.model].costSaved += c.costSaved
    }
    const avgSavings = calls.reduce((s, c) => s + ((c.bytesBefore - c.bytesAfter) / Math.max(1, c.bytesBefore)), 0) / calls.length * 100
    return {
      total: calls.length,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalBytesSaved: totalBytes,
      totalCostSaved: Math.round(totalCost * 10000) / 10000,
      avgSavingsPercent: Math.round(avgSavings * 10) / 10,
      byModel,
    }
  }

  getCieStats(): CieStats {
    const ticks = this.cieTicks
    if (ticks.length === 0) {
      return { totalTicks: 0, totalRetrieved: 0, totalInjected: 0, totalFiltered: 0, avgLatencyMs: 0, skipRate: 0 }
    }
    const skipped = ticks.filter(t => t.skipped).length
    return {
      totalTicks: ticks.length,
      totalRetrieved: ticks.reduce((s, t) => s + t.retrieved, 0),
      totalInjected: ticks.reduce((s, t) => s + t.injected, 0),
      totalFiltered: ticks.reduce((s, t) => s + t.filtered, 0),
      avgLatencyMs: Math.round(ticks.reduce((s, t) => s + t.latencyMs, 0) / ticks.length),
      skipRate: Math.round((skipped / ticks.length) * 100),
    }
  }

  getCostSummary(): CostSummary {
    const byModel: Record<string, { calls: number; inputTokens: number; outputTokens: number; cost: number }> = {}
    let totalSaved = 0
    for (const c of this.toonCalls) {
      if (!byModel[c.model]) byModel[c.model] = { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
      byModel[c.model].calls++
      byModel[c.model].inputTokens += c.inputTokens
      byModel[c.model].outputTokens += c.outputTokens
      // Estimate cost: $3/M input, $15/M output (Claude Sonnet pricing)
      const estimatedCost = (c.inputTokens / 1_000_000) * 3 + (c.outputTokens / 1_000_000) * 15
      byModel[c.model].cost += estimatedCost
      totalSaved += c.costSaved
    }
    const totalSpent = Object.values(byModel).reduce((s, m) => s + m.cost, 0)
    return {
      byModel,
      totalSpent: Math.round(totalSpent * 10000) / 10000,
      totalSaved: Math.round(totalSaved * 10000) / 10000,
      netCost: Math.round((totalSpent - totalSaved) * 10000) / 10000,
    }
  }

  getModuleStatuses(): ModuleStatus[] {
    return [...this.moduleStatuses.values()]
  }

  getAllAgentActivities(): AgentActivity[] {
    return [...this.agentActivities.values()]
  }

  getToonCalls(limit = 100): ToonCall[] {
    return this.toonCalls.slice(-limit)
  }

  getCieTicks(limit = 100): CiePipelineTick[] {
    return this.cieTicks.slice(-limit)
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  clear(): void {
    this.toonCalls = []
    this.cieTicks = []
    this.moduleStatuses.clear()
    this.agentActivities.clear()
  }
}

export const metrics = new MetricsCollector()
```

### Task 1.3: Create `src/metrics/health-checks.ts` — Module connection checker

**File:** Create: `src/metrics/health-checks.ts`

```typescript
// src/metrics/health-checks.ts
// Periodically checks all module connections and updates metrics.
// Called by dashboard server on startup and on-demand.

import { metrics } from './collector'
import { getConfig } from '../adapters/config'
import { existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

export function runHealthChecks(): void {
  const config = getConfig()
  const cwd = process.cwd()
  const now = Date.now()

  // 1. Claude (Anthropic) — API key presence
  const hasClaudeKey = !!(process.env.ANTHROPIC_API_KEY || config.claudeApiKey)
  metrics.setModuleStatus({
    name: 'Claude (Anthropic)',
    connected: hasClaudeKey,
    lastCheck: now,
    details: hasClaudeKey
      ? `API key: ${(process.env.ANTHROPIC_API_KEY || config.claudeApiKey || '').slice(0, 8)}...`
      : 'No API key — set ANTHROPIC_API_KEY',
  })

  // 2. DeepSeek — API key presence
  const hasDeepseekKey = !!(process.env.DEEPSEEK_API_KEY || config.deepseekApiKey)
  metrics.setModuleStatus({
    name: 'DeepSeek',
    connected: hasDeepseekKey,
    lastCheck: now,
    details: hasDeepseekKey ? 'API key configured' : 'No API key',
  })

  // 3. Hermes Sync — memory files exist
  const hermesDir = config.hermesMemoryDir || join(require('os').homedir(), '.hermes', 'memories')
  const hermesConnected = existsSync(join(hermesDir, 'USER.md'))
  metrics.setModuleStatus({
    name: 'Hermes Sync',
    connected: hermesConnected,
    lastCheck: now,
    details: hermesConnected ? `${hermesDir}/USER.md found` : 'Hermes not initialized — run hermes setup',
  })

  // 4. Graphify — graph report exists
  const graphifyPath = config.graphifyDir || join(cwd, 'graphify-out', 'GRAPH_REPORT.md')
  const graphifyOk = existsSync(graphifyPath)
  metrics.setModuleStatus({
    name: 'Graphify',
    connected: graphifyOk,
    lastCheck: now,
    details: graphifyOk ? `${graphifyPath.length} bytes` : 'Not built — run: yvon graph',
  })

  // 5. CodeGraph — codegraph report exists
  const codegraphPath = config.codegraphDir || join(cwd, 'graphify-out', 'CODEGRAPH_REPORT.md')
  const codegraphOk = existsSync(codegraphPath)
  metrics.setModuleStatus({
    name: 'CodeGraph',
    connected: codegraphOk,
    lastCheck: now,
    details: codegraphOk ? 'Report found' : 'Not built',
  })

  // 6. Code-Review-Graph (MCP) — pip package check
  try {
    const crgPath = execSync('which code-review-graph 2>/dev/null || echo ""', {
      encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe']
    }).trim()
    metrics.setModuleStatus({
      name: 'Code-Review-Graph',
      connected: !!crgPath,
      lastCheck: now,
      details: crgPath ? `Installed: ${crgPath}` : 'Not installed — built-in fallback active',
    })
  } catch {
    metrics.setModuleStatus({
      name: 'Code-Review-Graph',
      connected: false,
      lastCheck: now,
      details: 'Not installed — built-in fallback active',
    })
  }

  // 7. Supabase — env vars check
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  metrics.setModuleStatus({
    name: 'Supabase',
    connected: !!supabaseUrl,
    lastCheck: now,
    details: supabaseUrl ? `Connected: ${supabaseUrl}` : 'Not configured',
  })

  // 8. MCP Client — always available (local adapter)
  metrics.setModuleStatus({
    name: 'MCP Client',
    connected: true,
    lastCheck: now,
    details: 'Local adapter active',
  })

  // 9. TOON — always available (built-in)
  metrics.setModuleStatus({
    name: 'TOON Compression',
    connected: true,
    lastCheck: now,
    details: 'Built-in engine (dense, claude, api, js)',
  })

  // 10. CIE — always available (built-in)
  metrics.setModuleStatus({
    name: 'CIE Pipeline',
    connected: true,
    lastCheck: now,
    details: 'Built-in engine (classify → retrieve → rank → inject)',
  })
}
```

### Task 1.4: Hook TOON module to record metrics

**File:** Modify: `src/toon/toon.ts`

**Change:** After the existing `toon` export object, wrap each method to call `metrics.recordToonCall()`.

```typescript
// Add at the top of src/toon/toon.ts (after existing imports):
import { metrics } from '../metrics/collector'

// Replace the existing `export const toon = { ... }` block with this:
const _toonImpl = {
  dense(data: any[], schemaName?: string): string {
    // ... existing implementation unchanged ...
  },
  claude(data: any[], schemaName?: string): string {
    // ... existing implementation unchanged ...
  },
  api(data: any[], schemaName?: string): string {
    // ... existing implementation unchanged ...
  },
  js(data: any[], schemaName?: string): any[][] {
    // ... existing implementation unchanged ...
  },
  parse(input: string): any[] {
    // ... existing implementation unchanged ...
  },
}

function track(format: string, input: string, output: string, model = 'default'): void {
  if (!metrics.isEnabled()) return
  metrics.recordToonCall({
    timestamp: Date.now(),
    model,
    format: format as any,
    inputTokens: Math.ceil(input.length / 4),
    outputTokens: Math.ceil(output.length / 4),
    bytesBefore: input.length,
    bytesAfter: output.length,
    costSaved: Math.max(0, (input.length - output.length)) * 0.00000015,
  })
}

export const toon = {
  dense: (data: any[], schemaName?: string): string => {
    const raw = JSON.stringify(data)
    const result = _toonImpl.dense(data, schemaName)
    track('dense', raw, result)
    return result
  },
  claude: (data: any[], schemaName?: string): string => {
    const raw = JSON.stringify(data)
    const result = _toonImpl.claude(data, schemaName)
    track('claude', raw, result)
    return result
  },
  api: (data: any[], schemaName?: string): string => {
    const raw = JSON.stringify(data)
    const result = _toonImpl.api(data, schemaName)
    track('api', raw, result)
    return result
  },
  js: (data: any[], schemaName?: string): any[][] => {
    const raw = JSON.stringify(data)
    const result = _toonImpl.js(data, schemaName)
    track('js', raw, JSON.stringify(result))
    return result
  },
  parse: _toonImpl.parse,
}
```

### Task 1.5: Hook CIE pipeline to record ticks

**File:** Modify: `src/cie/index.ts`

**Change:** Record a `CiePipelineTick` at the end of `buildCieContext()`.

```typescript
// Add at the top of src/cie/index.ts (after existing imports):
import { metrics } from '../metrics/collector'

// Inside buildCieContext(), at the end (before the return statement), add:
export function buildCieContext(params: CieParams): CieContext {
  // ... existing implementation unchanged ...

  // ── Record metrics ──────────────────────────────────────────────────────
  if (metrics.isEnabled()) {
    metrics.recordCieTick({
      timestamp: Date.now(),
      taskType: taskType || 'unknown',
      taskLength: params.task.length,
      classified: 0, // zero-token classification
      retrieved: result?.items?.length || 0,
      injected: injectedCount,
      filtered: (result?.items?.length || 0) - injectedCount,
      latencyMs: Date.now() - t0,
      skipped: false,
    })
  }

  return context  // ... existing return ...
}
```

### Task 1.6: Wire agent activity from personality definitions

**File:** Create: `src/metrics/agent-tracker.ts`

```typescript
// src/metrics/agent-tracker.ts
// Initializes agent activities from personality definitions.

import { metrics } from './collector'
import { AGENT_PERSONALITIES } from '../agents/personalities'
import type { AgentActivity } from './types'

const DEPARTMENT_MAP: Record<string, string> = {
  'marcus-ceo': 'CEO',
  'diana-coo': 'COO',
  'dev-lead': 'Technical',
  'raj-backend': 'Technical',
  'mia-frontend': 'Technical',
  'quinn-qa': 'Technical',
  'kai-analyst': 'Marketing',
  'lena-brand': 'Marketing',
  'rio-ads': 'Marketing',
  'nate-growth': 'Marketing',
  'atlas-art-director': 'Marketing',
  'pixel-production': 'Marketing',
  'felix-finance': 'Finance',
}

export function initAgentActivities(): void {
  for (const personality of AGENT_PERSONALITIES) {
    const activity: AgentActivity = {
      agentId: personality.id,
      name: personality.name,
      department: DEPARTMENT_MAP[personality.id] || 'Unknown',
      status: 'idle',
      lastActivity: Date.now(),
      totalCalls: 0,
      tokensUsed: 0,
      memorySizeBytes: 0,
    }
    metrics.setAgentActivity(activity)
  }
}
```

### Task 1.7: Verify Phase 1

```bash
cd /root/yvon-engine
npx tsc --noEmit                    # must pass: 0 errors
node -e "
  const { metrics } = require('./dist/metrics/collector');
  metrics.enable();
  metrics.recordToonCall({ timestamp: Date.now(), model:'test', format:'dense', inputTokens:100, outputTokens:60, bytesBefore:400, bytesAfter:240, costSaved:0.000024 });
  console.log('Toon stats:', JSON.stringify(metrics.getToonStats(), null, 2));
  console.log('Phase 1 OK');
"
```

---

## Phase 2: Dashboard API Server (Express + WebSocket)

### Task 2.0: Install server dependencies

```bash
cd /root/yvon-engine
npm install --save express ws cors
npm install --save-dev @types/express @types/ws @types/cors
npm install --save better-sqlite3
npm install --save-dev @types/better-sqlite3
```

### Task 2.1: Create `src/metrics/store.ts` — SQLite persistence

**File:** Create: `src/metrics/store.ts`

```typescript
// src/metrics/store.ts
// SQLite persistence for historical metrics.
// Falls back to in-memory if better-sqlite3 unavailable.

import type { ToonCall, CiePipelineTick } from './types'

let db: any = null

function getDb() {
  if (db) return db
  try {
    const Database = require('better-sqlite3')
    const path = require('path')
    const dbPath = path.join(process.cwd(), '.yvon-metrics.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.exec(`
      CREATE TABLE IF NOT EXISTS toon_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        model TEXT NOT NULL,
        format TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        bytes_before INTEGER NOT NULL,
        bytes_after INTEGER NOT NULL,
        cost_saved REAL NOT NULL,
        agent_id TEXT
      );
      CREATE TABLE IF NOT EXISTS cie_ticks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        task_type TEXT NOT NULL,
        task_length INTEGER NOT NULL,
        classified INTEGER NOT NULL,
        retrieved INTEGER NOT NULL,
        injected INTEGER NOT NULL,
        filtered INTEGER NOT NULL,
        latency_ms INTEGER NOT NULL,
        skipped INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_toon_ts ON toon_calls(timestamp);
      CREATE INDEX IF NOT EXISTS idx_cie_ts ON cie_ticks(timestamp);
    `)
    return db
  } catch {
    return null // fallback: no persistence
  }
}

export function persistToonCall(call: ToonCall): void {
  const d = getDb()
  if (!d) return
  try {
    d.prepare(`INSERT INTO toon_calls (timestamp, model, format, input_tokens, output_tokens, bytes_before, bytes_after, cost_saved, agent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      call.timestamp, call.model, call.format, call.inputTokens, call.outputTokens,
      call.bytesBefore, call.bytesAfter, call.costSaved, call.agentId || null
    )
  } catch {}
}

export function persistCieTick(tick: CiePipelineTick): void {
  const d = getDb()
  if (!d) return
  try {
    d.prepare(`INSERT INTO cie_ticks (timestamp, task_type, task_length, classified, retrieved, injected, filtered, latency_ms, skipped)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      tick.timestamp, tick.taskType, tick.taskLength, tick.classified,
      tick.retrieved, tick.injected, tick.filtered, tick.latencyMs, tick.skipped ? 1 : 0
    )
  } catch {}
}

export function getHistoricalToonCalls(hours = 24): ToonCall[] {
  const d = getDb()
  if (!d) return []
  try {
    const cutoff = Date.now() - hours * 3600 * 1000
    return d.prepare(`SELECT * FROM toon_calls WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 1000`).all(cutoff)
  } catch { return [] }
}

export function getHistoricalCieTicks(hours = 24): CiePipelineTick[] {
  const d = getDb()
  if (!d) return []
  try {
    const cutoff = Date.now() - hours * 3600 * 1000
    const rows = d.prepare(`SELECT * FROM cie_ticks WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 1000`).all(cutoff)
    return rows.map((r: any) => ({ ...r, skipped: r.skipped === 1 }))
  } catch { return [] }
}
```

### Task 2.2: Create `src/dashboard/api.ts` — REST API routes

**File:** Create: `src/dashboard/api.ts`

```typescript
// src/dashboard/api.ts
// Express REST API routes for the dashboard.
// All endpoints return JSON.

import { Router, Request, Response } from 'express'
import { metrics } from '../metrics/collector'
import { runHealthChecks } from '../metrics/health-checks'
import { initAgentActivities } from '../metrics/agent-tracker'
import { getHistoricalToonCalls, getHistoricalCieTicks } from '../metrics/store'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const router = Router()

// ── Health ──────────────────────────────────────────────────────────────────

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    metricsEnabled: metrics.isEnabled(),
    uptime: process.uptime(),
    version: '1.3.0',
    timestamp: Date.now(),
  })
})

// ── TOON ────────────────────────────────────────────────────────────────────

router.get('/toon/stats', (_req: Request, res: Response) => {
  const stats = metrics.getToonStats()
  const historical = getHistoricalToonCalls(24)
  res.json({ ...stats, history24h: historical.slice(0, 100) })
})

router.get('/toon/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  res.json(metrics.getToonCalls(limit))
})

// ── CIE ─────────────────────────────────────────────────────────────────────

router.get('/cie/stats', (_req: Request, res: Response) => {
  const stats = metrics.getCieStats()
  const historical = getHistoricalCieTicks(24)
  res.json({ ...stats, history24h: historical.slice(0, 100) })
})

router.get('/cie/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100
  res.json(metrics.getCieTicks(limit))
})

// ── Modules ─────────────────────────────────────────────────────────────────

router.post('/modules/recheck', (_req: Request, res: Response) => {
  runHealthChecks()
  res.json({ ok: true })
})

router.get('/modules', (_req: Request, res: Response) => {
  runHealthChecks()
  res.json(metrics.getModuleStatuses())
})

// ── Agents ──────────────────────────────────────────────────────────────────

router.get('/agents', (_req: Request, res: Response) => {
  const activities = metrics.getAllAgentActivities()
  if (activities.length === 0) {
    initAgentActivities()
  }
  res.json(metrics.getAllAgentActivities())
})

// ── Cost ────────────────────────────────────────────────────────────────────

router.get('/cost', (_req: Request, res: Response) => {
  const summary = metrics.getCostSummary()
  res.json(summary)
})

// ── Graph ───────────────────────────────────────────────────────────────────

router.get('/graph', (_req: Request, res: Response) => {
  // Try to load actual codegraph data from file
  const graphPath = join(process.cwd(), 'graphify-out', 'CODEGRAPH_REPORT.md')
  let graphData = { nodes: [], edges: [] }
  if (existsSync(graphPath)) {
    try {
      // Parse the codegraph report for import relationships
      const content = readFileSync(graphPath, 'utf-8')
      const lines = content.split('\n')
      const nodes = new Set<string>()
      const edges: { source: string; target: string; weight: number }[] = []
      for (const line of lines) {
        const match = line.match(/^-\s+`([^`]+)`\s+→/)
        if (match) {
          const source = match[1]
          const deps = line.match(/`([^`]+)`/g)?.slice(1).map(d => d.replace(/`/g, '')) || []
          nodes.add(source)
          for (const dep of deps) {
            nodes.add(dep)
            edges.push({ source, target: dep, weight: 1 })
          }
        }
      }
      graphData = {
        nodes: [...nodes].map(id => ({ id, label: id.split('/').pop() || id })),
        edges,
      }
    } catch {}
  }
  res.json(graphData)
})

export default router
```

### Task 2.3: Create `src/dashboard/ws.ts` — WebSocket live push

**File:** Create: `src/dashboard/ws.ts`

```typescript
// src/dashboard/ws.ts
// WebSocket server for live dashboard updates.
// Pushes full stats snapshot every 5 seconds to all connected clients.

import { Server as WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { metrics } from '../metrics/collector'
import { runHealthChecks } from '../metrics/health-checks'

let wss: WebSocketServer | null = null
let interval: NodeJS.Timeout | null = null

export function attachWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/api/live' })

  wss.on('connection', (ws: WebSocket) => {
    console.log('  Dashboard client connected')

    // Send initial state immediately
    sendStats(ws)

    ws.on('close', () => {
      console.log('  Dashboard client disconnected')
    })
  })

  // Push stats every 5 seconds
  interval = setInterval(() => {
    if (!wss) return
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        sendStats(client)
      }
    })
  }, 5000)

  console.log('  WebSocket ready on /api/live')
}

function sendStats(ws: WebSocket): void {
  runHealthChecks()
  const payload = JSON.stringify({
    type: 'stats',
    timestamp: Date.now(),
    toon: metrics.getToonStats(),
    cie: metrics.getCieStats(),
    cost: metrics.getCostSummary(),
    modules: metrics.getModuleStatuses(),
    agents: metrics.getAllAgentActivities(),
  })
  ws.send(payload)
}

export function stopWebSocket(): void {
  if (interval) clearInterval(interval)
  if (wss) wss.close()
}
```

### Task 2.4: Rewrite `src/dashboard/index.ts` — Express + WebSocket + React SPA

**File:** Modify: `src/dashboard/index.ts`

Rewrite the entire file (~732 lines → ~80 lines):

```typescript
// src/dashboard/index.ts
// Dashboard v2 — Express server with REST API, WebSocket, and React SPA.
// Replaces the old inlined HTML dashboard.

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { join } from 'path'
import { metrics } from '../metrics/collector'
import { runHealthChecks } from '../metrics/health-checks'
import { initAgentActivities } from '../metrics/agent-tracker'
import apiRoutes from './api'
import { attachWebSocket, stopWebSocket } from './ws'

const DEFAULT_PORT = 4200

export function startDashboard(port: number = DEFAULT_PORT): void {
  // ── Enable metrics collection ─────────────────────────────────────────────
  metrics.enable()
  initAgentActivities()
  runHealthChecks()

  const app = express()
  app.use(cors())

  // ── API routes ────────────────────────────────────────────────────────────
  app.use('/api', apiRoutes)

  // ── Serve React SPA (built static files) ──────────────────────────────────
  const uiDist = join(__dirname, 'ui', 'dist')
  app.use(express.static(uiDist))
  app.get('*', (_req, res) => {
    res.sendFile(join(uiDist, 'index.html'))
  })

  // ── Start server ──────────────────────────────────────────────────────────
  const server = createServer(app)
  attachWebSocket(server)

  server.listen(port, () => {
    console.log(`\n  ⚡ YVON Dashboard v2 — http://localhost:${port}`)
    console.log(`  📊 API: http://localhost:${port}/api/health`)
    console.log(`  🔌 Live: ws://localhost:${port}/api/live\n`)
  })
}

export function stopDashboard(): void {
  stopWebSocket()
  metrics.disable()
}
```

### Task 2.5: Update engine's main export to include dashboard v2 functions

**File:** Modify: `src/index.ts`

Add: `export { startDashboard, stopDashboard } from './dashboard'`

### Task 2.6: Verify Phase 2

```bash
cd /root/yvon-engine
npx tsc --noEmit      # must pass: 0 errors
npm run build          # must succeed
node -e "
  const { startDashboard } = require('./dist/dashboard');
  startDashboard(4201);
  setTimeout(() => process.exit(0), 3000);
" &
sleep 2
curl -s http://localhost:4201/api/health | head -c 100
echo ""
curl -s http://localhost:4201/api/modules | head -c 200
kill %1 2>/dev/null
```

---

## Phase 3: React Frontend (Vite SPA)

### Task 3.0: Create Vite + React + Tailwind setup

```bash
cd /root/yvon-engine
mkdir -p src/dashboard/ui
cd src/dashboard/ui
npm init -y
npm install react react-dom recharts d3 @types/d3
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**File:** Create: `src/dashboard/ui/tailwind.config.js`
```js
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#0a0e17',
        'bg-card': 'rgba(255,255,255,0.04)',
        'glass-border': 'rgba(255,255,255,0.08)',
        'accent-cyan': '#00d4ff',
        'accent-purple': '#a78bfa',
        'accent-green': '#34d399',
        'accent-orange': '#f59e0b',
        'accent-red': '#f87171',
        'text-primary': '#e4e8f0',
        'text-secondary': '#8892a8',
      },
    },
  },
}
```

**File:** Create: `src/dashboard/ui/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: { port: 5173, proxy: { '/api': 'http://localhost:4200' } },
})
```

**File:** Create: `src/dashboard/ui/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YVON Dashboard v2</title>
</head>
<body class="bg-[#0a0e17] text-[#e4e8f0]">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

**File:** Create: `src/dashboard/ui/src/main.tsx`
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

**File:** Create: `src/dashboard/ui/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: #0a0e17;
  color: #e4e8f0;
  margin: 0;
}

/* Glass card base */
.glass-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
```

### Task 3.2: Create `App.tsx` — Main layout

**File:** Create: `src/dashboard/ui/src/App.tsx`

```tsx
import { useState, useEffect, useCallback } from 'react'
import ConnectionGrid from './panels/ConnectionGrid'
import ToonMetrics from './panels/ToonMetrics'
import CostTracking from './panels/CostTracking'
import CiePipeline from './panels/CiePipeline'
import AgentActivity from './panels/AgentActivity'
import KnowledgeGraph from './panels/KnowledgeGraph'

interface DashboardData {
  toon: any
  cie: any
  cost: any
  modules: any[]
  agents: any[]
  timestamp: number
}

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [connected, setConnected] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // ── WebSocket connection ──────────────────────────────────────────────────
  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${location.host}/api/live`)

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'stats') setData(msg)
      } catch {}
    }

    return () => ws.close()
  }, [])

  // ── Fetch initial data if WebSocket not connected ─────────────────────────
  useEffect(() => {
    if (data) return
    fetch('/api/health').then(r => r.json()).catch(() => {})
    fetch('/api/modules').then(r => r.json()).then(m => setData(prev => prev ? { ...prev, modules: m } : { toon: {}, cie: {}, cost: {}, modules: m, agents: [], timestamp: Date.now() })).catch(() => {})
  }, [data])

  const tabs = ['all', 'connections', 'toon', 'cost', 'cie', 'agents', 'graph']

  return (
    <div className="min-h-screen p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">⚡ YVON Dashboard</h1>
          <p className="text-sm text-[#8892a8]">Engine v1.3.0</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#34d399]' : 'bg-[#f87171]'}`} />
          <span className="text-sm text-[#8892a8]">{connected ? 'Live' : 'Polling'}</span>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-white/10 text-white'
                : 'text-[#8892a8] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'all' ? 'All Panels' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="space-y-6">
        {(activeTab === 'all' || activeTab === 'connections') && (
          <ConnectionGrid modules={data?.modules || []} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(activeTab === 'all' || activeTab === 'toon') && (
            <ToonMetrics toon={data?.toon} />
          )}
          {(activeTab === 'all' || activeTab === 'cost') && (
            <CostTracking cost={data?.cost} />
          )}
          {(activeTab === 'all' || activeTab === 'cie') && (
            <CiePipeline cie={data?.cie} />
          )}
        </div>

        {(activeTab === 'all' || activeTab === 'agents') && (
          <AgentActivity agents={data?.agents || []} />
        )}

        {(activeTab === 'all' || activeTab === 'graph') && (
          <KnowledgeGraph />
        )}
      </div>
    </div>
  )
}
```

### Task 3.3: Create `ConnectionGrid.tsx`

**File:** Create: `src/dashboard/ui/src/panels/ConnectionGrid.tsx`

```tsx
import { useState } from 'react'

interface Module { name: string; connected: boolean; lastCheck: number; details: string; latencyMs?: number }

export default function ConnectionGrid({ modules }: { modules: Module[] }) {
  const [rechecking, setRechecking] = useState(false)

  async function recheck() {
    setRechecking(true)
    await fetch('/api/modules/recheck', { method: 'POST' })
    setTimeout(() => setRechecking(false), 1000)
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">🔌 Connections</h2>
        <button
          onClick={recheck}
          disabled={rechecking}
          className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
        >
          {rechecking ? 'Checking...' : 'Re-check All'}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {modules.map((m, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition cursor-pointer group">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${m.connected ? 'bg-[#34d399]' : m.details.includes('fallback') ? 'bg-[#f59e0b]' : 'bg-[#f87171]'}`} />
              <span className="text-sm font-medium truncate">{m.name}</span>
            </div>
            <p className="text-xs text-[#5a6478] group-hover:text-[#8892a8] transition truncate">
              {m.details}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Task 3.4: Create `ToonMetrics.tsx`

**File:** Create: `src/dashboard/ui/src/panels/ToonMetrics.tsx`

```tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function ToonMetrics({ toon }: { toon?: any }) {
  if (!toon || toon.total === 0) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-64">
        <p className="text-[#5a6478]">No TOON calls yet. Compress some data to see metrics.</p>
      </div>
    )
  }

  const gaugeAngle = (toon.avgSavingsPercent / 100) * 270 - 135

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mb-4">📊 TOON Compression</h2>

      {/* Gauge */}
      <div className="flex items-center justify-center mb-4">
        <svg width="140" height="80" viewBox="0 0 140 80">
          <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="#00d4ff" strokeWidth="12"
            strokeDasharray={`${(toon.avgSavingsPercent / 100) * 173} 173`} strokeLinecap="round" />
          <text x="70" y="55" textAnchor="middle" fill="#e4e8f0" fontSize="20" fontWeight="bold">
            {toon.avgSavingsPercent}%
          </text>
          <text x="70" y="72" textAnchor="middle" fill="#5a6478" fontSize="10">avg savings</text>
        </svg>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold">{toon.total.toLocaleString()}</div>
          <div className="text-xs text-[#5a6478]">Calls</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{(toon.totalBytesSaved / 1024).toFixed(1)} KB</div>
          <div className="text-xs text-[#5a6478]">Saved</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-[#34d399]">${toon.totalCostSaved.toFixed(4)}</div>
          <div className="text-xs text-[#5a6478]">Saved $</div>
        </div>
      </div>

      {/* Model breakdown */}
      {Object.keys(toon.byModel).length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[#5a6478] border-b border-white/5">
              <th className="text-left py-1">Model</th>
              <th className="text-right py-1">Calls</th>
              <th className="text-right py-1">Saved</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(toon.byModel).map(([model, data]: [string, any]) => (
              <tr key={model} className="border-b border-white/[0.03]">
                <td className="py-1">{model}</td>
                <td className="text-right">{data.calls}</td>
                <td className="text-right text-[#34d399]">${data.costSaved.toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

### Task 3.5: Create `CostTracking.tsx`

**File:** Create: `src/dashboard/ui/src/panels/CostTracking.tsx`

```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const COLORS = ['#00d4ff', '#a78bfa', '#34d399', '#f59e0b', '#f87171', '#f472b6']

export default function CostTracking({ cost }: { cost?: any }) {
  if (!cost || Object.keys(cost.byModel || {}).length === 0) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-64">
        <p className="text-[#5a6478]">No cost data yet.</p>
      </div>
    )
  }

  const pieData = Object.entries(cost.byModel).map(([name, d]: [string, any]) => ({
    name,
    value: Math.round(d.cost * 10000) / 10000,
  }))

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mb-4">💰 Cost Tracking</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-[#5a6478]">Total Spent</div>
          <div className="text-xl font-bold text-[#f87171]">${cost.totalSpent.toFixed(4)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-[#5a6478]">Total Saved</div>
          <div className="text-xl font-bold text-[#34d399]">${cost.totalSaved.toFixed(4)}</div>
        </div>
      </div>

      {/* Pie chart */}
      <div className="h-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#151a24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {pieData.map((d, i) => (
          <div key={i} className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-[#8892a8]">{d.name}: ${d.value.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Task 3.6: Create `CiePipeline.tsx`

**File:** Create: `src/dashboard/ui/src/panels/CiePipeline.tsx`

```tsx
export default function CiePipeline({ cie }: { cie?: any }) {
  if (!cie || cie.totalTicks === 0) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-64">
        <p className="text-[#5a6478]">No CIE pipeline data yet.</p>
      </div>
    )
  }

  const stages = [
    { label: 'Classified', value: cie.totalTicks, color: 'bg-[#a78bfa]' },
    { label: 'Retrieved', value: cie.totalRetrieved, color: 'bg-[#00d4ff]' },
    { label: 'Injected', value: cie.totalInjected, color: 'bg-[#34d399]' },
    { label: 'Filtered', value: cie.totalFiltered, color: 'bg-[#f59e0b]' },
  ]

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mb-4">⚙️ CIE Pipeline</h2>

      {/* Flow */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-center min-w-[80px]">
              <div className={`w-2 h-2 rounded-full ${s.color} mx-auto mb-1`} />
              <div className="text-lg font-bold">{s.value.toLocaleString()}</div>
              <div className="text-xs text-[#5a6478]">{s.label}</div>
            </div>
            {i < stages.length - 1 && <span className="text-[#5a6478]">→</span>}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-sm font-bold">{cie.avgLatencyMs}ms</div>
          <div className="text-xs text-[#5a6478]">Avg Latency</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold">{cie.totalTicks}</div>
          <div className="text-xs text-[#5a6478]">Total Runs</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold">{cie.skipRate}%</div>
          <div className="text-xs text-[#5a6478]">Skip Rate</div>
        </div>
      </div>
    </div>
  )
}
```

### Task 3.7: Create `AgentActivity.tsx`

**File:** Create: `src/dashboard/ui/src/panels/AgentActivity.tsx`

```tsx
import { useState } from 'react'

interface Agent {
  agentId: string; name: string; department: string
  status: string; lastActivity: number; totalCalls: number
  tokensUsed: number; memorySizeBytes: number
}

const DEPT_COLORS: Record<string, string> = {
  CEO: 'border-[#f59e0b]',
  COO: 'border-[#f59e0b]',
  Technical: 'border-[#00d4ff]',
  Marketing: 'border-[#a78bfa]',
  Finance: 'border-[#34d399]',
}

export default function AgentActivity({ agents }: { agents: Agent[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (agents.length === 0) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-32">
        <p className="text-[#5a6478]">No agent data yet.</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mb-4">👥 Agents ({agents.length})</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {agents.map(agent => (
          <div
            key={agent.agentId}
            onClick={() => setExpanded(expanded === agent.agentId ? null : agent.agentId)}
            className={`p-3 rounded-xl bg-white/[0.03] border ${DEPT_COLORS[agent.department] || 'border-white/[0.06]'} hover:bg-white/[0.06] transition cursor-pointer`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${
                agent.status === 'online' ? 'bg-[#34d399]' :
                agent.status === 'idle' ? 'bg-[#f59e0b]' : 'bg-[#f87171]'
              }`} />
              <span className="text-sm font-medium truncate">{agent.name}</span>
            </div>
            <div className="text-xs text-[#5a6478]">
              <div>{agent.department}</div>
              <div>{agent.totalCalls.toLocaleString()} calls</div>
              <div>{Math.round(agent.tokensUsed / 1000)}K tokens</div>
            </div>

            {/* Expanded details */}
            {expanded === agent.agentId && (
              <div className="mt-2 pt-2 border-t border-white/[0.06] text-xs space-y-1 text-[#8892a8]">
                <div>Memory: {(agent.memorySizeBytes / 1024).toFixed(1)} KB</div>
                <div>Last active: {new Date(agent.lastActivity).toLocaleTimeString()}</div>
                <div>Agent ID: {agent.agentId}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Task 3.8: Create `KnowledgeGraph.tsx`

**File:** Create: `src/dashboard/ui/src/panels/KnowledgeGraph.tsx`

```tsx
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [search, setSearch] = useState('')
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/graph')
      .then(r => r.json())
      .then(data => {
        setNodes(data.nodes || [])
        setEdges(data.edges || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = 400

    const filtered = search
      ? nodes.filter(n => n.id.toLowerCase().includes(search.toLowerCase()))
      : nodes

    const filteredEdges = edges.filter(e =>
      filtered.some(n => n.id === e.source || n.id === e.target)
    )

    const simulation = d3.forceSimulation(filtered)
      .force('link', d3.forceLink(filteredEdges).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))

    const g = svg.append('g')

    const link = g.append('g').selectAll('line')
      .data(filteredEdges)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', 1)

    const node = g.append('g').selectAll('circle')
      .data(filtered)
      .join('circle')
      .attr('r', 6)
      .attr('fill', '#00d4ff')
      .attr('opacity', 0.8)
      .call(d3.drag<any, any>()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )

    const label = g.append('g').selectAll('text')
      .data(filtered)
      .join('text')
      .text((d: any) => d.label || d.id.split('/').pop())
      .attr('font-size', '9')
      .attr('fill', '#8892a8')
      .attr('dx', 8)
      .attr('dy', 3)

    simulation.on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y)
      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y)
    })

    return () => { simulation.stop() }
  }, [nodes, edges, search])

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold mb-4">🔗 Knowledge Graph</h2>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-[#e4e8f0] placeholder-[#5a6478] focus:outline-none focus:border-[#00d4ff]"
        />
      </div>
      <svg ref={svgRef} className="w-full h-[400px] rounded-lg bg-white/[0.02]" />
      {nodes.length === 0 && (
        <div className="flex items-center justify-center h-[400px] text-[#5a6478]">
          No graph data. Build codegraph first: npx yvon graph
        </div>
      )}
    </div>
  )
}
```

### Task 3.9: Add build script for dashboard UI

**File:** Modify: `package.json` (engine root)

Add to scripts:
```json
"build:dashboard": "cd src/dashboard/ui && npm install && npx vite build"
```

Update `prepublishOnly`:
```json
"prepublishOnly": "npm run build && npm run build:dashboard"
```

### Task 3.10: Verify Phase 3

```bash
cd /root/yvon-engine
npm run build:dashboard     # builds React SPA
npx tsc --noEmit            # 0 errors
node -e "const { startDashboard } = require('./dist/dashboard'); startDashboard(4202);" &
sleep 2
curl -s http://localhost:4202/ | grep -o "<title>.*</title>"
kill %1
```

Expected: `<title>YVON Dashboard v2</title>`

---

## Verification (End-to-End)

```bash
# 1. Build everything
cd /root/yvon-engine
npm run build
npm run build:dashboard
npx tsc --noEmit                # 0 errors

# 2. Start dashboard
npx yvon dashboard              # or: node -e "require('./dist/dashboard').startDashboard()"

# 3. Test API endpoints
curl http://localhost:4200/api/health
curl http://localhost:4200/api/modules
curl http://localhost:4200/api/toon/stats
curl http://localhost:4200/api/cost
curl http://localhost:4200/api/agents
curl http://localhost:4200/api/graph

# 4. Open browser
open http://localhost:4200
```

---

## File Map (Final State)

```
src/
├── metrics/
│   ├── types.ts           ← Task 1.1
│   ├── collector.ts       ← Task 1.2
│   ├── health-checks.ts   ← Task 1.3
│   ├── agent-tracker.ts   ← Task 1.6
│   └── store.ts           ← Task 2.1 (SQLite)
├── dashboard/
│   ├── index.ts           ← Task 2.4 (Express server)
│   ├── api.ts             ← Task 2.2 (REST routes)
│   ├── ws.ts              ← Task 2.3 (WebSocket)
│   └── ui/
│       ├── index.html      ← Task 3.1
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── src/
│           ├── main.tsx
│           ├── App.tsx     ← Task 3.2 (layout + tabs)
│           ├── index.css
│           └── panels/
│               ├── ConnectionGrid.tsx  ← Task 3.3
│               ├── ToonMetrics.tsx     ← Task 3.4
│               ├── CostTracking.tsx    ← Task 3.5
│               ├── CiePipeline.tsx     ← Task 3.6
│               ├── AgentActivity.tsx   ← Task 3.7
│               └── KnowledgeGraph.tsx  ← Task 3.8
├── toon/
│   └── toon.ts            ← Task 1.4 (metrics hooks)
└── cie/
    └── index.ts           ← Task 1.5 (metrics hooks)
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `better-sqlite3` compile fails | `store.ts` catches and falls back to no persistence |
| Vite build fails in CI | Separate `build:dashboard` script, fails gracefully |
| WebSocket fails behind proxy | Falls back to HTTP polling automatically in App.tsx |
| Charts empty (no data) | All panels show "No data yet" placeholder |
| D3 graph too large | Search/filter limits visible nodes |
| Memory leak (10K entries) | Oldest entries auto-purged; SQLite stores long-term |

---

**Ready to execute.** Start with Phase 1 — 7 bite-sized tasks, all backend, 0 visual changes. Want me to begin?
