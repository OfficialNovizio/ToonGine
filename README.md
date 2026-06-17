# ToonGine v1.5.4

**AI Agent OS Kernel — One `npm install`. 24 agents, TOON compressor, knowledge graphs, CIE.**

[![npm](https://img.shields.io/badge/npm-toongine-blue)](https://www.npmjs.com/package/toongine)
[![node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)
[![repo](https://img.shields.io/badge/github-OfficialNovizio%2FToonGine-black)](https://github.com/OfficialNovizio/ToonGine)

---

## Quick Install

```bash
npm install toongine         # install as dependency
npx toongine doctor           # health check — all systems
npx toongine agents           # list all 24 agents
npx toongine dashboard        # live dashboard → localhost:4200
```

## What Ships — One `npm install`

```bash
npm install toongine
       │
       ▼  postinstall.js auto-deploys:
       │
       ├── .toon/memory/agent-department/    24 agents · 918 files
       ├── .toon/memory/agent-memory/        TOON-compiled agent memory
       ├── .toon/graphs/                     knowledge graphs (graphify + codegraph)
       ├── .toon/docs/                       CONSTITUTION.toon + ENGINE.toon
       ├── docs/                             human-readable CONSTITUTION + ENGINE
       └── ~/.hermes/.../yvon/               Hermes skill files (auto-generated)
```

---

## Features

### 🧠 TOON Compiler (NEW)
4-phase deterministic pipeline — no ML, offline-capable, 80%+ token savings.

```bash
npx toongine compile             # compile all .md → .toon
npx toongine compile --file x   # compile single file
npx toongine watch               # auto-compile on file changes
npx toongine stats               # compression stats
```

```typescript
import { compileFile, compileAll } from 'toongine/toon'
const result = compileFile('agent-department/CEO/marcus/MEMORY.md', projectRoot)
// → { sourcePath, destPath, sourceSize, compressedSize, savingsPercent, sections }
```

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

### 🗺️ Knowledge Graphs
```bash
npx toongine graph                # rebuild graphify + codegraph → .toon/graphs/
```

- **graphify** — codebase community detection (function clusters, cohesion scores)
- **codegraph** — dependency analysis (hub files, fan-out, blast radius, API deps)

### 🔄 TOON v3/v4 Compression
```bash
npx toongine absorb --dry-run     # preview migration
npx toongine absorb               # migrate originals → .toon/ (safe, rollback)
npx toongine rollback             # list available snapshots
npx toongine rollback <ts>        # restore specific snapshot
npx toongine sync --once          # one-time originals → .toon/
npx toongine sync --watch         # auto-sync every 30s
npx toongine clean                # remove stale duplicates + reindex
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

### 🔌 Hermes Agent — VPS-Powered Agent Brain

ToonGine agents connect to **Hermes Agent** (by Nous Research) running on your VPS for persistent memory, cross-session skills, and identity context. Hermes acts as the persistent brain — agents receive your preferences, learned workflows, and project standards in every LLM call.

#### Full Setup — Install → Hermes → Agents Connected

```bash
# Step 1: Install ToonGine
npm install toongine

# Step 2: Integrate (wires imports, builds graphs, deploys agents)
npx toongine integrate

# Step 3: Save your VPS (one time — IP stays in gitignored .toon/hermes/config.json)
npx toongine hermes save-remote root@YOUR_VPS_IP

# Step 4: Connect (pulls Hermes memories, skills, sessions via SSH)
# Requires passwordless SSH to your VPS
npx toongine hermes connect

# Step 5: Build (compiles everything into engine.bin)
npx toongine graph && npx toongine compile --force

# Step 6: Verify
npx toongine doctor
# Should show: 🔗 Hermes: 🔗 Connected · Agent Memory: 24 agents
```

#### Complete Uninstall → Reinstall with Hermes Activation

```bash
# 1. Wipe everything ToonGine-related
rm -rf node_modules/toongine
rm -rf .toon/v3 .toon/codegraph .toon/graphify
rm -f toongine.config.json

# 2. Keep your Hermes VPS config (gitignored, safe)
#    .toon/hermes/config.json — your remote IP lives here, never delete this
#    .toon/agents/            — agent memory source of truth, keep this too

# 3. Reinstall fresh
npm install toongine

# 4. Re-integrate
npx toongine integrate

# 5. Reconnect Hermes (auto-reads saved IP from .toon/hermes/config.json)
npx toongine hermes connect

# 6. Rebuild everything
npx toongine graph && npx toongine compile --force

# 7. Verify all systems
npx toongine doctor
# Expected: 11/11 operational · 🔗 Hermes: 🔗 Connected · Agent Memory: 24 agents
```

#### What Hermes Provides (when connected)

| Context | Source | Injected via |
|---------|--------|-------------|
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
npm info toongine version           # 1.5.4
npm info toongine dependencies      # better-sqlite3, cors, express, ws
npm info toongine engines           # node >= 18.0.0
npm info toongine keywords          # ai, agent, llm, context, compression, toon
npm ls toongine --depth=0           # check installed version
```

```
Name        : toongine
Version     : 1.5.4
Description : TOON compression engine for AI agents
Main        : dist/index.js
Size        : ~20 MB (918 agent templates + 62 source modules)
License     : MIT
Repo        : github.com/OfficialNovizio/ToonGine
```

## CLI Reference (19 commands)

```bash
# Setup
toongine init                    # first-time setup (new projects)
toongine integrate               # wire into existing project (non-destructive)
toongine doctor                  # health check

# Agents
toongine agents                  # list all 24 agents
toongine agents --verify         # validate manifests

# TOON Compiler
toongine compile                 # compile all .md → .toon
toongine compile --file <path>   # single file
toongine watch                   # auto-compile on change

# Migration
toongine absorb                  # migrate originals → .toon/
toongine absorb --dry-run        # preview
toongine rollback                # list snapshots
toongine rollback <ts>           # restore snapshot
toongine sync --once             # one-time sync
toongine sync --watch            # live sync

# Maintenance
toongine clean                   # remove stale duplicates + reindex
toongine stats                   # compression statistics
toongine graph                   # rebuild knowledge graphs

# Dashboard
toongine dashboard               # start (port 4200)
toongine dashboard --hide        # hide
toongine dashboard --show        # show
toongine dashboard --status      # check

# Hermes Agent
toongine hermes status           # connection status
toongine hermes detect           # scan for Hermes
toongine hermes save-remote user@host  # save VPS IP (gitignored)
toongine hermes connect          # connect (auto-uses saved remote)
toongine hermes disconnect       # disconnect

# Info
toongine version                 # show version
```

## JavaScript API (24 exports)

```typescript
// CIE — context injection
import { buildCieContext } from 'toongine/cie'
import { extractKeywords, extractFilePaths } from 'toongine/cie/algorithms'

// TOON compiler
import { compileFile, compileAll } from 'toongine/toon'
import { compile } from 'toongine/toon/v3/compile'
import { resolve } from 'toongine/toon/v3/resolver'
import { readDoc, readDocsForLLM, docStats } from 'toongine/toon/v3/dual-docs'

// TOON v4
import { stratify } from 'toongine/toon/v4/stratify'

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
| BPE | Byte-pair encoding (V3) | O(n·v) |
| Stemmer | Porter-style (V3) | O(n) |

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
├── toon/           compiler, v3/{engine,compile,resolver,bpe,stemmer,dual-docs}, v4/stratify, auto/{middleware,decoder,encoder}
├── adapters/       config, hermes-sync, mcp-client
├── graphs/         graphify, codegraph
├── dashboard/      API + UI injection
├── metrics/        supabase-writer, collector
├── plugins/        loader
└── algorithms/     re-exports from cie/algorithms

templates/
├── agents/         24 agents across 8 departments (918 files)
└── docs/           CONSTITUTION.{md,toon} + ENGINE.{md,toon}
```

## License

MIT — YVON OS
