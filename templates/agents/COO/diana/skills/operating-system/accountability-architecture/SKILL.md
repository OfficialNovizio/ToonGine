---
name: accountability-architecture
description: Sandberg's accountability system for YVON. Every metric has one named owner. Every miss triggers a post-mortem. No exceptions, no shared ownership, no blame — just process.
version: 1.0.0
---

## Purpose

Accountability without blame. Sandberg built Facebook's revenue machine on this principle — every number had one person responsible, every failure had a process fix, not a person to punish.

Diana runs this system across every agent, every KPI, every sprint in YVON.

---

## The Three Rules

**Rule 1 — One owner per metric, always.**
Every KPI in the Operational KPIs table has exactly one named agent responsible for movement.
If the owner is unclear → Diana names one before proceeding.
If ownership is shared → Diana splits the metric until each piece has one owner.

**Rule 2 — Every miss triggers a post-mortem.**
A miss is: any KPI that moved in the wrong direction, any task that slipped its deadline, any sprint that didn't ship.
The post-mortem runs within 48 hours of the miss being identified.
The post-mortem finds the process failure, not the guilty agent.

**Rule 3 — Process fix, not reminder.**
A post-mortem that ends with "we'll be more careful next time" is a failed post-mortem.
Every post-mortem must end with a specific process change that makes the same failure structurally impossible.

---

## Ownership Map (YVON)

Diana maintains this map. Update after every sprint review or agent change.

| KPI | Owner | Cadence |
|-----|-------|---------|
| Novizio Instagram followers | Lena | Weekly |
| Novizio IG engagement rate | Lena / Kai | Weekly |
| Novizio website sessions | Kai | Monthly |
| Hourbour MRR | Felix | Monthly |
| Hourbour DAU/MAU | Raj | Monthly |
| Hourbour trial-to-paid | Rio | Monthly |
| CEO Brief delivery (100%) | Diana (Cron) | Daily |
| Social data freshness | Kai | Weekly |
| Sprint on-time delivery | Diana | Per sprint |
| Build passing (npm run build) | Quinn | Per deploy |

---

## Post-Mortem Protocol (runs on every miss)

### Step 1 — Name the miss precisely
- What was supposed to happen? (target)
- What actually happened? (result)
- By how much did it miss? (delta)
- When was it detected?

### Step 2 — Timeline reconstruction
Walk back from the miss: what was the sequence of events that led here?
Do not skip steps. The root cause is almost never the last thing that happened.

### Step 3 — Root cause (5 Whys)
Ask "why" five times.
Stop when you reach a process gap, a missing system, or an unclear ownership — not when you reach a person.

Example:
- Why did the brief not send? → The Cron job failed
- Why did the Cron fail? → The API route timed out
- Why did it time out? → No timeout handling was set
- Why was no timeout set? → No standard was defined for API routes
- Root cause: No timeout standard → Fix: add to ARCHITECTURE.md, enforce in Quinn's review

### Step 4 — Process fix
Name the specific change that makes this structurally impossible going forward.
Format: "If [trigger], then [system response] — owned by [agent] — done by [date]"

### Step 5 — Log it
Add to Diana's MEMORY.md Never Again section.
Add the process fix to the relevant agent's workflow or OPERATIONS-PRINCIPLES.md.

---

## Weekly Accountability Check

Every Monday, before sprint tasks begin, Diana runs:
1. Pull all KPI owners — did every owner report their metric?
2. Any misses since last Monday?
3. Are all post-mortems from the last 7 days complete?
4. Any ownership gaps (metrics with no named owner)?

Surface findings to Marcus in the ops section before any new task is started.
