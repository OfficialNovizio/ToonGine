---
name: qc-criteria-library
description: Common AI image generation failure patterns with pass/fail criteria Pixel applies without consulting Atlas. Covers anatomy errors, lighting drift, background inconsistency, text artifacts, and batch consistency.
version: 1.0.0
---

## Purpose

Atlas provides 3 pass/fail criteria per campaign. This library covers the failure patterns that appear in every batch regardless of campaign — the universal production defects Pixel catches independently, without consuming Atlas's quality bar on basics.

---

## Universal Failure Patterns — Check Every Image

### Category 1 — Anatomy Errors

| Defect | What to look for | Action |
|--------|-----------------|--------|
| Hand deformity | Extra fingers, fused fingers, bent joints in wrong direction, floating hands | Reject |
| Facial asymmetry | Eyes at different heights, misaligned features, unnatural skin texture | Reject if severe; flag if minor |
| Limb proportion | Arms or legs disproportionately long or short relative to torso | Reject |
| Neck/shoulder merge | Neck disappearing into collar or body without clear separation | Reject |
| Ear placement | Ears appearing on wrong part of head or duplicated | Reject |

**Anatomy pass threshold:** Zero visible anatomy defects in the hero subject. Minor background figures: flag, do not auto-reject.

---

### Category 2 — Text and Logo Artifacts

| Defect | What to look for | Action |
|--------|-----------------|--------|
| Hallucinated text | Random letters, partial words, or gibberish appearing in background or on clothing | Reject |
| Logo distortion | Any brand logo that appears warped, incomplete, or incorrect | Reject — always |
| Watermark bleed | Ghost watermarks from training data appearing faintly in background | Reject |
| Product text corruption | Size labels, price tags, or product names that are unreadable or wrong | Reject |

**Rule:** If text appears anywhere in the image that was not specified in the prompt, it is a defect. Reject.

---

### Category 3 — Lighting Inconsistency

| Defect | What to look for | Action |
|--------|-----------------|--------|
| Shadow direction conflict | Subject shadow pointing opposite direction to environmental light | Reject |
| Multiple light sources | Two distinct specular highlights indicating incompatible light sources | Reject if contradicts style spec |
| Flat lighting in editorial shot | No visible shadow or directional light when style spec calls for directional | Reject |
| Blown highlights | Subject face or key product area with no detail in bright regions | Flag |
| Underexposed subject | Subject significantly darker than background — unclear if intentional | Flag — check style spec |

---

### Category 4 — Background Inconsistency

| Defect | What to look for | Action |
|--------|-----------------|--------|
| Background bleed | Elements from background spilling into subject silhouette | Reject |
| Depth inconsistency | Background objects in sharp focus when bokeh is specified | Reject |
| Unintended elements | People, objects, or animals in background not specified in prompt | Reject if prominent; flag if minor |
| Pattern repetition | Obvious tiling or repetition in textured background | Reject |
| Background colour shift | Background colour noticeably different from other images in the same batch | Flag — batch consistency risk |

---

### Category 5 — Batch Consistency

These checks apply at batch level, not per-image. Run after QC-ing all individual images.

| Check | Standard |
|-------|---------|
| Lighting register | All images should feel lit from the same source and era |
| Colour temperature | No single image should feel warmer or cooler than the rest by more than one visible stop |
| Composition register | All images should feel like they belong to the same shoot |
| Model continuity | If same model appears across images, proportions and hair must remain consistent |

**Batch consistency fail:** If 2+ images feel like they came from a different campaign than the rest, reject those outliers even if they individually pass per-image checks.

---

## Novizio-Specific QC Additions

| Check | Standard |
|-------|---------|
| No promotional overlays | Any price text, discount badge, "Shop Now" element → Reject |
| No catalogue energy | White-background flat-lay with no environmental context → Reject unless campaign is product-only |
| Lighting is directional | Flat even lighting → Reject unless campaign spec explicitly allows it |
| Background is contextual | Plain white or grey paper background → Reject unless product-only approved |

---

## Hourbour-Specific QC Additions

| Check | Standard |
|-------|---------|
| No money imagery | Coins, cash, piggy banks → Reject immediately |
| Device is grounded | Floating phone mockup with no person or surface → Reject |
| No corporate clichés | Suits in boardrooms, handshakes → Reject |
| Environment has warmth | Purely sterile or clinical feel → Flag — check if plant, coffee, or workspace detail can be added in next variation |

---

## QC Scoring Format

After QC-ing a batch, Pixel reports:

```
Batch QC — [venture] — [campaign]
Images reviewed: [N]
Pass: [N] ([%])
Reject: [N] ([%])
Flag: [N]

Rejection breakdown:
- Anatomy error: [N]
- Text artifact: [N]
- Lighting conflict: [N]
- Background defect: [N]
- Batch inconsistency: [N]
- Venture-specific: [N]

→ Rejection rate [%]: [below 20% = proceed / above 20% = flag Atlas]
```
