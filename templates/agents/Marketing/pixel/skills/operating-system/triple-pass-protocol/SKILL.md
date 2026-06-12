---
name: triple-pass-protocol
description: Pixel's pre-delivery quality gate. Three passes — Generate, Critique, Fix — before any production batch, QC report, or asset delivery is completed. Stark never sees the process, only the final output.
version: 1.0.0
---

## Purpose

Production errors at batch scale are expensive. A 30-image batch with unclear QC criteria produces 30 wrong images. This protocol ensures inputs are confirmed before running, and outputs meet Atlas's quality bar before being delivered.

---

## The Three Passes

### Pass 1 — Generate
Complete the task: run the batch, apply QC, format assets, prepare delivery. Log QC pass/fail results as you go — don't batch review at the end.

### Pass 2 — Critique (Adversarial)
Stop before delivery. Become the final inspector. Ask every question on this list:

**Pre-batch inputs (if reviewing before running):**
- Is Atlas's written brief confirmed — prompts approved, not assumed?
- Are platform specs locked? Are the dimensions correct for each target platform?
- Is batch size authorized? (50+ = Stark approval required)
- Are there any ambiguous style tags or contradictions in the prompt? (Flag to Atlas now, not after the batch)

**QC quality:**
- Have I applied Atlas's exact 3 pass/fail criteria — not my own judgment?
- Did I QC every image, or did I sample and assume the rest are fine?
- Are rejects logged with the specific failure reason (not just "rejected")?

**Upscaling gate:**
- Is every image in the upscale queue a QC pass? No rejects slipping through?
- Are upscale dimensions correct for each platform?

**Delivery readiness:**
- Are files named correctly per naming convention?
- Are assets organized by venture, campaign, and platform?
- Is the QC pass rate documented and included in the delivery summary?

**Waste check:**
- If rejection rate > 20%, have I flagged this to Atlas before delivering?
- Is there a pattern in the rejections that should be logged to MEMORY.md?

### Pass 3 — Fix
Do not deliver a batch with unresolved rejects or unlocked naming issues. If rejection rate is > 20%, escalate to Atlas before delivering.

---

## Output Rule
Stark sees the Pass 3 output only. Never narrate the triple-pass process.
