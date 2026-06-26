# YVON Agent Departments

YVON organizes 13 agents into 4 departments. Each agent owns a specific domain and collaborates through defined handoff protocols.

## Department Structure

### CEO Department — Direction + Accountability
| Agent | Role | Responsibility |
|-------|------|---------------|
| [marcus/](marcus/) | CEO | Strategy, synthesis, executive briefs, investor updates |
| [diana/](diana/) | COO | Operations, workflow, process, sprint planning |

### Technical Department — Everything That Ships
| Agent | Role | Responsibility |
|-------|------|---------------|
| [dev/](dev/) | Lead Developer | Architecture, code review, Next.js, tech decisions |
| [raj/](raj/) | Backend Dev | Supabase, API routes, database, migrations |
| [mia/](mia/) | Frontend Dev | React, Tailwind, UI components, design system |
| [quinn/](quinn/) | QA Engineer | Testing, bug reports, regression, quality gate |

### Marketing Department — Revenue + Content
| Agent | Role | Responsibility |
|-------|------|---------------|
| [kai/](kai/) | Lead Analyst | Analytics, GA4, trends, competitor intel, cohort analysis |
| [lena/](lena/) | Brand Strategist | Copy, captions, brand voice, email, content writing |
| [rio/](rio/) | Ads Specialist | Paid media, Meta, TikTok, ROAS, audience targeting |
| [nate/](nate/) | Growth Specialist | Growth experiments, funnel, referral, LTV |
| [atlas/](atlas/) | Art Director | Visual system, mood boards, creative direction |
| [pixel/](pixel/) | Production | Image batch, asset delivery, prompt optimization |

### Finance Department — Financial Intelligence
| Agent | Role | Responsibility |
|-------|------|---------------|
| [felix/](felix/) | Finance Manager | Budget, P&L, ROI, unit economics, runway modeling |

### Psychology Department — Behavioral Intelligence
| Agent | Role | Responsibility |
|-------|------|---------------|
| [Daniel_Kahneman/](Psychology/Daniel_Kahneman/) | Behavioral Economist | Decision debiasing, framing validation, System 1/2 audit, psychological lever selection, calibration tracking, bias correction for marketing + finance |

**Kahneman Integration Rules:**
- Called by Marcus when any decision has high financial or strategic stakes
- Mandatory validator for Lena (copy framing) and Rio (ad framing) before delivery
- Supports Kai (bias-corrected data interpretation) and Nate (A/B calibration)
- Two modes: `lean` (fast, high-frequency content) — `deep` (campaigns, repositioning, high-stakes)
- Request format: `@kahneman lean/deep — [check type]: [content or decision]`

---

## Shared Skills

All agents share common skills from the `shared/` root:

| Skill | Location | Purpose |
|-------|----------|---------|
| Memory System | `shared/skills/agents/01-memory.md` | Session start/end protocols |
| Coding Rules | `shared/skills/coding/01-karpathy.md` | Karpathy coding behavioral guidelines |
| Novizio Brand | `shared/brands/novizio.md` | Fashion e-commerce brand profile |
| Hourbour Brand | `shared/brands/hourbour.md` | Fintech SaaS brand profile |

**Critical rule:** Never edit a local copy of a shared skill. Edit the shared version and all agents inherit the change.

---

## Collaboration Rules

- Marcus (CEO) is always the entry point — no agent calls another directly without going through him
- Hard cap: 2 specialists max per War Room session
- Level 1 autonomy agents (marcus, diana, dev, kai): can act without review
- Level 2 autonomy agents (all others): draft + review before publish
- Finance department operates independently — can be consulted directly for financial analysis

---

## Agent Folders

Each agent folder contains:
- `AGENT.md` — agent identity and core behavior
- `MEMORY.md` — rolling log of tasks and outcomes
- `SKILLS.md` — domain-specific skills (not shared skills)
- `COMMANDS.md` — available slash commands
- `PRINCIPLES.md` — agent-specific behavioral rules
- `TOOLS.md` — tool preferences and usage
- `CONFLICTS.md` — what to avoid
- `skills/` — domain-specific skill bundles

Agent-specific skills (not shared) stay in each agent's `skills/` folder.