---
name: fiduciary-guard
version: 1.0.0
description: Board fiduciary oversight. Budget approval gate. Spend authorization. Asset protection. Burn rate monitoring. Every spend over threshold MUST pass this gate.
triggers:
  - "approve budget"
  - "spend approval"
  - "fiduciary review"
  - "budget request"
  - "can we afford this"
  - "purchase over"
  - "cost approval"
  - "financial gate"
---

# Fiduciary Guard — Board Financial Oversight

When this skill activates, enforce the organization's fiduciary framework. Every spend over threshold, every budget request, every resource allocation must pass this gate. Board is the final financial authority.

## Inputs (Required)

Before ANY evaluation, gather these values. They live in the project's config.json under `fiduciary`. If unset, use defaults.

| Input | Source | Default | Description |
|-------|--------|---------|-------------|
| `spend_threshold` | `config.json → fiduciary.spend_threshold` | 5000 | Single expense requiring board review ($) |
| `monthly_budget` | `config.json → fiduciary.monthly_budget` | 50000 | Total approved monthly spend ($) |
| `runway_floor` | `config.json → fiduciary.runway_floor` | 6 | Minimum runway buffer (months) |
| `roi_minimum` | `config.json → fiduciary.roi_minimum` | 1.5 | Minimum expected return (multiplier) |
| `approval_tiers` | `config.json → fiduciary.approval_tiers` | see below | Who can approve what |

### Default Approval Tiers (used when unset)

| Role | Max Single | Max Monthly | Notes |
|------|-----------|-------------|-------|
| Agent Lead (marcus/diana) | $5,000 | $25,000 | Within approved budget only |
| Department Head | $2,000 | $10,000 | Must align with quarterly plan |
| Individual Agent | $500 | $2,000 | Routine tools/services only |
| **Board** | **Unlimited** | **Unlimited** | **Final authority on all spend** |

### How Inputs Are Read

```
Project install → user opens Dashboard → Settings → Fiduciary Inputs
Sets: spend_threshold, monthly_budget, runway_floor, roi_minimum
Saved to: .toon/config.json on VPS
Board agent reads: config.json → fiduciary section
```

**Hard rule:** If user has not configured inputs → use defaults. If user HAS configured → those override defaults. Board never asks "what's your threshold?" — it reads config or defaults.

---

## 3-Step Gate

### Gate 1 — AFFORDABILITY
"Is there money for this?"

- Read current runway from metrics (burn rate × cash / monthly burn)
- If this spend reduces runway below `runway_floor` → **REJECT**
- If this spend exceeds monthly remaining budget → **REJECT** or recommend defer to next cycle
- Check current month-to-date spend against `monthly_budget`

### Gate 2 — RETURN
"Is this worth doing?"

- What is the expected return? Revenue increase, cost reduction, risk reduction
- Is ROI ≥ `roi_minimum`? If NO → **REJECT** unless strategic (requires CEO override)
- Time to breakeven: < 3 months = strong, 3-6 = acceptable, > 6 = weak
- If ROI can't be quantified → **CONDITIONAL** — approve pilot/beta only, re-evaluate after data

### Gate 3 — AUTHORIZATION
"Who approved this and do they have authority?"

- Is the requestor within their approval tier?
- If above tier → escalate to next level, don't reject
- If CEO already approved → board ratifies, doesn't re-judge (unless constitution violation)
- Check: is this spend already budgeted? If yes and within tier → fast-track

---

## Output Format

```yaml
fiduciary_review:
  request: <what is being purchased/spent>
  amount: <$ amount>
  requestor: <agent or role>
  date: YYYY-MM-DD
  
  gates:
    affordability:
      runway_current: <months>
      runway_after: <months>
      below_floor: true|false
      month_budget_remaining: <$>
      passed: true|false
    
    return:
      expected_roi: <multiplier>
      breakeven_months: <N>
      quantifiable: true|false
      passed: true|false
    
    authorization:
      requestor_tier: <tier>
      within_authority: true|false
      ceo_pre_approved: true|false
      passed: true|false

  verdict: APPROVED | REJECTED | CONDITIONAL
  conditions: <if conditional, what must be met>
  escalation: <if escalated, to whom>
```

---

## Spend Categories (Risk-Weighted)

| Category | Risk Weight | Scrutiny Level | Examples |
|----------|-------------|----------------|----------|
| **Infrastructure** | 1.0× | Standard | Hosting, APIs, tool subscriptions |
| **Personnel/Contractors** | 1.5× | Elevated | Freelancers, agencies, services |
| **Marketing/Ads** | 1.2× | Standard with ROI check | Ad spend, sponsorships, content |
| **Capital/Assets** | 2.0× | High | Equipment, software licenses, IP |
| **Experimental/R&D** | 1.8× | High — requires hypothesis + success criteria | New tools, unproven channels |
| **Compliance/Legal** | 0.5× | Low — auto-approve if required by law | Regulatory filings, required audits |

**Formula:** Effective threshold = `spend_threshold / risk_weight`
Example: Capital asset at $3,000 → $5,000 / 2.0 = $2,500 effective threshold → requires board review even though under base threshold.

---

## Escalation Path

```
Agent requests spend
    ↓
Above tier? → Department Head
    ↓
Above department head tier? → CEO (marcus/diana)
    ↓
Above CEO tier OR runway impact? → BOARD
    ↓
Board evaluates → APPROVE / REJECT / CONDITIONAL
    ↓
CONDITIONAL → CEO must meet conditions → Board re-evaluates
```

---

## Anti-Patterns

- **"It's already budgeted so skip review"** — still check: does this specific spend fit the budget line item?
- **"CEO approved so it's fine"** — board ratifies, doesn't blindly accept. If CEO approval violates constitution, board overrides.
- **"It's small, don't waste time"** — cumulative small spends matter. Board monitors monthly totals, not just single transactions.
- **"ROI can't be calculated for this"** — then it's CONDITIONAL maximum. No blank checks.

---

## Weekly Fiduciary Audit

Board MUST run this weekly:
- [ ] Month-to-date spend vs. budget: on track?
- [ ] Runway: above floor?
- [ ] Any single spend over threshold missed review?
- [ ] Any conditional approvals still pending conditions?
- [ ] Any pattern of small spends aggregating over threshold?
