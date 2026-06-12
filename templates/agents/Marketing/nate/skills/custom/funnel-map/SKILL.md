---
name: funnel-map
description: YVON-specific funnel stages for Novizio and Hourbour with drop-off benchmarks and experiment type per stage. Load before designing any growth experiment to confirm which stage to target.
version: 1.0.0
---

## Purpose

Designing a great experiment at the wrong funnel stage wastes 14 days. If Hourbour's activation rate is 25% (well below the 40% benchmark), running a trial-to-paid conversion experiment is premature — users aren't reaching the value moment first. This skill maps the funnel stages, benchmarks, and the correct experiment type for each stage.

---

## Novizio — Fashion E-commerce Funnel

```
[Social Discovery] → [Site Visit] → [Product Page] → [Add to Cart] → [Purchase] → [Repeat]
```

### Stage 1 — Discovery (Social → Site)
- **Primary channels:** Instagram, TikTok, organic search, influencer
- **Key metric:** Social CTR (link in bio + story swipe-up click rate)
- **Benchmark:** 1–3% CTR from social post to site
- **Drop-off signal:** High impressions, low site traffic
- **Experiment types:** Hook testing (Lena), creative format (Atlas/Pixel), landing page match
- **DRI:** Rio (paid) / Lena (organic) / Kai (tracking)

### Stage 2 — Interest (Site → Product Page)
- **Key metric:** Pages per session, bounce rate
- **Benchmark:** < 60% bounce, > 2 pages/session
- **Drop-off signal:** High bounce on homepage or category pages
- **Experiment types:** Homepage layout (Mia), navigation structure (Dev), featured product selection (Marcus)
- **DRI:** Mia / Dev

### Stage 3 — Consideration (Product Page → Add to Cart)
- **Key metric:** Add-to-cart rate
- **Benchmark:** 3–8% of product page views
- **Drop-off signal:** High product page views, low ATC rate
- **Experiment types:** Product imagery (Atlas), size guide, social proof placement (Lena), price anchoring, reviews display
- **DRI:** Mia (layout) / Lena (copy) / Atlas (visual)

### Stage 4 — Decision (Cart → Purchase)
- **Key metric:** Cart abandonment rate
- **Benchmark:** 65–75% abandon (above 75% = investigate)
- **Drop-off signal:** High ATC, low purchase completion
- **Experiment types:** Checkout friction reduction (Dev), free shipping threshold, payment method options, urgency copy (Kahneman gate required before any scarcity/urgency)
- **DRI:** Dev (checkout) / Lena (copy) / Rio (retargeting)

### Stage 5 — Retention (Post-purchase → Repeat)
- **Key metric:** Repeat purchase rate within 90 days
- **Benchmark:** > 20% repeat within 90 days for fashion
- **Drop-off signal:** Low LTV, high new customer dependency
- **Experiment types:** Post-purchase email sequence (Lena), loyalty signals, personalised recommendations
- **DRI:** Lena

---

## Hourbour — SaaS Subscription Funnel

```
[Acquisition] → [Trial Signup] → [Activation] → [Engagement] → [Paid Conversion] → [Retention]
```

### Stage 1 — Acquisition (Ad/Content → Trial Signup)
- **Primary channels:** LinkedIn, YouTube, SEO, content marketing
- **Key metric:** Landing page → trial signup rate
- **Benchmark:** 1–3% of landing page visitors
- **Drop-off signal:** High traffic, low signups
- **Experiment types:** Landing page headline (Lena), CTA button, social proof placement, pricing page design (Mia)
- **DRI:** Rio (paid) / Lena (copy) / Mia (design)

### Stage 2 — Activation (Signup → First Key Action)
- **Key metric:** Activation rate within 7 days
- **Benchmark:** 40–60% of signups reach activation
- **Aha moment:** First timer logged AND first invoice or report generated
- **Drop-off signal:** High signups, low Day-7 DAU
- **Experiment types:** Onboarding flow (Dev), first-run experience, Day 1–3 email drip (Lena), in-app prompts
- **DRI:** Dev (flow) / Lena (email) / Raj (backend triggers)

### Stage 3 — Engagement (Active during trial)
- **Key metric:** Week-2 retention rate (active in trial week 2)
- **Benchmark:** > 50% of activated users return in week 2
- **Drop-off signal:** Activated but not returning after Day 7
- **Experiment types:** Weekly summary email (Lena), habit-forming feature nudges, push notification timing
- **DRI:** Lena

### Stage 4 — Conversion (Trial → Paid)
- **Key metric:** Trial-to-paid conversion rate
- **Benchmark:** 15–25% of activated trials convert
- **Drop-off signal:** Trial ending with low upgrade rate
- **Experiment types:** Upgrade prompt timing (Dev), pricing page clarity (Mia), trial extension offer, loss aversion CTA (Kahneman gate required)
- **DRI:** Dev (prompt) / Lena (copy) / Rio (retargeting)

### Stage 5 — Retention (Paid → Long-term)
- **Key metric:** Monthly churn rate
- **Benchmark:** < 3% monthly churn for healthy SaaS
- **Drop-off signal:** Churning in months 2–3
- **Experiment types:** Success milestone emails (Lena), feature education sequence, proactive check-in, annual plan offer
- **DRI:** Lena / Diana (process)

---

## Diagnosis Protocol — Which Stage to Target

Before proposing an experiment, answer in order:

1. **Where is Kai's data showing the largest relative drop-off?** (not absolute volume — relative conversion rate vs benchmark)
2. **Is the stage above it healthy?** Fixing Stage 4 (cart → purchase) is premature if Stage 3 (PDP → ATC) is already broken.
3. **Is this stage within Nate's experiment scope?** Stages requiring major Dev work (> 1 week) need Diana's sprint queue first.

**Rule:** Always fix the earliest broken stage first. Traffic leaking at Stage 2 cannot be recovered by a Stage 4 experiment.

---

## Funnel Health Snapshot Format

```
Venture: [Novizio / Hourbour]
Date: [YYYY-MM-DD]
Data source: Kai — [date of last report]

Stage 1 [Discovery]:    [metric] vs [benchmark] — [status: healthy / at-risk / broken]
Stage 2 [Interest]:     [metric] vs [benchmark] — [status]
Stage 3 [Consideration]:[metric] vs [benchmark] — [status]
Stage 4 [Decision]:     [metric] vs [benchmark] — [status]
Stage 5 [Retention]:    [metric] vs [benchmark] — [status]

→ Priority stage for experiment design: [stage + reason]
```
