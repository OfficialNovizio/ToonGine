# ToonGine

**AI Agent OS Kernel — One `npm install`. 24 agents, 8 departments, TOON-compressed.**

```bash
npm install toongine
```

## What Ships

| Feature | Description |
|---|---|
| **24 Agents** | 8 departments: CEO, COO, Command, Finance, Legal, Marketing, Psychology, Research, Sense, Technical |
| **TOON Compiler** | 4-phase pipeline: parse → schema detect → abbreviate → V3 index. ~80%+ token savings |
| **Agent Registry** | Manifest-based agent system with level-gating, council roles, and validation |
| **CONSTITUTION** | 10 immutable laws injected into every agent spawn |
| **Knowledge Graphs** | graphify + codegraph — stored under `.toon/graphs/` |
| **CIE** | Context Intelligence Engine — auto-injects relevant context into every LLM call |
| **Hermes Generator** | Auto-generates Hermes skill files for all 24 agents |
| **Dual-Docs Resolver** | Serves `.toon` compressed or `.md` original — auto-fallback |

## Architecture

```
npm install toongine
       │
       ▼  postinstall.js
       │
       ├── .toon/memory/agent-department/  (24 agents)
       ├── .toon/memory/agent-memory/     (TOON-compiled)
       ├── .toon/graphs/                  (knowledge graphs)
       ├── .toon/docs/                    (CONSTITUTION + ENGINE)
       └── docs/                          (human-readable copies)

YVON OS (consumer) reads from .toon/ at runtime
```

## Agent Departments

| Department | Agents | Level |
|---|---|---|
| **Command** | Board | L1 — full access |
| **CEO** | Marcus | L1 — orchestrator, final say |
| **COO** | Diana | L1 — operations, sprint planning |
| **Finance** | Felix | L2 — financial intelligence |
| **Psychology** | Kahneman | L2 — bias audit, decision review |
| **Legal** | Docs, Comply, Guard | L2-L3 — constitution, compliance |
| **Research** | Vette, Depth, Synth | L3 — deep research pipeline |
| **Sense** | Scout, Radar, Forge | L3 — intelligence gathering |
| **Marketing** | Kai, Lena, Rio, Nate, Atlas, Pixel | L2-L3 |
| **Technical** | Dev, Mia, Raj, Quinn | L2-L3 |

## Quick Start

```bash
npm install toongine
npx toongine doctor       # health check
npx toongine agents       # list 24 agents
npx toongine compile      # TOON-compile all .md files
npx toongine dashboard    # live dashboard at localhost:4200
```

## API

```typescript
// CIE — context injection
import { buildCieContext } from 'toongine'

// TOON compiler
import { compileFile, compileAll } from 'toongine/toon'

// Agent registry
import { loadRegistry, getAgent } from 'toongine/agents'

// Dual-docs resolver
import { resolve, readDoc } from 'toongine/toon/v3/dual-docs'

// Hermes skill generator
import { generateHermesSkills } from 'toongine/agents'
```

## Provider Support

OpenAI-compatible API: Anthropic, OpenAI, DeepSeek, xAI, Google, custom.

## Database Support

Pluggable: Supabase, PostgreSQL, SQLite, in-memory.

## License

MIT — YVON OS
