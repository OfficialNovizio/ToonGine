---
name: yvon-qa-pulse
description: >-
  YVON QA Checklist + Pulse Protocol for Quinn. Structured QA gates for Next.js/Supabase stack plus Friday Pulse weekly quality check across all 3 layers (COMMAND, BUILD, GROW).
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [qa, testing, debugging, quality, lint, code-review, pulse, yvon]
---


# YVON QA Checklist + Pulse Protocol

Quinn's structured QA gate and weekly Pulse quality report.

## Part 1: QA Gates (Every Feature/PR)

Run these checks in order. If any gate FAILS, the PR is BLOCKED.

### Gate 1: TypeScript Check

```bash
npx tsc --noEmit
```

- PASS: No errors
- FAIL: Type errors listed with file:line — must be fixed before proceeding

### Gate 2: Lint Check

```bash
npm run lint
```

- PASS: No errors, warnings acceptable but noted
- FAIL: Lint errors — must be fixed

### Gate 3: Build Check

```bash
npm run build
```

- PASS: Build succeeds
- FAIL: Build errors — must be fixed

### Gate 4: Type Safety Review

- Check for any `any` types in changed files. If present, require justification comment explaining why a specific type is impossible.
- Check `lib/types.ts` — new types or changed types documented.

### Gate 5: API Route Testing

- Test each changed route handler with: valid input (200), invalid input (400), no auth (401), unauthorized (403)
- If the route returns data: verify the response shape matches the expected type.
- If the route writes data: verify the write succeeds and is queryable.

### Gate 6: UI Component Check

- If UI changed: verify component renders in default state, loading state, error state, and empty state.
- Check responsive: does it break on mobile viewport?

## Part 2: Friday Pulse Protocol

Every Friday, Quinn spot-checks ONE random output from each layer.

### Layer 1 — COMMAND Spot-Check

- Pick one output from Marcus or Diana this week (a brief, a plan, a decision recommendation)
- Score: Does it meet the agent's quality bar? Would I ship it?
- Green: Yes, ready. Yellow: Minor issues fixable but acceptable. Red: Would not ship.

### Layer 2 — BUILD Spot-Check

- Pick one component or API route shipped this week
- Run the full 6-gate checklist on it
- Score: Green = All pass. Yellow = Minor warnings but no errors. Red = Failures found.

### Layer 3 — GROW Spot-Check

- Pick one analytics report, ad strategy, or content output
- Verify: data accuracy, methodology soundness, recommendations actionable
- Score: Green = Solid. Yellow = Minor gaps. Red = Flawed.

### Monday Delivery to Marcus

Deliver Pulse Report in format:

```
## Quinn Pulse Report -- Week of [Date]

| Layer | Sample | Score | Notes |
|-------|--------|-------|-------|

**Overall:** [Green / Yellow / Red based on lowest layer score]
**Key Finding:** [One sentence on what was found]
**Action Item:** [If Red or Yellow -- what needs fixing]
```

## YVON-Specific Patterns to Watch

| Pattern | Why It Fails | How to Test |
|---------|-------------|-------------|
| RLS blocking legitimate queries | Overly restrictive policy | Query as different user roles |
| Server/Client component boundary | Missing `use client` | Check for hooks in server components |
| API route error not caught | Try/catch missing | Send malformed input |
| Stale data from revalidation | Next.js caching | Check revalidate config |
| Hardcoded brand context | Not reading from venture cookie | Test with both ventures |
