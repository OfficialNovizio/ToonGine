# ToonGine — CAOS Cognitive Agent OS

One `npm install`. 25 AI agents. Full venture OS.

```bash
npx toongine init    # Deploy agents, scaffold .toon/, build graphs
```

---

## Architecture

```
npx toongine init
       │
       ▼
┌──────────────────────────────────────────────────┐
│                VPS (Hermes Agent)                 │
│                                                   │
│  POST :4201/register → creates project            │
│  /root/.toon/projects/<name>/                     │
│    ├── agents/         25 agents                  │
│    ├── metrics.json    token burn, cost, sessions │
│    ├── config.json     project config + memory    │
│    └── graphs/         codegraph, graphify        │
│                                                   │
│  Pipeline (every 5 min):                          │
│    state.db → metrics.json → GitHub .toon/        │
│                                                   │
│  API (:4201):                                     │
│    /register  /projects  /metrics  /agents        │
│    /health    /metrics/all                        │
└──────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│              Vercel Dashboard (yvon.in)            │
│                                                   │
│  Agents tab → Token Burn / Health / Memory        │
│  All data from VPS API — real metrics             │
└──────────────────────────────────────────────────┘
```

---

## 25 Agents — 10 Departments

| Department | Agents | Role |
|-----------|--------|------|
| **CEO** | marcus | Direction + Orchestration |
| **COO** | diana | Operations + Sprints |
| **Command** | board | Governance + Constitutional Authority |
| **Finance** | felix | Financial Intelligence |
| **Legal** | comply, docs, guard | Compliance, Docs, Security |
| **Marketing** | kai, lena, rio, nate, atlas, pixel, aria | Revenue + Content (7 agents) |
| **Psychology** | kahneman | Behavioral Intelligence + Bias Audit |
| **Research** | depth, synth, vette | Deep Research + Synthesis + Validation |
| **Sense** | forge, radar, scout | Discovery + Market Intel + Feasibility |
| **Technical** | dev, raj, mia, quinn | Architecture, Backend, Frontend, QA |

---

## Agent File Structure

Every agent carries:

| File | Purpose |
|------|---------|
| `AGENT.md` | Identity — who, what, personality |
| `MEMORY.md` | Learnings across sessions (fills during work) |
| `SESSION.md` | Current task state (fills during active work) |
| `SKILLS.md` | Load triggers — when to load what skill |
| `TOOLS.md` | Available tools |
| `manifest.toon` | Machine-readable spec |
| `skills/` | Custom skills + Marketplace skills + OS protocols |

---

## Governance Cycle (Board)

Every strategic decision flows through 4 gates:

```
Pre-Mortem → Decision Critic → Fiduciary Guard → Strategic Veto
     │              │                │                  │
  "What could    "Stress-test    "Can we afford    "Should we do
   go wrong?"     the logic"      this?"            this?"
```

Board skills:
- **Custom:** constitution-enforcement, fiduciary-guard, risk-assessment-matrix, strategic-veto
- **Marketplace:** decision-critic, postmortem-writing, pre-mortem
- **OS:** reflection-protocol, triple-pass-protocol

---

## Pipeline

`toongine-pipeline.py` (cron every 5 min):

1. Reads Hermes `state.db` — sessions, tokens, costs, agent attribution
2. Matches sessions to projects via working directory
3. Writes per-project `metrics.json` (tokens, cost, hourly burn, per-agent, per-provider)
4. Syncs agent memory health stats to `config.json`
5. Pushes `.toon/` to GitHub for visibility

Zero Supabase. Zero fake data.

---

## API Endpoints (VPS :4201)

| Endpoint | Returns |
|----------|---------|
| `POST /register` | Create project — deploys 25 agents |
| `GET /projects` | List all registered projects |
| `GET /metrics?project=<name>` | Per-project token burn, cost, agents |
| `GET /metrics/all` | Aggregate across all projects |
| `GET /agents?project=<name>` | Agent memory health per project |
| `GET /health` | Server status |

---

## Per-Project Structure

After `npx toongine init`, the VPS creates:

```
/root/.toon/projects/<name>/
├── agents/              25 agents with MEMORY.md
│   ├── CEO/marcus/
│   ├── COO/diana/
│   ├── Command/board/
│   ├── Finance/felix/
│   ├── Legal/{comply,docs,guard}/
│   ├── Marketing/{kai,lena,rio,nate,atlas,pixel,aria}/
│   ├── Psychology/Daniel_Kahneman/
│   ├── Research/{depth,synth,vette}/
│   ├── Sense/{forge,radar,scout}/
│   └── Technical/{dev,raj,mia,quinn}/
├── config.json          repo_id, version, agent memory health
├── metrics.json         token burn, cost, sessions, hourly, per-agent
├── graph/ codegraph/ graphify/ code-review-graph/
├── hermes/              bridge config
└── state/               runtime state
```

---

## CAOS Pipelines (yvon-engine/.toon/hermes/caos/)

| Module | Purpose |
|--------|---------|
| `pipeline_router.py` | Classifies intent: NEW_PROJECT / NEW_FEATURE / NEW_IDEA |
| `research_phase.py` | 6-agent research gate with 5-dimension scoring |
| `agent_protocol.py` | 4 checkpoints (CP1-CP4) — every agent self-questions |
| `caos_loop.py` | Marcus → Diana → Dev/Raj/Mia → Quinn → Council |
| `caos_executor.py` | Executes agent tasks with discipline gates |
| `caos_verifier.py` | Post-execution verification |
| `discipline_gate.py` | 6 discipline gates before output ships |
| `council.py` | Cross-agent deliberation and conflict resolution |
| `self_counter.py` | Agent self-critique and correction loop |
| `memory_store.py` | Persistent agent memory operations |
| `agent_registry.py` | Agent manifest, capabilities, department map |
| `project_registry.py` | Multi-project isolation and routing |

---

## Commands

```bash
npx toongine init              # Deploy agents + scaffold project
npx toongine compile           # Build TOON compression corpus
npx toongine graphify:build    # Build AST knowledge graph
npx toongine codegraph:build   # Build import dependency graph
npx toongine project list      # List registered projects
npx toongine project switch    # Switch active project
npx toongine dashboard         # Standalone dashboard (port 4200)
```

---

## Stack

- **Agent runtime:** Hermes Agent on VPS (DeepSeek v4)
- **Compression:** TOON v4 — 84.5% token savings
- **Dashboard:** Next.js 15 on Vercel
- **Graphs:** code-review-graph (semantic), graphify (AST), codegraph (imports)
- **Pipeline:** Python cron, zero Supabase dependency
