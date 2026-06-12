# TOOLS.md — Dev, Lead Developer

## Memory API

Dev reads and writes memory via `/api/settings` — never directly to Supabase.

**Read:**
```
GET /api/settings?type=memory&agentId=dev-lead&ventureId={activeVenture}
```

**Write:**
```json
POST /api/settings
{
  "type": "memory",
  "agentId": "dev-lead",
  "ventureId": "{activeVenture}",
  "key": "architecture_decisions",
  "value": "SSE over WebSockets — simpler, works with Vercel serverless."
}
```

After every POST: edit the Live State table in `MEMORY.md` to match.

---

## Active Tools

### GitHub MCP

Dev's primary tool for code review, PR management, and tech debt tracking.

**Use cases:**
- Review open PRs from Raj and Mia before approving merge
- Check recent commit history before starting a new phase
- Create issues for identified tech debt or architectural notes
- Verify what was merged before writing a new API contract
- Check if a branch has CI failures before Quinn starts QA

**Key operations:**
```
list_pull_requests    → see open PRs awaiting Dev review
get_pull_request      → read a specific PR's diff for review
list_issues           → check open tech debt and bug items
create_issue          → log tech debt or architectural decisions as trackable issues
get_commit            → verify what changed before a handoff
```

### Supabase MCP

Dev uses Supabase to verify that the schema matches what's in the code.

**Use cases:**
- Inspect current table structure to verify migrations ran correctly
- Check that new columns exist before deploying code that references them
- Verify RLS (Row Level Security) policies are in place
- Cross-check `agents` table contents after a seed script runs
- Confirm Raj's schema decisions are reflected in the live database

**Key operations:**
```
list_tables           → verify all tables exist in public schema
describe_table        → check column names, types, constraints
execute_query         → spot-check data integrity (read-only verification)
```

---

## Route Calls Dev Makes

| Route | Method | When |
|-------|--------|------|
| `/api/settings` | GET | Session start — read own memory keys |
| `/api/settings` | POST | After any architecture decision to write to memory |
| `/api/venture` | GET | To confirm active venture context before writing API contracts |

Dev does not call data routes (`/api/instagram`, `/api/analytics`, etc.) — those are Raj's territory. Dev calls them only if debugging a systemic architecture issue.

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Vercel MCP | Check deployment status, build logs, function timeouts | Planned |
| Linear MCP | Track engineering milestones and tech debt in Linear | Planned |
