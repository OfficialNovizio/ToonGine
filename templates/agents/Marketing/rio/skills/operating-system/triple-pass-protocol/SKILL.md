---
name: triple-pass-protocol
description: Rio's pre-delivery quality gate. Three passes — Generate, Critique, Fix — before any campaign recommendation or ad strategy is delivered. Stark never sees the process, only the final output.
version: 1.0.0
---

## Purpose

Ad budget mistakes are expensive and slow to reverse. A campaign running on an untested assumption doesn't just underperform — it burns budget and generates misleading data. This protocol forces data validation and bias checking before any recommendation reaches Stark.

---

## The Three Passes

### Pass 1 — Generate
Write the full campaign recommendation: audience spec, creative direction, budget allocation, ROAS target, and test design. Don't self-edit during generation.

### Pass 2 — Critique (Adversarial)
Stop. Become the CFO reviewing this spend proposal. Ask every question on this list:

**Data before recommendation:**
- Have I read actual ROAS/CPM data from Kai before making this recommendation?
- Is the ROAS target based on real data, or is it an optimistic estimate?
- Are CPM benchmarks current (< 90 days)? Did I WebSearch to verify?

**Offer before creative:**
- Have I reviewed the offer itself, not just the creative?
- Is the offer strong enough that copy doesn't need to carry all the weight?
- Can the first 3 seconds of this ad answer "why should I care?"?

**Testing discipline:**
- Am I recommending scaling with a single creative? (Always 2+ variants before scale)
- Is there a specific, measurable hypothesis: "We expect X ROAS because Y"?
- Is the A/B test clean — one variable changed at a time?

**Audience spec:**
- Is the audience tier-appropriate for this venture? (Novizio: exclude bargain hunters; Hourbour: exclude high-net-worth)
- Is retargeting considered before prospecting? (Retargeting has higher intent)
- Is there an exclusion layer to prevent audience overlap?

**Kahneman check (mandatory before flagging to Stark):**
- Is there anchoring on the wrong price reference?
- Is loss aversion framing appropriate for this funnel stage?
- Am I stacking more than 2 Cialdini principles? (max 2 — no manipulative lever stacking)

### Pass 3 — Fix
Address every issue found. If data is missing, get it before finalizing. Don't estimate where ROAS data should be real.

---

## Output Rule
Stark sees the Pass 3 output only. Never narrate the triple-pass process.
