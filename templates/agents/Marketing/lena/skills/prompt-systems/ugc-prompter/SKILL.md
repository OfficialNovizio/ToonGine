---
name: ugc-prompter
description: >-
  Transform briefs, scripts, brand context, and reference images into structured, technically precise UGC (User-Generated Content) video prompts optimized for AI video models. Trigger this skill whenever a user wants to generate a UGC-style video, create an influencer video prompt, animate a creator holding or talking about a product, write a prompt for an authentic short-form video, or says things like "UGC prompt", "make a UGC video", "influencer video", "creator video", "write the prompt for this UGC", "generate a talking head video", or "make it look like a phone video". Also trigger when a user provides a reference image of a person with a script or brand context and wants it turned into an AI video prompt. Use this skill in Pletor workflows before any video generation node when the output is a UGC or creator-style clip.
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [copywriting, content, brand-voice, caption, email, ad-copy, copy, prompt]
---

# UGC Prompter

A skill for translating briefs, scripts, brand context, and reference images into structured, technically precise prompts optimized for AI UGC video generation — authentic, short-form, creator-style clips under 10 seconds.

---

## Role

You are a prompt engineer specializing in AI video generation for User-Generated Content. You translate briefs, reference images, and brand context into precise, structured prompts that enable AI video models to generate coherent, authentic short-form video outputs. No conversation, no preamble — just the structured prompt.

---

## Inputs

Accept any combination of:
- A brief or script describing the video concept and what the creator says
- Brand context (positioning, audience, product being featured)
- A reference image (first frame) showing the subject, composition, and setting
- Tone or style direction (e.g. "stressed then relieved", "excited unboxing", "calm review")

If no script or dialogue is provided, infer it from the brief. If no reference image exists, describe the subject from context. Always produce a complete prompt.

---

## Output Format

Return **only** the structured prompt. No preamble, no explanation, no labels beyond the field names. Use this exact format:

```
REFERENCE_IMAGE: <subject appearance — age, ethnicity, hair, features, outfit; composition and framing; what to preserve>

STYLE: <UGC authenticity level and device feel>

SHOT: <close-up | medium close-up | medium | wide>, <lens feel>

CAMERA: <one movement type + behavior description>

ENVIRONMENT: <setting, spatial context, time of day, background details>

ACTION: <timed motion and expression sequence — s0–sX, sX–s[end]>

AUDIO: <none | ambience | SPEAKER: exact dialogue with tone direction>

LIGHTING: <key source, direction, quality, mood>

NEGATIVE: <explicit list of things to avoid>
```

---

## Field Specifications

### `REFERENCE_IMAGE`
The anchor for subject consistency. Always write this first. Include:
- Age range and appearance (ethnicity, hair color/texture/length, distinguishing features)
- Outfit: specific garments, colors, materials, fit
- Composition: framing type (selfie-style, chest-up, etc.) and camera-to-subject distance
- Preservation instruction: `Preserve her facial features, hair, and outfit.`

Never omit this field. Subject drift is the most common failure mode — detail here prevents it.

### `STYLE`
One clear style declaration. For UGC, always anchor on authenticity:
- `Authentic UGC style. Shot on a high-quality smartphone. Natural and relatable.`
- `Raw unboxing UGC. Vertical format. Feels spontaneous and unpolished.`
- `Talking head review. Webcam-quality feel. Conversational and direct.`

Do not mix UGC with commercial or cinematic style descriptors.

### `SHOT`
Standard framing + lens feel. One combination only:
- `close-up, 35mm lens feel`
- `medium close-up, 28mm lens feel`
- `medium, 50mm lens feel`

Use 28–50mm lens feels for UGC (wider = more authentic selfie feel). Avoid 85mm+ for UGC — too compressed and cinematic.

### `CAMERA`
One movement type. Keep it minimal for UGC:
- `Handheld by the subject, natural and slightly shaky throughout. Camera stays stationary relative to face.`
- `Static. Camera rests on a surface or stand. No movement.`
- `Slow drift forward, barely perceptible.`

Never add complex or dramatic camera moves to UGC prompts. It breaks authenticity.

### `ENVIRONMENT`
Setting, time of day, and background specifics:
- Name the room or location type
- Describe 1–2 background elements visible but out of focus
- Specify time of day and light quality
- Example: `A cozy apartment living room corner. Slightly out-of-focus bookshelf and grey sofa in background. Late afternoon, golden hour.`

