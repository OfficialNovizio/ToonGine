# Content Suggestion Engine (CSE) — Kai Skill

> Owner: Kai (Analytics) · Co-authors: Nate (Growth), Lena (Brand), Kahneman (Bias review)
> Last updated: 2026-05-20
> Venture scope: Novizio · Hourbour

---

## What CSE Does

CSE is a self-learning content scoring system. It generates pitch recommendations,
scores them against live signals, tracks whether approved pitches overperform or
underperform benchmarks, and adjusts signal weights over time.

The loop is:
```
Signal → Score → Pitch → Approve → Calendar → Post → Measure → Reflect → Re-weight
```

---

## Architecture

### Database (migration 022)

| Table | Purpose |
|-------|---------|
| `content_performance` | One row per approved pitch. Tracks outcome, actual metrics, benchmark delta. |
| `signal_reliability` | Per-signal accuracy score. Updated after each measurement. |
| `scoring_weight_history` | Audit trail of E/R/G/B/T weight changes. |
| `pitch_pass_reasons` | Records why a pitch was dismissed. Penalises unreliable signals. |

### Scoring Dimensions (E/R/G/B/T)

| Code | Dimension | What it measures |
|------|-----------|-----------------|
| E | Engagement Signal | Competitor engagement delta, trending formats |
| R | Revenue Correlation | SEO search volume, buyer intent keywords |
| G | Growth Fit | Funnel stage alignment, audience match |
| B | Brand Resonance | Tone fit, brand voice coherence |
| T | Timing | Platform trend window, urgency signals |

Default weights: `E=0.25 · R=0.25 · G=0.20 · B=0.15 · T=0.15`
Weights are venture-specific and drift over time as CSE learns.

### Signal Types

| Signal | Trigger condition |
|--------|-----------------|
| `GAP_OPPORTUNITY` | Competitor posts in a format we haven't tried — high eng, low our coverage |
| `PROVEN_FORMAT` | Format we've done before with above-benchmark result |
| `SEO_WINDOW` | Keyword search volume spike + low SERP competition |
| `URGENCY_WINDOW` | Trending topic with <72h relevance window |
| `FUNNEL_FIX` | Funnel drop-off detected at a specific stage (Kai identifies from GA4) |

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/content-intelligence` | POST | Generate a new pitch batch (5 pitches) |
| `/api/content-intelligence` | GET | Fetch current pitches + batch status |
| `/api/content-intelligence` | PATCH | Update pitch status (approved / passed) |
| `/api/content-performance` | POST | Record a pitch going live (create perf row) |
| `/api/content-performance` | GET | Fetch pending (≥7d old, unmeasured) + stage |
| `/api/content-performance` | GET `?pitchId=` | Fetch single record for Studio outcome banner |
| `/api/content-performance` | PATCH `action:link_calendar` | Write `calendar_entry_id` back to perf row |
| `/api/content-performance` | PATCH `action:measure` | Submit actual metrics, compute outcome |
| `/api/content-performance/measure` | POST | Cron T+7 auto-measurement trigger |
| `/api/signal-reliability` | GET | Fetch per-signal accuracy scores |
| `/api/weight-proposal` | GET | Fetch pending E/R/G/B/T weight change proposals |
| `/api/weight-proposal` | POST | Approve or reject a weight proposal |
| `/api/cse-reflection` | POST | Cron weekly reflection — proposes weight changes |

---

## Learning Stages

| Stage | Condition | Scoring source |
|-------|-----------|----------------|
| 0 | No measured posts | Industry benchmarks (8K–12K follower cohort) |
| 1 | 1–4 measured posts | Low-confidence blend: 70% benchmarks + 30% own data |
| 2 | 5+ measured posts | Own historical data primary |

---

## Closed Loop Flow (step-by-step)

1. **Generate** — Kai calls `/api/content-intelligence` POST → 5 pitches with CSE scores
2. **Approve** — User clicks Approve on a pitch card in Marketing → Content tab
   - PATCH `/api/content-intelligence` (status: approved)
   - POST `/api/content-performance` (creates perf row with pitch_id, signal_type, score_at_suggestion)
   - Calendar modal opens pre-filled
3. **Schedule** — User saves the calendar entry
   - POST `/api/content-calendar` → returns entry.id
   - PATCH `/api/content-performance` `action:link_calendar` → writes calendar_entry_id back
4. **Post** — Content goes live. User marks status → `posted` in calendar
5. **Measure** — 7 days after post_at:
   - Cron fires `/api/content-performance/measure` → auto-check for pending
   - OR user clicks "Measure X posts" pill in Marketing → Content tab → enters actual metrics
   - PATCH `/api/content-performance` → computes outcome (overperformed / met / underperformed)
   - Triggers `update_signal_reliability` RPC → adjusts signal accuracy
6. **Reflect** — Weekly cron fires `/api/cse-reflection`
   - Analyses recent outcomes vs signal types
   - If a signal type has >70% accuracy → propose weight increase (weight-proposal table)
   - User approves or rejects in the weight proposal panel on the pitch board
7. **Re-weight** — Approved weight changes take effect on next pitch generation

---

## UI Surfaces

| Surface | Location | What it shows |
|---------|----------|---------------|
| Pitch cards | Marketing → Content → pitch board | CSE score, E/R/G/B/T bars, hook A/B, growth hypothesis |
| Stage banner | Marketing → Content (top of pitch board) | Stage 0/1/2 label, "Measure X posts" pill when pending |
| Measure Now modal | Triggered from stage banner | Metric input (views/likes/comments/shares/saves/reach) |
| Weight proposal panel | Below pitch board | Pending E/R/G/B/T change proposals with approve/reject |
| Outcome banner | Creative Studio (top, when opened from pitch) | overperformed / met / underperformed + delta vs benchmark |

---

## Kai Rules for CSE Tasks

1. Never generate pitches without checking `signal_reliability` first — penalised signals (accuracy < 0.40) get a 0.5× weight multiplier.
2. Always include `growthHypothesis` in `fullProposal` — it's the key field that connects to measurement.
3. When proposing weight changes: only propose if ≥3 data points exist for that signal type. Fewer than 3 = noise.
4. Stage 0 → industry benchmarks only. Never invent own-history data.
5. After each `cse-reflection` run, save the proposed weight rationale to `scoring_weight_history` regardless of approval status.
