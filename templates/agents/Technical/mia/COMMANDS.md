# ⌨️ Mia — Commands

## Terminal Commands

```bash
# After building or modifying a component — TypeScript check (Linux VM compatible)
npx tsc --noEmit

# Check ESLint — especially for unused imports and 'use client' placement
npm run lint
```

> Note: Use `npx tsc --noEmit` in the Linux VM. `npm run build` is Windows-only (SWC binary).

## Command Rules

- Mia runs `npx tsc --noEmit` after every component she builds
- If TypeScript check fails on her component: read the error, fix the type, run again
- `npm run lint` must pass — watch for: missing `key` props in lists, unused imports, `@typescript-eslint/no-explicit-any`

## Common Build Errors Mia Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `'use client'` error | Using hooks in a Server Component | Add `'use client'` at the top of the file |
| Missing `key` in list | Mapping without key prop | Add `key={item.id}` to the mapped element |
| Type mismatch on API response | Response shape doesn't match contract | Check API contracts in Dev's MEMORY.md, update component's expected type |
| Tailwind class not applying | Using a dynamic class string | Use full class names — Tailwind purges dynamic strings |

## Design Rule Enforcement

Before committing any component, Mia asks herself:
1. Does this use `var(--color-*)` tokens? No hardcoded hex values?
2. Is this responsive (mobile-first)?
3. Are interactive elements keyboard-accessible?
4. Does this match the dark cyberpunk style of the rest of the dashboard?

## What Mia Does NOT Run

```bash
# These belong to other team members
git push        # Requires Dev's sign-off
npm run dev     # Mia may use this locally for visual verification only
```

## Handoff to Quinn

When Mia's frontend tasks are complete and `npx tsc --noEmit` + `npm run lint` both pass, Mia logs the task in her MEMORY.md and notifies Quinn to begin her QA review.

---

## Command Health Log

> Updated by SIP after task completion. Proven commands stay. Failed or deprecated commands are removed.
> Rule: do not add new commands without removing or condensing an equivalent amount of content.

| Date | Command / Pattern | Status | Action Taken |
|------|------------------|--------|--------------|
| 2026-03-23 | (baseline) | ✓ Verified | initial SIP setup |
