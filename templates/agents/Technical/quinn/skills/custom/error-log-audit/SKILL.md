---
name: error-log-audit
description: Quinn's error log audit procedure. References Raj's error-tracking skill as the SOURCE OF TRUTH for YVON's log format. Audits HTTP status correctness, no-PII compliance, structured format compliance, Vercel log review, and UI error state coverage.
version: 1.0.0
---

## Purpose

A feature that handles errors incorrectly produces two types of failures: security failures (stack traces exposed to users, PII in logs) and UX failures (500s where 400s belong, missing UI error states, no user-facing message). Quinn's error log audit catches both before APPROVED is issued.

**Source of truth:** Load `../../../raj/skills/custom/error-tracking/SKILL.md` first. That file defines YVON's standard error log format. This skill audits compliance with it — if they conflict, update Raj's file and sync this one.

---

## Pre-Audit Step

Before running this checklist:
1. Load `../../../raj/skills/custom/error-tracking/SKILL.md` — read the structured log format
2. Open Vercel function logs for the feature's API routes
3. Trigger at least one error path for each route (bad input, missing auth, dependency timeout if possible)

---

## The Audit Checklist

### HTTP Status Code Correctness

- [ ] **No 200 on failure** — Search responses for any `200` status code returned when an error occurred. Any found → BLOCKED.
- [ ] **Zod validation failures → 400** — Submit invalid input to each endpoint. Expected: `400 Bad Request`. Actual: ___
- [ ] **Missing auth → 401** — Unauthenticated request. Expected: `401`. Actual: ___
- [ ] **Wrong venture/role → 403** — Authenticated but unauthorized. Expected: `403`. Actual: ___
- [ ] **Resource not found → 404** — Request a non-existent resource. Expected: `404`. Actual: ___
- [ ] **Rate limit → 429** — Covered by security-test-checklist, but confirm `Retry-After` is present.
- [ ] **Dependency down → 503** — If feasible to test (mock or simulate): expected `503` with `Retry-After: 5`. Actual: ___
- [ ] **Unexpected errors → 500** — Any unhandled runtime error. Expected: `500` with generic message. Actual: ___

### Log Format Compliance

Compare actual Vercel logs against Raj's `error-tracking` format:

- [ ] **`type` field present** — `route_error | auth_error | db_error | external_api_error | validation_error`
- [ ] **`route` field present** — Exact path: `/api/[route-name]`
- [ ] **`method` field present** — `GET | POST | PUT | DELETE | PATCH`
- [ ] **`message` field is user-safe** — No raw `err.message` passthrough, no stack trace fragments
- [ ] **`timestamp` field present** — ISO 8601 format
- [ ] **`venture_slug` field present** — Multi-venture context for debugging

### No-PII in Logs

- [ ] **No email addresses** — Grep Vercel logs for `@` patterns in log entries
- [ ] **No full names** — Log messages reference `user_id` (UUID) only, not user names
- [ ] **No payment/financial data** — No card numbers, amounts, or account identifiers
- [ ] **No session tokens or API keys** — Grep logs for common key patterns (`sk-`, `Bearer `, long hex strings)

### UI Error State Coverage

- [ ] **Every route failure has a UI error state** — For each API route this feature uses: trigger a failure, verify the component shows a user-facing error message (not a blank screen, not a spinner that never resolves)
- [ ] **Error messages are generic** — User-facing error messages don't expose route names, stack traces, or technical details
- [ ] **Error states are dismissible or actionable** — User can retry, go back, or understand what to do next

### Vercel Log Review

- [ ] **No unexpected 500s in deploy** — After deploying the feature branch, review Vercel logs for any 500 errors that weren't triggered by a test
- [ ] **No 5xx that should be 4xx** — A `500` caused by invalid user input is a bug — it should be `400`. Flag any found.
- [ ] **External API failures handled** — If the feature calls Apify, YouTube, or GA4: confirm their failures produce `503` + degraded state, not `500`

---

## Verdict

If any item fails → **BLOCKED** with the specific log entry or response that failed.

```
Error log audit: PASSED / FAILED
Failed items:
  - [check name]: [what was found vs what was expected]
Fix required: [file and specific change]
```

Any log containing PII or a raw API key → immediate BLOCKED regardless of other results. Flag to Dev and Raj immediately — not just in the QA report.
