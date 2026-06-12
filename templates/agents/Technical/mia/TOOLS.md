# TOOLS.md — Mia, Frontend UI Developer

## Memory API

Mia reads and writes memory via `/api/settings` — never directly to Supabase.

**Read:**
```
GET /api/settings?type=memory&agentId=mia-frontend&ventureId={activeVenture}
```

**Write:**
```json
POST /api/settings
{
  "type": "memory",
  "agentId": "mia-frontend",
  "ventureId": "{activeVenture}",
  "key": "known_gotchas",
  "value": "SSE streams: always check event.data !== '[DONE]' before parsing JSON."
}
```

After every POST: edit the Live State table in `MEMORY.md` to match.

---

## Active Tools

### GitHub MCP

Mia uses GitHub to inspect existing components for visual and structural patterns before building new ones.

**Use cases:**
- Read an existing component to understand established JSX structure before writing a similar one
- Check recent commits for any design system changes Dev made (new CSS variables, Tailwind config updates)
- Verify a component matches what was merged — not a local-only version
- Check Leo's spec issues for UI fidelity requirements before starting a component

**Key operations:**
```
get_file_contents     → read an existing component.tsx for pattern reference
list_commits          → check recent design system or globals.css changes
get_pull_request      → review what Raj changed in a route before building the consuming component
```

---

## Design System Reference

Mia's primary constraint is the YVON design token system. These must be checked before writing any CSS:

| Token | Value | Usage |
|-------|-------|-------|
| `var(--color-navy)` | `#1A1A2E` | Page and layout backgrounds |
| `var(--color-surface)` | `#16213E` | Card backgrounds |
| `var(--color-red)` | `#E94560` | Primary accents, CTAs, active states |
| `var(--color-blue)` | `#0F3460` | Secondary accents, hover states |
| `var(--color-text)` | `#E2E8F0` | Primary text |
| `var(--color-muted)` | `#A0AEC0` | Subtle text, labels, timestamps |
| `--font-inter` | Inter | All UI text |

> Any new token must go through Aria → Dev → `globals.css` + `tailwind.config.ts` update. Mia never adds tokens unilaterally.

---

## Route Calls Mia Makes (from client components)

All external data goes through server-side API routes — never called from the browser directly:

| Route | Method | When |
|-------|--------|------|
| `/api/settings` | GET | Session start — read own memory keys |
| `/api/settings` | POST | After discovering a new component pattern or gotcha |
| `/api/venture` | GET | To load active venture config for venture-aware components |

Mia's components call `/api/claude` for AI streaming, `/api/instagram` etc. for social data — but always via the fetch abstraction in the component, never with raw API keys.

---

## Future Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Figma MCP | Access design files for pixel-perfect implementation | Planned |
| Storybook | Isolated component development and visual testing | Planned |
