---
name: rate-limiting
description: Rate limiting implementation for YVON using Vercel Edge Middleware. Covers per-route limits, sliding window pattern, 429 response format, and Supabase-based fallback. No Upstash — not in YVON's stack.
version: 1.0.0
---

## Purpose

Without rate limiting, YVON's AI routes (`/api/team-chat`, `/api/*-agent`) can be exhausted by a single client making rapid requests — burning Anthropic API credits and degrading response quality for all users. This skill defines what Raj implements and how.

---

## Per-Route Limits

| Route category | Limit | Window |
|---------------|-------|--------|
| AI routes (`/api/team-chat`, `/api/*-agent`, `/api/creative-engine`) | 20 req/min | per IP |
| Data routes (`/api/analytics`, `/api/competitor`, `/api/social`) | 60 req/min | per IP |
| Auth routes | 10 req/min | per IP |
| Cron routes | 1 req/min | enforced by Vercel schedule, not middleware |

---

## Required 429 Response

```typescript
return NextResponse.json(
  { error: 'Rate limit exceeded. Please wait before retrying.' },
  {
    status: 429,
    headers: {
      'Retry-After': '60',
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 60)
    }
  }
)
```

Never return `200` or `500` for a rate limit. Always `429` with `Retry-After`.

---

## Implementation: Vercel Edge Middleware (Primary)

`middleware.ts` at project root — runs on Edge before the route handler:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const RATE_LIMITS: Record<string, { limit: number; window: number }> = {
  '/api/team-chat': { limit: 20, window: 60 },
  '/api/creative-engine': { limit: 20, window: 60 },
  '/api/analytics': { limit: 60, window: 60 },
}

// Sliding window using Edge runtime — in-memory per Edge instance
// Resets on cold start (acceptable — degrades gracefully, doesn't block)
const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const config = Object.entries(RATE_LIMITS).find(([route]) => pathname.startsWith(route))

  if (!config) return NextResponse.next()

  const [, { limit, window: windowSec }] = config
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  const key = `${ip}:${pathname}`
  const now = Date.now()

  const entry = requestCounts.get(key)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return NextResponse.next()
  }

  if (entry.count >= limit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before retrying.' },
      { status: 429, headers: { 'Retry-After': String(windowSec) } }
    )
  }

  entry.count++
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/team-chat', '/api/creative-engine', '/api/analytics/:path*']
}
```

---

## Implementation: Supabase Fallback (when Edge KV not available)

For persistent rate limiting across Edge instances, use a Supabase `rate_limits` table:

```sql
CREATE TABLE rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT NOT NULL,
  route TEXT NOT NULL,
  venture_slug TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(ip, route, venture_slug, window_start)
);
```

```typescript
// In route handler — check before processing
const windowStart = new Date(Math.floor(Date.now() / 60000) * 60000) // 1-minute bucket

const { data: rateEntry } = await supabase
  .from('rate_limits')
  .upsert({
    ip: clientIp,
    route: '/api/team-chat',
    venture_slug: ventureSlug,
    window_start: windowStart.toISOString(),
    request_count: 1
  }, {
    onConflict: 'ip,route,venture_slug,window_start',
    ignoreDuplicates: false
  })
  .select('request_count')
  .single()

if (rateEntry && rateEntry.request_count > 20) {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Please wait before retrying.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  )
}
```

---

## Raj's Implementation Checklist

Before submitting a rate-limited route for Dev review:
- [ ] Route is in the middleware matcher config
- [ ] 429 response includes `Retry-After` header
- [ ] IP extraction handles `x-forwarded-for` (Vercel header)
- [ ] Venture_slug is included in the rate limit key (Novizio and Hourbour have separate quotas)
- [ ] Cron routes are NOT in middleware (they're protected by CRON_SECRET, not IP limits)
