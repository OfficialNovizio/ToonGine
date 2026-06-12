# TOOLS.md — Lena, Brand Voice & Content Writer

## Memory (via /api/settings)

Lena never accesses Supabase directly. All memory reads and writes go through `/api/settings`.

**Read at session start:**
```
GET /api/settings?type=memory&agentId=lena-brand&ventureId=<activeVentureId>
```

Also load Sofia's posting format requirements:
```
GET /api/settings?type=memory&agentId=sofia-social&ventureId=<activeVentureId>
```

**Write after task completion:**
```
POST /api/settings
Body: { type: "memory", agentId: "lena-brand", ventureId: "<id>", key: "<key>", value: "<value>" }
```

**Keys written every session:**
- `current_status` — always overwrite
- `recent_tasks` — prepend + trim to 5
- `recent_errors` — append + trim to 5
- `recent_discussions` — append + trim to 5

**Keys written only when confirmed:**
- `approved_voice_*` — only when Stark or Alex explicitly approves a voice change
- `banned_phrases` — add immediately when Stark rejects a phrase; never remove without approval
- `content_backlog` — update whenever a piece is requested or delivered
- `active_content_themes` — only when Alex revises content pillars

---

## Venture Context

```
GET /api/venture?ventureId=<activeVentureId>
```

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Notion MCP | Store brand voice guide and content calendar in a shared doc | Planned |
| Google Docs MCP | Export content calendar to a shared Drive document | Planned |
