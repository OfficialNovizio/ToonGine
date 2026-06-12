---
name: prompt-variation-engine
description: Systematic recovery when QC fails. Variation hierarchy for image and video prompts — what to change first, what to change last. Stops Pixel from guessing. Covers negative prompts, seed, steps, CFG, sampler, and prompt rewrites.
version: 1.0.0
---

## Purpose

When an image fails QC, the wrong response is to regenerate with the same prompt and hope for a different result. The right response is to change one variable at a time, in a known order, and read the result before changing another. This skill makes recovery systematic.

---

## The Variation Hierarchy

**Rule:** Change the lowest-cost variable first. Work down the hierarchy only when the higher level doesn't fix it.

```
Level 1 — Negative prompt (fastest, no quality cost)
Level 2 — Seed (next fastest)
Level 3 — Steps / CFG scale (affects generation cost)
Level 4 — Sampler (affects generation style)
Level 5 — Prompt rewrite (consult Atlas if > 3 words change)
Level 6 — Return to Atlas (direction is broken, not the execution)
```

Never skip levels unless the failure reason clearly maps to a deeper level (e.g., anatomy errors almost always start at Level 1; style direction failures often indicate Level 6).

---

## Level 1 — Negative Prompt Additions

The fastest fix. Add to the negative prompt before touching anything else.

### Anatomy failures → add to negative prompt

```
extra fingers, fused fingers, extra limbs, deformed hands, malformed hands,
mutated hands, bad anatomy, distorted face, asymmetrical face, floating limbs,
disconnected limbs, extra head, cloned face, ugly, deformed
```

### Text artifact failures → add to negative prompt

```
text, watermark, signature, logo, label, letters, numbers, words, typography,
blurry text, illegible text, copyright
```

### Background failures → add to negative prompt

```
busy background, cluttered background, pattern background, tiling, repetitive pattern,
extra people, extra figures, crowded, messy environment
```

### Catalogue/stock energy (Novizio) → add to negative prompt

```
white background, plain background, catalogue, stock photo, commercial, posed,
fake smile, perfect symmetry, product shot, flat lay on white
```

### Fintech clichés (Hourbour) → add to negative prompt

```
coins, cash, money, piggy bank, dollar sign, graph lines, upward arrow,
boardroom, suits, handshake, floating phone, sterile, clinical
```

---

## Level 2 — Seed Variation

When Level 1 doesn't fix it: change the seed. Same prompt + same negative prompt + new seed = different image composition with the same style direction.

| Situation | Action |
|-----------|--------|
| Anatomy error persists after negative prompt | Generate 3 new seeds before escalating |
| Background composition is wrong but style is right | Try 2 new seeds |
| Subject pose is off | Try 2 new seeds before rewriting prompt |
| Batch inconsistency (one outlier image) | Regenerate the outlier with a new seed |

**Rule:** Try at least 2 different seeds before moving to Level 3.

---

## Level 3 — Steps and CFG Adjustment

When subject detail or prompt adherence is the issue (not anatomy or background).

| Problem | Adjustment |
|---------|-----------|
| Image looks soft or undetailed | Increase steps: +5 to +10 |
| Subject doesn't match prompt description closely | Increase CFG scale: +0.5 to +1.0 |
| Image looks over-processed or plastic | Decrease CFG scale: -0.5 to -1.0 |
| Too much noise in output | Decrease steps: -5 |

**Typical ranges:**
- Steps: 20–50 (start at 30 for standard production)
- CFG scale: 5.0–9.0 (start at 7.0 for standard)

**Rule:** Change one at a time. Steps first if detail is the issue. CFG if prompt adherence is the issue.

---

## Level 4 — Sampler Change

When style register is wrong (the image looks different in texture or rendering quality from what the style spec intends).

| Current sampler | Try instead | When |
|----------------|-------------|------|
| Euler a | DPM++ 2M Karras | More detail, smoother result |
| DPM++ 2M Karras | Euler a | Softer, more painterly |
| DDIM | DPM++ SDE Karras | Better prompt adherence |

**Rule:** Only change sampler when style register is wrong, not when subject or anatomy is wrong. Sampler does not fix anatomy.

---

## Level 5 — Prompt Rewrite

When the failure is not in execution but in what the prompt is asking for.

**Pixel can rewrite independently (< 3 words changed):**
- Swapping a vague adjective for a specific one (e.g., `beautiful` → `soft editorial`)
- Removing a descriptor that conflicts with QC result
- Adding a specific composition instruction (e.g., `rule of thirds`, `subject left-aligned`)

**Pixel must flag Atlas before rewriting (> 3 words changed):**
- Changing the subject description
- Changing the setting or environment
- Changing any mood adjective that was explicit in Atlas's brief
- Removing any element that Atlas included deliberately

**Format for flagging Atlas:**
```
Variation flag → Atlas:
Batch: [name]
Images failed: [N] / [total]
Rejection reason: [specific]
Proposed change: [exact text to change] → [proposed replacement]
Reason: [why this variation targets the failure pattern]
Awaiting: approval to run variation batch
```

---

## Level 6 — Return to Atlas

Return to Atlas (do not attempt further variation) when:

- Rejection rate > 20% after Levels 1–4 applied
- The failure pattern is structural (every image fails the same check)
- Prompt contains a fundamental contradiction that variations cannot resolve
- The style spec direction is producing images that are technically correct but off-brand

**Format for returning to Atlas:**
```
Production block → Atlas:
Batch: [name] — [venture] — [campaign]
Rejection rate: [%] after [N] variation attempts
Root failure: [specific pattern — not "images look bad"]
Variations attempted: [list what was tried at each level]
Assessment: prompt architecture needs revision before batch can proceed
```

---

## Video Variation Rules

Video prompts have fewer levers than image prompts. Variation hierarchy is shorter:

```
Level 1 — Negative prompt additions (same as image)
Level 2 — Motion prompt adjustment (reduce motion descriptors if output is unstable)
Level 3 — Duration / frame count reduction (shorter clips are more stable)
Level 4 — Return to Atlas (video direction is broken)
```

Video-specific negative prompt additions for common failures:

```
flickering, jittery motion, morphing face, distorted movement, teleporting subject,
background morphing, inconsistent lighting, color flicker
```
