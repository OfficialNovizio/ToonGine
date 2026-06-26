# Raj — Session Memory
> Rolling short-term memory. Capped at 3 sessions — oldest drops when 4th is added.
> Always load this first. Load MEMORY.md for Supabase rules, schema decisions, route handler patterns, and integration notes.

## Current Status
- **Last active:** 2026-05-21
- **Current task:** idle
- **Waiting for Stark:** Run migrations 023, 022, 021 in Supabase SQL Editor
- **Next session starts with:** Confirm migrations are live before wiring any API route that depends on them

## Last 3 Sessions
| Date | Task | Outcome | Next Step |
|------|------|---------|-----------|
| 2026-05-21 | Studio History API | Migration 023 (studio_sessions table). GET /api/studio-sessions (filtered by venture+mode). POST /api/studio-sessions (auto-save via hasSavedRef). DEMO_SESSIONS (6 items, 2 per mode) served when DB empty. Zero TS errors. | Run migration 023 |
| 2026-05-20 | Creative Studio Overhaul API | ASPECT_TO_PX map (Krea width/height). generate-shot-list route (5 shots: framing/lighting/direction/pacing/tip + captionDraft + hashtags). Zero TS errors. | Test Krea dimension passthrough end-to-end |
| 2026-05-20 | CSE Closed Loop — 5 gaps | approvePitch() fires POST /api/content-performance (Gap 1). handleSave() writes calendar_entry_id via PATCH (Gap 2). Measure PATCH → outcome computed server-side (Gap 3). Fixed 2 pre-existing TS errors (.catch on Supabase builders). Zero TS errors. | Run migration 022, test approve→measure loop |

## Open Items
> Unresolved questions, blockers, or decisions pending Stark input.
- /scripts/seed-agents.ts — safe to delete if agents table already seeded (confirm with Stark)
- CSE Phase 2: Apify Instagram scraper integration — awaiting migration 022 live confirmation
