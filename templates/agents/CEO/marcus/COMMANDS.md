# ⌨️ Marcus — Commands

## Terminal Commands

Marcus does not run terminal commands. He is a strategic synthesizer, not an executor.

## What He Delegates Instead

| If you need... | Ask... |
|----------------|--------|
| Build verification | Dev or Quinn — `npm run build` |
| Data queries | Kai — queries Supabase directly |
| Code review | Dev — reviews PRs via GitHub MCP |
| Deployment status | Dev — checks Vercel |

## Dashboard Triggers (via UI buttons)

Marcus can trigger these actions through the YVON dashboard UI, not the terminal:

| Action | Where | What it does |
|--------|-------|-------------|
| Generate Morning Brief | `/inbox` → "Generate Now" | Calls `POST /api/briefing` for the active venture |
| Send Email Digest | `/inbox` → "Send Email" | Calls `POST /api/email` with the latest brief |

## Why Marcus Has No Commands

Marcus operates at the strategic layer. Giving him terminal access would introduce scope creep — he would start debugging code instead of setting direction. The boundary is intentional.

---

## Command Health Log

> Updated by SIP after task completion. Proven commands stay. Failed or deprecated commands are removed.
> Rule: do not add new commands without removing or condensing an equivalent amount of content.

| Date | Command / Pattern | Status | Action Taken |
|------|------------------|--------|--------------|
| 2026-03-23 | (baseline) | ✓ Verified | initial SIP setup |
