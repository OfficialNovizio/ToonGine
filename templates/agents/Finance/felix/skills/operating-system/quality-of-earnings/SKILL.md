---
name: quality-of-earnings
description: Distinguishes recurring vs. transactional revenue. Weights Hourbour MRR and Novizio revenue differently. Prevents consolidated reporting from overstating or understating financial health.
version: 1.0.0
---

## Purpose

Not all revenue is equal. A business with $10,000 MRR is fundamentally more valuable than one with $10,000 in one-time sales — because MRR compounds and the one-time sale must be re-acquired. Felix never consolidates Hourbour and Novizio revenue without clearly flagging their different quality.

---

## Revenue Quality Tiers (YVON)

| Revenue Type | Source | Quality | Why |
|-------------|--------|---------|-----|
| Subscription MRR | Hourbour | Highest | Recurring, predictable, compounding, sticky |
| Expansion MRR | Hourbour | High | Existing customer growth — zero additional CAC |
| Trial-to-paid conversion | Hourbour | Medium-High | Pipeline signal — not yet recurring |
| Repeat purchase revenue | Novizio | Medium | Customer loyalty, lower re-acquisition CAC |
| New customer revenue | Novizio | Medium-Low | Transactional — requires full CAC to acquire again |
| Product launch / promo spike | Novizio | Low | Seasonal, non-repeatable — flattering but not a trend |

---

## When It Runs

- Any consolidated YVON revenue report
- Any month where Novizio has a product launch or promotional activity
- Any comparison between Novizio and Hourbour financial performance
- Investor updates (quality of earnings is what sophisticated investors actually assess)
- Any report where MRR and transactional revenue appear in the same table

---

## The Protocol

### Step 1 — Disaggregate before consolidating
Never add Hourbour MRR + Novizio revenue into a single line without first showing each separately with its quality label and composition.

### Step 2 — Flag spike revenue
If Novizio revenue is elevated due to a launch or promotion, flag it as non-recurring and state baseline:

"Novizio revenue this month: $18,000 (+40% MoM). Note: $6,000 is attributable to the SS26 launch — non-recurring. Baseline revenue ex-launch: $12,000 (+0% MoM trend)."

### Step 3 — Weight the consolidated view
When reporting consolidated YVON financial health:
- Hourbour MRR growth is a stronger signal than Novizio revenue growth — state this explicitly
- Hourbour NRR > 100% is a stronger health signal than Novizio repeat purchase improvement
- Never present them as equivalent signals in an executive summary

### Step 4 — Investor framing
In investor updates: lead with Hourbour MRR (highest quality, most investable). Novizio follows as complementary revenue. Never present them as equivalent business lines without explaining the model difference.

---

## Output Flag Format

When a quality concern is present:

```
⚠️ Revenue quality note: $[X] of this month's reported revenue is [one-time / promotional / non-recurring]
Baseline revenue (ex-[event]): $X
Trend signal from baseline: [what the cleaned number actually tells us]
```
