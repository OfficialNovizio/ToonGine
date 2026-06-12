---
name: security-test-checklist
description: Quinn's security gate checklist — runs before issuing any APPROVED verdict. Covers auth bypass, cross-venture isolation, rate limiting, client bundle key scan, XSS, RLS spot-check, and CORS verification. Any failure = BLOCKED.
version: 1.0.0
---

## Purpose

A feature that passes functional QA but has a security hole is not ready to ship. Quinn is the last gate before Dev merges — which means Quinn is also the last check that catches security failures before they reach production. This checklist runs before every APPROVED verdict, no exceptions.

---

## The Checklist

Run all items. Check "N/A" only if the item genuinely doesn't apply to this feature (e.g., no auth routes = auth tests N/A). Never skip without stating why.

---

### Authentication Tests

- [ ] **Unauthenticated access** — Send an unauthenticated request to every protected endpoint this feature uses. Expected: `401`. Actual: ___
- [ ] **Expired session** — Use an expired or invalid token. Expected: `401` with clear message. Actual: ___
- [ ] **Invalid token** — Use a malformed JWT. Expected: `401`. Actual: ___
- [ ] **Auth failure response** — Confirm the 401 body contains only a generic message. No stack trace, no route name, no DB schema info.

---

### Cross-Venture Isolation Tests

- [ ] **Venture A → Venture B data** — Authenticate as a Novizio user; attempt to access Hourbour-specific data (change the `yvon_active_venture` cookie or `x-venture-slug` header). Expected: `403` or data scoped to correct venture only.
- [ ] **Cookie tampering** — Manually change the `yvon_active_venture` cookie value to another venture slug. Expected: data remains scoped to the authenticated venture, not the tampered cookie value.

---

### Rate Limiting Tests

- [ ] **AI route threshold** — Send > 20 requests in 60 seconds to any AI endpoint this feature uses. Expected: `429` status with `Retry-After` header.
- [ ] **Rate limit response body** — Confirm the 429 body contains a user-safe message only. No internal route structure exposed.
- [ ] **Retry-After header present** — Confirm `Retry-After` header is included in the 429 response.

---

### Client Bundle Security

- [ ] **API key scan** — After `npm run build`, search the `.next/static` output for any private API key strings (Anthropic, Apify, YouTube, Supabase service role). Expected: zero results.
  ```bash
  grep -r "ANTHROPIC\|APIFY\|SERVICE_ROLE" .next/static/ 2>/dev/null
  ```
- [ ] **NEXT_PUBLIC_ audit** — Review all `NEXT_PUBLIC_*` vars in `.env.local`. Confirm none contain secrets, API keys, or credentials.

---

### XSS Tests

- [ ] **Script injection** — Submit `<script>alert('xss')</script>` in every user-input field this feature exposes. Expected: script does not execute in the browser; content is rendered as text or rejected.
- [ ] **Event handler injection** — Submit `"><img src=x onerror=alert(1)>` in text inputs. Expected: no alert, content rendered safely.
- [ ] **SQL injection string** — Submit `'; DROP TABLE users; --` in any search or filter field. Expected: safe error response, no crash, no DB error exposed to client.

---

### RLS Spot-Check (if new tables or queries introduced)

- [ ] **Anonymous DB access** — If this feature introduced a new Supabase table or query, test accessing it without auth. Expected: blocked by RLS policy, zero rows returned.
- [ ] **Wrong venture access** — Test querying the new table with a different venture_slug. Expected: zero rows returned (RLS scoping enforced).

---

### CORS Check

- [ ] **CORS headers** — Check the `Access-Control-Allow-Origin` header on all API endpoints this feature introduces or modifies. Expected: no `*` on authenticated endpoints; origin scoped to YVON's domain.

---

### Error Response Audit (with error-log-audit skill)

- [ ] **Load `skills/custom/error-log-audit/SKILL.md`** and run its checklist against this feature's API routes.

---

## Verdict

If ANY item fails (not N/A) → **BLOCKED**. Document exactly which test failed, what was expected, and what was returned.

```
Security test result: PASSED / FAILED
Failed items:
  - [test name]: expected [X], got [Y]
Fix required: [specific change needed in which file]
```

Three or more security failures on the same feature → flag to Dev as a pattern issue, not just a bug list.
