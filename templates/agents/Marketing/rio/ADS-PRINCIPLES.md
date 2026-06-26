# ADS-PRINCIPLES.md — Rio, Ad & Growth Strategist

> Load this file only when: designing a paid campaign, analyzing ad performance, writing an ad strategy brief, or diagnosing a conversion funnel problem.

---

## Context Gathering Protocol

Before any ads output, confirm:
1. Active venture (Novizio or Hourbour)
2. `roas_benchmark` from memory — what's the target we're optimizing toward?
3. `active_campaigns_*` from memory — what's already running?
4. `ad_budget_split` from memory — what's the approved channel allocation?
5. Felix's budget context — how much is available to spend?

Never recommend a campaign without a budget and a hypothesis. Spend without hypothesis is waste.

---

## Campaign Structure

All paid campaigns follow this hierarchy:

```
Campaign (objective: awareness / traffic / conversion)
└── Ad Set (audience: cold / warm / retargeting)
    └── Ad (creative: video / carousel / static)
        └── Copy (headline + body + CTA)
```

One campaign = one objective. Never mix awareness and conversion in the same campaign.

---

## Targeting Framework

### Novizio (Fashion B2C)

| Audience Type | Definition |
|--------------|------------|
| Cold — Interest | Fashion, luxury brands, Vogue, lifestyle publications |
| Cold — Lookalike | 1–3% LAL of purchasers |
| Warm — Engagers | IG/FB page engagers (last 60 days) |
| Retargeting | Website visitors (last 30 days), add-to-cart abandoners |

### Hourbour (SaaS App)

| Audience Type | Definition |
|--------------|------------|
| Cold — Interest | Personal finance, investing, budgeting apps (LinkedIn: job title + seniority) |
| Cold — Lookalike | 1–3% LAL of app installs |
| Warm — Engagers | App page visitors, video viewers (25%+) |
| Retargeting | Trial users who haven't activated |

---

## Ad Copy Framework

Every ad has: headline + body (optional) + CTA

**Headline formula:**
- Benefit-first: "[Outcome] without [pain point]"
- Curiosity: "Why [audience] are switching to [venture]"
- Social proof: "[Number] people already [outcome]"

**Body:** 1–2 sentences max. Expand the headline. Do not repeat it.

**CTA:** One action only. Match to campaign objective:
- Awareness → "Learn more"
- Traffic → "Shop now" / "See how it works"
- Conversion → "Start free" / "Get yours"

Rio writes the strategy brief. Lena writes the actual words. Rio reviews for conversion fit.

---

## Performance Benchmarks

| Metric | Novizio Target | Hourbour Target |
|--------|---------------|----------------|
| CTR | > 1.5% | > 2.0% |
| CPM | < $8 | < $12 |
| ROAS | > 2.5x | — |
| CAC | < $15 (first purchase) | < $8 (app install) |
| LTV:CAC | > 3:1 | > 3:1 |

If any metric is 20%+ below benchmark for 7+ days: pause, diagnose, rebuild.

---

## A/B Test Design Protocol

Every test needs:

```
Hypothesis: [If we change X, then Y will improve because Z]
Variable: [what is being tested — one change only]
Control: [current version]
Variant: [new version]
Primary metric: [the single number that determines winner]
Min run time: [usually 7–14 days]
Min spend: [$X per variant — enough for statistical significance]
Success threshold: [e.g., 20% CTR improvement]
```

Test one variable at a time. Never test headline + image + audience simultaneously.

---

## Budget Allocation Rules

1. New campaign — start with minimum viable spend (1–2 weeks at low budget)
2. Winning creative — scale spend 20–30% every 3 days max to avoid fatigue
3. Never increase budget more than 2x in one change — algorithm resets
4. Kill an ad set after 7 days with < 50% of benchmark performance
5. Always reserve 20% of budget for testing; 80% to proven performers

---

## Attribution Model

YVON uses **7-day click, 1-day view** attribution as default.

When reporting ROAS:
- Always specify attribution window
- Compare to organic baseline (Kai's data)
- Never count a conversion if there's no plausible ad touchpoint

---

## Skills Reference

### Paid Ads


- Audience × Creative × Offer — optimize the weakest link, not all three at once.
- Test one variable at a time. Kill underperformers at the 7-day benchmark.
- **Avoid**: scaling a campaign before it has statistically significant data.

### Ad Creative


- Pattern interrupt in first 3 seconds. Problem → agitate → solve structure.
- Static creative lifespan: 2–3 weeks. Refresh before fatigue, not after.
- **Avoid**: benefit-led ads without a hook — nobody reads past line 1.

### Page CRO


- Above-the-fold must contain: headline, subheadline, CTA, and one trust signal.
- Single CTA per page. Competing CTAs reduce conversion.
- **Avoid**: sliders, autoplay video, and popups on page load.

### Paywall / Upgrade CRO


- Show value before price. Match upgrade trigger to the "aha moment."
- Frame as "unlock more" not "upgrade to paid" — the mental model matters.
- **Avoid**: paywall modals that block users from seeing what they'd get.

### Onboarding CRO


- First meaningful action within 60 seconds. Progressive disclosure of features.
- Success milestone before feature tour — let them win before you explain.
- **Avoid**: onboarding flows that frontload configuration before value.
