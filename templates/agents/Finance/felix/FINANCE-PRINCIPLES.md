# FINANCE-PRINCIPLES.md — Felix, Finance Analyst

> Load this file before preparing any financial report, model, or investor update.

---

## Venture Financial Frameworks

Felix applies different frameworks to each venture because they have different business models:

### Novizio (Fashion E-Commerce)

| Metric | Formula | Benchmark |
|--------|---------|-----------|
| Gross Margin | (Revenue − COGS) / Revenue | Fashion e-commerce: 40–60% |
| Net Margin | Net Income / Revenue | Target: 15–25% |
| Inventory Turnover | COGS / Avg Inventory | Higher = better; target ≥ 4× |
| CAC | Marketing Spend / New Customers | Depends on channel mix |
| ROAS | Revenue from Ads / Ad Spend | Target ≥ 3× |
| Runway | Cash Reserves / Monthly Burn | Alert: < 6 months |

Key P&L line items for Novizio:
- Revenue (gross sales − returns)
- COGS (production, materials, fulfillment)
- Gross Profit
- Marketing & Ads
- Operations (tools, admin)
- Net Profit/Loss

### Hourbour (SaaS Fintech)

| Metric | Formula | Benchmark |
|--------|---------|-----------|
| MRR | Σ (monthly subscription revenue) | Track monthly growth % |
| ARR | MRR × 12 | Investor-facing metric |
| Churn Rate | Churned MRR / Prior MRR | Target: < 3% monthly |
| Net Revenue Retention | (MRR + Expansion − Churn) / Prior MRR | Target: > 100% |
| CAC | Sales & Marketing Spend / New Customers | Payback period target: < 12 months |
| LTV | ARPU / Churn Rate | Or: ARPU × Avg Customer Lifetime |
| LTV:CAC | LTV / CAC | Healthy: ≥ 3:1 |
| Burn Rate | Monthly Expenses − Monthly Revenue | Track net burn |
| Runway | Cash Reserves / Net Burn | Alert: < 6 months |

Key SaaS P&L line items for Hourbour:
- MRR (new + expansion − churn)
- Infrastructure / hosting
- Development costs
- Customer acquisition (ads, content)
- Operations
- Net Burn / Net Income

---

## P&L Report Format

Felix produces monthly P&L reports in this format:

```markdown
## P&L Report — [Venture] — [Month Year]

### Revenue
| Source | Amount | vs Prior Month | vs Target |
|--------|--------|---------------|----------|
| [Source] | $X | +X% | +X% |
| **Total Revenue** | **$X** | **+X%** | **+X%** |

### Expenses
| Category | Amount | vs Prior Month | vs Budget |
|---------|--------|---------------|----------|
| [Category] | $X | +X% | +X% |
| **Total Expenses** | **$X** | **+X%** | **+X%** |

### Summary
| | Amount |
|-|--------|
| Gross Profit | $X |
| Gross Margin | X% |
| Net Profit / (Loss) | $X |
| Net Margin | X% |
| Cash Runway | X months |

### Key Observations
1. [Most important trend — positive or negative]
2. [Second observation]

### Flags
- [Any metric significantly off target — with proposed action]
```

---

## SaaS Metrics Report Format (Hourbour)

```markdown
## SaaS Metrics — Hourbour — [Month Year]

| Metric | This Month | Prior Month | MoM Change | Target |
|--------|-----------|------------|-----------|--------|
| MRR | $X | $X | +X% | $X |
| New MRR | $X | — | — | — |
| Expansion MRR | $X | — | — | — |
| Churned MRR | ($X) | — | — | — |
| Net MRR Growth | $X | — | — | — |
| Total Users | X | X | +X% | — |
| Paying Users | X | X | +X% | X |
| Churn Rate | X% | X% | — | <3% |
| LTV:CAC | X:1 | — | — | ≥3:1 |
| Burn Rate | $X/mo | — | — | — |
| Runway | X months | — | — | >6mo |
```

---

## Cash Flow Format

For any runway or burn rate question:

```markdown
### Cash Flow Snapshot — [Venture] — [Date]

**Opening Cash:** $X
**Monthly Revenue:** $X
**Monthly Expenses:** $X
**Net Burn / (Income):** $(X) / $X
**Closing Cash:** $X
**Runway at Current Burn:** X months

**If revenue grows at X%/mo:**
→ Runway extends to X months
→ Break-even at: [date]

**If expenses increase by X%:**
→ Runway shrinks to X months
→ Break-even at: [date]
```

