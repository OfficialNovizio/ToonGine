---
name: competitor-analysis
description: Kai's structured framework for turning YVON competitor scrape data into actionable competitive intelligence. Covers data ingestion from /api/competitor-*, scoring, gap analysis, and opportunity identification per venture.
version: 1.0.0
---

# Competitor Analysis

## Purpose

YVON scrapes competitor content and intelligence via multiple routes (`/api/competitor-content`, `/api/competitor-intelligence`, `/api/auto-competitors`, `/api/competitor-exploit`, `/api/competitor-pipeline`). This skill defines how Kai transforms that raw data into a competitive read Stark can act on.

Data without structure is noise. This skill makes it signal.

---

## When It Runs

- When Stark asks "what are competitors doing?"
- When a new competitor scrape completes in `/api/competitor-pipeline`
- When Marcus requests competitive context for a strategic decision
- During content brief generation (Phase 1 of Brand Intelligence Pipeline)

---

## Step 1 — Data Ingestion Checklist

Before any analysis, confirm data freshness:
```
□ GET /api/competitor-intelligence?venture=[slug] → retrieve latest scores
□ GET /api/competitor-content?venture=[slug]      → retrieve latest content samples
□ Check scrape timestamp — if > 7 days old, flag as stale before analyzing
□ Confirm venture scope: Novizio competitors ≠ Hourbour competitors
```

**Never mix venture competitor data.** Novizio = fashion DTC. Hourbour = fintech SaaS. Different competitive sets, different metrics.

---

## Step 2 — Scoring Framework

Rate each competitor on 5 axes. Score 1–5 each.

| Axis | Novizio signals | Hourbour signals |
|------|----------------|-----------------|
| **Content velocity** | Posts/week on Instagram, TikTok | Blog posts, product updates/week |
| **Engagement quality** | Saves rate, comments depth vs. likes | Review sentiment, support response time |
| **Visual differentiation** | Distinct aesthetic vs. generic feed | UI clarity, dashboard screenshots |
| **Messaging clarity** | Value proposition in first 3 words of bio | Pricing page, onboarding copy |
| **Growth signals** | Follower delta WoW, EMV spikes | App store rank movement, G2 reviews delta |

**Composite score:** sum of 5 axes ÷ 25 = competitive threat index (0–1.0). Above 0.6 = active threat.

---

## Step 3 — Gap Analysis

For each high-scoring competitor (threat index ≥ 0.6):

```
1. What are they doing that YVON's ventures are NOT doing?
   → List max 3 observable gaps (content, product, positioning, channel)

2. What are they doing WORSE than YVON's ventures?
   → List max 2 exploitable weaknesses (do not list strengths we share)

3. Is this gap closable in < 2 weeks (tactical) or > 2 weeks (strategic)?
   → Tactical: route to Lena/Rio for fast response
   → Strategic: route to Marcus for roadmap inclusion
```

---

## Step 4 — Opportunity Brief Format

Output one brief per competitor that clears the 0.6 threshold:

```
COMPETITOR: [name]
VENTURE:    [novizio | hourbour]
THREAT:     [score] — [HIGH/MED/LOW]

TOP GAP:    [one gap — what they do that we don't]
EXPLOIT:    [one weakness — where we can win]
WINDOW:     [tactical (≤2 weeks) | strategic (>2 weeks)]
ACTION:     [specific recommendation: copy angle / ad hook / feature / campaign]
ROUTE TO:   [Lena | Rio | Nate | Marcus]
```

---

## Step 5 — Marcus Synthesis Gate

Before sending competitive intelligence to Stark directly:
- If threat index ≥ 0.8 on any competitor → escalate to Marcus immediately
- If strategic gap identified → Marcus routes to appropriate agent (not Kai)
- If tactical gap → Kai routes directly to Lena or Rio with the brief

Kai delivers data and analysis. Marcus decides what to do with it.

---

## Anti-Patterns

- Never report competitor metrics without citing the scrape timestamp
- Never generalize across ventures ("both ventures face X competitor") — they compete in different markets
- Never recommend a response without routing it to the correct execution agent
- Never treat social follower count as a primary threat signal — engagement rate is the real metric
