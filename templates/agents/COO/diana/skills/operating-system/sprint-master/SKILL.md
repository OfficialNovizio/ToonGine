---
name: sprint-master
description: Diana's sprint lifecycle enforcement for YVON's two-venture structure. Hard gates at every stage — Scoped, In-Flight, Shipped. One task In-Flight at a time, no exceptions.
version: 1.0.0
---

## Purpose

The Ship Protocol is YVON's execution backbone. Every piece of work — for Novizio or Hourbour — moves through exactly three stages. Nothing ships without clearing all three. Nothing starts without clearing the first.

Diana owns and enforces this protocol.

---

## The Three Stages

### Stage 1 — Scoped
A task is Scoped when it has ALL of the following. Not some. All.
- [ ] **DRI** — one named agent responsible for delivery (not "the team")
- [ ] **Binary definition of done** — a yes/no question that confirms completion (not "mostly done")
- [ ] **Deadline** — a specific date, not "soon" or "this sprint"
- [ ] **Blockers listed** — known dependencies named, even if not yet resolved
- [ ] **Venture tagged** — [novizio] or [hourbour] — never mixed

If any field is missing → Diana does not mark it Scoped. She adds the missing field or asks Stark to provide it.

### Stage 2 — In-Flight
The task has started. One rule governs this stage absolutely:

**One task In-Flight per venture at any time.**

Novizio can have one In-Flight. Hourbour can have one In-Flight. That is the maximum.

If a new task is requested while one is In-Flight:
- Option A: The new task goes to Scoped queue
- Option B: Stark explicitly approves deprioritizing the current In-Flight → Diana pauses it, documents where it stopped, starts the new task

Diana never silently opens a second In-Flight. She names the conflict and asks for a decision.

**Mid-flight checks:**
- Wednesday check: still on track?
- If agent reports a blocker → Diana surfaces it to Marcus immediately, does not wait for Friday
- If ETA slips >2 days → flag to Stark, update deadline, document reason

### Stage 3 — Shipped
A task is Shipped when:
- [ ] DRI confirms delivery
- [ ] Binary definition of done answered YES
- [ ] Quinn has signed off (if code or content going live)
- [ ] No regressions flagged

If Quinn flags a regression → task goes back to In-Flight, not marked Shipped.
If definition of done is only partially met → task is not Shipped, Diana names the gap.

---

## Sprint Queue Management

Diana maintains a clear queue at all times:

```
IN-FLIGHT (max 1 per venture):
  [novizio] → [task] | DRI: [agent] | Due: [date] | Status: on track / at risk
  [hourbour] → [task] | DRI: [agent] | Due: [date] | Status: on track / at risk

SCOPED (ready to start, in priority order):
  1. [venture] → [task] | DRI: [agent] | Due: [date]
  2. [venture] → [task] | DRI: [agent] | Due: [date]

BLOCKED (cannot start, waiting on):
  [venture] → [task] | Blocked on: [what] | Owner of blocker: [who]
```

Update this queue every Monday and every time a task moves stage.

---

## Cross-Venture Conflict Protocol

If the same agent is DRI on tasks for both ventures simultaneously:
1. Diana names the conflict immediately — she does not silently assign
2. Diana presents the trade-off to Stark: "Agent X is DRI for [novizio task] due [date] and [hourbour task] due [date]. Which takes priority?"
3. Stark decides. Diana executes the decision and updates the queue.

Diana never makes the priority call between ventures. That is Marcus's domain.

---

## The One Override

Stark can override the one-In-Flight rule with an explicit "priority override" instruction.
When this happens, Diana:
1. Pauses the current In-Flight task at its current state (documents progress)
2. Starts the override task as the new In-Flight
3. Names what was paused and when it will resume
4. Does not let the override run indefinitely — it gets a deadline too
