---
name: yvon-pl-runway
description: >-
  YVON P&L and Runway Protocol for Felix. Dual-venture P&L tracking, runway calculation with escalation triggers, and investor summary template.
version: 1.0.0
platforms: []
metadata:
  hermes:
    tags: [finance, pl, runway, cac, ltv, mrr, margin, roi]
---


# YVON P&L + Runway Protocol

Felix's structured financial tracking and reporting for YVON and both ventures.

## Part A: P&L Per Venture

### Hourbour (SaaS Fintech)

```
Revenue
  Subscription Revenue (MRR x 12)    $
  One-time Revenue                     $
  Total Revenue                        $

COGS (Cost of Goods Sold)
  Hosting / Infrastructure             $
  Third-party APIs / Services          $
  Support / Customer Success           $
  Total COGS                           $

Gross Profit = Revenue - COGS
Gross Margin = Gross Profit / Revenue

OpEx (Operating Expenses)
  Team (salaries, contractors)         $
  Tools and Software                   $
  Marketing and Ads                    $
  Legal and Professional               $
  Other                                $
  Total OpEx                           $

Operating Income = Gross Profit - OpEx
```

### Novizio (Fashion E-commerce)

```
Revenue
  Product Sales                        $
  Shipping Income                      $
  Total Revenue                        $

COGS
  Product Cost (wholesale/mfg)         $
  Shipping and Fulfillment             $
  Packaging                            $
  Payment Processing                   $
  Total COGS                           $

Gross Profit = Revenue - COGS
Gross Margin = Gross Profit / Revenue

OpEx
  Marketing and Ads                    $
  Team and Contributors                $
  Photography / Content Production     $
  Returns and Refunds                  $
  Platform / E-commerce Tools          $
  Total OpEx                           $

Operating Income = Gross Profit - OpEx
```

## Part B: Consolidated Monthly View

```
YVON Consolidated -- {Month Year}

| Venture | Revenue | Gross Margin % | Operating Income |
|---------|---------|---------------|-----------------|
| Hourbour| $       | %             | $               |
| Novizio | $       | %             | $               |
| TOTAL   | $       | %             | $               |
```

## Part C: Runway Calculation

```
Runway = Current Cash / |Net Monthly Burn|
Net Burn = Total OpEx - Total Operating Income
```

### Escalation Triggers

| Runway | Level | Action |
|--------|-------|--------|
| More than 12 months | Stable | Continue normal operations |
| 6 to 12 months | Watch | Flag to Diana, review discretionary spend |
| 4 to 6 months | Alert | Surface to Marcus immediately, cost review required |
| 2 to 4 months | Critical | Urgent action: reduce burn, accelerate revenue |
| Less than 2 months | Emergency | All hands: survival mode |

## Part D: Investor Summary Template (1-Page)

```
Investor Brief -- YVON -- {Month / Quarter Year}

Headline Numbers
- Total Revenue: $X (up/down Y% vs last month)
- Gross Margin: X% (up/down vs last month)
- Net Burn: $X/month
- Runway: X months
- Cash on Hand: $X

By Venture
- Hourbour: MRR $X, NRR X%, Active users X (trend)
- Novizio: Revenue $X, AOV $X, Orders X (trend)

This Month: Key Change
- [Winner]
- [Loser]

Next Month: Focus
- [Priority 1]
- [Priority 2]

Asks / Blockers
- [Anything needing investor attention]
```

## Monthly Finance Cadence

1. **Week 1:** Close prior month P&L for both ventures
2. **Week 1:** Calculate runway, update Felix's tracking sheet
3. **Week 1:** If runway changed category, alert Marcus
4. **Week 2:** Review discretionary spend against budget
5. **End of Month:** Consolidate view sent to Marcus
