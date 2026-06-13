---
name: roas-diagnostics
description: Structured 4-layer investigation when ROAS misses target for Novizio or Hourbour. Run in order — creative fatigue first, attribution last. Prevents jumping to the wrong fix.
version: 1.0.0
---

## Purpose

When ROAS underperforms, the wrong diagnosis wastes time and budget. Replacing creative when the real issue is audience saturation spends money producing new assets that underperform for the same reason. This skill forces the right investigation order before any fix is recommended.

---

## YVON ROAS Thresholds

| Venture | Platform | Alert Below | Target Range |
|---------|---------|------------|-------------|
| Novizio | Meta (FB+IG) | 2.0× | 3.0–4.0× |
| Novizio | TikTok Ads | 1.8× | 2.5–3.5× |
| Hourbour | LinkedIn Ads | 1.5× | 2.5–3.5× |
| Hourbour | YouTube Ads | 1.5× | 2.0–3.0× |

**Escalation trigger:** ROAS misses target 2+ consecutive weeks → flag to Marcus and Felix immediately.

---

## The 4-Layer Investigation (Run in This Order)

### Layer 1 — Creative Fatigue

**Symptoms:**
- CTR dropping week-over-week
- Conversion rate holding stable or improving
- Frequency rising (Meta: > 3 in a 7-day window)

**Signals a creative problem**, not a targeting or offer problem. The audience has seen the ad enough times that it stopped working.

**Investigation:**
1. How many weeks has this creative been running? (Meta: 2–4 weeks average fatigue; YouTube: 3–6 weeks)
2. Is CTR the primary metric declining — or ROAS overall?
3. Is frequency above 3 for Meta, above 2 for LinkedIn?

**Fix if confirmed:** Brief Lena for 2+ new creative variants. Do not increase budget. Do not change audience.

---

### Layer 2 — Audience Saturation

**Symptoms:**
- CPM rising (platform charging more to reach the same people)
- Reach declining despite same or increased budget
- Frequency rising even with fresh creative

**Signals the audience pool is exhausted** — the algorithm has shown the ad to everyone in the defined audience who is likely to engage.

**Investigation:**
1. Is CPM up > 20% WoW without a platform-wide event (WebSearch required)?
2. Has reach declined while budget held constant?
3. Is the audience size too small for the campaign duration? (Minimum: Meta 500K for prospecting, LinkedIn 10K)

**Fix if confirmed:** Expand targeting (broader interest, new lookalike seed, wider age range). Pause the saturated audience for 2–4 weeks before returning.

---

### Layer 3 — Offer Weakness

**Symptoms:**
- CTR holding or improving
- Click-through to site healthy
- Add-to-cart, trial signup, or purchase rate declining

**Signals the ad is working — the offer or landing page is not.** People click but don't convert.

**Investigation:**
1. Has the offer changed recently (price, free trial terms, shipping)?
2. Is the landing page aligned with the ad's promise? (Ad says "free trial" → landing page must reflect it immediately)
3. Is the CTA on the landing page specific and low-friction?

**Fix if confirmed:** This is not a Rio fix — brief Marcus on offer review first. Rio does not recommend creative or audience changes when the offer is the problem.

---

### Layer 4 — Attribution Issue

**Symptoms:**
- ROAS looks poor in the ad platform
- Organic performance (Kai's GA4 data) is strong simultaneously
- Sudden ROAS drop with no campaign change

**Signals a measurement problem**, not a performance problem.

**Investigation:**
1. Are UTM parameters correct on all ad URLs? (Pull a sample from GA4 source/medium report)
2. Has iOS privacy update or browser policy changed? (WebSearch required)
3. Is there double-counting between Meta pixel and GA4?
4. Cross-check with Kai: is there an unexplained organic spike that could indicate misattribution?

**Fix if confirmed:** Fix tracking before changing any campaign variable. A tracking fix can make ROAS appear to double without spending an extra dollar.

---

## Diagnostic Output Format

After running all 4 layers, deliver:

```
LAYER CHECKED        SYMPTOMS PRESENT?   CONFIDENCE
Creative Fatigue     Yes / No / Partial  High / Medium / Low
Audience Saturation  Yes / No / Partial  High / Medium / Low
Offer Weakness       Yes / No / Partial  High / Medium / Low
Attribution Issue    Yes / No / Partial  High / Medium / Low

PRIMARY DIAGNOSIS: [layer]
RECOMMENDED FIX: [specific action]
ESCALATION NEEDED: Yes / No → [who]
```

**Rule:** Never recommend a fix until all 4 layers are checked. The primary diagnosis is the layer with the strongest signal — not the first one found.
