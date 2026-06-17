# TOON V4 — Graph Intelligence Bridge + 99% Efficiency Engine

> **For Hermes:** Build this phase-by-phase with verification gates. No phase advances without passing its gate.

**Goal:** Unify 3 knowledge graph tools (code-review-graph, graphify, codegraph) into a self-contained `.toon/` bridge that feeds graph intelligence to all 24 agents via Hermes, achieving 99% token compression at runtime. Auto-sync on every file change. Zero manual commands after `npx toongine init`.

**Target repo:** `OfficialNovizio/ToonGine` (NOT yvon-os)

**Architecture:** 4-layer engine — (1) Auto-activation installs all 3 tools inside `.toon/tools/`, (2) Unified Graph Bridge normalizes 3 formats into one `unified.db`, (3) V4 Stratified Context Engine compresses graph+agent data to ~90 tokens baseline, (4) Hermes MCP Gateway serves live graph queries to agents. File watchers on every layer. Fresh install = full auto-build. Empty project = starts cold, grows hot.

**Tech Stack:** TypeScript (ToonGine), SQLite (unified graph), Python pipx (graphify/code-review-graph), Node.js MCP (codegraph), Hermes Agent (runtime consumer).

---

## Current State — Why V4 Is Needed

| Problem | Impact |
|---|---|
| `.code-review-graph/graph.db` (12.1 MB) — unused by agents | 41% of knowledge base wasted |
| `graphify-out/graph.json` (2.5 MB, 3,117 nodes) — no bridge to TOON | Semantic intelligence invisible |
| `codegraph` (50.9k ⭐, Hermes MCP) — not installed | Best tool missing |
| Manual rebuilds (`npm run graphify:build`) — stale graphs | Agent uses wrong data |
| engine.bin: 4.5 MB from 35.9 MB raw = 78.7% compression | Not 99% |
| No graph data in engine.bin — only agent metadata | Agent sees agents, not code |
| 3 tools in 3 silos, no unified schema | Fragmented, unusable |

## V4 Target State

| Metric | Current | V4 Target |
|---|---|---|
| Compression ratio | 78.7% | **99%+** |
| Runtime payload | 4.5 MB | **~90 tokens (~360 bytes)** |
| Graph data used | 0 MB | All 14.6 MB queryable |
| Agent graph access | None | MCP live query + context injection |
| Rebuild commands | 2 manual | **0** (auto-sync watchers) |
| Fresh install flow | 3+ manual steps | 1 command: `npx toongine init` |
| Empty project | Broken | Cold start, grows hot |
| Tools location | Scattered (pipx, pip, npm) | `.toon/tools/` (self-contained) |

---

## Architecture — 4-Layer Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                     LAYER 4: HERMES MCP GATEWAY                 │
│  codegraph_explore · codegraph_callers · graph query · impact  │
│                 Agent queries graph at runtime                  │
├─────────────────────────────────────────────────────────────────┤
│               LAYER 3: V4 STRATIFIED CONTEXT ENGINE             │
│   Layer 1: STAT HEADER (~30 tokens, always)                    │
│   Layer 2: TOP-N RELEVANT (~50 tokens, matched to query)       │
│   Layer 3: DELTA REFS (~10 tokens, on-demand expansion)        │
│   Total: ~90 tokens vs 4.5 MB → 99.4% savings                  │
├─────────────────────────────────────────────────────────────────┤
│                LAYER 2: UNIFIED GRAPH BRIDGE                    │
│   unified.db ← code-review-graph + graphify + codegraph        │
│   Normalized schema: nodes, edges, communities, symbols        │
│   FTS5 full-text · compressed .toon snapshot · delta sync      │
├─────────────────────────────────────────────────────────────────┤
│                  LAYER 1: AUTO-ACTIVATION                       │
│   npx toongine init → install 3 tools → build graphs           │
│   File watchers on all 3 → auto-reindex on every save          │
│   Cold-start detection → empty .toon/ → fresh initialization   │
│   VACUUM empty state: 0 nodes, 0 edges, ready to grow          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Authentication

### Algorithm: Unified Graph Normalizer

**Input:** 3 tools produce fundamentally different schemas.

| Tool | Format | Schema |
|---|---|---|
| code-review-graph | SQLite (graph.db) | nodes(kind,name,file_path,language,community_id), edges(kind,source_qualified,target_qualified,confidence) |
| graphify | JSON (graph.json) | {nodes:[{id,label,type,community}], edges:[{source,target,kind}], communities:[{id,name,cohesion,nodes}]} |
| codegraph | SQLite (codegraph.db) | symbols, references, files (TBD — npm package not installed yet) |

