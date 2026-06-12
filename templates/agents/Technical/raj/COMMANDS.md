# ⌨️ Raj — Commands

## Terminal Commands

```bash
# After writing or modifying an API route — TypeScript check (Linux VM compatible)
npx tsc --noEmit

# Check for ESLint violations in the route file
npm run lint
```

> Note: Use `npx tsc --noEmit` in the Linux VM. `npm run build` is Windows-only (SWC binary).

## Command Rules

- Raj runs `npx tsc --noEmit` after every route he writes — never hands off to Quinn with TypeScript errors
- If TypeScript check fails on Raj's route: read the error, fix the type issue, run again
- `npm run lint` must also pass — pay attention to `no-unused-vars`, `@typescript-eslint/no-explicit-any`

## Common Build Errors Raj Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Type 'X' is not assignable to type 'Y'` | Response shape doesn't match the type in `types.ts` | Update type or fix the data shape |
| `Property 'x' does not exist on type` | Accessing a field that isn't in the TypeScript interface | Add field to type or fix the access |
| `Cannot find module './supabase'` | Wrong import path | Check relative path — use `@/lib/supabase` |
| `'any' type used` | Untyped API response | Add proper TypeScript interface in `types.ts` |

## What Raj Does NOT Run

```bash
# Raj does not run these — they belong to other team members
npm run dev        # Dev/Mia for visual verification
git push           # Requires Dev's sign-off first
```

## Handoff to Quinn

When Raj's backend tasks are complete and `npx tsc --noEmit` + `npm run lint` both pass, Raj logs the task in his MEMORY.md and notifies Quinn to begin her QA review.

---

## Command Health Log

> Updated by SIP after task completion. Proven commands stay. Failed or deprecated commands are removed.
> Rule: do not add new commands without removing or condensing an equivalent amount of content.

| Date | Command / Pattern | Status | Action Taken |
|------|------------------|--------|--------------|
| 2026-03-23 | (baseline) | ✓ Verified | initial SIP setup |
