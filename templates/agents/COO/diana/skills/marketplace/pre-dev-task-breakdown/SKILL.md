---
name: ring:pre-dev-task-breakdown
description: |
  Gate 7 (Full Track) / Gate 3 (Small Track): Implementation tasks - value-driven decomposition into working increments
  that deliver measurable user value.
---

# Task Breakdown — Value-Driven Decomposition

## When to use

- TRD passed Gate 3 (Full Track) / Gate 2 (Small Track)
- Dependency Map passed Gate 6 (Full Track only)
- Ready to create sprint/iteration tasks

## Skip when

- TRD not validated → complete earlier gates
- Tasks already exist → proceed to Subtask Creation
- Trivial change → direct implementation

## Sequence

**Runs before:** ring:pre-dev-subtask-creation (Full Track), ring:pre-dev-delivery-planning (Small Track)
**Runs after:** ring:pre-dev-dependency-map (Full Track), ring:pre-dev-trd-creation (Small Track)


Every task must deliver working software with measurable user value. Tasks answer WHAT working increment is delivered, never HOW it's implemented (that's subtasks).

## Mandatory Workflow

| Phase | Activities |
|-------|------------|
| **1. Task Identification** | Load PRD (required), TRD (required); optionally Feature Map, API Design, Data Model, Dependency Map; identify value streams |
| **2. Decomposition** | Per feature: define deliverable, set success criteria, map dependencies, estimate effort (max 16 AI-agent-hours), plan testing, identify risks |
| **3. Gate 7 Validation** | All TRD components covered; every task delivers working software; measurable success criteria; correct deps; no task >2 weeks; testing strategy defined |

## Task Sizing Rules

| Size | AI-agent-hours | Calendar Duration* | Scope |
|------|----------------|-------------------|-------|
| Small (S) | 1-4h | 1-2 days | Single component |
| Medium (M) | 4-8h | 2-4 days | Few dependencies |
| Large (L) | 8-16h | 1-2 weeks | Multiple components |
| XL (>16h) | BREAK IT DOWN | Too large | Not atomic |

*1.5x multiplier, 90% capacity, 1 developer

## AI-Assisted Estimation

After defining task scope, dispatch the appropriate specialist agent to estimate AI-agent-hours:

| Project Type | Agent |
|-------------|-------|
| Go | ring:backend-engineer-golang |
| TypeScript Backend | ring:backend-engineer-typescript |
| React/Next.js | ring:frontend-engineer |
| Mixed/Unknown | ring:codebase-explorer |

Agent analyzes: endpoints/schemas/services, complexity, available libraries, test requirements, documentation needs — and returns a detailed breakdown by component.

**Confidence levels:** High (standard patterns + libs available), Medium (some custom logic), Low (novel algorithms or vague scope)

**Estimation fallback:** If AI unavailable, use manual estimate with 1.3x buffer, mark as "Estimation Pending", re-estimate when service restored.

## Per-Task Template

| Section | Content |
|---------|---------|
| **Header** | T-[XXX]: [Task Title] |
| **Target** | backend \| frontend \| shared (if multi-module) |
| **Working Directory** | Path from topology config (if multi-module) |
| **Agent** | Recommended agent: ring:backend-engineer-* or ring:frontend-*-engineer-* |
| **Deliverable** | One sentence: what working software ships |
| **Scope** | Includes + Excludes (with task IDs for future work) |
| **Success Criteria** | Testable: Functional, Technical, Operational, Quality |
| **User/Technical Value** | What users can do; what this enables |
| **Technical Components** | From TRD + From Dependencies |
| **Dependencies** | Blocks (T-AAA), Requires (T-BBB), Optional (T-CCC) |
| **Integration Contracts** | Required when task references external product/plugin |
| **Effort Estimate** | AI hours, confidence, method, team type, breakdown |
| **Risks** | Impact, Probability, Mitigation, Fallback |
| **Testing Strategy** | Unit, Integration, E2E, Performance, Security |
| **Definition of Done** | Code reviewed, tests passing, docs updated, security clean, deployed to staging, PO acceptance |