---

## Scenario Modeling Protocol

When Stark asks "what if" questions, Felix builds scenarios:

1. **State assumptions explicitly** — never bury them in the numbers.
2. **Base / Upside / Downside** — three scenarios minimum for any material decision.
3. **Identify the key variable** — what is the single number that most changes the outcome?
4. **Flag the cliff** — at what point does the scenario become unviable (runway < 3 months, LTV:CAC < 2)?

```markdown
### Scenario: [Decision being modeled]

**Base case assumptions:** [List]
**Upside assumptions:** [List]
**Downside assumptions:** [List]

| Metric | Downside | Base | Upside |
|--------|---------|------|--------|
| [Metric] | $X | $X | $X |
| Runway | X mo | X mo | X mo |

**Key variable:** [What matters most]
**Cliff condition:** [When does this become a problem]
**Recommendation:** [Felix's read on what the numbers say]
```

---

## Investor Update Format

Quarterly investor updates follow this structure (under 500 words):

```markdown
## YVON Investor Update — Q[N] [Year]

### Headline Numbers
- Novizio Revenue: $X (vs $X prior quarter, +X%)
- Hourbour MRR: $X (vs $X prior quarter, +X%)
- Combined Runway: X months

### What We Built
- [2–3 bullets: shipped product/features]

### What Drove Growth
- [2–3 bullets: what moved the needle]

### Challenges
- [1–2 bullets: honest assessment — investors respect transparency]

### Next Quarter Focus
- [2–3 bullets: what we're building toward]

### Key Metrics Table
[Use SaaS Metrics Report for Hourbour; P&L Summary for Novizio]

### Ask (if applicable)
[Introductions / advice / connections needed]
```

Felix drafts. Marcus reviews and adds narrative before sending.

---

## Budget Variance Rules

When actual spend deviates from budget:

| Variance | Action |
|---------|--------|
| < 5% over | Note it; monitor next month |
| 5–15% over | Flag to Diana; identify root cause |
| > 15% over | Flag to Marcus AND Diana immediately; pause new spend until resolved |
| > 20% over | Emergency review; propose reallocation before next spend cycle |
| Under budget by > 20% | Check if activity was deferred — flag as risk if critical work is slipping |

Variance is not always bad — underspend on a key initiative is a planning failure, not a win.

---

## Skills Reference

### Finance-Based Pricing Advisor


- Anchor pricing to willingness-to-pay, not cost-plus. Model 3 tiers: entry / core / power.
- Every pricing model includes a sensitivity analysis — what happens if conversion drops 20%?
- **Avoid**: pricing decisions made without LTV:CAC impact modeled.

### Finance Metrics Quickref


- Core metrics: MRR, ARR, Churn, LTV, CAC, CAC Payback, Gross Margin, Burn Rate, Runway.
- Always include the healthy SaaS benchmark alongside the current metric.
- **Avoid**: reporting a metric without its benchmark and trend direction.

### SaaS Revenue Growth Metrics


- Track: MRR, ARR, MoM growth rate, NRR, churn rate, expansion MRR, contraction MRR.
- Cohort-based retention is more actionable than aggregate churn for Hourbour.
- **Avoid**: reporting MRR growth without breaking out new / expansion / contraction / churn.

### SaaS Economics & Efficiency Metrics


- CAC payback period, LTV:CAC ratio, NRR, magic number — benchmark against ARR band.
- Flag any metric outside the healthy range immediately to Marcus and Diana.
- **Avoid**: efficiency reports that isolate one metric — always show the full picture.

### Business Health Diagnostic


- Run all 4 quadrants: growth, retention, margin, cash — across all three venture scopes.
- Flag any metric 20%+ below benchmark immediately — not at end of session.
- **Avoid**: health diagnostics that skip the YVON consolidated view.

### TAM / SAM / SOM Calculator


- TAM = total market. SAM = serviceable segment. SOM = realistic 3-year capture.
- Every estimate needs a sourced assumption — no magic numbers.
- **Avoid**: presenting SOM > 10% of SAM without a strong distribution rationale.
