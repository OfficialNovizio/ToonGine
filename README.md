# ToonGine v1.5.5 — TOON V4 Graph Intelligence Bridge

**99.97% compression · 24 agents · 3-tool graph bridge · 5 MCP tools · 1-command setup**

[![npm](https://img.shields.io/badge/npm-toongine-blue)](https://www.npmjs.com/package/toongine)
[![node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)
[![repo](https://img.shields.io/badge/github-OfficialNovizio%2FToonGine-black)](https://github.com/OfficialNovizio/ToonGine)
[![compression](https://img.shields.io/badge/compression-99.97%25-brightgreen)]()
[![mcp](https://img.shields.io/badge/MCP-5%20tools-blue)]()

---

## Quick Install

```bash
npm install -g https://github.com/OfficialNovizio/ToonGine/releases/download/v1.5.5/toongine-1.5.5.tgz
npx toongine init      # one command — builds graph, deploys agents, starts watchers
npx toongine doctor    # verify — 11/11 operational
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    npx toongine init                         │
│                         │                                    │
│         ┌───────────────┼───────────────┐                   │
│         ▼               ▼               ▼                   │
│   ┌──────────┐   ┌──────────┐   ┌──────────────┐           │
│   │ 3 Graph  │   │ 24 Agents│   │ MCP Bridge   │           │
│   │  Tools   │   │ Deployed │   │  Deployed    │           │
│   └────┬─────┘   └────┬─────┘   └──────┬───────┘           │
│        │              │                │                    │
│   ┌────▼────┐    ┌────▼────┐     ┌─────▼──────┐            │
│   │ code-   │    │Marcus   │     │mcp-server. │            │
│   │ review- │    │  CEO    │     │    py      │            │
│   │ graph   │    └────┬────┘     └─────┬──────┘            │
│   │ (AST)   │         │               │                    │
│   ├─────────┤    ┌────▼────┐     ┌─────▼──────┐            │
│   │graphify │    │  Diana  │     │ 5 graph    │            │
│   │(communi-│    │   COO   │     │  tools     │            │
│   │ ties)   │    └────┬────┘     │ registered │            │
│   ├─────────┤         │         └─────┬──────┘            │
│   │codegraph│    ┌────▼────┐          │                    │
│   │(import  │    │ Dev     │          │                    │
│   │ deps)   │    │Tech Lead│          │                    │
│   └────┬────┘    └────┬────┘          │                    │
│        │              │               │                    │
│        ▼              ▼               ▼                    │
│   ┌──────────────────────────────────────┐                 │
│   │         unified.db                   │                 │
│   │   4,708 nodes · 30,010 edges          │                 │
│   │   FTS5 full-text search              │                 │
│   └──────────────┬───────────────────────┘                 │
│                  │                                         │
│                  ▼                                         │
│   ┌──────────────────────────────────────┐                 │
│   │         Hermes Agent                 │                 │
│   │   ┌──────────────────────────────┐   │                 │
│   │   │  toon_graph_explore          │   │                 │
│   │   │  toon_graph_callers          │   │                 │
│   │   │  toon_graph_impact           │   │                 │
│   │   │  toon_graph_search           │   │                 │
│   │   │  toon_graph_status           │   │                 │
│   │   └──────────────────────────────┘   │                 │
│   │          runtime MCP tools            │                 │
│   └──────────────────────────────────────┘                 │
│                                                             │
│   Context: 4.5 MB (1,125,000 tokens)                       │
│          → 29 tokens injected per agent call                │
│          → 99.97% compression                               │
└─────────────────────────────────────────────────────────────┘
```

**The flow:**
1. `npx toongine init` — installs 3 graph tools, deploys 24 agents, starts MCP server
2. **3 tools** (code-review-graph, graphify, codegraph) analyze your codebase → feed into `unified.db`
3. **24 agents** (8 departments) with MEMORY.md, manifest.toon, and personalities
4. **MCP bridge** exposes 5 graph tools to Hermes via stdio — agents query the graph at runtime
5. **Context injection** — 3-layer stratified: stat header (30t) → top-N relevant (50t) → delta refs (10t)
6. **File watchers** — auto-rebuild graph on code changes

---

## What Ships

After `npx toongine init`:

```
.toon/
├── agents/          24 agents across 8 departments (MEMORY.md + manifest.toon)
├── graph/
│   └── unified.db   unified knowledge graph (FTS5 search, 3-tool merged)
├── hermes/
│   └── mcp-server.py  MCP bridge — 5 graph tools via stdio
├── docs/
│   ├── CONSTITUTION.toon  10 immutable operational laws
│   └── ENGINE.toon        architecture reference
├── graphs/
│   └── graph.html    interactive D3 visualization
├── config.json       project identity (git-tracked)
└── cache/            agent cache (gitignored)
```

---

## Features

### 🧠 TOON Compression — 99.97% savings

5-phase deterministic pipeline — dictionary + BPE + delta + stratified + graph context. No ML, offline-capable.

```bash
npx toongine compile          # all .md → .toon
npx toongine compile --file x # single file
npx toongine watch            # auto-compile on changes
npx toongine stats            # compression statistics
```

### 👥 24 Agents — 8 Departments

| Dept | Agents | Level |
|------|--------|-------|
| Command | Board | L1 |
| CEO | Marcus | L1 |
| COO | Diana | L1 |
| Finance | Felix | L2 |
| Psychology | Kahneman | L2 |
| Legal | Docs, Comply, Guard | L2–L3 |
| Research | Vette, Depth, Synth | L3 |
| Sense | Scout, Radar, Forge | L3 |
| Marketing | Kai, Lena, Rio, Nate, Atlas, Pixel | L2–L3 |
| Technical | Dev, Mia, Raj, Quinn | L2–L3 |

```bash
npx toongine agents           # list all agents
npx toongine agents --verify  # validate manifests
```

### 🧬 V4 Graph Bridge — 3 Tools → 1 Unified Graph

| Tool | Data | Method |
|------|------|--------|
| code-review-graph | AST symbols, call graphs | `pip install code-review-graph` |
| graphify | Community detection, cohesion | `pipx install graphify` |
| codegraph | Import dependencies, hub files | `npm install -g @colbymchenry/codegraph` |

All 3 feed into `unified.db` — 4,708 nodes, 30,010 edges, FTS5 search.

### 🔌 Hermes MCP — 5 Runtime Graph Tools

| Tool | Purpose |
|------|---------|
| `toon_graph_explore` | Natural-language code exploration |
| `toon_graph_callers` | Find who calls a symbol |
| `toon_graph_impact` | Blast-radius analysis |
| `toon_graph_search` | Full-text search across all nodes |
| `toon_graph_status` | Graph health — nodes, edges, staleness |

Auto-registered by MCP. Agents get 3-layer stratified context: ~30 tokens stat header + ~50 tokens top-N relevant + ~10 tokens delta refs.

### 📊 V4 Performance

| Metric | Before | After |
|--------|--------|-------|
| Context injected | 4.5 MB (1.1M tokens) | **~29 tokens** |
| Compression | 78.7% | **99.97%** |
| Tools bridged | 0 of 3 | **3 of 3** |
| MCP tools | 0 | **5** |
| Manual commands | 2 | **0** (auto-sync) |
| Install steps | 3+ | **1** |

---

## CLI Reference

```bash
# Setup
toongine init              build unified.db + deploy agents + start watchers
toongine doctor            health check — all systems

# Agents
toongine agents            list 24 agents
toongine agents --verify   validate manifests

# Compiler
toongine compile           all .md → .toon
toongine compile --file x  single file
toongine watch             auto-compile on change
toongine stats             compression stats

# Graph
toongine graph             rebuild per-tool graphs
toongine clean             remove stale duplicates

# Migration
toongine absorb            migrate originals → .toon/
toongine absorb --dry-run  preview migration
toongine rollback          list snapshots
toongine rollback <ts>     restore snapshot
toongine sync --once       one-time sync
toongine sync --watch      live sync

# Dashboard
toongine dashboard         start (port 4200)

# Info
toongine version           show version
```

---

## JavaScript API

```typescript
// Context injection
import { buildCieContext } from 'toongine/cie'

// TOON compiler
import { compileFile, compileAll } from 'toongine/toon'

// V4 Graph Bridge
import { createUnifiedGraph, V4Engine } from 'toongine/toon/v4'
import { HermesGraphGateway, GRAPH_MCP_TOOLS } from 'toongine/toon/v4/hermes-gateway'
import { buildAgentContext, formatContextForLLM } from 'toongine/toon/v4/context-builder'
import { ingestAll, detectTools, ensureAllTools } from 'toongine/toon/v4'
import { activate, deactivate } from 'toongine/toon/v4/auto-activate'
import { stratify } from 'toongine/toon/v4/stratify'

// Agents
import { loadRegistry, getAgent, getAgentsByDept, getCouncilMembers } from 'toongine/agents'

// Adapters
import { getConfig, createMCPClient } from 'toongine/adapters'
```

---

## Repository

```
src/
├── agents/         registry, manifest-schema, personalities
├── cie/            classifier, builder, ranker, retriever, algorithms
├── toon/           compiler + v3 engine
│   └── v4/         unified-graph, engine, context-builder, hermes-gateway,
│                   mcp-server.py, tool-installer, watcher, stratify,
│                   ingesters/{code-review-graph, graphify, codegraph}
├── adapters/       config, mcp-client
├── graphs/         graphify, codegraph
├── dashboard/      API + UI injection
└── metrics/        supabase-writer, collector

templates/
├── agents/         24 agents across 8 departments (918 files)
└── docs/           CONSTITUTION + ENGINE
```

---

## License

MIT — YVON OS
