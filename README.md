# ToonGine v1.5.5 — V4 Graph Bridge Active

**AI Agent OS Kernel — One `npm install`. 24 agents, TOON compressor (99.97% savings), knowledge graphs, Hermes MCP bridge.**

[![npm](https://img.shields.io/badge/npm-toongine-blue)](https://www.npmjs.com/package/toongine)
[![node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)
[![repo](https://img.shields.io/badge/github-OfficialNovizio%2FToonGine-black)](https://github.com/OfficialNovizio/ToonGine)
[![compression](https://img.shields.io/badge/compression-99.97%25-brightgreen)]()
[![mcp](https://img.shields.io/badge/MCP-5%20tools-blue)]()

---

## Quick Install

```bash
npm install toongine         # install as dependency
npx toongine init             # ONE command — installs tools, builds graph, starts watchers
npx toongine doctor           # health check — all systems
npx toongine agents           # list all 24 agents
npx toongine dashboard        # live dashboard → localhost:4200
```

## What Ships — One `npm install`

```bash
npm install toongine
       │
       ▼  postinstall.js + npx toongine init auto-deploys:
       │
       ├── .toon/agents/                  24 agents · 918 files
       ├── .toon/graph/unified.db          unified knowledge graph (4,708 nodes, 12,004 edges)
       ├── .toon/graphify/ + .toon/codegraph/  per-tool graph outputs
       ├── .toon/hermes/mcp-server.py      MCP stdio server (5 graph tools for Hermes)
       ├── .toon/docs/                    CONSTITUTION.toon + ENGINE.toon
       ├── docs/                          human-readable CONSTITUTION + ENGINE
       └── ~/.hermes/.../yvon/            Hermes skill files (auto-generated, graph tools injected)
```

---

## Features

### 🧠 TOON Compiler — V4 Graph Bridge (99.97% token savings)
5-phase deterministic pipeline — dictionary + BPE + delta + stratified + graph context injection. No ML, offline-capable.

```bash
npx toongine compile             # compile all .md → .toon
npx toongine compile --file x   # compile single file
npx toongine watch               # auto-compile on file changes
npx toongine stats               # compression stats
```

```typescript
import { compileFile, compileAll } from 'toongine/toon'
const result = compileFile('.toon/agents/CEO/marcus/MEMORY.md', projectRoot)
// → { sourcePath, destPath, sourceSize, compressedSize, savingsPercent, sections }
```

#### V4 Stratified Context Engine
Agents get 3-layer context delivery instead of full dumps:
- **Layer 1** — Stat header (~30 tokens): graph health, node/edge counts, language breakdown
- **Layer 2** — Top-N relevant (~50 tokens): department-filtered, most-connected symbols
- **Layer 3** — Delta refs (~10 tokens): everything else expandable via graph tools on-demand

#### V4 Graph Intelligence Bridge (NEW)
Unified knowledge graph from 3 tools → single `unified.db`. 4,708 nodes, 12,004 edges, 479 files.

```typescript
import { createUnifiedGraph, V4Engine, HermesGraphGateway } from 'toongine/toon/v4'

const unified = createUnifiedGraph(projectRoot)
// → SQLite database with FTS5 full-text search

const engine = new V4Engine({ projectRoot })
engine.initGraph()
const ctx = engine.buildContext({ agentId: 'marcus-ceo', agentDept: 'CEO', agentLevel: 1 })
// → { agentData: '...', graphContext: '...', totalTokens: 29, toolsAvailable: ['code-review-graph', 'graphify'] }

const gateway = new HermesGraphGateway(projectRoot)
gateway.init()
gateway.handleToolCall('toon_graph_search', { query: 'auth flow' })
// → returns matching symbols from unified.db
```

#### Hermes MCP Gateway — 5 Graph Tools (NEW)
Every agent gets 5 runtime graph tools via Hermes MCP. Auto-registered on `npx toongine init`.

| Tool | Purpose | Example |
|---|---|---|
| `toon_graph_explore` | Natural-language code exploration | "auth flow", "database schema" |
| `toon_graph_callers` | Find callers of a symbol | Who calls `getSession()`? |
| `toon_graph_impact` | Blast-radius analysis | What breaks if we change X? |
| `toon_graph_search` | Full-text search across all nodes | "supabase", "rate-limit" |
| `toon_graph_status` | Graph health snapshot | Nodes, edges, staleness, languages |

### 👥 24-Agent System (UPGRADED from 13)
Manifest-based with level-gating (L1 command / L2 intelligence / L3 execution), council roles, tool allowlists.

| Department | Agents | Level |
|---|---|---|
| **Command** | Board | L1 |
| **CEO** | Marcus | L1 — orchestrator |
| **COO** | Diana | L1 — operations |
| **Finance** | Felix | L2 — financial intel |
| **Psychology** | Kahneman | L2 — bias audit |
| **Legal** | Docs, Comply, Guard | L2–L3 |
| **Research** | Vette, Depth, Synth | L3 |
| **Sense** | Scout, Radar, Forge | L3 |
| **Marketing** | Kai, Lena, Rio, Nate, Atlas, Pixel | L2–L3 |
| **Technical** | Dev, Mia, Raj, Quinn | L2–L3 |

```bash
npx toongine agents              # list all 24 agents with status
npx toongine agents --verify     # validate all manifest.toon files
```

```typescript
import { loadRegistry, getAgent, getCouncilMembers } from 'toongine/agents'
const registry = loadRegistry(projectRoot)        // 24 agents
const marcus = getAgent('marcus-ceo', registry)   // CEO lookup
const council = getCouncilMembers(registry)        // 8 council seats
```

### 📜 CONSTITUTION + ENGINE (NEW)
10 immutable laws. Injected as Layer 1 context into every agent spawn.

- `CONSTITUTION.toon` — operational laws, escalation rules, no-delete rule
- `ENGINE.toon` — architecture reference, TOON pipeline, resolver spec

### 🔍 CIE — Context Intelligence Engine
Auto-classifies tasks, retrieves relevant context, ranks by relevance, injects into LLM calls.

```typescript
import { buildCieContext } from 'toongine/cie'

const cie = buildCieContext({
  agentId: 'dev-lead',
  task: 'fix the login bug',
  venture: 'my-project',
})
// cie.systemExtension → prose rules for system prompt
// cie.dataBlock → TOON-formatted structural data
```

### 🗺️ Knowledge Graphs → V4 Unified Bridge

```bash
npx toongine graph                # rebuild graphify + codegraph → .toon/graphs/
npx toongine init                 # build unified.db + deploy MCP server + start watchers
```

- **graphify** — codebase community detection (function clusters, cohesion scores)
- **codegraph** — dependency analysis (hub files, fan-out, blast radius, API deps)
- **V4 unified bridge** — merges all 3 tools into single `unified.db` (4,708 nodes, 12,004 edges, 479 files) with FTS5 full-text search, accessible via 5 MCP tools

### 📊 V4 Performance

| Metric | Before (V3) | After (V4) |
|---|---|---|
| Injected context | 4.5 MB (1,125,000 tokens) | ~977 tokens (3.9 KB) |
| Compression ratio | 78.7% | **99.97%** |
| Graph data queryable | 0 MB | **14.6 MB** |
| Tools bridged | 0 of 3 | **2 of 3** (codegraph pending install) |
| MCP tools for agents | 0 | **5** |
| Manual commands | 2 | **0** (auto-sync) |
| Fresh install steps | 3+ | **1** (`npx toongine init`)

### 🔄 TOON v3/v4 Compression — Migration + Sync

V3 handles the compression pipeline (dictionary, BPE, delta). V4 adds the graph intelligence bridge and MCP gateway on top.

```bash
# V3: Migration (safe, with rollback)
npx toongine absorb --dry-run     # preview migration
npx toongine absorb               # migrate originals → .toon/ (safe, rollback)
npx toongine rollback             # list available snapshots
npx toongine rollback <ts>        # restore specific snapshot

# V3: Sync (keep originals + .toon/ in sync)
npx toongine sync --once          # one-time originals → .toon/
npx toongine sync --watch         # auto-sync every 30s

# V4: Graph Bridge (one command)
npx toongine init                 # build unified.db + deploy MCP server + start watchers
npx toongine graph                # rebuild per-tool graphs → .toon/graphs/
npx toongine clean                # remove stale duplicates + reindex engine.bin
```

### 🧪 Self-Healing
```bash
npx toongine doctor               # full health check
```
- Circuit breakers, auto-rebuild, health monitoring
- Failure telemetry (v4 stratify engine)

### 🎛️ Dashboard
```bash
npx toongine dashboard             # start on port 4200
npx toongine dashboard --hide      # hide from settings
npx toongine dashboard --show      # show in settings
npx toongine dashboard --status    # check status
```

### 🔌 Hermes Agent — MCP Graph Bridge + VPS Memory

ToonGine agents connect to **Hermes Agent** (by Nous Research) via two channels:

1. **MCP stdio** — 5 graph tools auto-registered (`toon_graph_*`). Agents query the unified knowledge graph at runtime.
2. **VPS memory sync** — persistent USER identity, cross-session skills, and project standards synced via SSH.

#### Full Setup — Install → MCP → Agents Connected

```bash
# Step 1: Install ToonGine
npm install toongine

# Step 2: Activate V4 (builds unified.db, deploys MCP server, starts watchers)
npx toongine init

# Step 3: Register MCP server with Hermes (one time)
hermes mcp add toongine-graph --command python3 \
  --args /path/to/project/.toon/hermes/mcp-server.py \
  --args /path/to/project

# Step 4: Save your VPS for memory sync (one time — IP stays in gitignored config)
npx toongine hermes save-remote root@YOUR_VPS_IP

# Step 5: Connect memory sync (pulls Hermes memories, skills, sessions via SSH)
npx toongine hermes connect

# Step 6: Verify all systems
npx toongine doctor
# Expected: 11/11 operational · 🔗 Hermes: 🔗 Connected · Agent Memory: 24 agents
# Also run: hermes mcp test toongine-graph → ✓ Connected · 5 tools discovered
```

#### After Setup — What Agents Get

Every agent session now has:
- **5 graph tools** via MCP — explore code, find callers, analyze impact, full-text search, graph health
- **Identity + preferences** via VPS memory — USER.md injected into every session
- **85+ skills** via VPS sync — indexed in engine.bin, matched by task type
- **Session history** via VPS — CIE retrieves relevant past decisions

#### Complete Uninstall → Reinstall with Hermes Activation

```bash
# 1. Wipe everything ToonGine-related
rm -rf node_modules/toongine
rm -rf .toon/graph .toon/graphify .toon/codegraph
rm -f toongine.config.json

# 2. Keep your Hermes VPS config (gitignored, safe)
#    .toon/hermes/config.json — your remote IP lives here, never delete this
#    .toon/agents/            — agent memory source of truth, keep this too

# 3. Reinstall fresh
npm install toongine

# 4. Activate V4 (replaces integrate)
npx toongine init

# 5. Reconnect Hermes MCP + memory sync
npx toongine hermes connect

# 6. Rebuild everything (init does this automatically)
npx toongine init && npx toongine compile --force

# 7. Verify all systems
npx toongine doctor
# Expected: 11/11 operational · 🔗 Hermes: 🔗 Connected · Agent Memory: 24 agents
```

#### What Hermes Provides (when connected)

| Context | Source | Injected via |
|---|---|---|
| **5 graph tools** | `toongine-graph` MCP server | Auto-registered at Hermes startup (toon_graph_*) |
| **USER identity** | `~/.hermes/memories/USER.md` | Always injected (name, role, GitHub, preferences) |
| **Project standards** | `~/.hermes/memories/MEMORY.md` | Keyword-matched per task |
| **85+ skills** | `~/.hermes/skills/` | Indexed in engine.bin, matched by task type |
| **Session history** | `~/.hermes/sessions/` | CIE retrieves relevant past decisions |

```typescript
// Programmatic access
import { generateHermesSkills } from 'toongine/agents'
generateHermesSkills(projectRoot)  // auto-generate skill files for all 24 agents

import { syncWithHermes } from 'toongine/adapters'
const ctx = syncWithHermes()       // bidirectional CRDT memory sync
```

#### Hermes CLI Reference

```bash
toongine hermes status             # connection status
toongine hermes detect             # scan for local/remote Hermes
toongine hermes detect --remote host  # scan remote VPS
toongine hermes save-remote user@host  # save VPS IP (gitignored)
toongine hermes connect            # connect (auto-uses saved remote)
toongine hermes connect --remote user@host  # connect to specific VPS
toongine hermes disconnect         # disconnect
```

> **🔒 Security:** `save-remote` stores your VPS IP in `.toon/hermes/config.json` — a gitignored file that never leaves your machine. Connection uses SSH with exponential backoff (max 3 retries) to prevent brute-force lockouts.

---

## Package Info

```bash
npm info toongine version           # 1.5.5
npm info toongine dependencies      # better-sqlite3, cors, express, ws
npm info toongine engines           # node >= 18.0.0
npm info toongine keywords          # ai, agent, llm, context, compression, toon, mcp, graph
npm ls toongine --depth=0           # check installed version
```

```
Name        : toongine
Version     : 1.5.5
Description : TOON compression engine — 99.97% token savings with V4 graph bridge + Hermes MCP
Main        : dist/index.js
Size        : ~21 MB (918 agent templates + 75 source modules + MCP server)
License     : MIT
Repo        : github.com/OfficialNovizio/ToonGine
```

## CLI Reference (27 commands)

```bash
# Setup
toongine init                    # V4 activation — builds unified.db + deploys MCP server + starts watchers
toongine integrate               # wire into existing project (non-destructive, pre-V4)
toongine doctor                  # health check — all systems including Hermes

# Agents
toongine agents                  # list all 24 agents
toongine agents --verify         # validate manifests

# TOON Compiler
toongine compile                 # compile all .md → .toon (V3 pipeline)
toongine compile --file <path>   # single file
toongine watch                   # auto-compile on change

# V4 Graph Bridge
toongine graph                   # rebuild per-tool knowledge graphs → .toon/graphs/
toongine stats                   # compression statistics + graph health
npx tsx scripts/build-unified-graph.ts  # rebuild unified.db from all 3 tools

# Migration
toongine absorb                  # migrate originals → .toon/
toongine absorb --dry-run        # preview
toongine rollback                # list snapshots
toongine rollback <ts>           # restore snapshot
toongine sync --once             # one-time sync
toongine sync --watch            # live sync

# Maintenance
toongine clean                   # remove stale duplicates + reindex engine.bin

# Dashboard
toongine dashboard               # start (port 4200)
toongine dashboard --hide        # hide
toongine dashboard --show        # show
toongine dashboard --status      # check

# Hermes Agent + MCP
toongine hermes status           # connection status
toongine hermes detect           # scan for local/remote Hermes
toongine hermes save-remote user@host  # save VPS IP (gitignored)
toongine hermes connect          # connect memory sync (auto-uses saved remote)
toongine hermes disconnect       # disconnect
hermes mcp test toongine-graph   # verify MCP graph tools (5 tools)

# Info
toongine version                 # show version
```

## JavaScript API (34 exports)

```typescript
// CIE — context injection
import { buildCieContext } from 'toongine/cie'
import { extractKeywords, extractFilePaths } from 'toongine/cie/algorithms'

// TOON compiler
import { compileFile, compileAll } from 'toongine/toon'
import { compile } from 'toongine/toon/v3/compile'
import { resolve } from 'toongine/toon/v3/resolver'
import { readDoc, readDocsForLLM, docStats } from 'toongine/toon/v3/dual-docs'

// TOON v4 — Graph Intelligence Bridge
import { createUnifiedGraph, UnifiedGraph } from 'toongine/toon/v4/unified-graph'
import { V4Engine, createV4Engine } from 'toongine/toon/v4/engine'
import { HermesGraphGateway, createGraphGateway, GRAPH_MCP_TOOLS } from 'toongine/toon/v4/hermes-gateway'
import { buildAgentContext, formatContextForLLM } from 'toongine/toon/v4/context-builder'
import { ingestAll, ingestCodeReviewGraph, ingestGraphify } from 'toongine/toon/v4/ingesters'
import { activate, deactivate } from 'toongine/toon/v4/auto-activate'
import { startWatcher, stopAllWatchers } from 'toongine/toon/v4/watcher'
import { detectTools, ensureAllTools } from 'toongine/toon/v4/tool-installer'
import { stratify, formatStatHeader, formatTopN } from 'toongine/toon/v4/stratify'

// Auto TOON middleware
import { autoToonMiddleware } from 'toongine/toon/auto/middleware'
import { decodeToonResponse } from 'toongine/toon/auto/decoder'
import { encodeRequest } from 'toongine/toon/auto/encoder'

// Agents
import { loadRegistry, getAgent, getAgentsByDept, getCouncilMembers } from 'toongine/agents'

// Algorithms
import { extractKeywords, extractFilePaths } from 'toongine/algorithms'

// Adapters
import { getConfig } from 'toongine/adapters'
import { syncWithHermes } from 'toongine/adapters'
import { createMCPClient } from 'toongine/adapters'

// Graphs
import { buildGraphify, queryGraph } from 'toongine/graphs'

// Dashboard
import { injectDashboard } from 'toongine/dashboard'
```

## Algorithms

| Algorithm | Purpose | Complexity |
|---|---|---|
| Bloom Filter | Context dedup | O(1) |
| MinHash | Near-duplicate detection | O(n) |
| TF-IDF | Relevance scoring | O(n·m) |
| Priority Queue | Top-K capped selection | O(n log k) |
| BFS | Blast radius analysis | O(V+E) |
| Circuit Breaker | Failure isolation | O(1) |
| BPE | Byte-pair encoding (V3/V4) | O(n·v) |
| Stemmer | Porter-style (V3) | O(n) |
| FTS5 | Full-text graph search (V4) | O(log n) |
| Stratified Delivery | 3-layer context injection (V4) | O(1) |

## Provider Support

Works with any OpenAI-compatible API:
Anthropic (Claude) · OpenAI (GPT-4) · DeepSeek · xAI (Grok) · Google (Gemini) · Custom endpoints

## Database Support

Pluggable adapters: Supabase · PostgreSQL · SQLite · In-memory

## Dev Commands

```bash
npm run build          # tsc — compile TypeScript
npm run dev            # tsc --watch
npm test               # test suite
npm run prepare        # npm run build (pre-publish)
```

## Repository

```
src/
├── agents/         registry, manifest-schema, hermes-generator, personalities
├── cie/            classifier, builder, ranker, retriever, algorithms, sources
├── toon/           compiler, v3/{engine,compile,resolver,bpe,stemmer,dual-docs}
│   └── v4/         unified-graph, unified-schema, bridge-types, engine, context-builder,
│                   hermes-gateway, mcp-server.py, auto-activate, tool-installer,
│                   watcher, stratify, compression-verifier, ingesters/{3 tools}
├── adapters/       config, hermes-sync, mcp-client
├── graphs/         graphify, codegraph
├── dashboard/      API + UI injection
├── metrics/        supabase-writer, collector
├── plugins/        loader
└── algorithms/     re-exports from cie/algorithms

scripts/
├── postinstall.js          npm postinstall — deploys templates
├── build-unified-graph.ts  builds unified.db from 3 graph tools
└── test-mcp-pipeline.py    integration test — 10/10 checks

templates/
├── agents/         24 agents across 8 departments (918 files)
└── docs/           CONSTITUTION.{md,toon} + ENGINE.{md,toon}
```

## License

MIT — YVON OS
