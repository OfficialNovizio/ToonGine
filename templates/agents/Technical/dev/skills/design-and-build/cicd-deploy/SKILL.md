---
name: cicd-deploy
description: Dev's Vercel deployment management skill for YVON. Covers preview vs. production deploy workflow, environment variable management, deploy hooks, maxDuration config, rollback procedures, and Vercel-specific Next.js 15 constraints.
version: 1.0.0
---

# CI/CD & Deploy Management — Vercel

## Purpose

YVON deploys to Vercel. Deployments are not trivial — wrong environment variables in production, incorrect `maxDuration` config on scraper routes, or a broken build that deploys silently can take down the dashboard for both ventures. This skill defines the deploy discipline Dev applies to every YVON deployment.

---

## When It Runs

- Before any production push
- When adding or modifying environment variables
- When adding a new API route (check `maxDuration` requirement)
- When a deploy fails or a route times out in production
- Before any vercel.json configuration change

---

## Vercel Configuration — vercel.json

YVON's `vercel.json` has critical route-level config:

```json
{
  "functions": {
    "app/api/competitor-pipeline/route.ts": { "maxDuration": 30 },
    "app/api/auto-competitors/route.ts":    { "maxDuration": 30 },
    "app/api/competitor-content/route.ts":  { "maxDuration": 30 }
  }
}
```

**maxDuration rules:**
- Default: 10 seconds (Hobby/Pro plan serverless function limit)
- Scraper routes (Apify calls): must be 30 seconds
- AI streaming routes (`/api/claude`): 30 seconds
- Standard data routes: 10 seconds default is fine

**When adding a new route that calls Apify, a slow external API, or runs batch processing:**
→ Add `maxDuration: 30` to that specific route in `vercel.json`
→ Never set `maxDuration: 30` globally — only on routes that need it (cost impact)

---

## Deploy Workflow

### Preview Deploy (every PR / branch push)
```
1. Push to any branch → Vercel auto-creates preview deploy
2. Preview URL: https://[hash]-[project].vercel.app
3. Preview uses PREVIEW environment variable group in Vercel dashboard
4. Test critical paths on preview before merging to main
5. Never share preview URLs externally — they can expose staging data
```

### Production Deploy
```
1. All changes on main branch → auto-deploy triggers
2. Pre-deploy gate (Dev must verify):
   □ npx tsc --noEmit → MUST pass
   □ npm run lint     → zero errors (warnings acceptable)
   □ npm run build    → MUST succeed locally first
3. Monitor deployment in Vercel dashboard — watch for function errors
4. Post-deploy: check /api/briefing and /api/agent-session-memory routes are responding
```

---

## Environment Variables

YVON has three environment contexts in Vercel:

| Context | Use | Key rule |
|---------|-----|---------|
| **Development** | Local `.env.local` | Never commit this file |
| **Preview** | PR/branch previews | Separate API key set where possible |
| **Production** | `main` branch | Real keys — never expose or log |

**Adding a new env var:**
1. Add to `.env.local` for local dev
2. Add to Vercel dashboard → Project Settings → Environment Variables → for all 3 contexts
3. Add to `docs/reference/ENV.md` with description and which context it applies to
4. If it's a secret: confirm it's server-only (never in client components)
5. If it's for a specific venture: prefix with `NOVIZIO_` or `HOURBOUR_`

**Checking required vars before deploy:**
```bash
# All vars in ENV.md should be present in local .env.local
# Verify critical vars are set before production deploy:
# ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
```

---

## Rollback Procedure

If a production deploy breaks something:

```
1. Vercel dashboard → Deployments → select last working deploy → "Redeploy"
   → This is the fastest rollback — Vercel keeps all previous builds
2. If the issue is env var related: update in Vercel dashboard → redeploy
3. If the issue is database schema: roll back migration (see Raj's migration-management skill)
4. Log the incident: docs/os/SESSION.md + flag to Quinn for post-mortem
```

**Never force-push to main to undo a breaking change.** Redeploy the previous Vercel build while fixing forward.

---

## Common Vercel + Next.js 15 Deploy Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Function timeout 504 | Route exceeds maxDuration | Add `maxDuration: 30` to vercel.json |
| Build error: missing types | TypeScript strict mode | Run `npx tsc --noEmit` locally first |
| Edge function size limit | Too many imports in edge route | Move to serverless route |
| Env var undefined in production | Not added to Vercel dashboard | Add to all 3 contexts in Vercel |
| `cookies()` error in static page | Using cookies in non-dynamic route | Add `export const dynamic = 'force-dynamic'` |
| SUPABASE_SERVICE_ROLE_KEY client leak | Used in client component | Move to server component or API route |

---

## Deploy Checklist

```
□ npx tsc --noEmit passes
□ npm run lint passes
□ npm run build succeeds locally
□ New env vars added to Vercel dashboard (all 3 contexts)
□ New env vars added to docs/reference/ENV.md
□ Any new long-running routes added to vercel.json with maxDuration: 30
□ No SUPABASE_SERVICE_ROLE_KEY or API keys in client components
□ Preview deploy tested on at least one critical path
```
