---
name: acceptance-criteria
description: Diana's AC writing standard — absorbed from Priya (PM). Defines the binary pass/fail format Quinn uses for QA sign-off. Covers AC structure, definition of done, edge case coverage, and the pre-build AC review gate.
version: 1.0.0
---

## Purpose

Diana absorbed Priya's PM responsibilities on 2026-04-01. Writing acceptance criteria is now Diana's job. AC is the contract between what gets built and what Quinn tests. Vague AC produces vague QA. This skill defines the format Quinn expects and Diana must deliver.

**Hard rule:** Quinn does not start QA without written AC. Diana does not hand off to Dev/Raj/Mia without written AC. AC is written before implementation begins — never after.

---

## AC Format — Binary Pass/Fail

Every AC item must be binary. A tester must be able to answer "did this pass?" with yes or no — no judgment calls.

```
Feature: [feature name]
Venture: [Novizio / Hourbour / Both]

AC-01: [Binary condition — present tense, observable]
AC-02: [Binary condition]
AC-03: [Binary condition]
...

Edge cases covered:
- AC-E1: [Edge case condition]
- AC-E2: [Edge case condition]

Definition of Done:
- [ ] All AC items pass
- [ ] npx tsc --noEmit: zero errors
- [ ] npm run lint: zero warnings
- [ ] Tested on mobile viewport
- [ ] Empty state handled
- [ ] Error state handled
- [ ] Loading state handled
```

---

## Writing Good AC Items

**Good AC (binary, observable):**
- "When a user submits the form with an empty email field, an inline error message appears below the email input."
- "The analytics dashboard loads within 3 seconds on a standard connection."
- "Switching ventures via the VentureSwitcher updates all dashboard data within one page reload."

**Bad AC (requires judgment, not binary):**
- "The UI looks good" — not testable
- "Performance is acceptable" — no threshold
- "The form works correctly" — too vague

**Rule:** If Quinn would have to make a judgment call to determine pass/fail, rewrite the AC.

---

## Required AC Sections for Every Feature

### 1. Functional AC (what the feature does)
Every stated requirement from the task spec becomes at least one AC item.

### 2. Auth & Security AC (if route or data is involved)
- "Unauthenticated request to [endpoint] returns 401."
- "Venture A user cannot access Venture B data."

### 3. Edge State AC (always required)
- Empty state: "When no data exists, the [component] shows [specific empty state message]."
- Error state: "When the API returns an error, the [component] shows [specific error message]."
- Loading state: "While data is loading, a skeleton/spinner is displayed."

### 4. Mobile AC (always required)
- "The [feature] is fully functional at 375px viewport width."

---

## Pre-Build AC Review Gate

Before handing off to Dev/Raj/Mia, Diana runs this check:

- [ ] Every AC item is binary — yes/no testable
- [ ] Every item in the task spec maps to at least one AC
- [ ] Auth/security AC present (if applicable)
- [ ] All three edge states covered: empty, error, loading
- [ ] Mobile tested AC present
- [ ] Definition of Done checklist complete
- [ ] Venture scope is explicit (Novizio / Hourbour / Both)

If any item fails: rewrite before handoff. Never send ambiguous AC to Dev — ambiguous AC is a bug factory.

---

## Handoff Format

When Diana hands off AC to the team:

```
Task: [task name]
Venture: [scope]
DRI: [who builds it — Raj / Mia / both]
AC document: [paste full AC here]
Definition of Done: [checklist]
Quinn QA: starts when DRI marks READY FOR QA in chat
```
