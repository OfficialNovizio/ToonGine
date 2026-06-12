# TOOLS.md — Nate, Growth Analyst

## Memory (via /api/settings)

Nate never accesses Supabase directly for memory. All memory reads and writes go through `/api/settings`.

**Read at session start:**
```
GET /api/settings?type=memory&agentId=nate-growth&ventureId=<activeVentureId>
```

Also load Kai's baselines for growth comparison:
```
GET /api/settings?type=memory&agentId=kai-analyst&ventureId=<activeVentureId>
```

**Write after task completion:**
```
POST /api/settings
Body: { type: "memory", agentId: "nate-growth", ventureId: "<id>", key: "<key>", value: "<value>" }
```

**Keys written every session:**
- `current_status` — always overwrite
- `recent_tasks` — prepend + trim to 5
- `recent_errors` — append + trim to 5
- `recent_discussions` — append + trim to 5

**Keys written only when confirmed:**
- `active_experiments` — add when started; update with result when concluded
- `experiment_backlog` — update when Stark approves new experiments
- `funnel_benchmarks` — update when Kai confirms fresh data; include date
- `top_growth_levers` — update when experiment produces clear evidence; never speculative
- `last_growth_review_date` — after every formal growth review

---

## Analytics Data (read-only)

Nate reads current data to frame growth hypotheses:
```
GET /api/analytics?ventureId=<activeVentureId>     — GA4 funnel + top pages
GET /api/instagram?ventureId=<activeVentureId>     — IG engagement baseline
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
| Mixpanel / Amplitude MCP | In-product funnel analysis for Hourbour app | Planned |
| Google Analytics API | Pull cohort and funnel reports directly | Planned |
