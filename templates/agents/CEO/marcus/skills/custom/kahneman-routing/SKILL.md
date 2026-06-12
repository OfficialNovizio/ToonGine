---
name: kahneman-routing
description: Marcus's gate for routing high-stakes decisions to Kahneman before delivering to Stark. Defines which decision types require a bias audit, what to send, how to interpret the verdict, and how to incorporate it into the final recommendation.
version: 1.0.0
---

## Purpose

Marcus is the synthesis endpoint — he receives specialist briefings and delivers a unified recommendation. But Marcus has a characteristic failure mode: narrative fallacy and confirmation bias. He constructs a compelling strategic story and then selects evidence to support it. Kahneman is the corrective.

This skill tells Marcus exactly when to invoke Kahneman, what to pass, and what to do with the result.

---

## When to Route to Kahneman

Route BEFORE delivering to Stark when ANY of these conditions are true:

| Trigger | Why |
|---------|-----|
| Strategic recommendation involves a spend decision > current monthly burn | High financial stakes; sunk cost and overconfidence risk |
| Market direction stated as fact ("the market is moving toward X") | Narrative fallacy — this is an interpretation, not a fact |
| Recommendation reverses a prior decision | Confirmation bias likely — Marcus may be rationalising a flip |
| Only confirming evidence cited in the brief | Active confirmation bias signal |
| Felix's projection is the primary basis for a strategic call | Overconfidence in projections — Felix's identified failure mode |
| Nate's ICE scores drive the priority ranking | Planning fallacy + ICE overconfidence — Nate's identified failure mode |
| Decision affects both ventures simultaneously | Cross-venture scope increases narrative complexity and error surface |

---

## What to Send Kahneman

```
Decision: [one sentence — what Marcus is recommending]
Basis: [what evidence supports it]
Counterevidence: [what argues against it — if Marcus can't name any, that's the bias]
Assumptions: [what must be true for this recommendation to hold]
Agent source: [which agent's output this is based on — Kai / Nate / Felix / Rio]
```

---

## Interpreting Kahneman's Verdict

| Verdict | What it means for Marcus |
|---------|--------------------------|
| 🟢 Clear | Deliver as planned — bias check passed |
| 🟡 Caution | Incorporate Kahneman's reframe before delivery. Do not deliver the original without the correction. |
| 🔴 Block | Do not deliver. Rebuild the recommendation with Kahneman's correction as the starting point, not a patch. |

**If 🔴:** Marcus does not argue with the verdict. He rebuilds, routes back to Kahneman, and only delivers after a second 🟢 or 🟡.

---

## The One Question Marcus Always Asks First

Before routing to Kahneman, Marcus must be able to answer:

> "What would have to be true for this recommendation to be wrong?"

If Marcus cannot name a specific condition — that is the bias. Route to Kahneman regardless of whether any of the triggers above apply.

---

## What NOT to Route

Kahneman is a validator, not a content producer. Do not route:
- Operational updates (Diana's domain)
- Morning briefs (data reporting, not strategic judgment)
- Routing decisions (which agent to activate)
- Requests for definitions or explanations

Route only: strategic recommendations, priority calls, go/no-go decisions, resource allocation choices.
