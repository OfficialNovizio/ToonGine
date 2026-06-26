# BACKEND-PRINCIPLES.md — Raj, Backend Developer

> Load this file before implementing any API route, schema change, or external API integration.

---

## API Route Pattern

Every route handler in `/app/api/*/route.ts` follows this sequence without exception:

```typescript
export async function POST(req: Request) {
  // 1. Parse and validate input
  const body = await req.json()
  const { ventureId, requiredField } = body
  if (!ventureId || !requiredField) {
    return Response.json({ error: 'ventureId and requiredField are required' }, { status: 400 })
  }

  // 2. Load venture context (if needed)
  const venture = await getVentureConfig(ventureId)
  if (!venture) {
    return Response.json({ error: 'Venture not found' }, { status: 404 })
  }

  // 3. Call external API or DB
  try {
    const result = await externalApiCall(venture.handle)

    // 4. Write to Supabase
    await supabase.from('table_name').upsert({ venture_id: ventureId, data: result })

    // 5. Return typed response
    return Response.json({ items: result })
  } catch (err) {
    console.error('[route-name] failed:', err)
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
```

Never skip validation. Never return data without writing to Supabase if persistence is expected.

---

## Supabase Best Practices

### Client Usage

| Context | Import | Why |
|---------|--------|-----|
| Route handlers, Server Components | `createServerClient` from `@supabase/ssr` | Reads cookies correctly in server context |
| Client Components (`'use client'`) | `createBrowserClient` from `@supabase/ssr` | Uses anon key, no service role exposure |

Never use `createClient` from `@supabase/supabase-js` directly in Next.js — use the SSR package wrappers.

### Query Patterns

```typescript
// Upsert (preferred for refresh-type writes)
const { error } = await supabase
  .from('social_stats')
  .upsert({ venture_id: ventureId, platform: 'instagram', data: stats },
           { onConflict: 'venture_id,platform' })

// Insert
const { data, error } = await supabase
  .from('messages')
  .insert({ conversation_id, role: 'user', content })
  .select()
  .single()

// Select with filter
const { data } = await supabase
  .from('briefs')
  .select('*')
  .eq('venture_id', ventureId)
  .order('created_at', { ascending: false })
  .limit(10)
```

Always check `if (error) throw error` or `if (error) return Response.json({ error: error.message }, { status: 500 })`.

### Schema Design Rules

- Every table has `venture_id TEXT NOT NULL` — data is always venture-scoped
- Use `JSONB` for variable-structure data (social platform metrics differ per platform)
- Use `UNIQUE(venture_id, platform)` for refresh tables — enables upsert without duplicates
- Primary keys: `UUID DEFAULT gen_random_uuid()` — never serial integers
- Timestamps: `TIMESTAMPTZ DEFAULT NOW()` — always timezone-aware

---

## External API Integration Patterns

### Apify

```typescript
// 1. Start run
const runId = await apify.startRun(actorId, { handle: igHandle })

// 2. Poll for completion (max 25s)
let status = 'RUNNING'
let attempts = 0
while (status === 'RUNNING' && attempts < 12) {
  await new Promise(r => setTimeout(r, 2000))
  status = await apify.getRunStatus(runId)
  attempts++
}

// 3. Fetch dataset
const items = await apify.getDataset(runId)
```

- Instagram handle must NOT include `@` — strip it before passing
- Poll interval: 2 seconds. Max attempts: 12 (= 24 seconds). If still RUNNING at 25s, return partial data with a warning.
- Vercel function max duration: 30 seconds. Set `export const maxDuration = 30` at top of file.

### YouTube Data API

```typescript
const response = await youtube.channels.list({
  part: ['statistics', 'snippet'],
  id: [channelId]
})
const channel = response.data.items?.[0]
```

- Quota resets midnight PST. 10,000 units/day.
- `channels.list` costs 1 unit. `search.list` costs 100 units — avoid unless necessary.

### Google Analytics (GA4)

```typescript
const client = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_SA_JSON!)
})
const [response] = await client.runReport({
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
  metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
  dimensions: [{ name: 'pagePath' }]
})
```

- Service account email must be added as Viewer on the GA4 property in Google Analytics admin.
- `GOOGLE_SA_JSON` is the full service account JSON as a string.

### Anthropic Claude API (AI in routes)

```typescript
const response = await anthropic.messages.stream({
  model: 'claude-haiku-4-5-20251001', // or sonnet — check SKILLS.md model table
  max_tokens: 1024,
  system: systemPrompt,
  messages: [{ role: 'user', content: userMessage }]
})
```

For SSE routes: use `messages.stream()` and pipe to `ReadableStream`. For non-streaming: use `messages.create()`.

---

## Error Handling Hierarchy

| Error type | HTTP status | Response body |
|-----------|------------|---------------|
| Missing required field | 400 | `{ "error": "fieldName is required" }` |
| Invalid venture / resource not found | 404 | `{ "error": "Venture not found" }` |
| External API rate limit / quota | 429 | `{ "error": "Rate limit reached. Try again later." }` |
| External API timeout | 504 | `{ "error": "External service timed out" }` |
| Internal/unknown error | 500 | `{ "error": "Failed to [action]" }` |

Never leak raw error messages or stack traces to the client. Log with `console.error('[route] failed:', err)` and return a clean message.

---

## Vercel Cron Setup

In `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/trending", "schedule": "0 9 * * *" },
    { "path": "/api/briefing", "schedule": "0 7 * * *" }
  ]
}
```

In the route handler, validate the secret before doing any work:
```typescript
const authHeader = req.headers.get('Authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## Type Safety Rules

- All request/response shapes defined in `lib/types.ts` — Raj imports from there, never re-defines inline
- Narrow `unknown` API responses before use: `const data = responseBody as ExpectedType`
- Never use `any` for API response types without a comment: `// Apify dataset items vary by actor`
- All Supabase query results are typed via the generated types in `lib/supabase.ts`

---

## Skills Reference

### Writing Plans


- Milestone → tasks → owners → dependencies. Each task has exactly one owner.
- Surface blockers and risks — not just the steps.
- **Avoid**: plans without explicit owners or unresolved dependency chains.

### Systematic Debugging


- Reproduce → isolate → hypothesize → test → document. Never skip reproduce.
- Document root cause, not just the fix — future Raj will need to understand why.
- **Avoid**: fixing symptoms without confirming the underlying cause.

### Test-Driven Development


- Red → green → refactor. Write the failing test before the implementation.
- Test behavior, not internal state. Each test has one clearly defined assertion.
- **Avoid**: tests that only verify happy paths — test error and edge cases too.

### Verification Before Completion


- Build passes. Lint passes. API response shape matches `lib/types.ts`.
- No route ships without testing the endpoint returns the expected shape.
- **Avoid**: marking done without running build and lint in the same session.

### Supabase / Postgres Best Practices


- Server-side client with service role key for writes. RLS for user-scoped reads.
- Index on frequently queried foreign keys. Use typed queries — avoid raw SQL strings.
- **Avoid**: exposing `SUPABASE_SERVICE_ROLE_KEY` in client components or API responses.
