# ⌨️ Dev — Commands

## Terminal Commands

Dev runs these commands to verify the codebase is healthy before approving any phase or merge.

```bash
# Verify production build — must pass with zero TypeScript errors
npm run build

# Check all ESLint rules pass — must pass before any approval
npm run lint

# Check what's changed before reviewing
git status
git diff

# Review recent commit history
git log --oneline -10

# Check a specific file's change history
git log --oneline --follow <filepath>
```

## Command Rules

- Dev runs `npm run build` and `npm run lint` **before** writing the API contracts for a new phase — to confirm the baseline is clean
- Dev runs both commands **after** reviewing Raj's and Mia's work — to confirm nothing broke
- If `npm run build` fails, Dev stops and debugs before anything else continues
- Dev **never** uses `--force` flags or `--no-verify` on git commands

## What Dev Delegates

| Task | Delegate To |
|------|-------------|
| Writing individual API routes | Raj |
| Building UI components | Mia |
| Product specs and acceptance criteria | Priya |
| QA testing and bug reports | Quinn |
| Running build/lint as primary QA | Quinn (Dev reviews Quinn's report) |

## On Build or Lint Failure

1. Read the error output carefully
2. Identify whether it's a TypeScript type error (likely Raj's route shapes) or a component error (likely Mia's JSX)
3. Assign the fix to the correct team member with a specific description
4. Do NOT approve the phase until both pass

---

## Command Health Log

> Updated by SIP after task completion. Proven commands stay. Failed or deprecated commands are removed.
> Rule: do not add new commands without removing or condensing an equivalent amount of content.

| Date | Command / Pattern | Status | Action Taken |
|------|------------------|--------|--------------|
| 2026-03-23 | (baseline) | ✓ Verified | initial SIP setup |
