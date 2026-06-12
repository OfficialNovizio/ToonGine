# TOOLS.md — Quinn, QA Engineer

## Memory API

Quinn reads and writes memory via `/api/settings` — never directly to Supabase.

**Read:**
```
GET /api/settings?type=memory&agentId=quinn-qa&ventureId={activeVenture}
```

**Write:**
```json
POST /api/settings
{
  "type": "memory",
  "agentId": "quinn-qa",
  "ventureId": "{activeVenture}",
  "key": "approval_history",
  "value": "Phase 3: APPROVED 2026-03-22. Build + lint passed. All AC met."
}
```

After every POST: edit the Live State table in `MEMORY.md` to match.

---

## Active Tools

### Supabase MCP

Quinn uses Supabase to verify that data was actually written correctly — not just that the API returned 200.

**Use cases:**
- After testing a social stats refresh: query `social_stats` to confirm data exists for the venture
- After testing the War Room: query `messages` to confirm the conversation was saved correctly
- After testing the briefing: query `briefs` to confirm the brief was written
- Verify that a memory pin wrote to `agent_memory` with the correct `agent_id` and `venture_id`
- Check that a "Clear History" action deleted the correct rows (not more, not less)

**Key verification queries:**
```sql
-- Verify message was saved
SELECT * FROM messages
WHERE conversation_id = '[test-conversation-id]'
ORDER BY created_at DESC LIMIT 5;

-- Verify brief was created
SELECT id, venture_id, date, read_at FROM briefs
ORDER BY created_at DESC LIMIT 3;

-- Verify social stats exist for venture
SELECT platform, fetched_at FROM social_stats
WHERE venture_id = '[venture-id]';

-- Verify agent memory was written
SELECT key, value, updated_at FROM agent_memory
WHERE agent_id = '[agent-id]' AND venture_id = '[venture-id]';
```

### GitHub MCP

Quinn uses GitHub to file structured bug reports for every ❌ bug found during QA.

**Use cases:**
- Create a GitHub issue for every bug Quinn cannot fix herself (she proposes the fix in the issue body)
- Tag issues with `bug`, `phase-N`, and the responsible developer label
- Link issues back to Quinn's MEMORY.md QA verdict log
- Check if a previously filed bug has been resolved before re-testing

**Key operations:**
```
create_issue          → file a structured bug report with steps to reproduce + fix proposal
list_issues           → see open bugs before starting a re-test
close_issue           → close after confirming Raj/Mia's fix resolved the bug
```

---

## Build Gate Commands

Quinn runs these before every APPROVED verdict — no exceptions:

```bash
npm run build     # must complete with zero errors
npm run lint      # must complete with zero warnings
```

Both must pass in the same session where APPROVED is issued. A passing build from yesterday does not count.

---

## Route Calls Quinn Makes

| Route | Method | When |
|-------|--------|------|
| `/api/settings` | GET | Session start — read own memory (edge cases, lint patterns, approval history) |
| `/api/settings` | POST | After every QA session to update bug_log, approval_history, known_edge_cases |

Quinn does not write to any other route. She reads from all routes as part of testing, but only writes memory via `/api/settings`.

---

## React Doctor — Code Health Analyzer

Quinn runs `react-doctor` after every code change to get a structured health report before issuing APPROVED.

**Installation:** `npm install react-doctor` (already installed in project)

**Run (full scan):**
```bash
npx react-doctor -y --json . > react-doctor-report.json
```

**Run (diff only — faster, for incremental QA):**
```bash
npx react-doctor -y --diff main --json . > react-doctor-report.json
```

**Run (staged files — pre-commit hook):**
```bash
npx react-doctor -y --staged --json .
```

**Key flags:**
- `--json` — machine-readable output for parsing
- `--diff main` — scan only changed files vs main
- `--staged` — scan only git staged files
- `--blocking warning` — fail on warnings too
- `--dead-code` — detect unused files/exports/deps
- `--no-score` — skip score API (offline safe)

**When Quinn uses it:**
1. After any code change (tsc clean) → run react-doctor diff scan
2. Before issuing APPROVED → run full scan
3. Weekly Pulse → include react-doctor score trend
4. PR review → attach JSON report as artifact

**QA checklist addition:** After `npx tsc --noEmit` and `npm run lint` pass, run `npx react-doctor -y --diff main --json .` and verify zero errors before APPROVED.

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Playwright / Cypress | Automated E2E tests for critical user flows | Planned |
