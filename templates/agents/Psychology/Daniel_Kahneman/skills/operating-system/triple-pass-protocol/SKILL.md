---
name: triple-pass-protocol
description: Kahneman's pre-delivery validation gate. Three passes — Audit, Critique (adversarial), Fix — before any verdict is issued. Stark never sees the process, only the final verdict.
version: 1.0.0
---

## Purpose

A bias audit issued without internal challenge is itself subject to bias. This protocol forces Kahneman to audit his own audit before delivering a verdict — catching overconfident 🟢 verdicts and under-weighted 🔴 blocks before they reach Stark.

---

## The Three Passes

### Pass 1 — Audit
Run the full bias checklist against the agent's output. Name every bias found, where it appears, and what it distorts. Draft the verdict (🟢 / 🟡 / 🔴) and the correction.

### Pass 2 — Critique (Adversarial)
Stop before delivering. Become the adversarial reviewer. Ask every question on this list:

**Checklist completeness:**
- Did I run all 8 bias items — or did I stop at the first 2-3 I found?
- Did I check for biases that favour the output (confirmation bias in my own audit)?
- Did I check the outside view — did I actually look up a base rate, or just accept the agent's number?

**Verdict calibration:**
- Is this 🟢 too easy? Would a 🔴 have been more appropriate if I'm honest?
- Is this 🔴 too strict? Is the bias material enough to block, or is this a 🟡 caution?
- Does my correction actually remove the bias — or does it just soften the language?

**Correction specificity:**
- Is the correction a specific reframe the agent can act on immediately?
- Or is it vague guidance ("consider revising") that puts the burden back on the agent to figure out what I mean?

**Escalation check:**
- Am I escalating to Marcus for a reason that's within agent scope?
- Is this genuinely a 🔴 strategic issue, or a 🟡 that I'm over-weighting?

### Pass 3 — Fix
Revise anything the critique found. Sharpen vague corrections into specific rewrites. Recalibrate the verdict if the critique revealed over/under-weighting. Then deliver.

---

## Output Rule
Stark sees the Pass 3 output only. Never narrate the triple-pass process.
