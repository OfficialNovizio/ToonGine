---
name: audience-architecture
description: YVON-specific layered audience stack for Novizio (Meta + TikTok) and Hourbour (LinkedIn + YouTube). Defines cold/lookalike/retargeting layers, exclusion rules, seed sources, and retargeting windows. Load before building or reviewing any audience targeting brief.
version: 1.0.0
---

## Purpose

Generic audience targeting fails because it ignores two things: venture-specific exclusion rules and the correct layering sequence. Running cold and retargeting simultaneously to the same user creates message confusion. Seeding a lookalike from fewer than 100 purchasers produces an unreliable signal. This skill makes the audience architecture explicit and YVON-specific.

---

## Novizio — Meta (FB + IG) and TikTok

### Layer 1: Cold (Top of Funnel — Awareness)

**Meta:**
- Interest targeting: fashion, luxury fashion, sustainable fashion, street style, editorial fashion
- Demographics: 22–45, all genders unless product-specific
- Exclude: past purchasers (all time), website visitors (last 180 days), bargain/discount interests (coupon apps, sale alerts, fast fashion)
- Minimum audience size: 500K before launching cold campaign

**TikTok:**
- Interest: fashion, style, lifestyle, luxury
- Behaviour: video completion rate > 75% on fashion content
- Exclude: past purchasers if pixel data available
- Minimum: 200K

**Creative brief to Lena/Atlas:** Aspirational, editorial. Esteem and aspiration triggers. Never urgency or discount framing.

---

### Layer 2: Lookalike (Mid Funnel — Consideration)

**Seed sources (in priority order):**
1. Purchaser email list — highest-quality seed
2. Add-to-cart users (last 90 days) — second best
3. Top 25% engagement audience (Instagram profile engagers) — if purchase list < 100 users

**Minimum seed size:** 100 users. Below this threshold, the lookalike signal is unreliable — do not run.

**Lookalike tiers:**
- 1% lookalike: most similar to seed — highest intent, smallest audience
- 1–3% lookalike: broader pool — more volume, slightly lower intent
- Run both tiers as separate ad sets to identify which converts better

**Exclusions:** Exclude actual purchasers and current website visitors from lookalike audiences.

**Creative brief:** Social proof angle, product quality story. Still brand-first, not discount-first.

---

### Layer 3: Retargeting (Bottom of Funnel — Decision)

**Window tiers (highest intent first):**

| Audience | Window | Creative angle |
|---------|--------|---------------|
| Checkout abandoners | 7 days | Product-specific, minimal friction CTA |
| Add-to-cart, no purchase | 14 days | Product benefit reminder |
| Product page visitors | 14 days | Brand credibility + product |
| Video viewers (75%+ completion) | 30 days | Next step in funnel |
| Instagram/TikTok engagers | 30 days | Brand story continuation |

**Rule:** Retargeting always shows different creative from cold. If they've seen the brand, do not show the awareness ad again.

---

## Hourbour — LinkedIn and YouTube

### Layer 1: Cold (Top of Funnel — Awareness)

**LinkedIn:**
- Job titles: freelancer, independent consultant, contractor, agency owner, self-employed, founder (< 10 employees)
- Company size: 1–10, 11–50
- Geographic: English-speaking markets first (US, UK, CA, AU)
- Exclude: enterprise job titles (VP, Director at 500+ companies), students, job seekers
- Minimum audience size: 10K before launching on LinkedIn

**YouTube:**
- Custom intent audience: users who searched competitor terms (Toggl, Harvest, Clockify, FreshBooks time tracking)
- In-market: small business software, freelance tools
- Exclude: existing trial users if matched via email

**Creative brief:** Safety and trust triggers. "Always know where your hours went." Professional, not enthusiastic.

---

### Layer 2: Retargeting (Bottom of Funnel — Hourbour is direct response, no lookalike phase)

Hourbour's audience is too small for meaningful lookalike. Skip straight to retargeting after cold.

**Retargeting tiers:**

| Audience | Window | Creative angle |
|---------|--------|---------------|
| Pricing page visitors | 7 days | Specific outcome + social proof |
| Trial sign-ups — not activated | 7 days | Activation reminder, specific first step |
| Trial sign-ups — active but not converting | 14 days | Value proof, what they'll lose at trial end |
| Trial expired, not converted | 30 days | Win-back offer or extended trial |
| Active paying customers | Excluded from all prospecting |

**Win-back window:** 60–90 days for lapsed trials. Different message entirely — acknowledge the gap.

---

## Universal Exclusion Rules (All Ventures, All Platforms)

1. **Never cold-target and retarget the same user simultaneously.** Audiences must be mutually exclusive — always add exclusion layers.
2. **Never run lookalike from fewer than 100 seed users.** The signal is too weak to be reliable.
3. **Exclude active paying customers from all prospecting and retargeting** — they're not a prospect.
4. **Minimum audience size before launching:**
   - Meta cold: 500K
   - TikTok cold: 200K
   - LinkedIn: 10K
   - YouTube custom intent: 1K
   Below these thresholds, the platform can't optimise — CPMs rise and delivery stalls.
5. **Novizio:** Never target discount or bargain-oriented interest segments. Conflicts with the brand positioning.
6. **Hourbour:** Never target enterprise (500+ employee companies). Product is designed for solo/small team operators.

---

## Retargeting Window Reference

| Intent level | Window | Signal |
|-------------|--------|--------|
| Very high (checkout abandon, trial signup) | 7 days | Strongest buying signal |
| High (product/pricing page) | 14 days | Clear consideration |
| Medium (homepage, feature pages, video) | 30 days | Early interest |
| Win-back (lapsed, churned) | 60–90 days | Re-engagement message required |
