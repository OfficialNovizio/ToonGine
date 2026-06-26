# FRONTEND-PRINCIPLES.md — Mia, Frontend UI Developer

> Load this file before building any new component or page.

---

## Component Architecture

### Server vs Client Decision

| Situation | Directive | Reason |
|-----------|-----------|--------|
| Displaying data fetched on server | None (Server Component) | No hydration cost |
| Using `useState`, `useEffect`, event handlers | `'use client'` | Browser APIs required |
| Consuming SSE stream | `'use client'` | `EventSource` / streaming fetch |
| Reading from a cookie (venture switcher) | None (Server Component) | Cookies readable in RSC |

> `'use client'` boundary should be placed at the lowest level that needs it. Never mark a page wrapper as client just because a child component needs it.

### Component File Structure

```tsx
// 1. Directive (if needed)
'use client'

// 2. Imports — React, then Next.js, then local
import { useState, useEffect } from 'react'
import { AgentAvatar } from '@/components/AgentAvatar'
import type { AgentConfig } from '@/lib/types'

// 3. Props type
type Props = {
  agent: AgentConfig
  ventureId: string
}

// 4. Component
export function ComponentName({ agent, ventureId }: Props) {
  // state
  // effects
  // handlers
  // render
}
```

---

## Design System Usage

Never write a raw color value. Always use design tokens:

```tsx
// ❌ Wrong
<div className="bg-[#1A1A2E] text-[#E2E8F0]">

// ✅ Correct
<div className="bg-[var(--color-navy)] text-[var(--color-text)]">
```

**Token reference:**

| Token | Value | When to use |
|-------|-------|-------------|
| `var(--color-navy)` | `#1A1A2E` | Page/layout backgrounds |
| `var(--color-surface)` | `#16213E` | Card backgrounds |
| `var(--color-red)` | `#E94560` | CTAs, active states, accents |
| `var(--color-blue)` | `#0F3460` | Hover states, secondary accents |
| `var(--color-text)` | `#E2E8F0` | Primary text |
| `var(--color-muted)` | `#A0AEC0` | Labels, timestamps, secondary text |

Border radius: max `rounded-lg` (8px). No `rounded-2xl` or larger — breaks the dashboard aesthetic.

---

## State Management Rules

| State type | Where to store | Why |
|-----------|---------------|-----|
| Server data (social stats, agents list) | Fetch in Server Component or via `useEffect` + local state | Simple, no global store needed |
| UI state (active tab, modal open) | `useState` in component | Ephemeral, not worth persisting |
| Active venture | Cookie `yvon_active_venture` | Survives navigation, accessible server-side |
| Conversation messages | Supabase via API route | Must persist across sessions |
| User preferences | `localStorage` | Ephemeral, device-local only |

No Zustand, Redux, or Jotai — this app is simple enough for local state + server data.

---

## SSE Consumption Pattern

Every component that streams AI responses follows this pattern:

```tsx
const [content, setContent] = useState('')
const [isStreaming, setIsStreaming] = useState(false)

async function startStream() {
  setIsStreaming(true)
  setContent('')

  const res = await fetch('/api/claude', {
    method: 'POST',
    body: JSON.stringify({ message, ventureId })
  })

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') { setIsStreaming(false); break }
        if (data === '[ERROR]') { /* handle error */ break }
        try {
          setContent(prev => prev + data)
        } catch { /* malformed chunk — skip */ }
      }
    }
  }
}
```

Always check `data !== '[DONE]'` before processing. Always handle `[ERROR]`. Never `JSON.parse` without try/catch.

---

## Responsive Layout Rules

Mobile-first. Default layout is single column. Scale up:

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Default (mobile) | < 640px | 1 column, full width |
| `sm:` | ≥ 640px | 2 columns |
| `lg:` | ≥ 1024px | 3–4 columns, sidebars |
| `xl:` | ≥ 1280px | Max-width container, centered |

```tsx
// Standard page grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Standard 2-panel layout (chat + sidebar)
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
```

Never use arbitrary breakpoint values (`min-[900px]`). Use the standard Tailwind scale.

---

## Accessibility Checklist

Every component passes these before marking done:

- [ ] All interactive elements reachable by keyboard (Tab / Enter / Space / Escape)
- [ ] All images and icon-only buttons have `aria-label`
- [ ] Live regions for dynamic content: `role="log" aria-live="polite"` on chat feeds
- [ ] Modals: `role="dialog"` + `aria-modal="true"` + focus trap on open
- [ ] Form inputs: `<label>` paired with input via `htmlFor` / `id`
- [ ] Color contrast: text on `var(--color-surface)` must pass WCAG AA (4.5:1 for normal text)
- [ ] Agent avatars: `aria-label="[Name] — [Role]"`

---

## Design Fidelity Protocol

1. **Before writing a single line:** read Leo's ASCII wireframe and component spec in Leo's MEMORY.md.
2. **Map every element:** identify which Tailwind classes correspond to Leo's spec.
3. **Any ambiguity → ask Leo** before guessing. Never silently deviate.
4. **After building:** compare the rendered component side-by-side with Leo's spec. Quinn checks this.
5. **Mia implements. Mia does not redesign.** If the spec is technically impossible in Tailwind/Next.js, flag to Dev + Leo together. Never find a workaround silently.

---

## Performance Rules

- No `framer-motion` — CSS transitions only (`transition-all duration-200`)
- No heavy chart libraries — use CSS bar charts with `div` widths as percentages
- Images: always `next/image` with explicit `width` and `height`
- No `useEffect` with empty `[]` that fetches data synchronously — fetch in Server Components where possible
- Bundle size check: if adding a new dependency, run `npm run build` and check the build output for size changes

---

## Skills Reference

### Verification Before Completion


- Build passes (`npm run build` zero errors). Lint passes. Component verified in browser.
- Responsive layout checked at mobile, tablet, and desktop breakpoints.
- **Avoid**: marking a component done without browser verification.

### Systematic Debugging


- Reproduce → isolate → hypothesize → test → document. Never skip the reproduce step.
- Document root cause, not just the fix.
- **Avoid**: applying a fix that works for the symptom without confirming the root cause.

### Vercel + React Best Practices


- Server Components by default. `'use client'` only when interactivity or browser APIs are required.
- No secrets in client components. No direct external API calls — route through `/app/api/`.
- **Avoid**: unnecessary `useEffect` for data that a Server Component could fetch.

### Vercel Composition Patterns


- Parallel data fetching in Server Components. Use `Suspense` for slow or optional data.
- Collocate fetching with the component that renders it.
- **Avoid**: prop-drilling fetched data through multiple component layers.

### Web Design Guidelines


- Contrast ratio ≥ 4.5:1 for body text. Touch targets ≥ 44px.
- Use CSS variable tokens from `globals.css` — never hardcode color values.
- **Avoid**: hover-only interactions on mobile; animating width/height — use transform and opacity.
