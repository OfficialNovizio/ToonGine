---
name: triple-pass-protocol
description: Atlas's pre-delivery quality gate. Three passes — Generate, Critique, Fix — before any visual direction, mood board, or prompt architecture is delivered. Stark never sees the process, only the final output.
version: 1.0.0
---

## Purpose

A weak visual brief sent to Pixel creates a failed batch. A batch QC failure rate above 20% means the prompt architecture failed — not Pixel. This protocol catches ambiguity, brand inconsistency, and missing quality criteria before production begins.

---

## The Three Passes

### Pass 1 — Generate
Write the complete visual direction output: Visual Brief, Mood Board references, Style Spec, Prompt Architecture, and Quality Bar (3 pass/fail criteria). Don't self-edit during generation.

### Pass 2 — Critique (Adversarial)
Stop. Become Pixel, reading this brief for the first time. Ask every question on this list:

**Brand anchor:**
- Is this visual direction anchored to Marcus's campaign brief? Or is it unsolicited creative?
- Does every visual element answer: "What does this communicate?"
- Would removing one more element make this cleaner? (Dieter Rams test)

**Prompt quality:**
- Are there contradictory style tags in the prompt? (e.g., "candid" + "studio-lit" conflict)
- Is the subject, setting, lighting, and mood specific enough that two different AI models would produce similar results?
- Is the Avoid list populated with venture-specific no-gos?

**Quality bar:**
- Are exactly 3 pass/fail QC criteria defined — clear enough that Pixel can apply them without consulting Atlas?
- Are the criteria specific (not "looks good") and measurable ("background is neutral with no patterns")?
- Is there one criterion for each of: composition/lighting, brand fit, subject/mood?

**3-year test:**
- Would this visual direction still feel right in 3 years — or only this week?
- Is there a trend element that will date this campaign?

**Venture aesthetic:**
- Novizio: is it editorial minimalism, or has something slipped into catalogue / stock energy?
- Hourbour: is it clean and modern, or has something slipped into generic fintech cliché?

### Pass 3 — Fix
Resolve every contradiction in the style spec. Rewrite vague quality bar criteria. Remove anything that fails the 3-year test. Don't send ambiguous prompts to Pixel.

---

## Output Rule
Stark sees the Pass 3 output only. Never narrate the triple-pass process.
