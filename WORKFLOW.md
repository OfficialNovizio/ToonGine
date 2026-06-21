# ToonGine v4 — How Everything Works

## One-sentence summary
ToonGine is a one-install npm package that builds a knowledge graph of your project, delivers stratified context to agents (≥97% token savings), tracks token burn, and gives you a 3-tab dashboard — all zero-config.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      YOUR PROJECT (code)                         │
│                                                                  │
│  npm install toongine                                            │
│  ├── postinstall → .toon/config.json (repo identity)            │
│  ├── postinstall → smart .gitignore (cache ignored, config ✓)  │
│  ├── npx toongine compile                                        │
│  │   └── v4 activate() ─────────────────────────────────────┐   │
│  │       ├── scan project (docs, agents, .md, .ts, .tsx)    │   │
│  │       ├── ingestAll() → unified.db                        │   │
│  │       │   ├── code-review-graph (Tree-sitter AST)         │   │
│  │       │   ├── graphify (import dependency graph)          │   │
│  │       │   └── codegraph (symbol call graph)               │   │
│  │       ├── install MCP server → .toon/hermes/mcp-server.py │   │
│  │       └── start watcher (auto-rebuild on file change)     │   │
│  │                                                            │   │
│  └── npm run dev → dashboard injected into sidebar              │   │
│                                                                  │   │
└─────────────────────────────────────────────────────────────────┘   │
                                                                      │
┌─────────────────────────────────────────────────────────────────────┘
│  unified.db (SQLite)
│  ┌──────────────┬──────────────┬──────────────┐
│  │ unified_nodes │ unified_edges │ communities  │
│  │  4,708 rows   │ 12,004 rows   │  13 clusters │
│  └──────────────┴──────────────┴──────────────┘
│
│  MCP Bridge (5 graph tools for Hermes agents)
│  ├── toon_graph_explore(q)     natural language → symbols + code
│  ├── toon_graph_callers(sym)   who calls this function?
│  ├── toon_graph_impact(sym)    blast radius analysis (3-level chain)
│  ├── toon_graph_search(q)      full-text across all nodes
│  └── toon_graph_status()       graph health (N nodes, E edges, stale?)
│
│  Context Builder (per-agent stratified delivery)
│  ┌─────────────────────────────────────────────────┐
│  │ Layer 1: STAT HEADER  (~30 tok)                 │
│  │   • Agent memory summary                        │
│  │   • Project stats (files, LOC, commits)         │
│  │   • Graph overview (nodes, communities)         │
│  ├─────────────────────────────────────────────────┤
│  │ Layer 2: TOP-N       (~50 tok)                  │
│  │   • Most relevant symbols for the query         │
│  │   • Agent's department context                  │
│  │   • Active issues / decisions                   │
│  ├─────────────────────────────────────────────────┤
│  │ Layer 3: DELTA REFS  (~10 tok)                  │
│  │   • What changed since last session             │
│  │   • File-level diffs (TOON-compressed)          │
│  │   • New symbols added since last compile        │
│  └─────────────────────────────────────────────────┘
│
│  Compression: 100K token codebase → ~90 tok context
│  Verified savings: ≥97% (compression-verifier.ts)
│
└─────────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                      VPS (pipeline)                               │
│                                                                  │
│  Hermes Agent runs your agents (DeepSeek/Opus/Anthropic)        │
│  │                                                               │
│  ├── state.db (every session: tokens, cost, cwd, agent)         │
│  │                                                               │
│  └── MCP bridge ──► unified.db (5 graph tools available)        │
│                                                                  │
│  cron every 5 min ($0 cost):                                     │
│    scripts/toongine-pipeline.py                                  │
│    ├── read state.db                                             │
│    ├── detect project via cwd → .toon/config.json → repo_id     │
│    └── POST to Supabase (activity_log, snapshots, provider)     │
│                                                                  │
│  Supabase (mcejxdjrwzjxafciuely.supabase.co)                     │
│    └── all tables scoped by repo_id (RLS isolation)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3-Tab Dashboard

| Tab | Shows | Data source |
|-----|-------|-------------|
| 🕵️ **Agent Memory** | Agent roster, knowledge graph (nodes/edges/communities), plugin health, Hermes sessions | `/api/agents/infra` |
| 🔥 **Token Burn** | Token usage 30d, cost trend, per-agent burn, provider health | `/api/token-burn` |
| 🧬 **Health** | TOON compression quality, savings trend, codebase structure, API health, issues | `/api/project-health` |

**Two ways to view:**
1. `npx toongine dashboard` → Express on port 3000 (Vite UI, 160KB gzipped)
2. Install in Next.js → auto-injected at `/agents` (inject.ts)

---

## v4 TOON Engine (active version)

The TOON v4 engine replaces v3's keyword-based chunk retrieval with graph intelligence:

