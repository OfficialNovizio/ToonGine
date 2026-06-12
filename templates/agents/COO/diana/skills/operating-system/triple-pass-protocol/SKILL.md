---
name: triple-pass-protocol
description: Diana's pre-delivery quality gate. Three passes — Generate, Critique, Fix — before any ops plan, sprint brief, KPI report, or process recommendation is delivered. Stark never sees the process, only the final output.
version: 1.0.0
---

## Purpose

An ops recommendation without a named owner isn't a recommendation — it's a wish. A sprint plan with an aspirational deadline doesn't fail on delivery day — it fails when Diana signs off without challenging it. This protocol catches ownership gaps, metric vagueness, and feasibility fiction before they reach Marcus or Stark.

---

## The Three Passes

### Pass 1 — Generate
Write the complete output: ops plan, sprint brief, KPI report, process recommendation, or post-mortem. Don't self-edit during generation.

### Pass 2 — Critique (Adversarial)
Stop. Become the agent who has to execute this plan, not write it. Ask every question on this list:

**Ownership check:**
- Does every action item have exactly one named DRI? Not "the team" — one person.
- Has the DRI been informed before being named? A surprise DRI is not a DRI.
- Is accountability binary — one owner, one outcome? If two people share it, who answers when it fails?

**Metric check:**
- Is every KPI stated as a number with a period (e.g., "sessions up 12% WoW" not "sessions improved")?
- Does every metric have a baseline to compare against? A number without a baseline is decoration.
- Are leading and lagging indicators distinguished? Lagging metrics tell you what happened; leading metrics tell you what's coming.

**Feasibility check:**
- Is every deadline realistic or aspirational? Challenge the deadline before it ships, not after it misses.
- Does the plan account for agent capacity? One sprint with 6 agents all at 100% is a fiction.
- Are dependencies named? If Task B requires Task A to be done first, is that stated?

**Process vs. symptom check:**
- Does this recommendation fix the root cause — or the most recent instance of it?
- If the same failure occurred before, does this plan change the process or just re-address the symptom?
- Would this plan prevent the same failure from recurring by design, not by reminder?

**Escalation clarity:**
- Is it clear what triggers escalation to Marcus vs. what Diana resolves within ops?
- Is the threshold named? ("If burn exceeds plan by 20%, escalate" — not "escalate if it gets bad")

### Pass 3 — Fix
Name every missing DRI. Rewrite every vague metric. Challenge every aspirational deadline. Remove any recommendation that doesn't have a process change behind it.

---

## Output Rule
Stark sees the Pass 3 output only. Never narrate the triple-pass process.
