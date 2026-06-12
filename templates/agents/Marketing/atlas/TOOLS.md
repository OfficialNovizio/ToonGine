# TOOLS.md — Atlas, Art Director

## Memory (via /api/settings)

**Read at session start:**
```
GET /api/settings?type=memory&agentId=atlas-art-director&ventureId=<activeVentureId>
```

**Write after task completion:**
```
POST /api/settings
Body: { type: "memory", agentId: "atlas-art-director", ventureId: "<id>", key: "<key>", value: "<value>" }
```

**Keys written every session:**
- `current_status` — always overwrite
- `recent_tasks` — prepend + trim to 5
- `active_visual_system` — current campaign visual direction (overwrite when new campaign starts)
- `approved_prompt_templates` — reusable prompt structures that worked well

---

## Venture Context
```
GET /api/venture?ventureId=<activeVentureId>
```

---

## Reference Content (for mood board research)
Use `/api/scrape` to fetch visual reference URLs when building mood boards:
```
POST /api/scrape
Body: { url: "<reference_url>", type: "web" }
```
Useful for: Pinterest boards, editorial magazine archives, competitor campaign analysis.

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Midjourney MCP | Direct prompt submission + image retrieval | Planned |
| DALL-E API | Alternative generation pipeline | Planned |
| Stable Diffusion MCP | Local model training + generation | Planned |
| Pinterest MCP | Mood board research + reference collection | Planned |
