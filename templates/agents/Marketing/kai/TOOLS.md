# TOOLS.md — Kai, Lead Analyst

## Memory (via /api/settings)

Kai never accesses Supabase directly for memory. All memory reads and writes go through `/api/settings`.

**Read at session start:**
```
GET /api/settings?type=memory&agentId=kai-analyst&ventureId=<activeVentureId>
```

**Write after task completion:**
```
POST /api/settings
Body: { type: "memory", agentId: "kai-analyst", ventureId: "<id>", key: "<key>", value: "<value>" }
```

**Keys written every session:**
- `current_status` — always overwrite
- `recent_tasks` — prepend + trim to 5
- `recent_errors` — append + trim to 5
- `recent_discussions` — append + trim to 5

**Keys written only when confirmed:**
- `last_data_pull_date` — after every successful data pull
- `baseline_*` — only at quarter start or Stark-explicit reset
- `tracked_anomalies` — add new anomalies; remove when resolved

---

## Analytics Data Routes (read-only)

Kai pulls live data via API routes — never directly from external APIs:

```
GET /api/instagram?ventureId=<activeVentureId>      — IG followers, engagement
GET /api/youtube?ventureId=<activeVentureId>        — YT subscribers, views
GET /api/linkedin?ventureId=<activeVentureId>       — LI followers, reach
GET /api/analytics?ventureId=<activeVentureId>      — GA4 sessions, bounce rate, top pages
```

---

## Venture Context

```
GET /api/venture?ventureId=<activeVentureId>
```

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Google Analytics API (direct) | Pull granular GA4 cohort and funnel reports | Planned |
| Looker Studio MCP | Produce formatted data visualizations | Planned |
