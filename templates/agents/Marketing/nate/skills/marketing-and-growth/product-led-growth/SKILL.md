---
name: product-led-growth
description: Nate's PLG framework for Hourbour (SaaS). Covers activation metrics, product-qualified leads, aha moment identification, viral loops, bottom-up funnel design, and self-serve expansion triggers.
version: 1.0.0
---

# Product-Led Growth — Hourbour

## Purpose

Hourbour is a SaaS product targeting working professionals. The highest-leverage growth model for this profile is PLG — where the product itself drives acquisition, retention, and expansion. This skill prevents Nate from defaulting to paid acquisition patterns (Rio's domain) when the product can do the work instead.

**PLG principle:** The product is the primary growth channel. Marketing amplifies what the product already demonstrates.

---

## When It Runs

- Any growth experiment for Hourbour
- When designing onboarding improvements
- When analyzing trial-to-paid conversion (before routing to Kai for cohort data)
- When identifying viral or referral mechanics
- When evaluating whether a growth lever is product-led or marketing-led

---

## The Hourbour PLG Stack

### Layer 1 — Activation (Aha Moment)

The aha moment is the first time a user experiences the core value of Hourbour. Until this is defined, no growth experiment is valid.

**Defining the aha moment:**
```
Prompt: "What action, when completed in the trial, predicts paid conversion?"
Method: Cross-reference with Kai's cohort data — what do converting users do in Day 1–3 that non-converting users skip?

Aha moment hypothesis format:
"Users who [specific action] within [X days] convert at [Y%] vs [Z%] baseline"
```

Every onboarding experiment must move users toward the aha moment, not just through the setup flow.

### Layer 2 — Product-Qualified Leads (PQLs)

A PQL is a trial user who has hit the aha moment and is ready for a conversion prompt.

**PQL trigger criteria (define for Hourbour):**
```
□ Has completed core setup (defines "active" — not just "signed up")
□ Has used the product on 2+ separate days within the trial window
□ Has reached [specific value milestone] within the product
→ These users receive a targeted conversion nudge, not generic drip emails
```

**Routing:** PQL list → Lena for conversion email sequence, not generic drip.

### Layer 3 — Viral Loops

Where does Hourbour's product create natural sharing moments?

```
Candidate loops to evaluate:
□ Shared outputs (reports, dashboards, summaries) — does sharing them expose the product to new users?
□ Collaboration features — does inviting a colleague give both users more value?
□ Export artifacts — do exported items carry an attribution marker?
□ Public benchmarks — can users opt into public comparisons that drive discovery?
```

**K-factor estimate:**
```
K = Invites sent per user × Conversion rate of invitees
K > 1.0 = viral growth (rare)
K 0.3–0.5 = meaningful amplifier for paid acquisition
K < 0.1 = sharing mechanics are decorative, not functional
```

### Layer 4 — Bottom-Up Expansion

SaaS PLG converts individuals first, then expands to teams/orgs.

```
Expansion signals to monitor:
□ Single user inviting a second user from the same org domain
□ User hitting usage limits (positive constraint — triggers upgrade prompt)
□ Power user behavior (daily active, high feature usage) — candidate for team upsell prompt
```

**Nate routes expansion findings to Felix for ARR impact modeling before recommending any pricing change.**

---

## PLG Experiment Template

Before any PLG experiment goes to Diana for sprint planning:

```
EXPERIMENT: [name]
LAYER:       [Activation | PQL | Viral | Expansion]
HYPOTHESIS:  "If we [change X], [metric Y] will improve by [Z%] because [mechanism]"
AHA MOMENT:  [is this experiment moving users toward the aha moment? YES/NO]
SUCCESS:     [single binary metric — what does 'won' look like?]
FAILURE:     [what does 'lost' look like? — name it before starting]
SAMPLE:      [minimum cohort size needed for significance — use n≥50 per variant]
RISK:        [what could this break? — load pre-mortem skill]
ROUTE:       [who executes: Raj (product change) / Lena (copy change) / Rio (paid amplification)]
```

---

## PLG vs. Paid Growth Decision Gate

Before recommending any paid acquisition experiment for Hourbour, run this gate:

```
1. Has the aha moment been validated with cohort data? → NO → do activation first
2. Is M1 retention ≥ 65%? → NO → do retention before acquisition
3. Is CAC currently sustainable? → NO → do PLG/viral before paid
4. Is the conversion path optimized? → NO → do CRO before buying more traffic
```

Failing any gate = PLG work before paid amplification. Document the gate result in the experiment proposal.

---

## Anti-Patterns

- Never run a paid acquisition experiment when activation rate is below 40% — pouring water into a leaky bucket
- Never define "activated" as "completed signup" — activation = first experience of core value
- Never measure PLG success on traffic metrics — measure on aha moment completion rate
- Never build a viral loop without defining K-factor targets first
