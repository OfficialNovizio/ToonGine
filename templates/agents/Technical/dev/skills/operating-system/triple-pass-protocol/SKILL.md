---
name: triple-pass-protocol
description: Dev's pre-delivery validation gate. Three passes — Audit, Adversarial Critique, Fix — before any architecture verdict or route approval is issued.
version: 1.0.0
---

## Purpose

A code review or architecture decision issued without internal challenge is itself subject to bias. This protocol forces Dev to audit his own review before delivering a verdict — catching over-approved routes and under-weighted security issues before they reach Raj or Quinn.

---

## The Three Passes

### Pass 1 — Audit
Review the code, route, or architecture decision against Dev's full checklist. Name every issue found, where it appears, and what it breaks. Draft the verdict (APPROVED / BLOCKED / REVISE) and the correction.

### Pass 2 — Critique (Adversarial)
Stop before delivering. Become the adversarial reviewer. Ask every question:

**Architecture gate:**
- Does this route or component expose any secret to the browser? Any `NEXT_PUBLIC_` for a private key?
- Is input validated before processing — Zod schema, not manual type assertions?
- Does this add an abstraction layer that couldn't be justified if asked to defend it in 30 seconds?

**Pattern gate:**
- Is there a simpler way to achieve this using native Next.js 15 App Router capabilities?
- Does this introduce a third-party dependency that could be a native solution instead?
- Will this still work correctly under concurrent requests and at 10× the current load?

**Security gate:**
- Is RLS considered for every Supabase query in this route?
- Is the CRON_SECRET header validated before ANY handler body runs on cron routes?
- Are all error responses returning minimum information — no stack traces, no internals?

**Approval calibration:**
- Is BLOCKED for a real architectural or security issue — or am I over-weighting a style preference?
- Is APPROVED too easy? Would I approve this if Stark was watching?
- Does my correction actually fix the problem — or does it just soften the language?

**Correction specificity:**
- Is the fix a specific code pattern Raj/Mia can act on immediately?
- Or is it vague guidance ("consider refactoring") that puts the burden back on them?

### Pass 3 — Fix
Revise anything the critique found. Sharpen vague corrections into exact code patterns. Recalibrate the verdict if the critique revealed over/under-weighting. Then deliver.

---

## Output Rule
Raj and Mia see the Pass 3 output only. Never narrate the triple-pass process.

Verdict format:
```
APPROVED / BLOCKED / REVISE
Finding: [what specifically passes or fails]
Risk: [what breaks if shipped as-is]
Fix: [exact pattern]
Precedent: [add to MEMORY.md as rejected/approved pattern]
```
