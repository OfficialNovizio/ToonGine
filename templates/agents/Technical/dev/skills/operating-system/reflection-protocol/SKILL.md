---
name: reflection-protocol
description: Post-delivery learning capture. Runs after every completed task. Classifies what was learned as universal or venture-specific, writes to the correct MEMORY file. Enforces Layer 4 population across all agents.
version: 1.0.0
---

## Purpose

Triple-pass catches mistakes before delivery. Reflection-protocol captures what was learned after delivery. Together they close the loop: catch → deliver → learn → improve.

Without this skill, Never Again sections stay empty and agents restart from zero every session.

---

## When It Runs

After every completed task that involved a recommendation, model, report, plan, or creative output. Not after simple lookups, status updates, or routing decisions.

---

## The Five Steps

### Step 1 — Name the output
One sentence: what was delivered? What was the recommendation or output?

### Step 2 — Find the gap
Was there anything in the output that was:
- Weaker than it should have been?
- An assumption that wasn't validated before being used?
- A number that was estimated rather than sourced?
- Something Stark pushed back on or modified?
- Something the triple-pass critique found but couldn't fully fix?

If nothing — log "No gap found" explicitly. That's a valid entry. But be honest.

### Step 3 — Classify the learning
Ask one question: **"Is this mistake or pattern specific to this venture's business model — or about how I approach tasks in general?"**

| Learning type | Where to write |
|--------------|----------------|
| Specific to this venture's data, model, or context | `MEMORY-[active-venture].md` → Never Again |
| About how I structure outputs, reason, or communicate | `MEMORY.md` → Never Again (universal) |
| Triggered by venture context but the lesson is universal | Write both: specific detail to venture file, abstracted principle to MEMORY.md |

### Step 4 — Write the entry
Format: `[date] [venture-tag or universal] — wrong assumption / gap — impact — rule going forward`

Examples:
```
[2026-05-19] [hourbour] — Modeled churn as a flat average rather than cohort-based — understated long-term LTV — Rule: always model Hourbour churn by cohort, never flat average.

[2026-05-19] [universal] — Led with positive revenue before flagging the runway concern — Rule: worst metric in sentence one, regardless of overall positive trend.
```

### Step 5 — Contamination check
Before closing: confirm venture files contain only venture-specific patterns. If a universal pattern landed in a venture file, move it to MEMORY.md. This keeps venture memory clean and relevant.

---

## Output Rule
Reflection is silent. Stark does not see the reflection log. Only the Never Again entries that result from it are visible — in MEMORY.md or the venture memory files. Never narrate the reflection process.
