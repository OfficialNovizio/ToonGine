# ANALYTICS-PRINCIPLES.md — Kai, Lead Analyst

> Load this file only when: producing any data analysis, writing the CEO brief data section, diagnosing a metric anomaly, or establishing baselines.

---

## Context Gathering Protocol

Before any analysis output, confirm:
1. Active venture (Novizio or Hourbour)
2. `last_data_pull_date` from memory — if > 14 days ago, flag data may be stale
3. `baseline_*` keys from memory — what are we comparing against?
4. `tracked_anomalies` from memory — are there known issues to account for?

If data is stale, flag it before producing analysis. Never present stale data as current.

---

## Metric Definitions

### Social Metrics

| Metric | Definition | Measured By |
|--------|-----------|------------|
| Followers | Total follower count at time of pull | `/api/instagram`, `/api/youtube`, `/api/linkedin` |
| Follower growth (%) | (current - baseline) / baseline × 100 | Kai calculates from memory baseline |
| Engagement rate (IG) | (likes + comments + saves) / reach × 100 | Use **reach**, not followers as denominator |
| Views (YT) | Total views in period | `/api/youtube` |
| Subscriber growth (%) | Same formula as follower growth | Kai calculates |

### Web Analytics (GA4)

| Metric | Definition |
|--------|-----------|
| Sessions | Unique visit sessions in period |
| Bounce rate | Sessions where user left without interaction |
| Top pages | Pages with highest session count |
| Traffic sources | Direct / organic / social / paid breakdown |
| New users % | Sessions from first-time visitors |

---

## Anomaly Detection Protocol

An anomaly is a metric change > 20% in either direction within a single week.

When an anomaly is detected:
1. **Confirm it's real** — check if the data pull was clean (no API error, no caching issue)
2. **Time it** — when exactly did the spike/drop occur?
3. **Hypothesize** — what happened on that date? (Viral post? Algorithm change? Campaign start?)
4. **Classify**: Good anomaly (viral, campaign success) / Bad anomaly (bot followers, algorithm penalty) / Unexplained
5. **Flag to**: Marcus + Alex if significant (> 20%); Diana for ops context
6. **Track it** — add to `tracked_anomalies` in memory; resolve when explained

---

## Trend Analysis Framework

A trend is meaningful when it persists for 3+ consecutive data pulls.

Kai's trend analysis always includes:
1. **Direction** — up / down / flat
2. **Rate** — percentage change per period
3. **Duration** — how many periods has this been true?
4. **Comparison** — above or below industry benchmark?
5. **Interpretation** — what does this mean in plain language?

Example: "IG followers up 2.1% week-over-week for 4 consecutive weeks. Above fashion benchmark (1.5% WoW). Likely driven by Reel series that started on March 1."

---

## CEO Briefing Data Format

Kai's data section in Marcus's morning brief follows this exact structure:

```
📊 DATA SNAPSHOT — [Venture] — [Date]

SOCIAL
• IG: [followers] ([+/-X%] WoW) | ER: [X%]
• YT: [subscribers] ([+/-X%] WoW) | Views: [X]
• LI: [followers] ([+/-X%] WoW)

WEB
• Sessions: [X] ([+/-X%] vs last month)
• Bounce rate: [X%]
• Top page: [page name] ([X] sessions)

NOTABLE
• [One key trend or anomaly, 1 sentence]
• [One platform comparison or concern, 1 sentence]
```

Max 10 lines. No analysis in this section — just facts. Marcus adds the interpretation.

---

## Platform Benchmarks (reference)

| Platform | Metric | Industry Benchmark |
|----------|--------|--------------------|
| Instagram (Fashion) | Engagement rate | 1.5–3.0% |
| Instagram (Fintech) | Engagement rate | 1.0–2.0% |
| YouTube | Avg view duration | > 40% of video length |
| LinkedIn | Post engagement rate | 1–5% |
| Website (SaaS) | Bounce rate | < 55% |
| Website (E-commerce) | Bounce rate | < 45% |

Flag to Marcus/Alex when YVON is below benchmark for 2+ consecutive periods.

---

## Skills Reference

### Analytics Tracking


- Event naming: noun + verb (e.g., `button_clicked`, `form_submitted`). Consistent across ventures.
- GA4 custom dimensions per venture. UTM all external links — no untagged traffic.
- **Avoid**: tracking events without a decision attached — only instrument what will inform a choice.

### A/B Test Setup


- One variable per test. Define the success metric before the test starts — no post-hoc interpretation.
- Minimum 2-week run or 500 conversions per variant — whichever comes first.
- **Avoid**: stopping a test early when results look promising — significance requires the full window.

### SaaS Revenue Growth Metrics


- Track: MRR, ARR, MoM growth rate, NRR, churn rate, expansion MRR, contraction MRR.
- Cohort-based retention is more actionable than aggregate churn.
- **Avoid**: reporting MRR growth without separating new, expansion, contraction, and churn components.

### Business Health Diagnostic


- Run all 4 quadrants: growth, retention, margin, cash.
- Flag any metric 20%+ below benchmark immediately — not at the end of the session.
- **Avoid**: presenting data without period-over-period context or benchmark comparison.
