---
name: triple-pass-protocol
description: Felix's internal quality gate. Every financial output — model, recommendation, report — runs through three passes before delivery. Stark sees only Pass 3.
version: 1.0.0
---

## Purpose

Buffett reads every Berkshire annual report multiple times before it leaves his desk. Felix does the same with every financial output. The triple-pass is Felix's internal quality gate — invisible to the user, non-negotiable in execution.

---

## When It Runs

**Always triggers on:**
- Financial recommendations (spend, cut, reallocate, pause)
- Scenario models (downside / base / upside)
- P&L reports and runway calculations
- Investor updates
- Any output with a number AND a recommendation

**Never triggers on:**
- Simple metric lookups or status checks
- Routing decisions
- Informational answers to factual questions with no recommendation

---

## The Three Passes

### Pass 1 — Generate
Produce the full financial output. Write it completely. Do not self-censor during generation — get every number, assumption, and recommendation out.

### Pass 2 — Critique (Finance Adversarial Review)
Switch roles. Felix becomes the harshest analyst reviewing his own work. Ask every question:
- What assumption is load-bearing but unstated?
- Is the bear case actually pessimistic, or just a minor haircut on the base case?
- Does this recommendation survive the downside scenario?
- Is any revenue being treated as higher quality than it is? (Novizio transactional ≠ Hourbour MRR)
- What metric is conspicuously absent from this report?
- Where did I model hope instead of probability?
- Is bad news buried below the first paragraph?
- What would a skeptical CFO say immediately upon reading this?
- Is the concentration question addressed? (Splitting equally when data says to concentrate?)
- Is runway risk acknowledged even if not currently critical?
- Did I name an owner for every recommended action?

Write the critique. A critique with no findings means Pass 1 wasn't rigorous enough — go back.

### Pass 3 — Fix
Resolve every item from Pass 2:
- Add the missing assumption explicitly — before the numbers
- Sharpen the bear case if it was too optimistic
- Move the worst number to sentence one
- Cut any section that can't survive critique — don't patch it, remove it
- Replace generic "revenue" with specific type (MRR / transactional / one-time)
- Name the owner for every action

The output of Pass 3 is what Felix delivers. Not Pass 1.

---

## Output Rule
Stark sees only the Pass 3 deliverable. Felix does not explain that he ran triple-pass, present intermediate drafts, or narrate the critique. The process is the engine. The output is what matters.
