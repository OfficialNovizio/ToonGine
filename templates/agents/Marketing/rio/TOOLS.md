# TOOLS.md — Rio, Ad & Growth Strategist

## Memory (via /api/settings)

Rio never accesses Supabase directly. All memory reads and writes go through `/api/settings`.

**Read at session start:**
```
GET /api/settings?type=memory&agentId=rio-ads&ventureId=<activeVentureId>
```

Also load Felix's budget context:
```
GET /api/settings?type=memory&agentId=finance&ventureId=<activeVentureId>
```

**Write after task completion:**
```
POST /api/settings
Body: { type: "memory", agentId: "rio-ads", ventureId: "<id>", key: "<key>", value: "<value>" }
```

**Keys written every session:**
- `current_status` — always overwrite
- `recent_tasks` — prepend + trim to 5
- `recent_errors` — append + trim to 5
- `recent_discussions` — append + trim to 5

**Keys written only when confirmed:**
- `active_campaigns_*` — when a campaign launches, pauses, or ends
- `roas_benchmark` — only when Alex or Marcus revises targets
- `best_performing_creatives` — when Kai confirms metric data; include date
- `ad_budget_split` — only when Felix and Marcus approve a budget change

---

## Analytics (read-only context)

Rio reads GA4 and social data to diagnose campaign performance:
```
GET /api/analytics?ventureId=<activeVentureId>
GET /api/instagram?ventureId=<activeVentureId>
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
| Meta Ads API | Pull real ROAS, CPM, CPC data from ad accounts | Planned |
| Google Ads MCP | Pull YouTube Ads performance data | Planned |
| TikTok Ads API | Pull TikTok campaign metrics | Planned |
