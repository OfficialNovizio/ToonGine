# YVON Agent Departments

YVON orchestrates **24 agents across 10 departments**. Each agent owns a specific domain, carries role-specific skills, and collaborates through defined handoff protocols.

> ⚠️ **Missing agent:** aria (Content Writer, Marketing) — exists in server registry but has no template folder. Create `templates/agents/Marketing/aria/` before next release.

---

## Department Structure

### CEO — Direction + Accountability

| Agent | Role | Skills |
|-------|------|--------|
| **marcus** | CEO | brand-guardian, kahneman-routing, business-health-diagnostic, creativity-inc, decision-critic, good-strategy-bad-strategy, storytelling, strategy-advisor, vision, challenge-protocol, focus-protocol, reality-distortion-field, reflection-protocol, triple-pass-protocol |

| Agent | Role | Skills |
|-------|------|--------|
| **diana** | COO | acceptance-criteria, content-pipeline-coordination, business-health-diagnostic, prd-development, prioritization-advisor, roadmap-planning, delivery-status, executive-kpi-briefings, lean-startup, milestone, postmortem, pre-dev-delivery-planning, pre-dev-dependency-map, pre-dev-task-breakdown, traction-eos, weekly-review, accountability-architecture, operational-rhythm, reflection-protocol, sprint-master, triple-pass-protocol, nodes-overview, pletor-agent |

### Command — Governance

| Agent | Role | Skills |
|-------|------|--------|
| **board** | Governance Agent | constitution-enforcement, fiduciary-guard, risk-assessment-matrix, decision-critic, postmortem-writing, pre-mortem, reflection-protocol, triple-pass-protocol |

### Finance — Financial Intelligence

| Agent | Role | Skills |
|-------|------|--------|
| **felix** | CFO | ecommerce-metrics, sunk-cost-gate, yvon-pl-runway, finance-based-pricing-advisor, finance-metrics-quickref, saas-economics-efficiency-metrics, saas-revenue-growth-metrics, devil-advocate, finances, saas-metrics, buffett-communication, capital-allocation, margin-of-safety, quality-of-earnings, reflection-protocol, triple-pass-protocol |

### Legal — Compliance + IP Protection

| Agent | Role | Skills |
|-------|------|--------|
| **comply** | Compliance Lead | data-privacy-audit, gdpr-compliance, regulatory-monitoring, soc2-framework, reflection-protocol, triple-pass-protocol |
| **docs** | Legal Documentation | nda-templates, privacy-policy-builder, tos-drafting, reflection-protocol, triple-pass-protocol |
| **guard** | Security & Privacy | open-source-compliance, patent-landscape, trademark-protection, reflection-protocol, triple-pass-protocol |

### Marketing — Revenue + Content

| Agent | Role | Skills |
|-------|------|--------|
| **kai** | Lead Analyst | cohort-analysis, competitor-analysis, content-suggestion-engine, platform-benchmarks, signal-vs-noise, analytics-tracking, marketing-ideas, seo-audit, executive-kpi-briefings, panning-for-gold, reflection-protocol, triple-pass-protocol, brand-analyst |
| **lena** | Brand Strategist | content-layout, emotional-triggers, maslow-copy, cold-email, content-strategy, copy-editing, copywriting, email-sequence, seo-copywriting, social-content, storytelling, reflection-protocol, triple-pass-protocol, ugc-prompter |
| **rio** | Ads Specialist | audience-architecture, roas-diagnostics, ab-test-setup, ad-creative, form-cro, launch-strategy, onboarding-cro, paid-ads, pre-mortem, reflection-protocol, triple-pass-protocol, json-prompter-video, static-ads-prompter, video-prompt-enhancer |
| **nate** | Growth Hacker | funnel-map, ice-scoring-framework, churn-prevention, lead-magnets, marketing-psychology, product-led-growth, referral-program, lean-startup, pre-mortem, reflection-protocol, triple-pass-protocol |
| **atlas** | Art Director | algorithmic-art, brand-guidelines, canvas-design, theme-factory, ai-prompt-architecture, prompt-qa, visual-style-integrity, pre-mortem, reflection-protocol, triple-pass-protocol, image-prompt-enhancer, kling-3-prompter, model-selection |
| **pixel** | Production Artist | asset-delivery, production-pipeline, prompt-variation-engine, qc-criteria-library, upscaling-pipeline, video-production, pre-mortem, reflection-protocol, triple-pass-protocol, json-image-prompter, nano-banana-prompter, advanced-nodes |
| **aria** ↓ | Content Writer | *Missing — template folder not created* |

