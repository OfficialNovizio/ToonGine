---
name: recovery-patterns
description: Dev-enforced recovery architecture for YVON's 4 critical failure scenarios — Vercel timeout, Supabase failure, external API down, Anthropic streaming failure. Every route Raj writes must have an explicit answer for each applicable scenario.
version: 1.0.0
---

## Purpose

YVON's API layer depends on Vercel, Supabase, external APIs (Apify, YouTube, GA4), and the Anthropic API. Each can fail independently. A route without a defined recovery path is a route that produces silent failures, hanging connections, or raw 500s — all of which break the product in production.

Dev enforces this: before approving any route, the recovery path for each applicable dependency must be stated and implemented.

---

## The 4 Recovery Scenarios

### 1. Vercel Timeout (10-second limit)

**Problem:** Any API route that blocks for > 10 seconds on Vercel will timeout and return a raw 504, with no user-facing message.

**Required pattern:**
- Long-running AI routes must use `ReadableStream` SSE streaming — begin sending tokens immediately, don't buffer the full response
- If a route cannot stream, the heavy computation must be moved to a background queue; the route returns a job ID and the client polls
- Hard rule: no route should block past 8 seconds. The remaining 2 seconds is buffer for overhead

**Dev approval gate:** If a route makes a blocking call that could exceed 8s → BLOCKED until streaming or queue pattern is implemented.

### 2. Supabase Connection Failure

**Problem:** Network hiccups, Supabase maintenance windows, and connection pool exhaustion all produce runtime errors that, without handling, become raw 500s with DB schema info in the message.

**Required pattern:**
```typescript
try {
  const { data, error } = await supabase.from('table').select('...')
  if (error) throw error
  return NextResponse.json(data)
} catch (err) {
  console.error({ type: 'db_error', route: '/api/...', message: 'Database unavailable' })
  return NextResponse.json(
    { error: 'Service temporarily unavailable. Please try again.' },
    { status: 503, headers: { 'Retry-After': '5' } }
  )
}
```

**Rule:** Never expose raw Supabase error messages to the client. Always return `503` with `Retry-After` — not `500`.

### 3. External API Down (Apify, YouTube, GA4)

**Problem:** Third-party APIs go down. YVON's analytics, competitor, and social screens depend on them. A 500 from an external API must not propagate as a 500 to the client.

**Required pattern:**
- Return the last cached response from Supabase if it's < 24 hours old
- If no cache exists, return a degraded state response: `{ data: null, degraded: true, message: 'Data temporarily unavailable' }`
- Never return `500` on a third-party failure — that's YVON's fault from the user's perspective
- Log the external API failure at WARN level with the API name and status code

**Dev approval gate:** Any route calling Apify, YouTube API, or GA4 without a cache fallback → BLOCKED.

### 4. Anthropic API Failure (SSE Streaming Routes)

**Problem:** If the Anthropic API fails mid-stream, the SSE connection can hang indefinitely, or close abruptly without the client knowing an error occurred.

**Required pattern:**
```typescript
const stream = new ReadableStream({
  async start(controller) {
    try {
      const response = await anthropic.messages.stream(...)
      for await (const chunk of response) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
    } catch (err) {
      // Client receives explicit error event before stream closes
      controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'AI service unavailable' })}\n\n`))
    } finally {
      controller.close()
    }
  }
})
```

**Rule:** The client must always receive either `[DONE]` or an explicit `event: error` — never a dead hanging socket.

---

## Dev's Approval Gate

Before approving any route, Dev asks:

> "If [dependency] goes down right now, what does the client receive?"

The answer must be: a structured error response with correct status code and Retry-After header — not a raw exception, not a hanging connection, not a 200 with error content.

No answer → route is not approved.
