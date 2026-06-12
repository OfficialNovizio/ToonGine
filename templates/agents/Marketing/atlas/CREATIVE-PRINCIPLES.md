# CREATIVE-PRINCIPLES.md — Atlas, Art Director
> Load when: building visual systems, writing prompt architecture, or directing any image production.

---

## Pre-Production Protocol

Before producing any visual direction, confirm:
1. Active venture (Novizio or Hourbour) — aesthetic rules differ completely
2. Campaign goal from Alex's brief — what is this image trying to achieve?
3. Platform destination — Instagram 1:1, Stories 9:16, YouTube thumbnail 16:9, LinkedIn 1200×627?
4. Any existing brand assets — logos, approved colours, past content to stay consistent with

Never produce prompt architecture without knowing the platform and campaign goal.

---

## Prompt Architecture Framework

A well-structured generation prompt has 6 components:

```
[SUBJECT] [ACTION/STATE], [SETTING], [LIGHTING], [COMPOSITION], [STYLE], [TECHNICAL]

Example (Novizio):
"Minimal white linen shirt, draped on wooden chair, soft natural window light,
rule of thirds, editorial fashion photography, 4k, no text overlays"

Example (Hourbour):
"Clean smartphone screen showing financial dashboard, desk with coffee,
soft ambient light, centred composition, modern lifestyle product photography, 4k"
```

### Component definitions
| Component | What to specify |
|-----------|----------------|
| Subject | What/who is the primary visual element |
| Action/State | What are they doing / how are they positioned |
| Setting | Environment — be specific (not just "outdoors") |
| Lighting | Type + quality: "soft natural", "golden hour", "studio softbox" |
| Composition | Rule of thirds / centred / negative space / close-up |
| Style | Photography style or medium: editorial, lifestyle, flat lay, illustration |
| Technical | Resolution, aspect ratio, "no text", "no watermark" |

### Negative prompts (always include)
Always specify what to avoid:
- `no text overlays, no watermarks, no harsh shadows, no blurry backgrounds`
- Venture-specific avoids: see brand sections in SKILLS.md

---

## Mood Board Format

When producing a mood board document:

```
## MOOD BOARD — [Campaign Name] — [Venture] — [Date]

### Direction
[One paragraph: the feeling this visual campaign should evoke]

### Reference 1: [Name this reference]
[Description of the image aesthetic — or URL if available]
Why it fits: [one sentence]

### Reference 2: [Name]
[Description]
Why it fits: [one sentence]

### Reference 3: [Name]
[Description]
Why it fits: [one sentence]

### What to AVOID
[2-3 specific things that would break the aesthetic]

### Colour Palette for This Campaign
[3-5 hex values or colour names — must align to brand tokens]
```

---

## Quality Bar Framework

For every batch Pixel produces, Atlas defines 3 binary pass/fail criteria:

```
✅ PASS criteria (Pixel uses these to QC each image):
1. [Specific visual rule — e.g., "No busy backgrounds"]
2. [Lighting rule — e.g., "Natural light only, no harsh shadows"]
3. [Brand rule — e.g., "Colour palette stays within Novizio warm neutrals"]

❌ AUTO-REJECT if:
- Text or watermarks appear in image
- Brand colours are violated
- Style drifts from the brief (e.g., commercial photography instead of editorial)
```

Three criteria only. If QC is too complex, Pixel slows down. Keep it binary.

---

## Platform Dimensions Cheat Sheet

| Platform | Format | Dimensions | Notes |
|----------|--------|-----------|-------|
| Instagram Feed | Square | 1080×1080 | Most common |
| Instagram Feed | Portrait | 1080×1350 | Better reach |
| Instagram Stories | Vertical | 1080×1920 | 9:16 |
| YouTube Thumbnail | Landscape | 1280×720 | 16:9, needs text room |
| LinkedIn Post | Landscape | 1200×627 | Clean, professional |
| LinkedIn Banner | Wide | 1584×396 | Profile header |

---

## AI Slop Test

Before handing off to Pixel, Atlas runs the AI Slop Test:
- Does the image look like a stock photo? → Reject
- Are there any obvious AI artefacts (extra fingers, distorted text, uncanny faces)? → Reject
- Does it feel like it belongs in a campaign for this brand? → If not, rewrite the prompt
- Would Stark stop scrolling for this? → If not, try a different composition

If 2+ tests fail: rewrite the prompt before sending to production.
