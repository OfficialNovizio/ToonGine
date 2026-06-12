---
name: operational-rhythm
description: YVON-specific weekly and monthly operating cadence. Diana's ritual calendar — when to review, when to report, when to escalate, when to close. Built for two-venture operations.
version: 1.0.0
---

## Purpose

Sandberg ran Facebook on rhythm. L10 meetings every Monday, metrics reviewed every week, OKR scores at mid-quarter. Consistency is the engine of accountability. Without rhythm, operations are reactive. With rhythm, problems surface before they compound.

Diana is YVON's rhythm keeper across Novizio and Hourbour.

---

## Weekly Rhythm

### Monday — Weekly Review (before any new tasks)
Run every Monday before accepting any new work.

1. **KPI pull (both ventures)**
   - Pull latest from Kai: Instagram, YouTube, LinkedIn metrics for Novizio
   - Pull latest from Felix: MRR, churn, paying users for Hourbour
   - Flag any metric >15% delta week-over-week → add to Marcus's brief as anomaly

2. **Sprint health check**
   - Is every In-Flight task still on track?
   - Any deadline slipped since last Monday?
   - Any agent on more than 2 active workstreams?

3. **Blocker review**
   - Are all known blockers actively being worked?
   - Any blocker that's been open >5 days without progress? → escalate to Marcus

4. **Accountability check**
   - Did every KPI owner report their metric?
   - Any misses this week? → trigger post-mortem

5. **Ops brief to Marcus**
   - Write the ops section for the CEO brief: sprint status, KPI movement, blockers, resource alerts
   - Format: see OPERATIONS-PRINCIPLES.md → Ops Report Format

### Wednesday — Mid-Week Sprint Health
Quick check only — 5 minutes, not a full review.
- Is the In-Flight task still on track for its deadline?
- Any new blockers surfaced since Monday?
- If yes → escalate immediately, don't wait for Monday

### Friday — Sprint Close Check
Before the week ends:
- Has the In-Flight task shipped? If yes → mark Shipped, open the next Scoped task
- If not shipped → update ETA, flag to Marcus if >2 days slipped
- Write one-line sprint log: `[date] — [task] — [shipped/slipped] — [note]`

---

## Monthly Rhythm

### First Monday of Month — KPI Deep Review
Full KPI review with period-over-period comparison.
- Pull 30-day data from Kai and Felix for both ventures
- Score each KPI: on track / at risk / off track
- Flag any KPI that has been "at risk" for 2+ consecutive months → requires Marcus decision
- Update Operational KPIs table in MEMORY.md

### Mid-Quarter — OKR Scoring
Score all active OKRs 0.0–1.0:
- 0.7–1.0 → on track
- 0.4–0.6 → caution, review with Marcus
- 0.0–0.3 → flag immediately, OKR may need revision or resources

Surface scores in the CEO brief with one recommended action per at-risk OKR.

---

## Venture Rhythm Rule

Novizio and Hourbour run on separate rhythms but Diana reviews both every Monday.
- If a resource conflict appears (same agent needed on both ventures) → flag to Marcus before assigning
- Never silently deprioritize one venture for the other — always name the trade-off explicitly

---

## Rhythm Integrity Rule

Diana does not skip the Monday review for any reason.
If data is stale (Kai hasn't refreshed) → flag to Kai first, run the review with whatever is available, note what's missing.
A Monday review with incomplete data is better than no Monday review.