### Psychology — Behavioral Intelligence

| Agent | Role | Skills |
|-------|------|--------|
| **kahneman** | Behavioral Economist | calibration-tracker, decision-audit, framing-analysis, pre-mortem, reflection-protocol, triple-pass-protocol |

**Kahneman Integration Rules:**
- Called by Marcus when any decision has high financial or strategic stakes
- Mandatory validator for Lena (copy framing) and Rio (ad framing) before delivery
- Supports Kai (bias-corrected data interpretation) and Nate (A/B calibration)
- Two modes: `lean` (fast, high-frequency content) — `deep` (campaigns, repositioning, high-stakes)
- Request format: `@kahneman lean/deep — [check type]: [content or decision]`

### Research — Deep Research

| Agent | Role | Skills |
|-------|------|--------|
| **depth** | Deep Researcher | competitive-teardown, market-mapping, research-methodology, reflection-protocol, triple-pass-protocol |
| **synth** | Research Synthesizer | recommendation-framework, research-synthesis, thesis-building, reflection-protocol, triple-pass-protocol |
| **vette** | Research Validator | fact-checking, misinformation-detection, source-credibility, reflection-protocol, triple-pass-protocol |

### Sense — Discovery + Intel

| Agent | Role | Skills |
|-------|------|--------|
| **forge** | Feasibility Analyst | benchmark-methodology, model-evaluation-framework, paper-reproduction, reflection-protocol, triple-pass-protocol |
| **radar** | Market Radar | competitor-intelligence, market-sizing, trend-detection, reflection-protocol, triple-pass-protocol |
| **scout** | Discovery Scout | api-assessment, emerging-tech-radar, tool-evaluation, reflection-protocol, triple-pass-protocol |

### Technical — Everything That Ships

| Agent | Role | Skills |
|-------|------|--------|
| **dev** | Tech Lead | api-security-checklist, bloom-filter-caching, recovery-patterns, cicd-deploy, finishing-a-development-branch, next-browser, vercel-composition-patterns, vercel-react-best-practices, webapp-testing, reflection-protocol, triple-pass-protocol, subagent-driven-development, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans, writing-skills |
| **raj** | Backend Eng | api-security, auth-middleware, bloom-filter-caching, error-tracking, migration-management, rate-limiting, supabase-rls, reflection-protocol, triple-pass-protocol, systematic-debugging, test-driven-development, verification-before-completion |
| **mia** | Frontend Eng | awesome-design-reference, brand-guidelines, frontend-security, accessibility, frontend-design, responsive-design, vercel-react-best-practices, web-design-guidelines, reflection-protocol, triple-pass-protocol, systematic-debugging, test-driven-development, verification-before-completion, writing-skills |
| **quinn** | QA Engineer | error-log-audit, security-test-checklist, yvon-qa-pulse, webapp-testing, reflection-protocol, triple-pass-protocol, subagent-driven-development, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans, writing-skills |

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

- **Marcus (CEO) is always the entry point** — no agent calls another directly without going through him
- **Hard cap:** 2 specialists max per War Room session
- **Level 1 autonomy** (marcus, diana, dev, kai): can act without review
- **Level 2 autonomy** (all others): draft + review before publish
- **Finance operates independently** — can be consulted directly for financial analysis
- **Board is final constitutional authority** — any constitutional conflict triggers CONDITIONAL verdict

---

## Agent Folder Contents

Each agent folder contains:

| File | Purpose |
|------|---------|
| `AGENT.md` | Identity card — who am I, what do I do |
| `MEMORY.md` | Rolling log of tasks and learnings (fills during work) |
| `SESSION.md` | Current session state (fills during active work) |
| `SKILLS.md` | Load triggers — when to load which skill |
| `TOOLS.md` | Available tools |
| `manifest.toon` | Machine-readable agent spec |
| `skills/` | Agent-specific skill bundles (custom + marketplace + operating-system) |

> **Note:** `COMMANDS.md`, `CONFLICTS.md`, `*-PRINCIPLES.md`, and venture-specific MEMORY files (`MEMORY-novizio.md`, `MEMORY-hourbour.md`) are being phased out. Venture context lives in `docs/ventures/<name>/`. Agent-specific principles live in `AGENT.md` or dedicated principle files where still needed.
