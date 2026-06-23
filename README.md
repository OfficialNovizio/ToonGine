# ToonGine v5 — CAOS Cognitive Agent Operating System

**18 engines · 14 agents · real DeepSeek/Hermes execution · SQLite FTS5 · 5 MCP graph tools · 99.97% TOON compression**

## Quick Install

```bash
npm install -g github:OfficialNovizio/ToonGine#master
npx toongine init        # one command — everything
npx toongine doctor       # health check — all systems
```

---

## Architecture

```
                         npx toongine init
                              │
    ┌─────────────────────────┼─────────────────────────┐
    ▼                         ▼                         ▼
┌──────────┐           ┌──────────────┐          ┌──────────┐
│ 3 GRAPHS │           │  CAOS AGENTS │          │  HERMES  │
│          │           │              │          │  BRIDGE  │
│ codegraph│           │ agent_registry│         │ MCP tools│
│ graphify │           │ 14 personas  │          │ auto-wire│
│ cr-graph │           │ 4 council    │          │ config   │
└────┬─────┘           └──────┬───────┘          └────┬─────┘
     │                        │                      │
     └────────────┬───────────┘                      │
                  ▼                                  │
         ┌────────────────┐                          │
         │  unified.db    │◄─────────────────────────┘
         │  FTS5 search   │
         └───────┬────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │        CAOS PIPELINE               │
    │                                    │
    │  USER TASK: "build auth system"    │
    │      │                             │
    │      ├─ Marcus (AgenticCoordinator)│
    │      │  → decompose + assign       │
    │      ├─ Diana (scheduler)          │
    │      │  → parallel rounds          │
    │      ├─ Agent executes (DeepSeek)  │
    │      │  + session injection        │
    │      │  + graph query (MCP)        │
    │      ├─ Self-Counter               │
    │      ├─ Cross-Dept Challenge       │
    │      ├─ Quinn (real verification)  │
    │      │  syntax→lint→type→test→sec  │
    │      ├─ Kahneman (reasoning audit) │
    │      │  fallacies + biases + evid. │
    │      ├─ Discipline Gate (6 gates)  │
    │      ├─ Council (LLM deliberation) │
    │      └─ Output → SQLite FTS5 mem   │
    │           + Mistake→prevention rule│
    └────────────────────────────────────┘
```

---

## What `npx toongine init` Does (7 Phases)

### Phase 1 — Detect
```
Platform: Windows/Linux auto-detect (python/python3, where/which)
Tools:    codegraph, graphify, code-review-graph — check if installed
API keys: DEEPSEEK_API_KEY or ANTHROPIC_API_KEY
Hermes:   ~/.hermes/memories/USER.md exists?
```

### Phase 2 — Install Missing Tools
```
npm i -g @colbymchenry/codegraph       → import dependency mapper
pip install graphifyy                     → semantic community detection
pip install code-review-graph            → tree-sitter AST analyzer
```
Skips already-installed tools.

### Phase 3 — Build 3 Knowledge Graphs
```
codegraph init                          → .codegraph/codegraph.db
  ├─ Imports resolved (TS/JS/Python)
  ├─ Hub files (most-imported)
  └─ Dependency graph

graphify extract . --backend auto       → .toon/graphify/GRAPH_REPORT.md
  ├─ LLM-powered semantic analysis
  ├─ Community detection
  └─ Cohesion scoring
  (Falls back to built-in regex if no API key)

code-review-graph build                 → .toon/code-review-graph/graph.db
  ├─ Tree-sitter AST parsing
  ├─ Symbol extraction
  ├─ Call graph construction
  └─ Bug pattern detection
```

### Phase 4 — Synthesize TOON Reports
```
synthesize-codegraph.py          → .toon/codegraph/CODEGRAPH_REPORT.toon
synthesize-graphify.py           → .toon/graphify/GRAPH_REPORT.toon
synthesize-code-review-graph.py  → .toon/code-review-graph/CODEGRAPH_REPORT.toon
```
Each builds abbreviation dictionaries. `authentication` → `§42`. 99.97% compression.

### Phase 5 — Deploy CAOS Agents
```
AgentRegistry loaded from .toon/hermes/caos/agent_registry.py
14 agents deployed with personas, capabilities, departments
4 council members: marcus (CEO), diana (COO), felix (Finance), kahneman (Psychology)
Memory stores initialized (SQLite FTS5)
Strike tracking initialized
```

### Phase 6 — V4 Graph Activation + MCP Wire
```
dist/toon/v4/auto-activate.js:
  → Merge 3 graphs → unified.db (FTS5 search)
  → Deploy MCP server → .toon/hermes/mcp-server.py
  → Auto-wire to ~/.hermes/config.yaml (5 graph tools + permissions)
```

### Phase 7 — Dashboard
```
toongine dashboard → localhost:4200
Real metrics from unified.db — not fake data.
```

---

## CAOS Pipeline — How Agents Execute Tasks

