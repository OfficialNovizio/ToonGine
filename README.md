# ToonGine v1.7.1 — TOON V4 Graph Intelligence Bridge

**99.97% compression · 24 agents · 3-tool graph bridge · 5 MCP tools · 1-command setup**

## Quick Install

```bash
npm install -g github:OfficialNovizio/ToonGine
npx toongine init      # one command — builds graph, deploys agents, starts watchers
npx toongine doctor    # verify — all systems operational
```

## What It Does

ToonGine is a **codebase intelligence plugin** that analyzes your project, builds a unified knowledge graph, deploys 24 AI agents, and auto-wires into Hermes. After `npx toongine init`, your project is fully understood by AI:

```
Project Source Code
        │
        ▼
┌───────────────────────────────────────────┐
│            npx toongine init               │
│                                             │
│   ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│   │ 3 Graph  │  │ 24 Agents│  │  MCP    │ │
│   │  Tools   │  │ Deployed │  │ Bridge  │ │
│   └────┬─────┘  └────┬─────┘  └────┬────┘ │
│        │             │             │       │
│   code-review-graph  8 depts   5 graph    │
│   graphify           MEMORY.md   tools     │
│   codegraph          persona    auto-wire  │
│        │             │             │       │
│        └──────┬──────┴──────┬──────┘       │
│               ▼             ▼              │
│        ┌──────────┐  ┌──────────┐         │
│        │unified.db│  │  Hermes  │         │
│        │FTS5 graph│  │  Agent   │         │
│        └──────────┘  └──────────┘         │
│                                             │
│   Context: 4.5 MB → 29 tokens (99.97%)     │
└─────────────────────────────────────────────┘
```

**Result:** Hermes agents can explore your codebase, find callers, analyze impact, and search symbols — all at runtime.

## Workflow — 7 Phases

Every `npx toongine init` runs this exact sequence:

### Phase 1 — Detect
```
python --version           → found ✓
pip list                   → check graphify, code-review-graph installed
which codegraph            → check codegraph installed
```
Windows-safe: uses `python` / `where` on Windows, `python3` / `which` on Linux.

### Phase 2 — Install Missing Tools
```
pip install graphifyy              → semantic community detection
pip install code-review-graph      → tree-sitter AST analyzer
npm install -g @colbymchenry/codegraph  → import dependency mapper
```
Skips tools already installed. Uses `python -m pip` as fallback if pip not on PATH.

### Phase 3 — Build 3 Graphs
```
codegraph init                   → .codegraph/codegraph.db (import deps, hub files)
graphify extract . --backend auto → .toon/graphify/graph.json (community structure)
code-review-graph build           → .toon/code-review-graph/graph.db (AST symbols, call graphs)
```
Falls back to `python -m graphify` / `python -m code_review_graph` if CLI not on PATH. Falls back to built-in regex analyzer if no API key.

### Phase 4 — Synthesize TOON Reports
```
synthesize-codegraph.py         → .toon/codegraph/CODEGRAPH_REPORT.toon
synthesize-graphify.py          → .toon/graphify/GRAPH_REPORT.toon
synthesize-code-review-graph.py → .toon/code-review-graph/CODEGRAPH_REPORT.toon
```
Each script builds abbreviation dictionaries (e.g. `authentication` → `§42`) so Hermes reads compressed data. UTF-8 encoding enforced on all file writes (Windows-safe).

### Phase 5 — Deploy 24 Agents
```
.toon/agents/
  CEO/marcus/MEMORY.md          → "I am Marcus, CEO of YVON OS..."
  COO/diana/MEMORY.md            → "I am Diana, COO..."
  Technical/dev/MEMORY.md       → "I am Dev, tech lead..."
  ... (24 agents, 8 departments)
```
Each agent gets a MEMORY.md with persona, role, and department context. These are the files Hermes loads when role-playing agents.

### Phase 6 — Wire MCP Bridge
```
wire-hermes-mcp.py → edits ~/.hermes/config.yaml
```
Adds 5 graph tools as MCP stdio server + permissions. Platform-aware: writes `python` on Windows, `python3` on Linux/Mac.