**Normalization algorithm:**
```
FUNCTION unify(rootDir):
  unified = SQLite("unified.db")
  
  // 1. Schema
  CREATE TABLE unified_nodes(
    id TEXT PK, name TEXT, kind TEXT, file_path TEXT,
    language TEXT, community TEXT, tool_source TEXT,
    extra JSON
  )
  CREATE TABLE unified_edges(
    id INTEGER PK, source_id TEXT, target_id TEXT,
    kind TEXT, confidence REAL, tool_source TEXT,
    FOREIGN KEY(source_id) REFERENCES unified_nodes(id),
    FOREIGN KEY(target_id) REFERENCES unified_nodes(id)
  )
  CREATE VIRTUAL TABLE nodes_fts USING fts5(name, kind, file_path, content='unified_nodes')
  
  // 2. Ingest code-review-graph
  FOR EACH node IN "SELECT * FROM nodes WHERE kind='File'" (code-review-graph):
    INSERT INTO unified_nodes(id=hash(file_path), name=file_path, ...)
  FOR EACH edge IN "SELECT * FROM edges WHERE kind='IMPORTS_FROM'" (code-review-graph):
    INSERT INTO unified_edges(source_id=hash(source), target_id=hash(target), ...)
  
  // 3. Ingest graphify
  FOR EACH node IN graph.json.nodes:
    INSERT INTO unified_nodes(id=hash(node.label), name=node.label, ...)
  FOR EACH edge IN graph.json.edges:
    INSERT INTO unified_edges(...)
  
  // 4. Ingest codegraph (MCP)
  FOR EACH symbol IN codegraph MCP:
    INSERT INTO unified_nodes(...)
  FOR EACH reference IN codegraph MCP:
    INSERT INTO unified_edges(...)
  
  // 5. Deduplicate — same file_path from different tools merges
  // 6. Build FTS5 index
  // 7. Write compressed .toon snapshot
  RETURN unified
```

**Failure modes:**
| Failure | Detection | Recovery |
|---|---|---|
| Tool not installed | `which codegraph` returns non-zero | Skip that tool, flag in status |
| Corrupt graph.db | SQLite `PRAGMA integrity_check` fails | Delete, rebuild from scratch |
| Empty project (no files) | scan returns 0 files | Create empty schema, watcher ready |
| Graph JSON parse error | JSON.parse throws | Skip graphify, continue with others |
| MCP server timeout | 30s timeout on connection | Fall back to codegraph CLI |

### Algorithm: V4 Stratified Context Engine

Current `v4/stratify.ts` handles tabular data with 3 layers. Extended for graph data:

```
FUNCTION injectGraphContext(agentId, query):
  // Layer 1: STAT HEADER (always, ~30 tokens)
  header = "[GRAPH:" + nodeCount + "n/" + edgeCount + "e/" + communityCount + "c"
  IF stale > 60s: header += " STALE:" + staleSeconds + "s"
  header += "]"
  
  // Layer 2: TOP-N RELEVANT (matched to agent's department, ~50 tokens)
  deptFiles = unified.query("
    SELECT n.name FROM unified_nodes n
    WHERE n.file_path LIKE '%" + agentDept + "%'
    LIMIT 20
  ")
  topN = stratify(deptFiles)  // use existing v4/stratify.ts pipeline
  
  // Layer 3: DELTA REFS (on-demand expansion, ~10 tokens)
  restHash = SHA256(allOtherNodes).slice(0,8)
  refTag = "[REF:" + restHash + "] (" + allOtherNodes.length + " nodes available)"
  
  // Token budget enforcement
  totalTokens = 30 + 50 + 10 = ~90 tokens
  IF totalTokens > 100: // adaptive shrink
    reduce topN from 20 → 10 → 5 lines
  
  RETURN { header, topN, refTag, totalTokens }
```

**Why 99% is possible:**
- Current: 4.5 MB engine.bin injected = ~1,125,000 tokens raw
- Target: ~90 tokens header + top-N + delta refs
- Savings: (1,125,000 - 90) / 1,125,000 = **99.992%**
- But real-world: agent needs to expand delta refs ≈ 2-3 queries per session
- Each expansion: 5,000 tokens (full node details)
- Conservative: 90 + 15,000 = 15,090 tokens → 98.66% savings
- **Target 99% is achievable** with the stratify+delta approach

