---
name: framing-analysis
description: Kahneman's systematic framing effect detection protocol. Covers gain vs. loss framing audit, reference point manipulation, choice architecture review, and specific reframes. Used before any copy, campaign, or financial recommendation goes to Stark.
version: 1.0.0
---

# Framing Analysis

## Purpose

The framing effect is one of the most reliably exploited cognitive biases — and one of the easiest to accidentally weaponize against the very customer you're trying to serve. This skill gives Kahneman a structured protocol for detecting and correcting framing distortions in YVON agent outputs before they reach Stark or go to market.

---

## When It Runs

- Any copy from Lena that uses "only", "limited", "last chance", "don't miss", "lose"
- Any financial projection from Felix that leads with the positive scenario
- Any A/B test recommendation from Rio or Nate that frames one variant in terms of gain and the other in terms of loss
- Any strategic brief from Marcus that selectively frames risks vs. opportunities
- Any request containing "framing check" or "@kahneman framing"

---

## The 6-Point Framing Audit

For any content, recommendation, or decision:

### Point 1 — Gain vs. Loss Framing
Is the same outcome described in both positive (gain) and negative (loss) terms before a recommendation is made?

```
Gain frame:  "85% of customers keep their purchase"
Loss frame:  "15% of customers return"
→ Functionally identical. If the recommendation changes based on framing, the decision is biased.
→ Audit question: does this recommendation hold if framed the opposite way?
```

**Correction rule:** Any recommendation that is not robust to its inverse framing should be flagged 🔴.

### Point 2 — Reference Point Manipulation
What reference point is being used, and is it the most honest one?

```
Problematic: "Revenue up 12% vs last month" (seasonal low comparison)
Honest:      "Revenue up 12% MoM — down 8% vs same period last year"
```

**Audit question:** Has the comparison reference been chosen to make the data look better than a neutral baseline would?

### Point 3 — Scarcity and Loss Aversion in Copy
Is scarcity language ("only 3 left", "ending tonight") backed by a real constraint?

```
Real constraint: Inventory count is genuinely limited → permitted
Manufactured constraint: "Only available until midnight" when midnight resets → 🔴 Trust debt
```

**Audit question:** If a customer discovered the scarcity was not real, would they feel deceived?

### Point 4 — Default Effect
What happens if the customer does nothing? Is the default option genuinely the best option for the customer, or for revenue?

```
Pre-checked upsell at checkout → examine who benefits from the default
Default to annual billing → is this disclosed clearly before the "start trial" click?
```

**Audit question:** Does the default option require the customer to take an action to avoid an undesired outcome?

### Point 5 — Asymmetric Salience
Is negative information as salient as positive information in the output?

```
Red flag: 4 bullet points of benefits, 1 footnote of risks
Red flag: ROI projection in headline, CAC risk in footnote
```

**Audit question:** If risks and benefits were equally prominent, would the recommendation still be made?

### Point 6 — Anchoring in Financial Projections
Does a financial model lead with a scenario that anchors subsequent expectations upward?

```
Red flag: "Best case: £200k revenue" presented before "Base case: £110k"
Correction: Always present base case first. Anchors set by best case inflate expectations.
```

**Audit question:** Would presenting the base case first change the risk appetite behind the decision?

---

## Output Format

```
FRAMING ANALYSIS — [agent audited] — [content type]

POINT 1 (Gain/Loss):   [CLEAN | DISTORTED] — [finding if distorted]
POINT 2 (Reference):   [CLEAN | DISTORTED] — [finding if distorted]
POINT 3 (Scarcity):    [CLEAN | N/A | DISTORTED] — [finding if distorted]
POINT 4 (Default):     [CLEAN | N/A | DISTORTED] — [finding if distorted]
POINT 5 (Salience):    [CLEAN | DISTORTED] — [finding if distorted]
POINT 6 (Anchoring):   [CLEAN | N/A | DISTORTED] — [finding if distorted]

CORRECTIONS:
  [Point n] — [exact reframe, not "consider revising"]

VERDICT: 🟢 Clean / 🟡 Caution / 🔴 Block
```

🔴 Block conditions: any Point 3 real-vs-manufactured scarcity failure, any Point 6 anchor that changes a budget decision, Point 5 asymmetry on a high-stakes financial model.

---

## Anti-Patterns

- Never audit only the headline — framing distortions hide in footnotes, defaults, and comparison baselines
- Never issue 🟢 with an unresolved distortion because "it's minor" — name it 🟡 and note it explicitly
- Never confuse persuasion (acceptable) with deception (not acceptable) — scarcity is fine when real
- Never issue corrections that are vague ("consider more balanced framing") — provide the exact reframe