| Component | What it does |
|-----------|-------------|
| **auto-activate.ts** | `activate(projectRoot)` — one command: build graph, install tools, start watchers |
| **unified-graph.ts** | SQLite-backed knowledge graph (nodes, edges, communities) |
| **unified-schema.ts** | Schema + SQL definitions for unified.db |
| **ingesters/** | 3 data sources → unified nodes/edges: code-review-graph, graphify, codegraph |
| **context-builder.ts** | Per-agent stratified context (stat header → top-N → delta refs) |
| **hermes-gateway.ts** | MCP bridge — exposes 5 graph tools to Hermes agents |
| **stratify.ts** | Numeric/string stat compression + delta injection |
| **tool-installer.ts** | Auto-install MCP server into .toon/hermes/ |
| **watcher.ts** | File system monitor — auto-rebuild graph on changes |
| **compression-verifier.ts** | Verifies ≥97% compression target |
| **bridge-types.ts** | Shared types: UnifiedNode, UnifiedEdge, MCPToolDef |
| **mcp-server.py** | Python MCP server (stdio) that Hermes connects to |

**Why v4 over v3:**

| | v3 | v4 |
|---|----|----|
| Retrieval | Keyword index (inverted) | Semantic graph search |
| Context | Flat chunk injection | 3-layer stratified (stats → top-N → delta) |
| Tools | None | 5 MCP graph tools for Hermes |
| Auto-activate | Manual compile only | One-command init + watcher |
| Compression | BPE tokenization (~94%) | Graph-based context minimization (~97%) |

---

## Key Files (source tree)

```
src/
├── dashboard/               ← 3-component glass dashboard
│   ├── AgentMemory.tsx         (agent roster + graph + plugins)
│   ├── TokenBurn.tsx           (token usage + cost charts)
│   ├── ProjectHealth.tsx       (compression quality + issues)
│   ├── ToonGineDashboard.tsx   (3-tab wrapper)
│   ├── types.ts                (shared data types)
│   ├── api.ts                  (Express API — 30+ routes)
│   ├── server.ts               (Express entry, port 3000)
│   ├── inject.ts               (auto-inject into Next.js)
│   └── ui/                     (minified Vite app)
│       └── src/App.tsx         (tab switch + data fetch)
├── toon/
│   ├── v3/                     (BPE engine — kept for backward compat)
│   └── v4/ ★ACTIVE             (graph intelligence engine)
│       ├── auto-activate.ts
│       ├── engine.ts
│       ├── unified-graph.ts    (SQLite knowledge graph)
│       ├── context-builder.ts  (stratified context delivery)
│       ├── hermes-gateway.ts   (MCP bridge)
│       ├── ingesters/          (graphify, codegraph, code-review-graph)
│       ├── watcher.ts          (auto-rebuild on file change)
│       └── mcp-server.py       (Python MCP server)
├── metrics/     collector, agent-tracker, health-checks
├── agents/      registries, personalities, manifest
├── cie/         classify → retrieve → rank → inject
├── plugins/     zero-config Supabase plugin
└── adapters/    hermes-sync, mcp-client, config
cli/
├── toongine.js  (CLI — compile, init, dashboard, integrate, watch, stats)
scripts/
├── postinstall.js       (smart gitignore + config creation)
├── preuninstall.js      (hardened cleanup of 8 injected files)
├── toongine-pipeline.py (every 5 min: state.db → Supabase)
```

---

## Commands

```
npx toongine init        Initialize project (.toon/ + config + agents/)
npx toongine compile     Build v4 knowledge graph (activate → ingest → verify)
npx toongine dashboard   Launch dashboard on port 3000 (Vite UI)
npx toongine watch       Auto-rebuild graph on file changes
npx toongine integrate   TIER-K setup: TOON + CIE + Graph + Inject
npx toongine clean       Remove .toon/ caches (not config, not agents)
npx toongine stats       Project stats + compression savings
npx toongine hermes      Hermes bridge: connect / disconnect / status
```

---

## Pipeline (every 5 min, $0 cost)

```
scripts/toongine-pipeline.py:
  1. Reads /root/.hermes/state.db (SQLite)
  2. For each session with cwd:
     a. Climb up directories looking for .toon/config.json
     b. Read repo_id from config.json
     c. Push activity_log to Supabase (scoped by repo_id)
  3. Push snapshots (token counts, provider health)
  4. Push provider_ledger (per-model cost breakdown)
  5. Flag unattributed sessions (no .toon/config.json found)

Attribution chain: cwd → .toon/config.json → repo_id → Supabase
```

---

## 3 Rules

1. **Install once, works everywhere.** No .env needed — Supabase anon key hex-baked.
2. **One Supabase, all ventures.** Every table has `repo_id` — automatic isolation.
3. **Pipeline is $0.** Reads Hermes state.db locally, pushes to Supabase. No LLM.
4. **Build matters, then it's automatic.** Run `npx toongine compile` once per project — after that, watcher handles changes and agent context auto-injects.
