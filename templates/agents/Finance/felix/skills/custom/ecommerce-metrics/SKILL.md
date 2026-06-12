---
name: ecommerce-metrics
description: Felix's financial framework for Novizio (DTC fashion e-commerce). Covers AOV, return rate, contribution margin per SKU, inventory turn, e-commerce CAC:LTV, sell-through rate, and SS26 campaign financial modeling.
version: 1.0.0
---

# E-Commerce Financial Metrics — Novizio

## Purpose

Felix's core skills are SaaS-optimized. Novizio is DTC fashion — a fundamentally different financial model. MRR, ARR, and SaaS LTV:CAC do not apply. This skill defines the metrics framework Felix uses for any Novizio financial analysis to prevent SaaS-lens distortion on a fashion e-commerce venture.

---

## Core Novizio Metrics

### Average Order Value (AOV)
```
AOV = Total Revenue ÷ Total Orders
Target: £80–£120 for contemporary fashion DTC
Red flag: AOV declining WoW for 3+ consecutive weeks
```

### Return Rate
```
Return Rate = Returned Orders ÷ Total Orders × 100
Industry benchmark: 20–30% for online fashion
YVON flag: > 35% = sizing/quality issue · < 15% = potential friction in return process
Impact: every 1% return rate increase reduces net revenue by AOV × (1% of orders)
```

### Sell-Through Rate
```
Sell-Through Rate = Units Sold ÷ (Units Sold + Units Remaining) × 100
Good: ≥ 70% within 90 days of season launch
At 50%: discount pressure begins
At < 40%: markdown risk — flag to Marcus before SS26 inventory decisions
```

### Contribution Margin per SKU
```
Contribution Margin = (Selling Price − COGS − Shipping − Returns Cost − Payment Fees) ÷ Selling Price
Target: ≥ 45% to support profitable paid acquisition
Below 35%: SKU cannot support Meta ads — organic only
```

### Gross Merchandise Value (GMV) vs Net Revenue
```
GMV = Total order value before returns
Net Revenue = GMV − Returns − Refunds − Discounts

Always report both. A strong GMV with high returns is a false signal.
```

---

## E-Commerce CAC:LTV

LTV for Novizio is **not** a subscription metric. Use purchase frequency model:

```
Novizio LTV = AOV × Avg. Purchase Frequency × Avg. Customer Lifespan (years) × Gross Margin %

Example:
AOV £95 × 2.1 orders/year × 2.5 years × 48% margin = £239 LTV

CAC:LTV target: 3:1 minimum (spend £1 to earn £3 lifetime)
Current CAC from Kai's channel data → Felix models LTV from above formula
```

**Never use SaaS LTV:CAC ratios for Novizio.** Fashion DTC benchmarks are structurally different.

---

## SS26 Campaign Financial Model

Before any SS26 campaign budget is approved:

```
1. INVENTORY VALUE:   Total cost of SS26 units × expected sell-through rate = expected net COGs
2. REVENUE TARGET:    Inventory value ÷ target contribution margin
3. CAC BUDGET:        Revenue target × (1 ÷ LTV multiplier) = max total acquisition spend
4. ROAS FLOOR:        CAC Budget ÷ expected paid revenue = minimum ROAS to break even
5. MARKDOWN RESERVE:  Flag % of inventory likely to hit 40%+ markdown (sell-through < 50% at week 8)
```

Output for Marcus approval:
```
SS26 FINANCIAL MODEL
Inventory cost:     £[X]
Revenue target:     £[X] (at [Y]% sell-through, [Z]% margin)
Max CAC spend:      £[X]
ROAS floor:         [X.Xx]
Markdown risk:      £[X] reserve if sell-through < 50% at week 8
Felix verdict:      PROCEED / REDUCE INVENTORY / DELAY
```

---

## Weekly Novizio Health Check

Felix monitors these weekly (not monthly):

| Metric | Green | Amber | Red |
|--------|-------|-------|-----|
| AOV | > £90 | £70–£90 | < £70 |
| Return rate | < 22% | 22–32% | > 32% |
| Sell-through (SS) | > 65% | 50–65% | < 50% |
| Contribution margin | > 45% | 35–45% | < 35% |

---

## Anti-Patterns

- Never apply SaaS MRR/ARR/NRR framework to Novizio analysis
- Never report GMV as revenue without netting out returns
- Never recommend a paid campaign budget for Novizio without calculating contribution margin first
- Never project Novizio LTV using a subscription formula — use purchase frequency model above
