---
name: api-security
description: Raj's implementation-level API security checklist. Runs at build time — before any route is submitted for Dev review. 8 items covering Zod validation, auth, API keys, CRON_SECRET, CORS, parameterized queries, error shape, and HTTP status codes.
version: 1.0.0
---

## Purpose

Dev's `api-security-checklist` is the approval gate. This skill is the build-time equivalent — what Raj self-audits before the route reaches Dev. Running this internally means Dev's review catches architectural issues, not basic security omissions.

---

## The 8-Item Checklist

Run before submitting any route for Dev review. All 8 must pass.

**1. Zod Validation**
```typescript
// Every route that accepts a body
const schema = z.object({
  venture_slug: z.string().min(1),
  // ...
})
const parsed = schema.safeParse(await req.json())
if (!parsed.success) {
  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
const { venture_slug } = parsed.data  // typed, safe
```
- No `any` casting anywhere in the route
- No `as SomeType` on unvalidated data

**2. Authentication**
```typescript
const supabase = createServerClient(...)  // with cookie pattern, not createClient
const { data: { user }, error } = await supabase.auth.getUser()
// NOT auth.getSession() — session can be stale
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// Use user.id from here — NEVER body.userId or params.userId
```

**3. API Key Exposure**
- All keys: `process.env.APIFY_KEY`, `process.env.ANTHROPIC_API_KEY`, etc.
- Zero keys in `NEXT_PUBLIC_*` env vars
- Zero keys referenced in any client component or `'use client'` file

**4. CRON_SECRET Validation**
```typescript
// Must be FIRST in cron route body — before any other code
const authHeader = req.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// Only now proceed with handler logic
```

**5. CORS Headers**
```typescript
// On routes that need CORS — scope to specific origins
headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://yvon.app')
// NEVER: headers.set('Access-Control-Allow-Origin', '*') on authenticated routes
```

**6. Parameterized Queries**
```typescript
// Correct
const { data } = await supabase
  .from('analytics')
  .select('*')
  .eq('venture_slug', ventureSlug)  // parameterized

// NEVER — SQL injection vector
const { data } = await supabase.rpc(`SELECT * FROM analytics WHERE slug = '${ventureSlug}'`)
```

**7. Error Response Shape**
```typescript
// Correct
return NextResponse.json({ error: 'Service unavailable. Please try again.' }, { status: 503 })

// NEVER — exposes internals
return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
```

**8. HTTP Status Codes**
| Scenario | Status |
|----------|--------|
| Invalid input (Zod fail) | `400` |
| Missing/invalid auth | `401` |
| Authenticated, wrong venture | `403` |
| Resource not found | `404` |
| Rate limit exceeded | `429` + `Retry-After` header |
| Server error | `500` |
| Dependency down (Supabase, external API) | `503` + `Retry-After` header |
| **Never** | `200` on failure |

---

## Self-Audit Output

Before submitting for Dev review, state:
```
Security self-audit: PASSED / FAILED
Failed items: [list]
```

Any failure → fix before submitting. Don't submit and hope Dev catches it.