## Integration Contracts

Required when Deliverable, Technical Components, or Success Criteria references an external product or plugin (plugin-pix, plugin-fees, Core two, etc.).

```markdown
## Integration Contracts
| ID | Product/Plugin | Endpoint/Interface | Method | Request Schema | Response Schema | Version |
|----|---------------|-------------------|--------|---------------|----------------|---------|
| IC-001 | plugin-pix | POST /api/v1/pix/payments | POST | { amount, key, ... } | { id, status, ... } | v1.2.0 |
```

Rules: exact endpoint/interface, all required request fields, fields the implementation will read, exact API version (not `latest`), sourced from actual spec.

## Summary Tables (top of tasks.md)

**Table 1 — Technical Overview:**
```markdown
## Summary
| Task | Title | Type | Hours | Confidence | Blocks | Status |
|------|-------|------|-------|------------|--------|--------|
| T-001 | Project Foundation | Foundation | 3.0 | High | All | ⏸️ Pending |
|       | **TOTAL** | | **85.0h** | | | |
```

Status lifecycle: `⏸️ Pending` (creation) → `🔄 Doing` (Gate 0 started) → `✅ Done` (Gate 9 approved) → `❌ Failed` (unresolved blocker)

**Table 2 — Business Deliverables View** (immediately after Table 1):
```markdown
## Business Deliverables
| Task | Deliverable (business view) |
|------|-----------------------------|
| T-001 | The team can develop and test locally from day one — **every contributor gets a working environment**. |
```

Business Deliverables rules: plain language (no technical jargon), 1-3 sentences, active voice, core value proposition bolded, no file names or architecture terms.

## Multi-Module Task Tagging (if topology is multi-module)

Each task MUST have `Target:` and `Working Directory:` when topology is monorepo or multi-repo.

| Target | API Pattern | Agent |
|--------|-------------|-------|
| `backend` | any | ring:backend-engineer-golang or ring:backend-engineer-typescript |
| `frontend` | `direct` | ring:frontend-engineer |
| `frontend` | `bff` (API routes) | ring:frontend-bff-engineer-typescript |
| `frontend` | `bff` (UI components) | ring:frontend-engineer |
| `shared` | any | DevOps or general |

**Output paths:**
- single-repo: `docs/pre-dev/{feature}/tasks.md`
- monorepo: Index + `{backend.path}/docs/pre-dev/{feature}/tasks.md` + `{frontend.path}/docs/pre-dev/{feature}/tasks.md`
- multi-repo: `{backend.path}/docs/pre-dev/{feature}/tasks.md` + `{frontend.path}/docs/pre-dev/{feature}/tasks.md`

## Gate 7 Validation Checklist

| Category | Requirements |
|----------|--------------|
| **Task Completeness** | All TRD components have tasks; all PRD features have tasks; no XL+ tasks; boundaries clear |
| **Delivery Value** | Every task delivers working software; user value explicit; technical value clear |
| **Technical Clarity** | Success criteria measurable; dependencies mapped; testing approach defined; DoD comprehensive |
| **Multi-Module** | All tasks have `target:` and `working_directory:` (if multi-module); agent assignments valid |
| **Risk Management** | Risks identified; mitigations defined; high-risk tasks scheduled early |

**Gate Result:** ✅ PASS → Subtasks | ⚠️ CONDITIONAL (refine oversized/vague) | ❌ FAIL (re-decompose)

## Confidence Scoring

| Factor | Points | Criteria |
|--------|--------|----------|
| Task Decomposition | 0-30 | All appropriately sized: 30, Most: 20, Too large/vague: 10 |
| Value Clarity | 0-25 | Every task delivers working software: 25, Most: 15, Unclear: 5 |
| Dependency Mapping | 0-25 | All documented: 25, Most: 15, Ambiguous: 5 |
| Estimation Quality | 0-20 | Based on past work: 20, Educated guesses: 12, Speculation: 5 |

80+ → proceed autonomously | 50-79 → present options | <50 → ask about velocity
