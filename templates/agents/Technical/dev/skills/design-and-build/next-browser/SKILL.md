---
name: next-browser
description: CLI tool for inspecting a running Next.js dev app programmatically. Enables Dev/Mia/Quinn to inspect React component trees, capture errors, audit network calls, profile Core Web Vitals, and debug PPR — all from the terminal without clicking through browser DevTools.
version: 1.0.0
---

## What It Is

`@vercel/next-browser` is a CLI that exposes React DevTools and the Next.js dev overlay as shell commands. A persistent Chromium daemon runs in the background; each CLI command sends a JSON-RPC message to it and returns structured, agent-parseable output.

**When to use:** Any time Dev, Mia, or Quinn needs to inspect what a running Next.js app is actually doing — component state, network calls, render performance, accessibility, or build errors — without manual browser interaction.

---

## Installation

**Preferred (integrates with Claude Code):**
```bash
npx skills add vercel-labs/next-browser
```

**Manual:**
```bash
pnpm add -g @vercel/next-browser
playwright install chromium
# Requires Node.js >= 20
```

---

## Command Reference

### Start / Navigate
```bash
next-browser open http://localhost:3000        # launch browser + navigate
next-browser goto /analytics                  # full-page reload to path
next-browser push /settings                   # client-side navigation (no reload)
next-browser back                             # previous page
next-browser reload                           # refresh
next-browser restart-server                   # reset Next.js dev server + clear cache
next-browser close                            # terminate daemon
```

### Inspect
```bash
next-browser snapshot                         # accessibility tree with interactive element refs
next-browser tree                             # React component hierarchy (full)
next-browser tree <component-id>              # individual component: props + hooks + state
next-browser errors                           # build + runtime errors
next-browser logs                             # dev server stdout
next-browser browser-logs                     # console.log/warn/error from browser
next-browser network                          # list all network requests
next-browser network <idx>                    # inspect specific request (headers, body, response)
next-browser screenshot                       # viewport capture
next-browser screenshot --full-page          # full scrollable page capture
```

### Interact
```bash
next-browser click <ref|text|selector>        # click an element
next-browser fill <ref|selector> <value>      # type into an input
next-browser eval <script>                    # run JS in page context
next-browser eval <ref> <script>              # run JS scoped to a component
```

### Performance
```bash
next-browser perf                             # Core Web Vitals + React hydration timing
next-browser renders start                    # begin component render profiling
next-browser renders stop                     # end profiling + output render counts
next-browser ppr lock                         # freeze dynamic content (inspect PPR shell)
next-browser ppr unlock                       # restore dynamic content
```

### Next.js Framework
```bash
next-browser page                             # current page metadata
next-browser project                          # project structure info
next-browser routes                           # all registered routes
next-browser action <id>                      # inspect a Server Action
```

---

## YVON Workflow Patterns

### Pattern 1 — Debug a route rendering issue
```bash
next-browser open http://localhost:3000
next-browser goto /analytics
next-browser errors          # check for build/runtime errors first
next-browser tree            # inspect component hierarchy
next-browser network         # check which API calls fired and their status
```

### Pattern 2 — Verify API calls from a screen
```bash
next-browser goto /war-room
next-browser network         # list all requests made during page load
next-browser network 3       # inspect request #3 — headers, body, response
```

### Pattern 3 — Accessibility audit before QA sign-off
```bash
next-browser snapshot        # get accessibility tree
# Look for: missing alt text, unlabelled interactive elements, skip nav
```

### Pattern 4 — Performance profiling
```bash
next-browser perf http://localhost:3000/analytics
# Returns: LCP, FID, CLS, TTFB, React hydration time
```

### Pattern 5 — PPR shell debugging
```bash
next-browser ppr lock        # freeze Suspense boundaries
next-browser screenshot      # capture static shell
next-browser tree            # inspect which components are in the shell vs dynamic
next-browser ppr unlock
```

---

## Requirements
- Next.js dev server must be running (`npm run dev`)
- Node.js >= 20
- Chromium (installed via `playwright install chromium`)
- Works only against localhost dev server — not production builds