### Phase 7 — Dashboard (optional)
```
toongine dashboard              → localhost:4200
```
3-tab HTML dashboard: Token Burn, Agents & Memory, Health Metrics. Reads real data from `.toon/`.

## Runtime — After Init

```
Code changes
      │
      ▼
toongine watch (2-tier file watcher)
      │
      ├── 2s debounce → rebuild unified graph
      └── 5min timer  → rebuild all 3 tool graphs
      │
      ▼
Hermes agent asks: "who calls authenticate()?"
      │
      ▼
toon_graph_callers("authenticate") → returns callers from unified.db
      │
      ▼
Agent gets 29 tokens of context instead of 4.5MB of raw files
```

### Hermes With vs Without

| Without ToonGine | With ToonGine |
|---|---|
| Read files manually | `toon_graph_explore("auth flow")` |
| Grep for callers | `toon_graph_callers("login")` |
| Trace impact manually | `toon_graph_impact("config.ts")` |
| No code awareness | 4,708 nodes, 30,010 edges indexed |

## What Ships

After `npx toongine init`:

```
.toon/
├── agents/          24 agents across 8 departments (MEMORY.md + manifest.toon)
├── codegraph/       CODEGRAPH_REPORT.toon (import dependencies)
├── graphify/        GRAPH_REPORT.toon (community structure)
├── code-review-graph/ CODEGRAPH_REPORT.toon (AST symbols + call graphs)
├── hermes/
│   └── mcp-server.py  MCP bridge — 5 graph tools via stdio
├── graphs/
│   └── unified.db   merged knowledge graph (FTS5 search)
├── docs/
│   ├── CONSTITUTION.toon  10 immutable operational laws
│   └── ENGINE.toon        architecture reference
├── config.json       project identity (git-tracked)
└── cache/            agent cache (gitignored)
```

## 3 Graph Tools → 1 Unified Graph

| Tool | Data | Method |
|------|------|--------|
| **code-review-graph** | AST symbols, call graphs | `pip install code-review-graph` |
| **graphify** | Community detection, cohesion | `pip install graphifyy` |
| **codegraph** | Import dependencies, hub files | `npm install -g @colbymchenry/codegraph` |

All 3 feed into unified graph. Hermes gets 3-layer stratified context: ~30 tokens stat header + ~50 tokens top-N relevant + ~10 tokens delta refs.

## 5 MCP Tools

| Tool | Purpose |
|------|---------|
| `toon_graph_explore` | Natural-language code exploration |
| `toon_graph_callers` | Find who calls a symbol |
| `toon_graph_impact` | Blast-radius analysis |
| `toon_graph_search` | Full-text search across all nodes |
| `toon_graph_status` | Graph health — nodes, edges, staleness |

Auto-registered with Hermes on `init`. No manual config.

## 24 Agents — 8 Departments

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

## CLI Reference

```bash
# Setup
toongine init              build graphs + deploy agents + wire MCP
toongine doctor            health check — all systems
toongine doctor --stale    check for stale graph outputs

# Agents
toongine agents            list 24 agents
toongine agents --verify   validate manifests
toongine agents --sync     sync agents to .toon/

# Graph
toongine graph             rebuild per-tool graphs
toongine clean             remove stale duplicates

# Compiler
toongine compile           all .md → .toon
toongine watch             auto-compile + rebuild on change
toongine stats             compression stats

# Dashboard
toongine dashboard         start (port 4200)

# Hermes
toongine hermes connect    auto-wire MCP into Hermes config

# Info
toongine version           show version
```

## Install From GitHub

```bash
# Latest release
npm install -g github:OfficialNovizio/ToonGine

# Or specific version via raw .tgz
npm install -g https://raw.githubusercontent.com/OfficialNovizio/ToonGine/master/toongine-1.7.1.tgz

# Windows: if github: protocol fails, use raw .tgz URL
```

## Requirements

- Node.js ≥ 18
- Python ≥ 3.10
- Git (for code-review-graph)
- Hermes Agent (for MCP tools)

## License

MIT — YVON OS