```
USER: "build auth system with login and signup"
  │
  ├─ MARCUS (AgenticCoordinator) plans
  │   AgenticCoordinator.plan(task)
  │   → Decomposes: DB schema → API → UI → tests → security audit
  │   → Matches agents by fitness (category + success_rate - load - strikes)
  │   → Extracts spec: features, edge cases, constraints, tests
  │
  ├─ DIANA schedules
  │   Topological sort → parallel execution rounds
  │   Speculative: start B before A finishes if A is reliable (>85%)
  │
  └─ FOR EACH TASK → AGENT EXECUTES
      │
      ├─ SESSION INJECTION
      │   SQLite FTS5 search across all history
      │   → Top 5 episodic memories
      │   → Top 3 past mistakes
      │   → Prevention rules from MistakeRulesEngine
      │   → Graph context from unified.db
      │   → Strike status + confidence multiplier
      │   → TOON-compressed → ~29 tokens
      │
      ├─ AGENT GENERATES (via Hermes → DeepSeek)
      │   CaosExecutor reads provider/model from ~/.hermes/config.yaml
      │   Agent persona: "You are Raj, backend lead. Write clean APIs..."
      │   Discipline rules: 10 rules (never hardcode secrets, parameterized SQL...)
      │   Full context injection (memories + rules + graph + spec)
      │   → Calls Hermes-configured model API
      │
      ├─ AGENT QUERIES GRAPH (MCP tools)
      │   toon_graph_search("auth")          → finds auth.ts, login.ts
      │   toon_graph_callers("hashPassword") → register.ts, login.ts
      │   toon_graph_impact("UserSchema")    → 5 files affected
      │
      ├─ SELF-COUNTER
      │   Agent attacks its own output
      │   Finds flaws → revises → re-checks (max 3 retries)
      │
      ├─ CROSS-DEPT CHALLENGE
      │   Other departments audit the output
      │   File challenges for issues found
      │
      ├─ QUINN (CaosVerifier) — real execution
      │   SYNTAX:   compile(code) or tsc --noEmit
      │   LINT:     flake8 or eslint
      │   TYPE:     mypy or tsc
      │   TESTS:    pytest or jest
      │   SECURITY: scan for secrets, SQL injection, eval()
      │   → CRITICAL/ERROR = REJECTED
      │
      ├─ KAHNEMAN (ReasoningEngine) — real audit
      │   10 fallacies detected (circular, false dichotomy...)
      │   10 biases detected (confirmation, overconfidence...)
      │   Evidence chains built (trace every claim)
      │   Uncertainty quantified (confidence intervals)
      │   → Fallacies/weak evidence = REJECTED
      │
      ├─ DISCIPLINE GATE (6 gates)
      │   DATA:         has evidence from tools/graph?
      │   LOGIC:        has reasoning chain?
      │   VERIFY:       Quinn passed?
      │   SELF-COUNTER: agent attacked own output?
      │   CONFIDENCE:   above 0.75?
      │   COUNCIL:      high-stakes approved?
      │   → ANY gate fails = BLOCKED, agent: "I need more data"
      │
      ├─ COUNCIL (real LLM deliberation)
      │   Marcus (DeepSeek): deliberates + votes
      │   Diana, Kahneman, Felix: deterministic fallback
      │   3/5 majority required for threaten/demote/suspend/override
      │
      ├─ BELIEF UPDATE (Bayesian)
      │   P(H|E) = P(E|H)P(H)/P(E)
      │   Confidence < 0.3 → 💀 KILL belief
      │
      └─ OUTPUT DELIVERED or RETRY
          Passed → COMPLETED (SQLite memory updated)
          Failed → retry/reassign (max 3x) → fallback agent

AFTER TASK:
  ├─ Memory updated (SQLite FTS5 — episodic, semantic, procedural, mistake)
  ├─ Mistake → prevention rule (pattern extraction + generalization)
  ├─ Agent capability updated (EMA on success_rate + avg_time)
  └─ State vector updated
```

---

## CLI Reference — All Commands

```bash
# ── Setup ──────────────────────────────────────────────────
npx toongine init              # Full install: graphs + agents + CAOS + MCP
npx toongine doctor            # Health check — all systems operational
npx toongine doctor --stale    # Check for stale graph outputs

# ── Agents (CAOS Agent Registry) ───────────────────────────
npx toongine agent list        # All agents with status/department/role
npx toongine agent add <name>  # Add new agent (--dept --role --categories...)
npx toongine agent remove <n>  # Archive agent (preserves memories)
npx toongine agent edit <n>    # Edit capabilities (--success-rate 0.9...)
npx toongine agent suspend <n> # Suspend from rotation
npx toongine agent reinstate <n> # Reactivate

# ── Graphs ─────────────────────────────────────────────────
npx toongine compile           # Rebuild all TOON reports + unified.db
npx toongine graph             # Rebuild per-tool graphs
npx toongine clean             # Remove stale duplicates

# ── Dashboard ──────────────────────────────────────────────
npx toongine dashboard         # Start (port 4200) — real metrics

# ── Hermes ─────────────────────────────────────────────────
npx toongine hermes connect    # Auto-wire MCP into Hermes config

# ── Info ───────────────────────────────────────────────────
npx toongine version           # Show version
npx toongine stats             # Compression stats
```

