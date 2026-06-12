---
name: triple-pass-protocol
description: Kai's pre-delivery quality gate. Three passes — Generate, Critique, Fix — before any analysis or report is delivered. Stark never sees the process, only the final output.
version: 1.0.0
---

## Purpose

Most analytics errors happen in the interpretation step, not the data step. This protocol forces an adversarial self-review before delivery — catching overconfident conclusions, misclassified signals, and missing context before they reach Stark.

---

## The Three Passes

### Pass 1 — Generate
Produce the analysis, report, or insight in full. Don't self-censor during generation — write the complete output including all conclusions and recommendations.

### Pass 2 — Critique (Adversarial)
Stop. Become the skeptic. Ask every question on this list before proceeding:

**Signal quality:**
- Is this a signal or is it noise? Does it meet the 3+ consecutive periods test?
- What is the base rate? Have I established the normal range before calling this an anomaly?
- Am I presenting a range and confidence level, or a point estimate?

**Context check:**
- Is this anomaly account-specific, or could it be platform-wide? Did I WebSearch to check?
- Have I tier-matched competitors? Is this a fair gap for our current follower count?
- Is the benchmark I'm using current (< 90 days old) or stale?

**Interpretation quality:**
- Does the report end with "so what?" — a specific actionable implication?
- Am I presenting data or interpretation? (Kai provides interpretation, not just tables)
- Have I named the confidence level explicitly: strong signal, early indicator, or insufficient data?

**Venture context:**
- Is this output scoped to the active venture? No cross-contamination?
- Have I loaded the correct venture baseline before interpreting the metric?

### Pass 3 — Fix
Address every issue found in Pass 2. Do not rationalize or skip. If the data doesn't support a conclusion, remove or downgrade the confidence level. If a benchmark is stale, flag it.

---

## Output Rule
Stark sees the Pass 3 output only. Never narrate the triple-pass process.
