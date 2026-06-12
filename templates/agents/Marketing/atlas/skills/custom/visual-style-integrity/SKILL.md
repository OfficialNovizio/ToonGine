---
name: visual-style-integrity
description: Structured "every element justifies itself" check using Dieter Rams principles. Strip test, 3-year test, and venture drift check. Run during style spec development to catch decoration masquerading as direction.
version: 1.0.0
---

## Purpose

The most common failure in visual direction is adding rather than removing. A mood board with 12 references isn't richer — it's unfocused. A style spec with 6 lighting modifiers isn't precise — it's indecisive. This skill makes the removal process systematic, forcing every element to earn its presence before it reaches Pixel.

---

## The Three Tests

### Test 1 — Strip Test (Dieter Rams)

For every element in the style spec — colour specification, lighting modifier, mood adjective, compositional rule, model direction, prop — ask:

> "If I remove this element, does the image communicate something meaningfully different?"

| Answer | Action |
|--------|--------|
| Yes — removing it loses something specific | Keep it. It earns its place. |
| No — the image works without it | Remove it. It's decoration. |
| Unsure | Default to remove. Doubt = out. |

**Elements to test explicitly:**
- Each mood adjective (if 2 adjectives say the same thing, remove one)
- Each lighting modifier (do you need both `soft` and `diffused`?)
- Each colour in the palette (is each colour doing something different?)
- Each composition rule (do they conflict or reinforce each other?)
- Each item in the subject description (does every detail matter for this campaign?)

**Target:** A style spec that passes the strip test has no redundant elements. Every word is doing work.

---

### Test 2 — 3-Year Test

> "Would this visual direction still feel right in 2029?"

**Failure signals (date this direction):**
- The aesthetic is rooted in a specific social media trend or moment (specific filter style, pose trend, viral format)
- The direction references a cultural moment that will be resolved or forgotten
- The AI generation style is visibly "2026 AI" — identifiable as a specific era of generative imagery
- The colour palette is trending now but is not anchored to the brand palette
- The composition style is borrowed from a specific creator or movement that peaked recently

**Pass signals (direction is durable):**
- The aesthetic is rooted in the brand's values, not in what's currently performing
- The references are timeless visual traditions (editorial photography, Bauhaus reduction, Scandinavian minimalism)
- The mood could describe photographs made in 2015 and photographs made in 2030 equally well
- The colour palette is the brand palette — not the trend palette

**If it fails the 3-year test:** Strip the trend element and re-anchor to a brand principle. The question to ask: "What does Novizio/Hourbour stand for that will still be true in 2029?" That's the direction.

---

### Test 3 — Venture Drift Check

Ventures drift when visual directions start to sound like other brands. Run this check before finalising.

**Novizio drift: editorial minimalism → catalogue energy**

| Drift signal | Correction |
|-------------|-----------|
| Multiple products in one frame | One hero product or no product — editorial perspective |
| White or plain background instead of contextual setting | Add environment: textured wall, natural setting, editorial space |
| Model not engaging naturally with the product | Direction: authentic interaction, not demonstration |
| High-key, flat, even lighting | Restore: soft, directional, natural — a single light source |
| Text overlay or promotional element in image composition | Remove entirely — copy lives outside the image |
| Perfect symmetry and commercial polish | Introduce considered imperfection — editorial is not symmetrical |

**Hourbour drift: clean/modern → generic fintech cliché**

| Drift signal | Correction |
|-------------|-----------|
| Any money imagery (coins, notes, piggy banks) | Replace with person + device in a real working environment |
| Dark dramatic backgrounds | Restore: white space, natural light, clean surfaces |
| Corporate setting (boardroom, suits, handshakes) | Replace with solo professional, home office, focused context |
| Upward graphs or checkmarks as visual elements | Remove — let the copy carry the outcome claim, not the image |
| Generic phone mockup (floating device, no context) | Ground it: device in hand, on a real desk, with a real person |
| Clinical or sterile feel | Add warmth: a plant, a coffee, a real workspace detail |

---

## Purpose Anchor (Final Check)

Before closing: answer this in one sentence —

> "The single most important thing this visual communicates is: ___"

- If you can answer in one clear sentence → direction is focused. Proceed.
- If the answer is "it looks good" or "it's on brand" → direction isn't done. Good and on-brand are prerequisites, not purposes.
- If you can't answer → the direction needs more reduction before it goes to Pixel.

---

## Output Format

```
Strip test: [X elements tested] — [Y removed] — [reason for each removal]
3-year test: [pass / fail] — [what was stripped or why it holds]
Drift check: [clean / drift found: X corrected to Y]
Purpose anchor: "The single most important thing this visual communicates is: ___"

Style spec status: FINALISED / REVISED — see updated spec below
```
