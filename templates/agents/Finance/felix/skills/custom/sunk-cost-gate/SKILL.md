---
name: sunk-cost-gate
description: Felix's mandatory gate before any "continue investing in X" recommendation. Forces separation of past spend from future expected value. Catches the sunk cost fallacy — Felix's identified cognitive failure mode per Kahneman's decision-audit profile.
version: 1.0.0
---

## Purpose

Sunk cost is Felix's highest-risk bias. "We've already spent X on this channel" is not a reason to keep spending. Past spend is irretrievable — it has zero bearing on whether future spend will generate positive returns. But the feeling of waste is powerful and invisible, and it corrupts financial recommendations without Felix noticing.

This gate runs before any recommendation to continue, increase, or defend spending on an existing channel, tool, campaign, or initiative.

---

## When This Gate Triggers

Load this skill and run the gate before delivering any recommendation that includes:
- "We should continue investing in..."
- "We've already spent X, so..."
- "Stopping now would waste..."
- "Given our investment to date..."
- "We're too far in to stop..."
- Any recommendation to maintain current spend level when results are underperforming

---

## The Gate — 4 Questions

Answer all 4 before issuing the recommendation. If any answer is "no" or "unclear" — revise.

**Question 1: Zero-based test**
> "If we had spent nothing on this to date — would we start spending on it now, given what we know?"

If YES → the recommendation can reference current performance data, not sunk costs.
If NO → the recommendation must flag: "On a zero-base analysis, we would not initiate this spend. The case for continuing rests on [specific forward-looking reason], not on past investment."

**Question 2: Alternative deployment**
> "What would $X deployed elsewhere return, compared to continuing here?"

Felix must name at least one alternative use of the funds and estimate its return range. A recommendation to continue spending is only valid when it beats the best available alternative — not just when it avoids a loss.

**Question 3: Stopping cost vs. continuing cost**
> "What is the actual cost of stopping now — not emotionally, but financially?"

Sunk costs are already gone. The only stopping costs that matter are real future costs: contract penalties, transition costs, team disruption. These are legitimate. Emotional loss-of-investment feelings are not.

**Question 4: Downside scenario survival**
> "If performance stays flat for the next 90 days — does this recommendation still hold?"

If the recommendation only makes sense in the base or upside scenario → flag this explicitly. A recommendation that fails the downside scenario is not a recommendation — it is a hope.

---

## Output Format

After running the gate, Felix prepends this to any continuation recommendation:

```
Sunk Cost Gate: PASSED / FLAGGED

Zero-base: [would we start this today? yes/no + reason]
Best alternative: [what else could this budget do, and at what estimated return]
Stopping cost: [actual financial cost of stopping, not emotional]
Downside survival: [does this hold if flat performance for 90 days? yes/no]

Recommendation: [proceed / revise / stop — with rationale based on forward-looking value only]
```

If FLAGGED → Felix does not issue the continuation recommendation as written. He restructures it around forward-looking expected value, names the stopping cost explicitly, and presents the alternative deployment comparison.

---

## Escalation to Kahneman

If Felix runs this gate and is still uncertain whether sunk cost reasoning is driving the recommendation — route to Kahneman before delivering to Marcus. Kahneman's `decision-audit` for Felix specifically flags overconfidence in projections and sunk cost as the two highest-risk patterns.

Three continuation recommendations on the same underperforming channel in 90 days → mandatory Kahneman audit of the pattern.
