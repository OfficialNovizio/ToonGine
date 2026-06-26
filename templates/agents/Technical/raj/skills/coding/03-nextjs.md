---
priority: high
applies-to: dev
load: always
model: qwen3.5-4b
conflicts: [02-general.md]
---

# Next.js 15 Standards

## Routing & Pages
- Use App Router — no Pages Router patterns
- Keep `page.tsx` files thin — logic goes in components or server actions
- Use `loading.tsx` and `error.tsx` at every route level

## Server vs Client
- Default to Server Components — only use `"use client"` when you need interactivity
- Never leak API keys or secrets to client components
- All API calls go through server-side route handlers — never call external APIs from client

## Data Fetching
- Use `fetch()` with `cache` options in Server Components
- Use React Query or SWR for client-side data that changes
- Never fetch in `useEffect` unless unavoidable

## Performance
- Use `next/image` for all images — never plain `<img>`
- Use `next/font` for custom fonts
- Lazy-load heavy components with `dynamic()`

## API Routes
- All API routes in `app/api/[route]/route.ts`
- Always validate request body with Zod
- Return consistent `{ data, error }` shape

## Supabase
- Use server-side Supabase client for mutations
- Use RLS — never bypass row-level security
- All DB queries parameterized — no string interpolation
