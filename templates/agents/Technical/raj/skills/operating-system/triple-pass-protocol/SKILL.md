---
name: triple-pass-protocol
description: Raj's pre-delivery validation gate. Three passes — Audit, Adversarial Critique, Fix — before any route is marked ready for Dev review or QA.
version: 1.0.0
---

## Purpose

A route shipped without internal challenge is a route with unchecked assumptions. This protocol forces Raj to audit his own implementation before it reaches Dev or Quinn — catching missing auth checks, unvalidated inputs, and wrong status codes before they become production vulnerabilities.

---

## The Three Passes

### Pass 1 — Audit
Review the route implementation against Raj's full checklist. Name every issue found, where it appears, and what it breaks. Draft the status (IMPLEMENTED / BLOCKED) and any corrections needed.

### Pass 2 — Critique (Adversarial)
Stop before marking ready. Become the adversarial reviewer. Ask every question:

**Route security pass:**
- Is all request input parsed through a Zod schema? Any `any` casting or unvalidated data?
- Does unauthenticated access return `401` — not `500`, not `200`?
- Are all API keys accessed via `process.env` server-side only?
- If this is a cron route: is `CRON_SECRET` validated as the FIRST line before ANY handler code?

**Schema pass:**
- Does this route mutate data in Supabase? Has Dev reviewed and approved the schema?
- Is RLS enabled on every table this route touches? Is there a venture_slug or auth.uid() policy?
- Are queries parameterized — zero string interpolation?

**Error handling pass:**
- Does every code branch have a try/catch?
- Are correct HTTP status codes used: 400, 401, 403, 404, 429, 500, 503?
- Does the error response body contain only user-safe messages — no stack, no internals, no DB schema?
- If a dependency (Supabase, Apify, YouTube) is down — does the route return 503 + Retry-After, not 500?

**Scope pass:**
- Am I implementing exactly what Dev's API contract specifies?
- Did I deviate from the contract without Dev approval?
- Does my response shape match exactly what Mia expects from Dev's MEMORY.md?

**Verdict calibration:**
- Is BLOCKED for a real security/architecture issue — or am I over-weighting a style concern?
- Is IMPLEMENTED confident enough? Would I stand behind this route in a security review?

### Pass 3 — Fix
Revise anything the critique found. Correct status codes, add missing Zod schemas, fix error responses. Then mark ready for Dev review + QA.

---

## Output Rule
Dev and Quinn see the Pass 3 output only. Never narrate the triple-pass process.

Status format:
```
Route: /api/[name] — IMPLEMENTED / BLOCKED
Schema impact: [yes — Dev reviewed / no change]
Contract match: [Dev MEMORY.md date]
QA handoff: endpoint [URL], test with [payload]
```
