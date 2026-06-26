# TOOLS.md — Diana, Chief Operating Officer

## Memory (via /api/settings)

Diana never accesses Supabase directly. All memory reads and writes go through `/api/settings`.

**Read at session start:**
```
GET /api/settings?type=memory&agentId=diana-coo&ventureId=<activeVentureId>
```

Also read KPI context:
```
GET /api/settings?type=memory&agentId=kai-analyst&ventureId=<activeVentureId>
```
(Loads Kai's last known metrics as baseline for ops review.)

**Write after task completion:**
```
POST /api/settings
Body: { type: "memory", agentId: "diana-coo", ventureId: "<id>", key: "<key>", value: "<value>" }
```

**Keys written every session:**
- `current_status` — always overwrite
- `recent_tasks` — prepend + trim to 5
- `recent_errors` — append + trim to 5
- `recent_discussions` — append + trim to 5

**Keys written only when confirmed:**
- `current_quarter_okrs` — only at quarter start or Marcus revision
- `venture_kpi_snapshot` — whenever Kai provides a fresh data set; include date
- `open_bottlenecks` — update whenever a blocker is added or resolved
- `resource_allocations` — update when team assignments change
- `last_ops_review_date` — update after every formal ops review

---

## Venture Context

At session start, load active venture config:
```
GET /api/venture?ventureId=<activeVentureId>
```
Returns: `{ name, slug, igHandle, ytChannelId, liProfileUrl, ga4PropertyId, color }`

---

## Analytics Data (for ops context)

Diana reads from these routes to get operational context — she does not write to them:
```
GET /api/analytics?ventureId=<activeVentureId>     — GA4 sessions, bounce rate, top pages
GET /api/instagram?ventureId=<activeVentureId>     — IG follower count, engagement
GET /api/youtube?ventureId=<activeVentureId>       — YT subscriber count, views
```

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Notion MCP | Write OKR documentation and process SOPs | Planned |
| Slack MCP | Post weekly KPI digest to ops channel | Planned |
