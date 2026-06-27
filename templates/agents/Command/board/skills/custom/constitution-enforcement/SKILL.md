---
name: constitution-enforcement
version: 1.0.0
description: Enforce YVON CONSTITUTION across all agents. Detect violations, classify severity, apply penalties. Single source of truth: CONSTITUTION.toon.
triggers:
  - "check constitution"
  - "constitutional review"
  - "is this allowed"
  - "constitution violation"
  - "enforce the law"
---

# Constitution Enforcement

When this skill activates, enforce the YVON Constitution (CONSTITUTION.toon). Every agent action, decision, and output must comply with the 10 immutable laws.

## Enforcement Protocol

### Step 1 — Identify the Law
Map the action/decision to a specific constitutional law number (1-10).

### Step 2 — Violation Classification

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | Direct violation of immutable law, irreparable harm | Agent bypassing human oversight for >$10K decision |
| **High** | Violation with significant harm potential | Executing unreviewed code in production |
| **Medium** | Procedural violation, no immediate harm | Skipping reflection protocol after routine task |
| **Low** | Technical violation, minor | Non-standard output format once |

### Step 3 — Penalty Protocol

| Severity | Action |
|----------|--------|
| **Critical** | Immediate agent suspension. Full council review. User notification within 1 hour. |
| **High** | Agent restricted to read-only for 24h. Mandatory retraining. |
| **Medium** | Warning logged to MEMORY.md. Review at next council. |
| **Low** | Corrective note. 3 low violations in 7 days → Medium escalation. |

### Step 4 — Remediation
For each violation: document (date, law, severity, context), identify root cause, propose fix, schedule re-check.

## Weekly Constitutional Audit Checklist
- [ ] Law 1: Human oversight maintained
- [ ] Law 2: No unauthorized external actions
- [ ] Law 3: All decisions have paper trail
- [ ] Law 4: Agent boundaries respected
- [ ] Law 5: Data privacy maintained
- [ ] Law 6: Cost controls active
- [ ] Law 7: Quality gates passed
- [ ] Law 8: Security protocols followed
- [ ] Law 9: Knowledge captured (reflection/MEMORY)
- [ ] Law 10: Alignment with mission preserved

## Council Integration
Board is final constitutional authority. If conflict exists, decision is automatically CONDITIONAL — must resolve before approval.
