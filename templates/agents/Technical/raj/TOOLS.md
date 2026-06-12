# TOOLS.md — Raj, Backend Developer

## Memory API

Raj reads and writes memory via `/api/settings` — never directly to Supabase in code outside of route handlers.

**Read:**
```
GET /api/settings?type=memory&agentId=raj-backend&ventureId={activeVenture}
```

**Write:**
```json
POST /api/settings
{
  "type": "memory",
  "agentId": "raj-backend",
  "ventureId": "{activeVenture}",
  "key": "integration_notes",
  "value": "Apify: startRun returns runId, poll every 2s, max 25s timeout."
}
```

After every POST: edit the Live State table in `MEMORY.md` to match.

---

## Active Tools

### Supabase MCP

Raj's primary tool for all database work.

**Use cases:**
- Inspect current schema before writing a new query (check column names, types, constraints)
- Run a test query to verify data is being written correctly
- Check UNIQUE constraints before writing upsert logic
- Verify that a migration ran correctly (table exists, columns present)
- Debug a failing query by running it directly in the MCP before adding it to code

**Key operations:**
```
list_tables           → see all tables in the public schema
describe_table        → get column names, types, constraints for a specific table
execute_query         → run a SQL query directly (verification only — not production writes via MCP)
```

### GitHub MCP

Raj uses GitHub to check existing route implementations for established patterns.

**Use cases:**
- Read an existing route file to match error handling and response shape patterns
- Check if a similar integration already exists before writing from scratch
- See what changed in a recent commit that might affect a route being built

**Key operations:**
```
get_file_contents     → read an existing route.ts for pattern reference
list_commits          → check recent backend changes before starting new work
```

---

## Files Raj Uses Directly (not via MCP)

All external API integrations are imported from `/lib/` — never re-implemented inline:

| File | What it wraps |
|------|--------------|
| `lib/apify.ts` | Apify Actor run + poll + dataset fetch |
| `lib/youtube.ts` | YouTube Data API v3 client |
| `lib/google-analytics.ts` | GA4 Data API (service account auth) |
| `lib/supabase.ts` | Server-side Supabase client (`createServerClient`) |

---

## Route Calls Raj Makes (within his own routes)

| Route | Method | When |
|-------|--------|------|
| `/api/settings` | GET | Session start — read own memory keys |
| `/api/settings` | POST | After discovering a new pattern or quirk to write to memory |
| `/api/venture` | GET | To load venture-specific config (handles, IDs) before calling external APIs |

Raj never calls `/api/claude`, `/api/team-chat`, or `/api/route-intent` — those are the chat layer, not backend data.

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Vercel MCP | Check function timeout logs for slow Apify/GA4 routes | Planned |
