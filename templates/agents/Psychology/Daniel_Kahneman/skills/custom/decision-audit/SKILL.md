---
name: decision-audit
description: Per-agent bias failure patterns for YVON. Each agent has a distinct cognitive failure signature. Load when Kahneman is auditing a specific agent's output to know where to look hardest.
version: 1.0.0
---

## Purpose

Not all agents fail in the same way. Lena's most common bias is not the same as Felix's. This skill maps the characteristic cognitive failure pattern of each YVON agent so Kahneman looks in the right place first — without skipping the full 8-item checklist.

**Rule:** Use this as a starting lens, not a replacement for the full bias checklist. Every bias on the checklist still runs. This skill tells Kahneman which biases to weight more heavily for each agent.

---

## Agent Bias Profiles

---

### Lena — Brand Voice & Copy

**Characteristic failure:** Availability bias + Survivorship bias

**Where it appears:**
- "This format is trending" → trend data usually comes from accounts 10–50× larger than YVON's ventures. The available example is not representative of what works at this scale.
- "This hook worked for [competitor]" → cites the hit post, ignores the miss rate. Survivorship bias: the examples Lena sees are the ones that worked.
- Loss aversion CTAs ("Don't miss out", "Last chance") applied when scarcity is not real — emotional lever activated on false premise.

**Priority checks when auditing Lena:**
- [ ] Is the trend evidence scale-matched to Novizio/Hourbour's actual audience size?
- [ ] Is the social proof cited (engagement rate, conversion) from a comparable account, not a 500K+ brand?
- [ ] Is any loss aversion CTA anchored to a real scarcity condition?
- [ ] Is the lever selection based on what the brand needs at this lifecycle stage, or what just performed well somewhere else?

**Common correction:** Replace trend reference with a mechanism — not "this format is trending" but "this format activates [specific psychological lever] because [mechanism]."

---

### Rio — Paid Ads & Performance

**Characteristic failure:** Overconfidence + Anchoring

**Where it appears:**
- ROAS projections stated as point estimates ("we'll hit 3.5× ROAS") without confidence intervals or base rate comparison.
- Anchoring on competitor benchmark ROAS (often from brands with established audiences and optimized funnels) — sets a reference frame that is unrealistic for cold audience campaigns.
- "The campaign failed" diagnosis that attributes failure to a single variable when multiple variables changed simultaneously — attribution overconfidence.

**Priority checks when auditing Rio:**
- [ ] Is the ROAS projection a range with a stated base rate, or a single number asserted as likely?
- [ ] Is the benchmark being used drawn from an account at YVON's scale and funnel maturity?
- [ ] If diagnosing a campaign failure — has Rio isolated the variable, or are multiple changes confounded?
- [ ] Is audience size large enough for statistical confidence before calling a winning creative?

**Common correction:** Replace point predictions with ranges: "ROAS target 2.5–3.5×, based on [comparable campaign] at [comparable stage]."

---

### Nate — Growth Strategy

**Characteristic failure:** Planning fallacy + Overconfidence in ICE scores

**Where it appears:**
- Experiment timelines of "14 days" stated without acknowledging that 14 days may produce insufficient sample at YVON's current traffic volume.
- ICE scores presented as numbers without stating the assumptions behind each dimension — Impact 8 means nothing without knowing what it assumes.
- "This worked for [high-growth SaaS]" → reference company is at 100× YVON's scale. Mechanism may not transfer.

**Priority checks when auditing Nate:**
- [ ] Is the 14-day read window feasible at current traffic volume? What sample size is achievable?
- [ ] Does each ICE dimension have a named assumption? If Impact = 8, what does that assume?
- [ ] Is the benchmark being referenced from a comparable-stage company, not a scaled-up success story?
- [ ] Is the experiment testing one variable — or are multiple changes confounded?

**Common correction:** Force assumption naming: "Impact 8 assumes [X]. If [X] is wrong, score drops to [N]."

---

### Felix — Financial Intelligence

**Characteristic failure:** Overconfidence in projections + Sunk cost

**Where it appears:**
- Revenue forecasts built on best-case scenario inputs without a base-case or worst-case range.
- "We've already spent X on this channel" used as a reason to continue spend — sunk cost framing.
- Runway calculations that assume current burn rate is fixed when it is actually discretionary.
- LTV projections that model linear growth without acknowledging early cohort data is insufficient for long-term extrapolation.

**Priority checks when auditing Felix:**
- [ ] Are projections presented as ranges (base/worst/best) or as single-point forecasts?
- [ ] Is any recommendation influenced by money already spent rather than future expected value?
- [ ] Does the runway model show sensitivity to burn rate changes — or is burn treated as fixed?
- [ ] Is the LTV projection based on enough cohort data to be statistically meaningful?

**Common correction:** Three-scenario modeling: "Base case [X], worst case [Y], best case [Z]. Decision holds under [base/worst]."

---

### Marcus — CEO Strategy

**Characteristic failure:** Narrative fallacy + Confirmation bias

**Where it appears:**
- Strategy brief constructs a compelling story connecting a trend → insight → strategic move. The story feels coherent, but coherence is not causality. The data may only support one part of the narrative.
- Evidence selected to support the strategic direction already decided — confirmation bias in which data gets cited.
- "The market is moving toward X" stated as fact when it is an interpretation with genuine uncertainty.

**Priority checks when auditing Marcus:**
- [ ] Is the strategic narrative supported by data at each logical step, or does the data only support the conclusion?
- [ ] Is contradictory evidence acknowledged and addressed — or absent from the brief?
- [ ] Are market direction claims stated with appropriate uncertainty, or as fact?
- [ ] What would have to be true for this strategy to be wrong? Is that condition discussed?

**Common correction:** Separate the narrative from the evidence: "Here is what the data shows [X]. Here is the interpretation [Y]. Here is the assumption required to connect them [Z]."

---

### Kai — Analytics & Insight

**Characteristic failure:** Recency bias + Availability bias

**Where it appears:**
- A single spike in data treated as a durable trend rather than a one-period event.
- Competitor analysis citing the competitor's most visible recent moves rather than a systematic review of their strategy.
- "Users are responding to X" based on 1–2 weeks of data without checking if the pattern holds over a longer window.

**Priority checks when auditing Kai:**
- [ ] Is the trend conclusion based on a single period or a consistent pattern across ≥3 comparable periods?
- [ ] Is the competitor analysis based on a systematic review or the most recently visible examples?
- [ ] Has the signal passed the WebSearch elimination test — is this a platform-wide effect, not venture-specific?
- [ ] Is the sample size large enough to support the confidence level of the claim?

**Common correction:** Time-extend the data window: "Pattern holds over [N] periods — not just the most recent spike."

---

## Output After Loading This Skill

Before issuing a verdict on any agent's output, Kahneman states:

```
Agent audited: [name]
Characteristic failure mode: [bias name from profile above]
Priority check applied: [which checklist items weighted most heavily]
Finding: [what was found, or "profile bias not present — standard checklist applied"]
```

Then continue to full verdict in standard Communication DNA format.
