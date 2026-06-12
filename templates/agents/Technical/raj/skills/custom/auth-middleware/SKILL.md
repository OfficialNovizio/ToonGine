---
name: auth-middleware
description: Authentication implementation patterns for YVON's API routes. Covers createServerClient pattern, getUser vs getSession, HTTP-only cookie rule (ALL cookies server-side only), venture-scoped auth, session expiry, and role-based route protection.
version: 1.1.0
---

## Purpose

Auth mistakes are the most common source of security vulnerabilities in YVON's routes. Using the wrong Supabase client, trusting client-supplied user IDs, or exposing cookies to client JavaScript are all patterns that create security holes. This skill makes the correct pattern the default.

---

## Hard Rule — All Cookies Are HTTP-Only, Server-Side Only

**No cookie in YVON is ever set from a client component. No exceptions.**

| Cookie | Set by | Readable by client JS? |
|--------|--------|------------------------|
| Supabase auth session | `createServerClient` (Raj, server) | ❌ Never |
| `yvon_active_venture` | `/api/venture/set` route (Raj, server) | ❌ Never |
| Any future session cookie | Server-side API route only | ❌ Never |

**Why:** Client-readable cookies are vulnerable to XSS. If any script on the page can read `document.cookie`, a single XSS injection can steal the session token, the venture context, and any other state stored there. HTTP-only cookies are invisible to JavaScript — even if XSS fires, the attacker gets nothing.

**Implication for Mia:** Mia's components cannot read `yvon_active_venture` via `document.cookie` or any client-side cookie utility. Venture context must arrive as Server Component props (passed from a Server Component that reads the cookie server-side) or from a `/api/venture/current` route call.

```typescript
// CORRECT — Server Component reads cookie server-side, passes as prop
// app/screens/analytics/page.tsx (Server Component)
import { cookies } from 'next/headers'

export default async function AnalyticsPage() {
  const ventureSlug = cookies().get('yvon_active_venture')?.value ?? 'novizio'
  return <AnalyticsClient ventureSlug={ventureSlug} />
}

// NEVER — client component reads cookie directly
// 'use client'
// const ventureSlug = document.cookie  ← XSS vector
// const ventureSlug = Cookies.get('yvon_active_venture')  ← exposes cookie to JS
```

---

## Setting Cookies — Server-Side Only

All cookie writes go through API routes using `NextResponse` with explicit security flags:

```typescript
// /api/venture/set/route.ts — venture switcher
export async function POST(req: NextRequest) {
  const { ventureSlug } = await req.json()

  const response = NextResponse.json({ success: true })

  response.cookies.set('yvon_active_venture', ventureSlug, {
    httpOnly: true,        // not readable by JavaScript
    secure: true,          // HTTPS only
    sameSite: 'lax',       // CSRF protection
    path: '/',
    maxAge: 60 * 60 * 24 * 30  // 30 days
  })

  return response
}
```

**Required flags for every cookie Raj sets:**

| Flag | Value | Why |
|------|-------|-----|
| `httpOnly` | `true` | Blocks JS access — XSS can't steal it |
| `secure` | `true` | HTTPS only — never sent over HTTP |
| `sameSite` | `'lax'` | CSRF protection — cookie not sent on cross-site POST |
| `path` | `'/'` | Scoped to whole app |
| `maxAge` | explicit value | No indefinite sessions |

---

## Standard Authenticated Route

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // 1. Always createServerClient with cookies — never createClient()
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )

  // 2. Always getUser() — never getSession() (session can be stale/forged)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Use user.id from getUser() — NEVER body.userId, params.userId, or headers
  const userId = user.id

  // 4. Proceed with handler
  // ...
}
```

---

## getUser vs getSession — Why It Matters

| Method | What it does | Use? |
|--------|-------------|------|
| `auth.getUser()` | Re-validates the JWT with Supabase Auth server | ✅ Always use this |
| `auth.getSession()` | Returns the session from the cookie — does NOT re-validate | ❌ Never for auth checks |

`getSession()` trusts the cookie value as-is. A malformed or replayed cookie passes. `getUser()` hits the Auth server every time — correct.

---

## Session Expiry Handling

```typescript
const { data: { user }, error } = await supabase.auth.getUser()

if (error?.status === 401) {
  return NextResponse.json(
    { error: 'Session expired. Please log in again.' },
    { status: 401 }
  )
}

if (error) {
  return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 })
}
```

**Rule:** Auth failure always returns `401`. Never `500`. Never a redirect in an API route.

---

## Venture-Scoped Authentication

```typescript
// After user is validated — read venture from HTTP-only cookie server-side
const ventureSlug = cookieStore.get('yvon_active_venture')?.value

if (!ventureSlug) {
  return NextResponse.json(
    { error: 'Venture context required.' },
    { status: 400 }
  )
}

// Verify user has access to this venture
const { data: access } = await supabase
  .from('venture_access')
  .select('role')
  .eq('user_id', user.id)
  .eq('venture_slug', ventureSlug)
  .single()

if (!access) {
  return NextResponse.json(
    { error: 'Access to this venture is not permitted.' },
    { status: 403 }
  )
}
```

**Note:** `ventureSlug` always comes from the server-side `cookieStore`, never from `req.headers.get('x-venture-slug')` or the request body. The client cannot fake venture context because the cookie is HTTP-only.

---

## Role-Based Route Protection

```typescript
const userRole = access.role  // 'admin' | 'viewer' | 'editor'

if (userRole !== 'admin' && req.method === 'DELETE') {
  return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 })
}
```

| Scenario | Status |
|----------|--------|
| Not logged in | `401` |
| Logged in, wrong venture | `403` |
| Logged in, insufficient role | `403` |
| Venture not found | `404` |

---

## Common Mistakes Checklist

- [ ] Never use `createClient()` in API routes — always `createServerClient()` with cookie pattern
- [ ] Never use `auth.getSession()` — always `auth.getUser()`
- [ ] Never trust `body.userId` — always `user.id` from `auth.getUser()`
- [ ] Never set cookies from client components — always server-side API routes with full security flags
- [ ] Never set a cookie without `httpOnly: true`, `secure: true`, `sameSite: 'lax'`
- [ ] Never read `yvon_active_venture` from `document.cookie` — server-side `cookies()` only
- [ ] Session expiry → `401`, not `500`
- [ ] Wrong venture → `403`, not `401`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` server-side only — never bypasses RLS unintentionally
