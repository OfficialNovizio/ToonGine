---
name: prompt-qa
description: YVON-specific pre-handoff prompt checklist. Run on every prompt before it reaches Pixel. Catches contradictory style tags, venture forbidden elements, missing Avoid list items, and platform dimension gaps. Reduces Pixel's QC rejection rate.
version: 1.0.0
---

## Purpose

A prompt with contradictory tags produces inconsistent batches. A prompt missing the Avoid list produces images that technically pass the style spec but violate the brand. This skill catches both — at the individual prompt level, not the campaign level. The triple-pass reviews overall direction quality; this skill checks the actual string Pixel will use.

---

## The Four Checks (Run in Order)

### Check 1 — Contradiction Detector

Scan for known incompatible tag pairs. Any of these present together = rewrite before handoff:

| Tag A | Incompatible with | Why |
|-------|------------------|-----|
| `candid` | `studio-lit` | Candid = unposed/natural; studio-lit = controlled setup |
| `editorial` | `catalogue` | Editorial = conceptual; catalogue = commercial product focus |
| `editorial` | `product shot` | Same conflict as above |
| `raw` | `polished` | Contradictory finish |
| `minimal` | `maximalist` | Opposite compositional philosophies |
| `natural light` | `neon` | Conflicting light sources |
| `natural light` | `studio flash` | Conflicting light sources |
| `lifestyle` | `product shot` | Different compositional register |
| `moody` | `bright and airy` | Contradictory mood |
| `documentary` | `staged` | Contradictory authenticity signals |
| `bokeh` | `tack sharp everything` | Contradictory depth of field |
| `close-up portrait` | `wide establishing shot` | Contradictory composition |

**Rule:** If a contradiction is found, resolve it — don't send both tags hoping the model will figure it out.

---

### Check 2 — Venture Forbidden Elements

**Novizio — forbidden in every prompt:**
- Busy patterns or busy backgrounds
- Stock-photo energy: perfect poses, fake smiles, overly generic settings
- Promotional overlays: sale banners, price text, "Buy Now" text within the image
- Harsh flash or high-key flat lighting
- Catalogue-style white-background product shots (unless product-only campaign is specifically approved)
- Any element that reads as fast fashion or disposable

**Hourbour — forbidden in every prompt:**
- Money imagery: coins, cash, piggy banks, dollar signs, stacks of notes
- Dark or dramatic backgrounds (unless explicitly brand-approved for that campaign)
- Generic corporate imagery: suits in boardrooms, handshakes, stock-photo professionals
- Clichéd fintech visuals: upward graph lines, padlocks, checkmarks in shields
- Overly clinical/sterile environments
- Generic phone mockups that could belong to any SaaS brand

**Fix:** If any forbidden element is present in the prompt or is likely to appear based on the style tags — add it to the Avoid list explicitly.

---

### Check 3 — Avoid List Standard

Every prompt must have an Avoid list that meets this minimum:

| Requirement | Standard |
|------------|---------|
| Minimum items | 3 specific items |
| Specificity | Each item names something concrete — not "avoid bad quality" |
| Venture-specific | At least 1 item is specific to the venture's known failure patterns |
| Campaign-specific | At least 1 item is specific to this campaign's risk (what could easily go wrong here?) |

**Reject if:** Avoid list is empty, has only generic items ("avoid blurry images"), or has fewer than 3 entries.

---

### Check 4 — Platform Dimension and Format Check

Confirm the prompt or production brief includes the correct output dimensions for the target platform:

| Platform | Venture | Ratio | Dimensions |
|---------|---------|-------|-----------|
| Instagram Feed | Novizio | 1:1 or 4:5 | 1080×1080 or 1080×1350 |
| Instagram Stories / Reels | Novizio | 9:16 | 1080×1920 |
| TikTok | Novizio | 9:16 | 1080×1920 |
| LinkedIn post | Hourbour | 1:1 or 1.91:1 | 1080×1080 or 1200×628 |
| YouTube Thumbnail | Hourbour | 16:9 | 1280×720 |

**Fix:** If dimensions aren't specified, add them to the production brief before handoff. Pixel should not have to infer the target format.

---

### Ambiguity Test

Final check before handoff: "If this prompt were given to three different AI models, would they all produce images in the same aesthetic register?"

- If yes → specific enough. Proceed.
- If no → identify the ambiguous term (usually the mood or style tag) and replace with a more specific descriptor.

**Common vague terms and what to replace them with:**

| Vague | Replace with |
|-------|-------------|
| `beautiful` | Specific mood: `soft, editorial, quiet confidence` |
| `professional` | Specific setting: `clean workspace, natural light, focused` |
| `modern` | Specific aesthetic: `minimal, white space, geometric` |
| `aesthetic` | Specific register: `Scandinavian editorial, muted palette` |
| `luxurious` | Specific cues: `soft cashmere, clean neutrals, considered composition` |

---

## Output

After all 4 checks, deliver:

```
Check 1 — Contradictions: [none found / resolved: X replaced Y because Z]
Check 2 — Forbidden elements: [none present / removed: X from prompt]
Check 3 — Avoid list: [passed: N items / added: X]
Check 4 — Platform dimensions: [confirmed: ratio X / added to brief]
Ambiguity test: [passed / resolved: X replaced with Y]

Prompt status: READY FOR PIXEL / REVISED — see updated prompt below
```
