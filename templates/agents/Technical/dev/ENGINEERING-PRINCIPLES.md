# ENGINEERING-PRINCIPLES.md — Dev, Lead Developer

> Load this file before making any architecture decision, writing an API contract, or reviewing code.

---

## Architecture Rules

### 4-Layer Rule (non-negotiable)

```
Browser (React)
    ↓
Next.js API Routes (/app/api/*/route.ts)
    ↓
External Services (Anthropic | Apify | YouTube | GA4 | Supabase)
```

- API keys live only in Next.js API routes — never in client components.
- Supabase `service_role` key used only server-side. Browser uses `anon` key via `createBrowserClient`.
- Persistent data always in Supabase. `localStorage` only for ephemeral UI state (tab position, scroll).

### Component Classification

| Type | When to use | Rule |
|------|------------|------|
| Server Component (default) | Data fetching, no user interaction | No `'use client'` directive |
| Client Component | State, event handlers, browser APIs | Add `'use client'` at top of file only |
| Route Handler | External API calls, DB writes | In `/app/api/*/route.ts` only |

> `'use client'` boundary should be as deep in the component tree as possible. Never mark a layout or wrapper as client unless required.

---

## API Contract Format

Dev writes contracts in Dev's MEMORY.md before Raj implements. Every contract includes:

```markdown
### POST /api/[route-name]

**Request body:**
```json
{
  "ventureId": "string (required)",
  "fieldName": "string | number (required/optional)"
}
```

**Success response (200):**
```json
{
  "fieldName": "value",
  "items": []
}
```

**Error responses:**
- `400` — Missing required field: `{ "error": "ventureId is required" }`
- `404` — Resource not found: `{ "error": "Venture not found" }`
- `500` — Internal error: `{ "error": "Failed to fetch data" }`

**Notes:** [Any caching, rate limiting, or Vercel timeout considerations]
```

Raj implements to this exact shape. Mia builds components that consume this exact shape. No deviations without Dev approval.

---

## Code Review Checklist

Dev checks every PR from Raj and Mia against this list:

### Backend (Raj's PRs)
- [ ] Route validates required request fields before calling any external API
- [ ] All external API calls are wrapped in try/catch with appropriate HTTP status codes
- [ ] Response shape exactly matches the contract in Dev's MEMORY.md
- [ ] No `any` type without a comment explaining why
- [ ] API keys are read from `process.env` only — never hardcoded
- [ ] `venture_id` is always included in Supabase writes
- [ ] Apify: `CRON_SECRET` validated on cron routes via `Authorization: Bearer` header

### Frontend (Mia's PRs)
- [ ] No hardcoded color values — all colors use `var(--color-*)` tokens
- [ ] `'use client'` only on components that genuinely need it
- [ ] Every interactive element has ARIA attributes and keyboard nav
- [ ] Loading state, error state, and empty state all handled
- [ ] SSE consumption checks `event.data !== '[DONE]'` before `JSON.parse()`
- [ ] No direct Supabase calls — data always fetched via API routes

### Both
- [ ] `npx tsc --noEmit` passes with zero errors (Linux VM) / `npm run build` on Vercel/Windows
- [ ] `npm run lint` passes with zero warnings
- [ ] TypeScript strict — no `@ts-ignore` without explanation comment

---

## TypeScript Standards

| Rule | Example |
|------|---------|
| All request/response shapes in `lib/types.ts` | `import type { AgentConfig } from '@/lib/types'` |
| No implicit `any` | `const data: unknown = await res.json()` then narrow |
| Use `type` not `interface` for simple shapes | `type ApiResponse = { items: Item[] }` |
| Discriminated unions for status types | `type Status = 'pending' \| 'done' \| 'error'` |
| Explicit return types on exported functions | `export async function getVenture(): Promise<Venture>` |

---

## SSE Architecture

All AI streaming routes follow this pattern:

