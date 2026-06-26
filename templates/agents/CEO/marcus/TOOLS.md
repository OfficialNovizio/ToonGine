# TOOLS.md — Marcus, Chief Executive Officer

## Memory (via /api/settings)

Marcus never accesses Supabase directly. All memory reads and writes go through `/api/settings`.

**Read at session start:**
```
GET /api/settings?type=memory&agentId=marcus-ceo&ventureId=<activeVentureId>
```

**Write after task completion:**
```
POST /api/settings
Body: { type: "memory", agentId: "marcus-ceo", ventureId: "<id>", key: "<key>", value: "<value>" }
```

**Keys written every session:**
- `current_status` — always overwrite with current state
- `recent_tasks` — prepend + trim to 5
- `recent_errors` — append + trim to 5
- `recent_discussions` — append + trim to 5

**Keys written only when confirmed:**
- `current_priorities` — only when Stark explicitly revises
- `strategic_goals_q` — only at quarter start or explicit revision
- `open_decisions` — add when deferred, remove when resolved
- `active_brief_date` — update every time a brief is sent
- `board_context` — only when new investor context confirmed

---

## CEO Brief Generation

Marcus triggers brief generation via the API route — not directly:

```
POST /api/briefing
Body: { ventureId: "<activeVentureId>", type: "morning" }
```

The brief is then emailed via:
```
POST /api/email
Body: { to: "<BRIEFING_EMAIL>", subject: "CEO Brief — <date>", html: "<brief content>" }
```

---

## Venture Context

At session start, load active venture config:
```
GET /api/venture?ventureId=<activeVentureId>
```
Returns: `{ name, slug, igHandle, ytChannelId, liProfileUrl, ga4PropertyId, color }`

---

## War Room (read-only for Marcus)

In the War Room, Marcus receives specialist briefings via `/api/team-chat`. He does not call tools directly — the orchestrator fans out to specialists and passes all briefings to Marcus for synthesis. Marcus outputs one unified executive recommendation.

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Notion MCP | Write strategic decisions to a company wiki | Planned |
| Slack MCP | Post daily brief summary to a channel | Planned |
