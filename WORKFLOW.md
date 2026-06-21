# ToonGine — The Real Workflow (for YVON OS Agent Team)

## Step 1: Install in a venture project

```
cd /root/novizio
npm install toongine
```

**What this does:**
```
POSTINSTALL runs automatically:
  ├─ Creates .toon/config.json  →  { repo_id: "stark-labs/novizio", name: "Novizio" }
  ├─ Updates .gitignore  →  .toon/ ignored EXCEPT config.json + agents/ + docs/
  └─ Creates .toon/agents/ directory (for agent memory files)
```

**No config needed.** The Supabase key is baked into the compiled JS.

---

## Step 2: Agents work on the project (Hermes on VPS)

```
YOU → Telegram → Marcus (CEO)
  "Fix the checkout bug in Novizio"

Marcus delegates:
  hermes --profile yvon -s marcus-ceo chat -q "fix the checkout bug"
  workdir: /root/novizio    ← THIS IS THE KEY
```

**Hermes records every session in state.db:**
```
state.db → sessions table
  ├─ cwd: /root/novizio
  ├─ input_tokens: 8,200
  ├─ output_tokens: 5,100
  ├─ estimated_cost_usd: 0.12
  ├─ model: claude-opus-4-7
  └─ started_at, ended_at
```

---

## Step 3: Pipeline syncs to Supabase (every 5 min, $0)

```
cron job runs toongine-pipeline.py:
  1. Opens /root/.hermes/state.db
  2. For each completed session:
     ├─ Reads cwd → climbs up dirs → finds .toon/config.json
     ├─ Gets repo_id: "stark-labs/novizio"
     └─ POSTs to Supabase → toongine_activity_log
  3. Pushes snapshots (aggregated token/cost per project)
  4. Pushes provider ledger (per-model cost breakdown)

If no .toon/config.json found:
  → session flagged "unattributed" (visible in dashboard)
```

**Attribution chain:**
```
cwd: /root/novizio/app/api/checkout/route.ts
  ↓ climb up
/root/novizio/app/api/checkout/
/root/novizio/app/api/
/root/novizio/app/
/root/novizio/.toon/config.json  ← FOUND! repo_id = stark-labs/novizio
```

---

## Step 4: YVON OS Dashboard shows everything

```
YVON OS at yvon.in → /agents
  │
  ├─ Venture switcher: Novizio ▼
  │
  ├─ 🕵️ Agent Memory tab  →  agent roster, sessions, graph health
  │     GET /api/agents/infra  →  reads .toon/agents/ + unified.db + state.db
  │
  ├─ 🔥 Token Burn tab   →  tokens per day, cost per agent, provider health
  │     GET /api/token-burn   →  reads Supabase toongine_activity_log
  │
  └─ 🧬 Health tab      →  TOON compression quality, savings, issues
        GET /api/project-health →  reads compile-cache + metrics buffer
```

**All data scoped by venture.** Novizio only sees Novizio's telemetry.

---

## The graph (optional — boosts context quality)

```
cd /root/novizio
npx toongine compile

Builds:
  .toon/graph/unified.db
    ┌──────────────┬──────────────┬──────────────┐
    │ unified_nodes │ unified_edges │ communities  │
    │ symbols       │ call graphs    │ clusters     │
    └──────────────┴──────────────┴──────────────┘

  .toon/hermes/mcp-server.py
    └─ Hermes connects via MCP → 5 graph tools
       ├─ search symbols
       ├─ find callers
       ├─ blast radius
       ├─ full-text search
       └─ graph status

Result: Agent gets 100K-token codebase context
        compressed to ~90 tokens via stratified delivery
        (stat header → top-N → delta refs)
```

---

## Source tree (what actually matters)

```
ToonGine source repo (# this is what's on GitHub):
──────────────────────────────────────────────────
src/
├── dashboard/         3 tabs (all you ever see)
│   ├── AgentMemory.tsx    agent roster + graph + plugins
│   ├── TokenBurn.tsx      token usage + cost charts
│   ├── ProjectHealth.tsx  compression quality + issues
│   └── api.ts             Express routes (30 endpoints)
├── toon/v4/           graph engine (compiles code → context)
│   ├── auto-activate.ts   one-command init
│   ├── unified-graph.ts   SQLite knowledge graph
│   ├── context-builder.ts per-agent stratified context
│   └── hermes-gateway.ts  MCP bridge (5 tools)
├── plugins/supabase/  connects to Supabase
├── metrics/           token tracking + health checks
└── agents/            agent registry + personalities
cli/toongine.js        all CLI commands
scripts/
├── postinstall.js         auto-runs on npm install
├── preuninstall.js        cleans up on npm uninstall
└── toongine-pipeline.py   state.db → Supabase (cron)

Installed in Novizio project (# what you see in the venture):
──────────────────────────────────────────────────
.toon/
├── config.json        { repo_id: "stark-labs/novizio" }
├── agents/            agent memory files (tracked in git)
├── graph/             unified.db (built by compile)
└── hermes/            MCP server (Hermes connects to this)
```

---

## 3 things to remember

1. **Install once, cwd does the rest.** Postinstall creates config.json. Hermes records cwd. Pipeline finds it. Zero manual wiring.

2. **One Supabase, all ventures isolated.** Every table has `repo_id`. RLS policies scope data. Hourbour can't see Novizio's telemetry.

3. **Graph is optional but powerful.** Without it: agents get just their memory. With it: agents get codebase context at ~97% token savings.
