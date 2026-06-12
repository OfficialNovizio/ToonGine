---
name: ice-scoring-framework
description: YVON-calibrated ICE scoring for growth experiment prioritisation. Defines Impact, Confidence, and Effort scales anchored to Novizio and Hourbour's business models. Load before scoring any experiment brief.
version: 1.0.0
---

## Purpose

ICE scoring without calibration is noise. "Impact 9" on a Novizio experiment means something specific — it moves purchase conversion. "Impact 9" on a Hourbour experiment means something different — it moves trial-to-paid conversion. This skill anchors each dimension to YVON's ventures so scores are comparable across experiments and honest about what they assume.

---

## ICE Score Formula

```
ICE = (Impact + Confidence + Effort) / 3
```

Each dimension scored 1–10. Effort is inverse: 10 = lowest effort (easiest to run).

**Priority thresholds:**

| ICE Score | Action |
|-----------|--------|
| ≥ 7.0 | Fast track — run in current sprint |
| 5.0–6.9 | Queue — schedule in next sprint |
| 3.0–4.9 | Backlog — revisit when higher-scored experiments are done |
| < 3.0 | Drop — effort exceeds expected return |

---

## Impact Scale — Venture Calibrated

**Novizio (Fashion E-commerce) — Impact anchors:**

| Score | What it moves |
|-------|--------------|
| 9–10 | Directly increases purchase conversion rate or average order value |
| 7–8 | Increases add-to-cart rate or reduces cart abandonment |
| 5–6 | Increases product page engagement (time on page, scroll depth) |
| 3–4 | Increases site traffic or social engagement without direct conversion path |
| 1–2 | Brand awareness only — no measurable conversion signal within 14 days |

**Hourbour (SaaS Subscription) — Impact anchors:**

| Score | What it moves |
|-------|--------------|
| 9–10 | Directly increases trial-to-paid conversion or reduces monthly churn |
| 7–8 | Increases activation rate (users reaching first key action within 7 days) |
| 5–6 | Increases trial signups from landing page |
| 3–4 | Increases traffic, leads, or trial starts without activation data |
| 1–2 | Brand awareness only — no measurable subscription signal within 14 days |

---

## Confidence Scale

| Score | Evidence basis |
|-------|---------------|
| 9–10 | 3+ comparable experiments with consistent results (own data) |
| 7–8 | 1–2 comparable experiments or strong analogous data from similar businesses |
| 5–6 | Qualitative evidence: user interviews, surveys, or session recordings — no direct conversion data |
| 3–4 | Logical inference from related data (e.g., industry benchmarks, Kai's trend data) |
| 1–2 | Pure hypothesis — no supporting evidence beyond intuition |

**Rule:** Never round up Confidence. If evidence is thin, score it thin. A wrong high-Confidence score burns 14 days on a bad bet.

---

## Effort Scale (Inverse — Higher = Lower Effort = Better)

| Score | Effort required |
|-------|----------------|
| 9–10 | < 1 day to implement, Nate or Lena/Rio executes without Dev/Raj |
| 7–8 | 1–3 days, single DRI can execute (no technical dependency) |
| 5–6 | 3–7 days, requires one Dev/Raj resource |
| 3–4 | 1–2 weeks, cross-team coordination required |
| 1–2 | > 2 weeks or major engineering lift |

**Common underestimation patterns:**
- "It's just a quick copy change" → check with Lena: how long does a complete variant take?
- "It's just a design tweak" → check with Mia: what's the actual implementation time?
- "It's already built" → check with Dev/Raj: is it actually deployable in current state?

---

## Scoring Protocol

For every experiment, state scores AND assumptions:

```
Experiment: [name]
Impact: [score] — assumes [specific outcome and which funnel stage]
Confidence: [score] — based on [specific evidence or data source]
Effort: [score] — assumes [who executes, estimated time, dependencies]
ICE: [calculated average]
```

**Example:**
```
Experiment: Add size guide popup to Novizio PDP
Impact: 7 — assumes reducing size uncertainty increases ATC rate by 10–15%
Confidence: 5 — based on 2 user interviews citing sizing as a hesitation; no split test data
Effort: 8 — Mia estimated 2 days for design + implementation
ICE: 6.7 → Queue
```

---

## ICE Calibration Log

After every experiment resolves, compare predicted vs actual impact:

| If predicted Impact was... | And actual was... | Update |
|---------------------------|------------------|--------|
| 8, actual 3 | Overestimated | Reduce confidence on similar hypotheses by 1–2 points |
| 5, actual 8 | Underestimated | Increase priority of similar experiments; refine anchor definitions |
| Consistent with prediction | Well-calibrated | No change needed |

A scoring model that consistently over- or under-predicts is the problem — not the experiments.