```typescript
export async function POST(req: Request) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({ ... })
        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta') {
            controller.enqueue(encoder.encode(`data: ${chunk.delta.text}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        controller.enqueue(encoder.encode(`data: [ERROR]\n\n`))
      } finally {
        controller.close()
      }
    }
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  })
}
```

The `[DONE]` signal and try/catch inside the stream start are non-negotiable — Quinn checks for both.

---

## Security Checklist

Before any deploy:
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in any file under `/app/**/page.tsx` or `/components/`
- [ ] No `ANTHROPIC_API_KEY` accessible in client bundle
- [ ] Cron routes validate `Authorization: Bearer ${CRON_SECRET}` header
- [ ] User-supplied `ventureId` values are validated against known ventures before use
- [ ] No `eval()`, `dangerouslySetInnerHTML` with unsanitized input, or SQL string concatenation

---

## PR Gate Criteria

Dev only approves merge when all of these are true:

1. Quinn has issued APPROVED verdict for the current phase
2. `npm run build` passes (zero errors) in Quinn's session
3. `npm run lint` passes (zero warnings) in Quinn's session
4. All items in Dev's code review checklist are satisfied
5. Dev's MEMORY.md has been updated with completion status

No partial merges. The phase ships as a unit.

---

## Skills Reference

### Writing Plans


- Milestone → tasks → owners → dependencies. Each task has exactly one owner.
- Surface blockers and risks — not just the steps.
- **Avoid**: plans without explicit owners or unresolved dependency chains.

### Executing Plans


- Verify plan state before the first step. Check dependencies before starting each task.
- Update the plan after each completed task — never let it go stale.
- **Avoid**: marking a task complete without verifying its output.

### Brainstorming


- Diverge → cluster → converge. Quantity before quality in the generation phase.
- No criticism during diverge — every option gets written down first.
- **Avoid**: evaluating approaches before the generation phase is complete.

### Systematic Debugging


- Reproduce → isolate → hypothesize → test → document. Never skip reproduce.
- Document the root cause, not just the fix — future Dev will need to understand why.
- **Avoid**: fixing symptoms without understanding what caused them.

### Test-Driven Development


- Red → green → refactor. Write the failing test before the implementation.
- Test behavior, not implementation detail. Each test has one assertion.
- **Avoid**: tests that pass trivially or test internal state rather than external behavior.

### Requesting Code Review


- Context → what changed → what to focus on. Flag specific uncertainty areas explicitly.
- Provide the PR link, relevant diff sections, and the acceptance criteria being met.
- **Avoid**: PRs with no description — reviewers need context.

### Receiving Code Review


- Respond to every comment. "Won't fix" requires an explanation, not silence.
- Separate clarifying questions from disagreements — ask first, then decide.
- **Avoid**: defensive responses; treat every comment as useful signal.

### Verification Before Completion


- Build passes (`npm run build` zero errors). Lint passes (`npm run lint` zero warnings). Browser-verified for UI changes.
- No feature ships without evidence of verification.
- **Avoid**: marking done without running build and lint in the same session.

### Dispatching Parallel Agents


- Define agent role, input, output format, and handoff criteria before spawning.
- Merge outputs before responding — never surface raw parallel agent output directly.
- **Avoid**: dispatching with unresolved dependencies between workstreams.

### Using Git Worktrees


- One worktree per feature. Never commit directly to main from a worktree.
- Clean up worktrees after the branch is merged.
- **Avoid**: long-lived worktrees that drift far from the main branch.

### Finishing a Development Branch


- Squash, rebase on main, PR title format: `type(scope): description`.
- Delete the branch after merge. Update MEMORY.md with completion status.
- **Avoid**: merging without Quinn's APPROVED verdict.

### Subagent-Driven Development


- Define agent role + expected output format before spawning.
- Verify subagent output before integrating — treat it as a PR, not a done deal.
- **Avoid**: chaining subagent outputs without a verification step between them.

### Supabase / Postgres Best Practices


- Server-side client with service role key for writes. RLS for user-scoped reads.
- Index on frequently queried foreign keys. Prefer typed queries over raw SQL strings.
- **Avoid**: exposing `SUPABASE_SERVICE_ROLE_KEY` to client components.

### Vercel + React Best Practices


- Server Components by default. `'use client'` only when interactivity or browser APIs are required.
- No secrets in client components — all external API calls go through `/app/api/` routes.
- **Avoid**: unnecessary `useEffect` for data that can be fetched in a Server Component.

### Vercel Composition Patterns


- Parallel data fetching in Server Components. Streaming with `Suspense` for slow data.
- Collocate data fetching with the component that uses it — don't prop-drill fetched data.
- **Avoid**: request waterfalls in RSC trees; fetch all independent data in parallel.
