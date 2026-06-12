---
name: content-pipeline-coordination
description: Diana's orchestration skill for the Lena → Atlas → Pixel content production pipeline. Defines stage gates, handoff checklists, blocking criteria, approval gates, and calendar scheduling. Ensures content moves through the pipeline without getting stuck or skipping validation.
version: 1.0.0
---

# Content Pipeline Coordination

## Purpose

The Brand Intelligence Pipeline (P4-A on roadmap) involves three agents in sequence: Kai generates the brief → Lena writes copy → Atlas gives creative direction → Pixel runs production. Without a coordinator, these handoffs either get skipped (output quality degrades) or get stuck (nothing ships). Diana owns the pipeline clock and gates.

---

## When It Runs

- When Kai routes a content brief to Lena
- When Lena routes approved copy to Atlas
- When Atlas routes a visual brief to Pixel
- When a content piece is overdue at any stage
- Weekly content calendar review

---

## The 4-Stage Pipeline

```
Stage 0: BRIEF      Kai generates content brief from analytics/competitor data
   ↓ Gate: brief must include venture, platform, target metric, creative direction
Stage 1: COPY       Lena writes caption, email, or long-form copy from brief
   ↓ Gate: Kahneman framing check for any ad copy or urgency language
Stage 2: DIRECTION  Atlas provides visual style brief + AI prompt architecture
   ↓ Gate: Atlas prompt-qa check before handing to Pixel
Stage 3: PRODUCTION Pixel generates, QCs, and delivers final assets
   ↓ Gate: Pixel QC criteria + Stark approval before publish
```

**No stage starts until the previous stage's gate is cleared.**

---

## Stage Gates — Entry Criteria

### Gate 0→1: Brief to Copy
Before Lena starts writing:
```
□ Venture specified: [novizio | hourbour]
□ Platform specified: [Instagram | TikTok | Email | LinkedIn]
□ Content goal: [awareness | conversion | retention]
□ Key metric this content should move: [e.g., engagement rate, CTR, trial starts]
□ Competitor context: [what are competitors doing that this should respond to?]
□ Brand constraints: [any campaign-specific rules from venture FEEDBACK.md]
```

### Gate 1→2: Copy to Creative Direction
Before Atlas starts:
```
□ Copy is complete and reviewed by Lena (triple-pass run)
□ Kahneman framing check complete for any ad copy (🟢 or 🟡 only — 🔴 blocks)
□ Copy includes: headline, body, CTA
□ Platform format confirmed: [static | carousel | Reel/video | story]
□ Any specific visual constraints from the copy (mentions of season, color, mood)
```

### Gate 2→3: Direction to Production
Before Pixel starts batch:
```
□ Atlas visual brief complete
□ Prompt-qa check run by Atlas (skills/custom/prompt-qa)
□ AI model selected for this batch (skills/workflow/model-selection)
□ Number of variants confirmed: [single | 3-5 variants | batch > 20]
□ Output format specified: [dimensions, file type, naming convention]
□ Pre-mortem run if batch > 20 images
```

### Gate 3→Publish
Before anything goes to market:
```
□ Pixel QC complete: rejection rate < 20%
□ Stark (or Marcus) has approved final assets
□ Copy and visual are still aligned (no copy drift during production)
□ Scheduled in content calendar with correct venture context
```

---

## Handoff Format

Each agent uses this handoff card when passing to the next stage:

```
CONTENT HANDOFF — [Stage name] → [Next agent]
Venture:    [novizio | hourbour]
Platform:   [platform]
Piece type: [copy | visual brief | production batch]
Status:     GATE CLEARED ✅

What's included: [short description]
What's needed from [next agent]: [clear ask]
Deadline: [date]
Blocker risk: [any known risk to the next stage?]
```

---

## Calendar Integration

Diana maintains the content calendar in `/api/content-calendar`. Rules:

```
□ Every piece in the pipeline has a Stage 0 date (brief) and a publish date
□ Stage 1 (copy) must be complete ≥ 5 days before publish date
□ Stage 2 (direction) must be complete ≥ 3 days before publish date
□ Stage 3 (production) must be complete ≥ 1 day before publish date (QC buffer)
□ Stark approval gate: ≥ 1 day before publish date
```

If a stage is running late: Diana flags to Marcus — never silently slip the publish date without Marcus knowing.

---

## Pipeline Health Metrics

Diana reports weekly (in KPI briefing to Marcus):

| Metric | Green | Amber | Red |
|--------|-------|-------|-----|
| Pieces in Stage 1 (copy) | ≤ 3 | 4–5 | ≥ 6 (backlog) |
| Avg stage duration (days) | Brief→Copy: 2 | 3 | > 3 |
| Gate failure rate | < 10% | 10–20% | > 20% |
| Pieces missed publish date | 0 | 1 | ≥ 2/week |

---

## Anti-Patterns

- Never let Pixel start production without Atlas's direction brief — random prompts in production waste compute
- Never skip the Kahneman framing check on ad copy — this gate exists because it was violated repeatedly
- Never schedule a publish date without confirming Stage 3 completion is possible in the window
- Never route a content piece directly from Kai to Pixel — copy always comes before production