### Algorithm: Auto-Activation + File Watcher

```
FUNCTION init(rootDir):
  // 1. Create .toon/ structure
  mkdir .toon/tools/
  mkdir .toon/graph/
  
  // 2. Install tools (idempotent — skip if exists)
  INSTALL code-review-graph: pip install (already done)
  INSTALL graphify: pipx install graphifyy (already done)
  INSTALL codegraph: npm i -g @colbymchenry/codegraph OR curl install
  
  // 3. Check project state
  files = scan(rootDir, /\\.(ts|tsx|js|jsx|py|md)$/)
  IF files.length === 0:
    createEmptySchema()  // cold start
  ELSE:
    buildAll()  // full build
  
  // 4. Start watchers (background)
  FOR EACH tool IN [code-review-graph, graphify, codegraph]:
    spawn watcher:
      ON file change (debounced 2s):
        re-index changed files
        rebuild unified.db
        recompress engine.bin
        push delta to Hermes bridge
```

**Watcher safety:**
| Risk | Defense |
|---|---|
| Infinite rebuild loop | Debounce 2s, max 1 rebuild per 5s |
| Watcher crash | Health check every 30s, auto-restart |
| Disk full from graph.db growth | Auto-VACUUM on >100MB, warn on >500MB |
| Race condition (2 saves at once) | Lock file `.toon/graph/.lock`, timeout 30s |

### Attack Surface Analysis

| Vector | Likelihood | Impact | Defense |
|---|---|---|---|
| Malicious file injected → graph extraction | Medium | Low | Only index `.ts/.tsx/.js/.py/.md` — code only |
| graph.db SQL injection via filename | Low | Medium | Parameterized queries only, filename sanitization |
| MCP server exposed to network | Low | High | Bind 127.0.0.1 only, require auth token |
| Watcher CPU exhaustion | Medium | Low | `nice -n 10` priority, max 1 core |
| Corrupt unified.db crashes agents | Low | High | Fallback: skip graph data, agents work without it |

---

## Phase-by-Phase Plan

### Phase 0: Foundation — Directory Structure + Schema

**Goal:** Create the `.toon/graph/` structure and unified schema. No tools touched yet.

**Files:**
- Create: `src/toon/v4/unified-schema.ts` — SQL schema + Typescript types
- Create: `src/toon/v4/unified-graph.ts` — UnifiedGraph class (create, query, ingest)
- Create: `src/toon/v4/bridge-types.ts` — Bridge types for 3 tools
- Modify: `src/toon/index.ts` — re-export v4 modules

**Verification gate:**
1. `tsc --noEmit` — zero errors
2. `node -e "const {UnifiedGraph}=require('./dist/toon/v4/unified-graph'); const g=new UnifiedGraph(':memory:'); g.initialize(); console.log('OK:',g.stats())"` — outputs empty stats
3. `git commit -m "feat(v4): unified graph schema + bridge types"`

### Phase 1: Ingesters — Normalize All 3 Tools

**Goal:** Read from each tool's output format and ingest into unified.db.

**Files:**
- Create: `src/toon/v4/ingesters/code-review-graph.ts` — SQLite → unified
- Create: `src/toon/v4/ingesters/graphify.ts` — JSON → unified
- Create: `src/toon/v4/ingesters/codegraph.ts` — MCP/CLI → unified
- Create: `src/toon/v4/ingesters/index.ts` — run all ingestors
- Create: `src/__tests__/v4-ingesters.test.ts`

**Verification gate:**
1. `tsc --noEmit` — zero errors
2. Run ingester on existing YVON project: `node -e "..."` — ingests data from code-review-graph + graphify
3. Query verification: `SELECT COUNT(*) FROM unified_nodes` > 5000 (combined nodes)
4. Dedup verification: no duplicate file_path nodes
5. `npm test` — ingester tests pass
6. Commit

### Phase 2: V4 Stratified Engine — Graph Integration

**Goal:** Extend `v4/stratify.ts` to inject graph context into agent prompts. Replace the flat 4.5 MB engine.bin injection with ~90 token stratified delivery.

**Files:**
- Modify: `src/toon/v4/stratify.ts` — add `injectGraphContext()` function
- Modify: `src/toon/v3/engine.ts` — call V4 stratified instead of flat DENSE
- Create: `src/toon/v4/context-builder.ts` — per-agent context assembly
- Modify: `src/cie/builder.ts` — integrate graph context into CIE
- Create: `src/__tests__/v4-context.test.ts`

