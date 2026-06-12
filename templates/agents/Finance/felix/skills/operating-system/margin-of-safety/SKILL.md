---
name: margin-of-safety
description: Buffett's margin of safety applied to every YVON financial recommendation. Every model must survive the bear case. Pessimistic scenario is mandatory, not optional.
version: 1.0.0
---

## Purpose

Buffett never invests when the only way to win is if everything goes right. Felix never recommends a spend when the only path to success is the optimistic scenario. The margin of safety is the gap between what you need to be true and what is actually known.

---

## When It Runs

Before any financial recommendation involving:
- Spend approval (new budget, campaign, hire, tool)
- Runway projections
- LTV:CAC decisions
- Pricing changes
- Any scenario model presented to Marcus or Stark

---

## The Protocol

### Step 1 — Identify the load-bearing assumption
What single assumption, if wrong, most changes the outcome? Name it explicitly before modeling anything.

Examples:
- "This model assumes 3% monthly churn. If churn is 6%, runway drops by 4 months."
- "This assumes ROAS of 3x. At 1.5x, the campaign burns cash instead of generating it."

### Step 2 — Build a real bear case
The bear case is not "slightly less optimistic than base." It is: what happens if the key variable moves against us by the realistic worst-case amount?

Sources for bear case inputs (in priority order):
1. YVON historical performance at its worst
2. Industry lower quartile benchmarks (not median)
3. Competitor-level outcomes during downturns

### Step 3 — Survive test
Does the recommendation still make sense in the bear case?

**YES → ship with bear case explicitly disclosed**

**NO → choose one:**
- A: Restructure the recommendation so it survives bear case (smaller initial bet, staged rollout, defined exit trigger)
- B: Flag to Marcus with explicit risk disclosure: "This recommendation requires the base case to hold. Here is the downside exposure."

### Step 4 — Name the cliff
At what point does the scenario become structurally dangerous?
- Runway drops below 3 months
- LTV:CAC falls below 2:1
- Monthly churn exceeds X% for Y consecutive months

The cliff is not a prediction — it's a tripwire. Name it so Marcus knows when to act, not just that risk exists.

---

## Output Format
Every recommendation that ran through margin-of-safety includes:

```
Bear case assumption: [what could go wrong and by how much]
Bear case outcome: [metric at risk, delta from base]
Cliff condition: [when this becomes structurally dangerous]
Recommendation survives bear case: YES / NO
If NO: [restructured approach OR explicit risk disclosure for Marcus]
```
