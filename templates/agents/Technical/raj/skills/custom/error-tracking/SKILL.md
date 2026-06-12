---
name: error-tracking
description: SOURCE OF TRUTH for YVON's structured error log format. Raj implements this in every route. Quinn's error-log-audit verifies compliance with this standard. Covers log format, error classification, HTTP status code rules, and no-PII policy.
version: 1.0.0
---

## Purpose

YVON's routes have 60+ API endpoints across two ventures. Without a consistent error format, debugging a production issue means parsing different log shapes from different routes. This skill defines the one format every route uses — making Vercel logs parseable, Quinn's audit reliable, and production debugging fast.

**This is the source of truth.** Quinn's `error-log-audit` skill references this file. If they conflict, update this file and sync Quinn's skill.

---

## Structured Error Log Format

Every route error MUST follow this shape before logging:

```typescript
interface YVONErrorLog {
  type: 'route_error' | 'auth_error' | 'db_error' | 'external_api_error' | 'validation_error'
  route: string          // '/api/[exact-route-name]'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  message: string        // user-safe message only — NOT err.message
  venture_slug: string   // context for multi-venture debugging, not PII
  timestamp: string      // new Date().toISOString()
  // NEVER include: stack trace, err.message, API keys, email, name, payment info
}
```

**Implementation:**
```typescript
function logError(error: Partial<YVONErrorLog>) {
  console.error(JSON.stringify({
    type: error.type ?? 'route_error',
    route: error.route,
    method: error.method,
    message: error.message ?? 'An error occurred.',
    venture_slug: error.venture_slug ?? 'unknown',
    timestamp: new Date().toISOString()
  }))
}
```

---

## Error Classification

| Error type | When to use | Log level |
|-----------|------------|-----------|
| `validation_error` | Zod parse failed, bad input | `console.warn` (INFO) |
| `auth_error` | getUser() failed, session expired | `console.warn` (INFO) |
| `route_error` | Unexpected error in handler | `console.error` (ERROR) |
| `db_error` | Supabase query failed | `console.error` (ERROR) |
| `external_api_error` | Apify, YouTube, GA4 failure | `console.warn` (WARN) |

`4xx` errors → WARN (client caused this, not our bug)
`5xx` errors → ERROR (our system failed)

---

## HTTP Status Code Rules

| Scenario | Status | Notes |
|----------|--------|-------|
| Zod validation failed | `400` | Bad Request |
| Missing or invalid auth | `401` | Unauthorized |
| Authenticated, not authorized | `403` | Forbidden (wrong venture, wrong role) |
| Resource not found | `404` | Not Found |
| Rate limit exceeded | `429` | + `Retry-After` header required |
| Unexpected server error | `500` | Internal Server Error |
| Dependency unavailable (DB, external API) | `503` | + `Retry-After: 5` header |

**Non-negotiable:** Never return `200` with an error body. Never return `500` for a client input error. Never return `401` for an authorization failure (that's `403`).

---

## No-PII Rule

**Never log:**
- Email addresses
- Full names
- Phone numbers
- Payment or financial data
- Session tokens or auth tokens
- Raw API keys or secrets
- IP addresses (in logs — rate limiting uses IP but doesn't log it)

**Acceptable to log:**
- `user_id` (UUID only — not email, not name)
- `venture_slug`
- `route` and `method`
- HTTP status code
- A generic user-safe message string

---

## Route Error Template

```typescript
export async function POST(req: NextRequest) {
  const ventureSlug = req.headers.get('x-venture-slug') ?? 'unknown'

  try {
    // ... handler logic
  } catch (err) {
    logError({
      type: 'route_error',
      route: '/api/[route-name]',
      method: 'POST',
      message: 'An unexpected error occurred.',
      venture_slug: ventureSlug
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
```

---

## Supabase Error Template

```typescript
const { data, error } = await supabase.from('table').select('...')
if (error) {
  logError({
    type: 'db_error',
    route: '/api/[route-name]',
    method: 'GET',
    message: 'Database query failed.',
    venture_slug: ventureSlug
  })
  return NextResponse.json(
    { error: 'Service temporarily unavailable. Please try again.' },
    { status: 503, headers: { 'Retry-After': '5' } }
  )
}
```

---

## External API Error Template

```typescript
try {
  const result = await apifyClient.actor('...').call(input)
} catch (err) {
  logError({
    type: 'external_api_error',
    route: '/api/competitor',
    method: 'POST',
    message: 'External data service unavailable.',
    venture_slug: ventureSlug
  })
  // Return cached data if available, or degraded state
  return NextResponse.json(
    { data: cachedData ?? null, degraded: true, error: 'Using cached data — live data temporarily unavailable.' },
    { status: cachedData ? 200 : 503 }
  )
}
```