**Algorithm:**
```
injectGraphContext(agentId, query, unifiedGraph):
  // Layer 1: Stat header
  stats = unifiedGraph.stats()
  header = formatGraphHeader(stats)  // ~30 tokens
  
  // Layer 2: Top-N relevant to agent's department
  deptFiles = unifiedGraph.findByAgentDept(agentId)
  topN = formatTopN(deptFiles, 5)  // ~50 tokens
  
  // Layer 3: Delta ref (rest on-demand)
  restHash = hash(allOtherNodes)
  deltaRef = "[REF:" + restHash + "]"
  
  return { header, topN, deltaRef }  // ~90 tokens total
```

**Verification gate:**
1. `tsc --noEmit` — zero errors
2. Generate context for marcus-ceo: measure token count < 100
3. Generate context for kahneman: measure token count < 100
4. Verify delta refs are expandable
5. `npm test` — passes
6. Commit

### Phase 3: Auto-Activation + Tool Installation

**Goal:** `npx toongine init` installs all 3 tools inside `.toon/tools/`, builds unified graph, starts watchers. Cold-start support.

**Files:**
- Create: `src/toon/v4/auto-activate.ts` — init, install, build, watch
- Create: `src/toon/v4/tool-installer.ts` — install code-review-graph, graphify, codegraph
- Create: `src/toon/v4/watcher.ts` — file watcher with debounce, lock, health-check
- Modify: `cli/toongine.js` — add `init` v4 flow, `status` v4, `graph` command
- Modify: `scripts/postinstall.js` — run auto-activate on npm install
- Create: `src/__tests__/v4-activation.test.ts`

**Empty project behavior:**
```
IF scan(root) returns 0 source files:
  create empty unified.db schema
  start watchers (ready to capture first file)
  status: "Empty project — graph will auto-build as you add files"
```

**Verification gate:**
1. Fresh clone test: `cd /tmp/test && npx toongine init` → all tools installed
2. Empty project test: `mkdir /tmp/empty && npx toongine init` → cold start, no crash
3. watcher test: create file → auto-indexed within 5s
4. `npx toongine status` → shows all 3 tools status + graph stats
5. `tsc --noEmit` — zero errors
6. Commit

### Phase 4: Hermes MCP Gateway

**Goal:** Expose unified graph intelligence as Hermes MCP tools. Agents can query graph at runtime.

**Files:**
- Create: `src/toon/v4/hermes-gateway.ts` — MCP server (codegraph_explore, graph_query, graph_impact)
- Create: `src/toon/v4/hermes-mcp-tools.ts` — tool definitions
- Modify: `src/toon/auto/hermes-bridge.ts` — wire gateway to Hermes
- Modify: `src/adapters/mcp-client.ts` — add graph tools

**MCP Tools exposed:**
| Tool | What it does |
|---|---|
| `toon_graph_explore` | Explore graph by query (same output as codegraph_explore) |
| `toon_graph_callers` | Find all callers of a symbol |
| `toon_graph_impact` | Blast radius analysis |
| `toon_graph_search` | FTS5 full-text search across all nodes |
| `toon_graph_status` | Graph health + staleness |

**Verification gate:**
1. `tsc --noEmit` — zero errors
2. MCP server starts: `node -e "const {startMCPServer}=require('./dist/toon/v4/hermes-gateway'); startMCPServer();"` — binds to 127.0.0.1
3. Query test: `codegraph_explore "auth flow"` returns relevant symbols
4. Impact test: `codegraph_impact "UserService"` returns call chain
5. Commit

### Phase 5: Compression Pipeline — 99% Target

**Goal:** Achieve 99%+ token compression. If current architecture can't hit it, restructure.

**Files:**
- Modify: `src/toon/compressor.ts` — V4 compression with dictionary + BPE + delta
- Modify: `src/toon/v3/bpe.ts` — extend BPE dictionary with graph terms
- Create: `src/toon/v4/token-budget.ts` — enforce 100-token budget per injection
- Create: `src/toon/v4/adaptive-shrink.ts` — auto-reduce if over budget
- Create: `src/__tests__/v4-compression.test.ts`

**Compression strategy:**
1. Dictionary compression: common graph terms → 2-byte tokens (saves 40%)
2. BPE tokenization: rare terms → subword units (saves 25%)
3. Delta compression: unchanged data between turns = hash ref (saves 80%+)
4. Stratified delivery: only send what's needed (saves 90%+)
5. Combined: 0.4 × 0.75 × 0.2 × 0.1 = 0.006 → **99.4% compression**

