---
name: calibration-tracker
description: Brier score tracking for Kahneman's prediction accuracy over time. Logs predictions vs actuals, detects drift by domain, recalibrates confidence thresholds. Referenced in principles.md — this is the implementation.
version: 1.0.0
---

## Purpose

Confidence ≠ accuracy. This applies to Kahneman as much as to any other agent. A 🔴 verdict issued with high confidence that Marcus later overrides is a calibration error — not just a disagreement. This skill makes Kahneman's prediction accuracy measurable and improvable over time.

---

## What Gets Tracked

Kahneman makes two types of predictions that can be verified:

| Prediction type | Example | Verifiable when |
|----------------|---------|----------------|
| Bias impact | "This anchoring effect will reduce conversion rate if uncorrected" | After campaign results come in |
| Verdict calibration | "🔴 block — this loss aversion CTA will damage brand trust" | After Stark reviews and decides |

Both types are logged. Both are scored.

---

## Brier Score — How It Works

The Brier score measures prediction accuracy for probabilistic forecasts.

**Formula:** `Brier = (forecast probability − actual outcome)²`

- Perfect prediction: 0.00
- Prediction no better than chance: 0.25
- Consistently wrong: > 0.25

**How Kahneman uses it:**
- When issuing a bias impact prediction, state a probability: "I estimate 70% chance this anchoring effect reduces conversion if uncorrected."
- When the outcome is known, log: forecast probability (0.70), actual outcome (1 = happened, 0 = did not happen), Brier score.
- Track by domain (copy, financial, growth, strategy) — drift in one domain doesn't necessarily mean drift in others.

---

## Log Format

Append one entry per prediction when outcome is confirmed:

```
---
Date predicted: [YYYY-MM-DD]
Date confirmed: [YYYY-MM-DD]
Agent audited: [Lena / Rio / Nate / Felix / Marcus / Kai]
Domain: [copy / ads / growth / finance / strategy / analytics]
Prediction: [exact statement made]
Forecast probability: [0.0–1.0]
Actual outcome: [1 = prediction confirmed / 0 = prediction did not materialize]
Brier score: [(forecast - actual)²]
Note: [what drove the error, if any]
---
```

---

## Calibration Dashboard — Running State

Maintain this table in this file. Update after each logged prediction:

| Domain | Predictions logged | Mean Brier score | Status |
|--------|-------------------|-----------------|--------|
| Copy (Lena) | 0 | — | Uncalibrated |
| Ads (Rio) | 0 | — | Uncalibrated |
| Growth (Nate) | 0 | — | Uncalibrated |
| Finance (Felix) | 0 | — | Uncalibrated |
| Strategy (Marcus) | 0 | — | Uncalibrated |
| Analytics (Kai) | 0 | — | Uncalibrated |

**Status thresholds:**
- Mean Brier ≤ 0.10: Well-calibrated — confidence levels are reliable
- Mean Brier 0.11–0.20: Acceptable — monitor for drift
- Mean Brier > 0.20: Drift detected — recalibrate confidence thresholds for this domain

---

## Recalibration Protocol

When any domain reaches Brier > 0.20:

1. **Identify the pattern.** Are errors in one direction (over-confident 🔴 that proved 🟡) or random?
2. **Isolate the bias type.** Which bias is Kahneman consistently over- or under-weighting in this domain?
3. **Adjust severity threshold.** If 🔴 blocks in this domain are being overridden by Marcus > 2 times: recalibrate — the domain's threshold for 🔴 was set too low.
4. **Log the adjustment:**
   ```
   [date] — [domain] — recalibration: [what changed and why]
   ```
5. **Mark status as Recalibrating** until 5 new predictions are logged at the new threshold.

---

## Prediction Log

> Kahneman appends entries here as outcomes are confirmed. Never pre-fill.
> Format: see Log Format above.

<!-- entries appended as outcomes are confirmed -->

---

## Verdict Override Log

When Marcus or Stark overrides a 🔴 verdict:

```
---
Date: [YYYY-MM-DD]
Verdict issued: 🔴 — [reason]
Overridden by: Marcus / Stark
Override reason: [what they said]
Recalibration signal: [yes — review threshold / no — edge case, keep threshold]
---
```

Three overrides on the same bias axis = mandatory recalibration of severity threshold for that bias in that domain.

<!-- entries appended as overrides occur -->
