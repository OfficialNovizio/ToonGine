# ToonGine — How Everything Works

## One-sentence summary
ToonGine is a one-install npm package that auto-compresses your project's LLM context, tracks token burn, and gives you a 3-tab dashboard — all zero-config.

---

## Architecture (2 parts)

```
PART 1: YOUR PROJECT (code)
────────────────────────────────
  npm install toongine
  ↓ (postinstall auto-runs)
  • Creates .toon/config.json (project identity)
  • Smart gitignore: caches ignored, config+agents tracked
  • Creates .toon/agents/ directory for agent memory
  • npm run dev → dashboard injected into Next.js sidebar


PART 2: VPS (metrics pipeline)
────────────────────────────────
  Hermes Agent runs your agents (DeepSeek/claude-opus)
  ↓
  state.db records every session (tokens, cost, cwd)
  ↓
  cron job every 5 min ($0 cost):
    scripts/toongine-pipeline.py
    → reads state.db
    → detects project via cwd → .toon/config.json → repo_id
    → POSTs to Supabase (activity_log, snapshots, provider_ledger)
  ↓
  Supabase (mcejxdjrwzjxafciuely.supabase.co)
    → all tables scoped by repo_id
    → RLS policies isolate venture data
```

---

## 3-Tab Dashboard (what you see)

| Tab | Shows | Data source |
|-----|-------|-------------|
| 🕵️ **Agent Memory** | Agent roster, knowledge graph, plugin health, session stats | `/api/agents/infra` (reads .toon/agents/, unified.db, state.db) |
| 🔥 **Token Burn** | Token usage 30d, cost trend, per-agent burn, provider health | `/api/token-burn` (reads Supabase + local SQLite) |
| 🧬 **Health** | TOON compression quality, savings trend, codebase structure, API health | `/api/project-health` (reads compile-cache, metrics buffer) |

**Two ways to view:**
1. `npx toongine dashboard` → launches Express on port 3000 (standalone Vite UI)
2. Install in Next.js project → dashboard auto-injected at `/agents`

---

## TOON Compression (the savings engine)

**Active versions: v3 (stable) + v4 (newest)**

```
Full codebase (100K tokens)
  ↓ v4 Unified Graph ingest
Code → nodes + edges (4,708 nodes)
  ↓ v3 BPE tokenization
Stemmed chunks (94% compression)
  ↓ CIE classify → retrieve → rank
Only relevant chunks injected
  ↓
LLM gets ~6K tokens instead of 100K
```

**What each TOON version does:**

| Version | Purpose | Status |
|---------|---------|--------|
| v3 | BPE compression, query-aware chunking, dual-doc sync (.toon ↔ .md) | ✅ Active |
| v4 | Graph intelligence (unified.db, MCP bridge, auto-activate, watcher) | ✅ Active |
| v1, v2 | Prototype compressors | 🗑️ Removed |

---

## Key files (source tree)

```
src/
├── dashboard/          ← 3-component glass dashboard
│   ├── AgentMemory.tsx   agent roster + graph + plugins
│   ├── TokenBurn.tsx     token usage + cost charts
│   ├── ProjectHealth.tsx compression quality + issues
│   ├── ToonGineDashboard.tsx  3-tab wrapper
│   ├── types.ts         shared data types
│   ├── api.ts           Express API routes (30+ endpoints)
│   ├── server.ts        Express entry (port 3000)
│   ├── inject.ts        auto-inject into Next.js
│   └── ui/              minified Vite app (App.tsx only)
├── toon/
│   ├── v3/              BPE + chunking + sync engine
│   └── v4/              Graph MCP + unified.db + watcher
├── metrics/             collector, agent-tracker, health-checks
├── agents/              registries, personalities, manifest
├── cie/                 classify → retrieve → rank → inject
├── plugins/supabase/    zero-config Supabase plugin
└── adapters/            hermes-sync, mcp-client, config
```

---

## Pipeline (every 5 min, $0 cost)

```
scripts/toongine-pipeline.py:
  1. Reads /root/.hermes/state.db (SQLite)
  2. For each session with cwd:
     a. Climb up directories looking for .toon/config.json
     b. Read repo_id from config.json
     c. Push activity_log row to Supabase (scoped by repo_id)
  3. Push snapshots (token counts, provider health)
  4. Push provider_ledger (per-model cost breakdown)
  5. Flag unattributed sessions (no .toon/config.json found)
```

**Attribution chain:** cwd → .toon/config.json → repo_id → Supabase row

---

## Commands

```
npx toongine init        Initialize project (creates .toon/ + config)
npx toongine dashboard   Launch dashboard on port 3000
npx toongine compile     Rebuild TOON graph + engine.bin
npx toongine watch       Auto-recompile on file changes
npx toongine clean       Remove .toon/ caches (not config)
npx toongine integrate   Full TIER-K setup (TOON + CIE + Graph)
npx toongine stats       Quick project stats
```

---

## 3 rules to remember

1. **Install once, works everywhere.** No .env needed — Supabase anon key hex-baked into compiled JS.
2. **One Supabase, all ventures.** Every table has `repo_id` column — automatic data isolation.
3. **Pipeline runs on VPS only.** $0 cost, reads Hermes state.db locally, pushes to Supabase.