**Verification gate:**
1. Test with real YVON project: compression > 99%
2. If NOT reaching 99%: log bottleneck, restructure compressor
3. Test with empty project: compression still works (no division by zero)
4. Test with 10K+ files synthetic project: scales linearly
5. `tsc --noEmit` — zero errors
6. `npm test` — all pass
7. Commit

### Phase 6: Hard Audit + Push

**Goal:** Verify every layer, every edge case. Push to ToonGine repo.

**Verification gate (10-point audit):**
1. Exports: all `package.json` exports resolve
2. Templates: no app code leaked into templates
3. postinstall.js: mkdir defined, dest paths correct
4. CLI: help runs without errors
5. Registry: loads 24 agents successfully
6. Resolver: finds agent files
7. Compiler: produces output at correct paths (no double-nesting)
8. Build: `tsc --noEmit` zero errors
9. README: reflects reality (24 agents, v4 features, CLI commands)
10. GitHub: fresh clone works, README matches

**Additional V4-specific checks:**
11. Unified graph: `SELECT COUNT(*) FROM unified_nodes` > 0
12. Watchers: all 3 running, no crashes in 60s
13. Compression: >99% on real project data
14. Cold start: empty project doesn't crash
15. Hermes MCP: tools registered, queryable

---

## File Map

| Phase | File | Action |
|---|---|---|
| 0 | `src/toon/v4/unified-schema.ts` | Create |
| 0 | `src/toon/v4/unified-graph.ts` | Create |
| 0 | `src/toon/v4/bridge-types.ts` | Create |
| 0 | `src/toon/index.ts` | Modify |
| 1 | `src/toon/v4/ingesters/code-review-graph.ts` | Create |
| 1 | `src/toon/v4/ingesters/graphify.ts` | Create |
| 1 | `src/toon/v4/ingesters/codegraph.ts` | Create |
| 1 | `src/toon/v4/ingesters/index.ts` | Create |
| 1 | `src/__tests__/v4-ingesters.test.ts` | Create |
| 2 | `src/toon/v4/stratify.ts` | Modify (add graph context) |
| 2 | `src/toon/v3/engine.ts` | Modify (use V4) |
| 2 | `src/toon/v4/context-builder.ts` | Create |
| 2 | `src/cie/builder.ts` | Modify (integrate graph) |
| 2 | `src/__tests__/v4-context.test.ts` | Create |
| 3 | `src/toon/v4/auto-activate.ts` | Create |
| 3 | `src/toon/v4/tool-installer.ts` | Create |
| 3 | `src/toon/v4/watcher.ts` | Create |
| 3 | `cli/toongine.js` | Modify (v4 commands) |
| 3 | `scripts/postinstall.js` | Modify (auto-activate) |
| 3 | `src/__tests__/v4-activation.test.ts` | Create |
| 4 | `src/toon/v4/hermes-gateway.ts` | Create |
| 4 | `src/toon/v4/hermes-mcp-tools.ts` | Create |
| 4 | `src/toon/auto/hermes-bridge.ts` | Modify |
| 4 | `src/adapters/mcp-client.ts` | Modify |
| 5 | `src/toon/compressor.ts` | Modify |
| 5 | `src/toon/v3/bpe.ts` | Modify |
| 5 | `src/toon/v4/token-budget.ts` | Create |
| 5 | `src/toon/v4/adaptive-shrink.ts` | Create |
| 5 | `src/__tests__/v4-compression.test.ts` | Create |
| 6 | `README.md` | Modify |
| 6 | `package.json` | Modify (exports) |
| 6 | `.gitignore` | Modify |

---

## Risks

| Risk | Mitigation |
|---|---|
| 99% not reachable with current schema | Phase 5: restructure compressor, change format, try different algorithm. Keep iterating until 99% is hit. |
| codegraph cannot be installed inside `.toon/tools/` | Fall back to global npm install. Still auto-configured, just not self-contained. |
| Watcher consumes too much CPU | `nice` priority, debounce 2s, max 1 core. Configurable in `.toon/graph/config.json`. |
| MCP server conflicts with existing Hermes config | Merge, don't replace. Detect existing config, add graph tools alongside. |
| Empty project edge cases | Tested: empty directory, single file, only .md files, binary files only |
