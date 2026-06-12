---
name: cohort-analysis
description: Kai's cohort retention analysis framework for Hourbour (SaaS) and Novizio (e-commerce). Covers cohort table structure, churn calculation, trial-to-paid funnel, LTV projection from cohort data, and Supabase query templates.
version: 1.0.0
---

# Cohort Analysis

## Purpose

Hourbour's North Star is MRR + trial-to-paid conversion. Flat averages hide cohort-level decay. A 10% average churn rate can mask a 30% churn rate in the first 30 days with 2% thereafter — those two businesses have completely different interventions. This skill ensures Kai never reports a flat average when cohort data is available.

---

## When It Runs

- Any analysis of Hourbour retention, churn, or LTV
- Monthly Hourbour health review
- When Felix models runway and needs cohort-based LTV inputs
- When Nate designs a churn-prevention experiment and needs baseline cohort data

---

## Hourbour Cohort Framework

### Cohort Definition
Group users by the week they converted from trial to paid.

```sql
-- Supabase: trial-to-paid cohorts (replace table names with actual schema)
SELECT
  DATE_TRUNC('week', trial_started_at) AS cohort_week,
  COUNT(*) AS trial_starts,
  COUNT(CASE WHEN converted_at IS NOT NULL THEN 1 END) AS conversions,
  ROUND(100.0 * COUNT(CASE WHEN converted_at IS NOT NULL THEN 1 END) / COUNT(*), 1) AS conversion_rate_pct
FROM hourbour_users
GROUP BY cohort_week
ORDER BY cohort_week DESC
LIMIT 12;
```

### Retention Curve (months 0–6)
For each cohort, measure what % of paying users remain active at M1, M2, M3, M6.

```
Cohort Week | M0 (100%) | M1 | M2 | M3 | M6
2026-W20    | 100       | 72 | 61 | 55 | 48
2026-W19    | 100       | 68 | 57 | 51 | —
```

**Red flag:** If M1 retention drops below 65%, the onboarding is broken — not the product. Route to Nate.
**Red flag:** If M1 is strong but M3 drops sharply, the product has a value cliff — route to Marcus.

---

## LTV Projection from Cohort Data

Do not use flat churn rate for LTV. Use the cohort retention curve.

```
LTV = ARPU × Σ(retention_rate_at_month_n) for n = 1 to 24
    = ARPU × (M1 + M2 + M3 + ... + M24)
```

If only 6 months of data exist, project M7–M24 using the M3→M6 decay slope.
Flag the projection as estimated beyond the data window.

**Always give Felix a range, not a point estimate:**
```
LTV estimate: $[low] – $[high]
Based on: [n] months of cohort data (M1–M6)
Projection method: linear decay from M3→M6 slope
Confidence: [LOW | MED | HIGH] depending on cohort sample size
```

---

## Novizio Cohort Framework

For Novizio (e-commerce), cohorts are by first purchase month:

```
Cohort Month | Orders | Repeat 60d | Repeat 90d | AOV avg
2026-04      | 142    | 18%        | 24%        | £84
2026-03      | 98     | 22%        | 31%        | £91
```

**Key metrics:**
- **Repeat purchase rate at 60 days:** below 15% = weak retention
- **AOV trend:** if AOV drops over time for a cohort, product-market fit is weakening
- **Cohort GMV:** which acquisition month generates the most lifetime revenue?

---

## Output Format

Every cohort report to Marcus or Felix uses this structure:

```
COHORT REPORT — [venture] — [date]

1. DATA WINDOW:   [earliest cohort] to [latest cohort] — [n] months
2. CONVERSION:    Trial-to-paid [X%] — [vs prior 4-week avg: +/-X%]
3. M1 RETENTION:  [X%] — [RED/AMBER/GREEN vs 65% threshold]
4. LTV ESTIMATE:  $[low]–$[high] — [confidence level]
5. KEY SIGNAL:    [one insight — what the cohort data says that a flat average hides]
6. ROUTE:         [who needs to act on this: Nate (onboarding) / Marcus (strategy) / Felix (model update)]
```

---

## Anti-Patterns

- Never report a single churn rate without breaking it by cohort week
- Never extrapolate beyond 2× the data window (6 months of data → max 12-month projection)
- Never report Hourbour cohort data to the Novizio session context (venture isolation rule)
- Never give Felix a point estimate for LTV — always a range with confidence level
