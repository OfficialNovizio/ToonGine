---
name: api-security-checklist
description: Dev's behavioral gate before approving any new /api/ route. 8-item checklist — any failure blocks the route from shipping. Covers input validation, auth, API key exposure, CRON_SECRET, CORS, SQL injection, cookie security (HTTP-only server-side only), and error response shape.
version: 1.0.0
---

## Purpose

Dev's architecture approval role means a missed security issue in review becomes a production vulnerability. This checklist runs before Dev issues APPROVED on any new or modified `/api/` route. Not a reference document — an active gate.

---

## The 8-Item Gate

Run all 7 before issuing any verdict. Any failure = BLOCKED until fixed.

**1. Input Validation**
- Is all request body, query param, and path param input parsed through a Zod schema before any handler logic?
- No `any` casting, no manual type assertions, no `as SomeType` on unvalidated data?

**2. Authentication**
- Does the route call `supabase.auth.getUser()` (not `auth.getSession()`)?
- Does unauthenticated return `401` — not `500`, not `200`, not a redirect?
- Is the user object from `auth.getUser()` used — never `body.userId` or `params.userId` as the identity source?

**3. API Key Exposure**
- Are ALL external API keys accessed via `process.env` server-side only?
- Zero keys in `NEXT_PUBLIC_` env vars?
- Zero keys in any client component, hook, or `'use client'` file?

**4. CRON_SECRET**
- If this is a cron route (`/api/cron/*`): does the handler validate `Authorization: Bearer ${CRON_SECRET}` as the FIRST line before ANY other code runs?
- Validation failure → immediate `401` return, no side effects executed?

**5. CORS**
- Is `Access-Control-Allow-Origin` set appropriately for this route?
- No wildcard `*` on authenticated or sensitive data endpoints?

**6. Parameterized Queries**
- Zero string interpolation in Supabase `.rpc()` calls or raw SQL?
- All dynamic values passed as parameters — never concatenated into query strings?

**7. Cookie Security**
- Are ALL cookies set server-side only — never from client components?
- Do all cookies have `httpOnly: true`, `secure: true`, `sameSite: 'lax'` flags set?
- Is `yvon_active_venture` read from server-side `cookies()` only — never from `document.cookie` or client-side cookie utilities?
- Zero cookies without explicit `maxAge` (no indefinite sessions)?

**8. Error Response Shape**
- Does every error path return `{ error: 'user-safe message' }` only?
- Zero `error.message` passthrough, zero stack traces, zero internal route names or DB schema info in the response body?
- Correct HTTP status codes used: 400, 401, 403, 404, 429, 500, 503 — never `200` on failure?

---

## Verdict Format

```
API Security Gate: PASSED / FAILED
Failed items: [list]
Required fix before approval: [exact correction]
```

Three or more failures on the same route pattern → add the pattern to Dev's MEMORY.md "Rejected Patterns" section.