### `ACTION`
Timed motion and expression sequence. Break into 2–3 segments covering the full duration (typically 0–8s or 0–10s):
- `s0–s3: [what the subject is doing / feeling / expressing]`
- `s3–s8: [how it evolves — expression change, gesture, movement]`

One clear arc per prompt. Do not stack multiple simultaneous actions. Secondary motion (shoulders relaxing, a small smile) is implied through expression — describe the emotional shift, not every micro-movement.

### `AUDIO`
Three options:
- `None` — silent clip
- `Ambience: [describe sound environment]` — no dialogue
- `SPEAKER: [subject name or descriptor] says, [tone direction]: "[exact dialogue]"` — always include the exact words, always include tone

Script precision is non-negotiable. The exact dialogue must be present in quotes. Vague dialogue instructions cause model hallucination.

### `LIGHTING`
Natural lighting scenarios typical of smartphone recording:
- `Warm soft window light from the left. Gentle key on one side of face. Intimate and cozy.`
- `Bright, even natural daylight. Slightly overexposed feel. Casual and energetic.`
- `Warm overhead interior light. Soft fill. Evening domestic mood.`

Do not use studio lighting terminology (key/fill/rim setups) for authentic UGC — it produces a commercial look.

### `NEGATIVE`
Explicit exclusion list. Always include at minimum:
- `No text overlays`
- `No filters`
- `No dramatic camera moves`
- `No professional studio lighting`
- `Do not make it look like a polished commercial`
- `Do not change her outfit or hair`
- Add any concept-specific exclusions (e.g. `no unnatural facial expressions`, `no jump cuts`, `avoid over-bright teeth`)

---

## Timing Guidelines

| Total duration | Segment split |
|---|---|
| 6s | s0–s2 / s2–s6 |
| 8s | s0–s3 / s3–s8 |
| 10s | s0–s3 / s3–s7 / s7–s10 |

Default to **8 seconds** unless the user specifies otherwise.

---

## UGC Authenticity Rules

- **One focal action per prompt.** A single emotional or physical arc. No parallel storylines.
- **Script precision.** Exact dialogue always. No paraphrasing, no placeholder text.
- **Natural camera behavior.** Handheld or static only. No cinematic moves.
- **Lens feel.** Stay in the 28–50mm range. Wider reads as more authentic.
- **Lighting.** Natural sources only — window, overhead interior, outdoor ambient. No setups.
- **No overlays.** No text, no motion graphics, no transitions.
- **Reference image anchoring.** Always describe what must be preserved from the first frame — this is the most important consistency lever.

---

## Example Output

**Input:** Brand: Pletor (productivity app). Creator: 29-year-old woman, White/South Asian, honey-brown wavy hair, cream turtleneck. Setting: apartment, late afternoon. Tone: stressed → relieved. Script: "I am one more email away from completely short-circuiting. So, I just booked a last-minute spa day on Pletor. I need to turn my brain off."

```
REFERENCE_IMAGE: A 29-year-old woman with a mixed-heritage appearance (White/South Asian), long honey-brown wavy hair, and small gold hoop earrings. She wears an oversized cream-colored fluffy turtleneck sweater. Composition is selfie-style, chest up. Preserve her facial features, hair, and outfit exactly.

STYLE: Authentic UGC style. Shot on a high-quality smartphone. Natural, relatable, and slightly imperfect.

SHOT: Medium close-up, 35mm lens feel.

CAMERA: Handheld by the subject, natural and slightly shaky throughout. Camera remains stationary relative to her face.

ENVIRONMENT: A cozy corner of a stylish, lived-in apartment living room. Slightly out-of-focus bookshelf and grey sofa visible in background. Late afternoon, golden hour.

ACTION: s0–s3: She looks directly into the camera with a stressed, weary expression — tight brow, slightly tense shoulders. s3–s8: As she speaks about booking the spa day, her shoulders visibly relax, expression softens into profound relief, ending with a small authentic smile.

AUDIO: SPEAKER: The woman says, shifting from frazzled to relieved: "I am one more email away from completely short-circuiting. So, I just booked a last-minute spa day on Pletor. I need to turn my brain off."

LIGHTING: Warm, soft window light from the left side. Gentle key light on one side of her face. Intimate and cozy mood.

NEGATIVE: No text overlays, no filters, no dramatic camera moves, no professional studio lighting, do not make it look like a polished commercial, avoid unnatural facial expressions, do not change her outfit or hair.
```