---

## 5 MCP Graph Tools

Auto-registered with Hermes on `init`. No manual config.

| Tool | Purpose | Example |
|------|---------|---------|
| `toon_graph_search` | Full-text search all symbols | `toon_graph_search("auth flow")` |
| `toon_graph_explore` | Natural language exploration | `toon_graph_explore("database connection")` |
| `toon_graph_callers` | Find who calls a symbol | `toon_graph_callers("login")` |
| `toon_graph_impact` | Blast radius analysis | `toon_graph_impact("UserSchema")` |
| `toon_graph_status` | Graph health metrics | nodes, edges, staleness, coverage |

---

## CAOS Engines (`.toon/hermes/caos/`)

| Engine | File | Purpose |
|--------|------|---------|
| Pipeline | `pipeline.py` | 6-phase execution: plan→schedule→execute→verify→council→synthesize |
| Executor | `caos_executor.py` | Agent → Hermes config → model API (DeepSeek/OpenRouter/etc.) |
| Verifier | `caos_verifier.py` | Real verification: syntax→lint→type→test→security |
| Coordinator | `agentic_coordinator.py` | Capability matrix + task decomposition + speculative scheduling |
| Coding Engine | `coding_engine.py` | 12 anti-patterns + spec extraction + project rules |
| Reasoning Engine | `reasoning_engine.py` | 10 fallacies + 10 biases + evidence chains + Bayesian update |
| Mistake Rules | `mistake_rules.py` | Mistake→prevention rule + session injection + feedback loop |
| Discipline Gate | `discipline_gate.py` | 6 gates: DATA/LOGIC/VERIFY/SELF-COUNTER/CONFIDENCE/COUNCIL |
| Council | `council.py` | Real LLM deliberation + deterministic fallback |
| Agent Registry | `agent_registry.py` | Single source of truth — add/remove/edit agents at runtime |
| Memory System | `memory_system.py` | SQLite FTS5 — episodic, semantic, procedural, mistake, working |
| Memory Store | `memory_store.py` | SQLite FTS5 database — BM25 search across all history |
| Self-Counter | `self_counter.py` | Agent attacks own output before submission |
| Challenge | `challenge_protocol.py` | Cross-department adversarial review |
| Counter-User | `counter_user.py` | Agents VETO dangerous user requests |
| Algorithms | `algorithms.py` | DSA: TaskDAG, BeliefPropagation, PriorityScheduling |
| Algorithms v2 | `algorithms_v2.py` | Beam Search, MCTS, Speculative Exec, Fibonacci Heap, Bloom Filter |

---

## 14 Agents — 8 Departments

| Dept | Agents | Council |
|------|--------|---------|
| Executive | marcus (CEO), diana (COO) | ✅ marcus (2 votes), diana |
| Technical | dev, rio | |
| Backend | raj, nate | |
| Frontend | mia | |
| Testing | quinn | |
| Design | kai, lena | |
| Finance | felix | ✅ |
| Psychology | kahneman | ✅ |
| Research | vette, depth | |

Add/remove/edit agents at runtime: `npx toongine agent add nova --dept frontend`

---

## Memory Architecture

```
SQLite FTS5 database: .toon/memory/caos_memory.db

5 Memory Types:
  EPISODIC:   what happened (task logs)
  SEMANTIC:   what I know (facts)
  PROCEDURAL: how to do (patterns)
  MISTAKE:    what NOT to do (errors → prevention rules)
  WORKING:    right now (current task state)

Search:  FTS5 full-text with BM25 ranking
Query:   memory_store.search("auth login", agent="raj", memory_type="mistake")
          → Returns mistakes about "auth login" in milliseconds
          → Works across months of history

Session injection: top 5 episodic + top 3 mistakes + top 3 procedures
                 → TOON-compressed → ~29 tokens
```

---

## Install from GitHub

```bash
# Latest (v5)
npm install -g github:OfficialNovizio/ToonGine#master

# Windows: if github: protocol fails, clone + npm link
git clone https://github.com/OfficialNovizio/ToonGine
cd ToonGine && npm link
```

---

## Requirements

- Node.js ≥ 18
- Python ≥ 3.10
- Git (for code-review-graph)
- [Hermes Agent](https://hermes-agent.nousresearch.com) (for MCP tools + CAOS execution)
- DEEPSEEK_API_KEY (for agent execution via Hermes)

---

## Version History

| Version | What |
|---------|------|
| v1.x | Initial TOON compression, basic graphs, agent deployment |
| v4 | Unified graph, V4 bridge, MCP tools, 3-tool graph |
| **v5** | **CAOS — 18 engines, real DeepSeek/Hermes execution, SQLite FTS5, council deliberation, discipline gate, mistake→rule pipeline, agent registry** |

---

## License

MIT — YVON OS
