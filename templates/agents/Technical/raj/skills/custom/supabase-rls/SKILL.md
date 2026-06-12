---
name: supabase-rls
description: Row Level Security behavioral guide for Raj. Every table that stores venture or user data must have RLS enabled. Covers policy patterns, venture-scoping, service role rules, and the pre-schema-change checklist.
version: 1.0.0
---

## Purpose

YVON is a multi-venture system (Novizio + Hourbour). Without RLS, a bug in the venture-switching logic could expose Novizio's data to Hourbour's context — or vice versa. RLS is the last line of defence after application-level scoping. It must be on every data table.

**Hard rule:** No table ships without an explicit RLS decision documented. "We'll add it later" is not acceptable — schema changes are expensive and RLS retrofits require auditing every existing row.

---

## Standard Policy Patterns

### Venture-scoped read (most tables)
```sql
-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Read: only the active venture's rows
CREATE POLICY "venture_read" ON analytics_events
  FOR SELECT
  USING (venture_slug = current_setting('app.venture_slug', true));

-- Insert: only insert into active venture
CREATE POLICY "venture_insert" ON analytics_events
  FOR INSERT
  WITH CHECK (venture_slug = current_setting('app.venture_slug', true));
```

### Auth-scoped (user-specific data)
```sql
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read" ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "auth_write" ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Combined venture + auth (most YVON tables)
```sql
CREATE POLICY "venture_auth_read" ON campaigns
  FOR SELECT
  USING (
    venture_slug = current_setting('app.venture_slug', true)
    AND auth.uid() = owner_id
  );
```

### Service role bypass (cron/admin only)
```sql
-- Service role bypasses RLS by default in Supabase
-- Use ONLY in server-side cron routes with CRON_SECRET validation
-- NEVER use service role key from client components
```

---

## Setting venture context in routes
```typescript
// At the start of any route that uses venture-scoped tables
await supabase.rpc('set_config', {
  setting: 'app.venture_slug',
  value: ventureSlug,
  is_local: true
})
// Now all queries on this connection respect the RLS policy
```

---

## Service Role Key Rules

| Situation | Key to use |
|-----------|-----------|
| Server-side API route (normal) | Anon key + user auth session |
| Cron jobs (admin operations) | Service role key — bypasses RLS by design |
| Client components | NEVER use service role key |
| Supabase storage (file uploads) | Anon key with storage policies |

**Hard rule:** `SUPABASE_SERVICE_ROLE_KEY` appears ONLY in routes that have been validated with `CRON_SECRET` header, or in explicit admin-only endpoints. Never in `NEXT_PUBLIC_*`.

---

## Pre-Schema-Change Checklist

Before creating or modifying any table, verify:

- [ ] RLS enabled on this table? (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] SELECT policy: uses `auth.uid()` or `venture_slug` scoping — not open to all?
- [ ] INSERT policy: prevents cross-venture writes? (`WITH CHECK` clause present)
- [ ] UPDATE policy: same scoping as SELECT?
- [ ] DELETE policy: should regular users be able to delete? Who can?
- [ ] Service role: are any operations on this table intended to bypass RLS? Is that documented and intentional?
- [ ] Has Dev reviewed and approved this schema change?
- [ ] Is this change logged in MEMORY.md with its rationale?

---

## Testing RLS Policies

Before submitting schema changes for Dev review, test RLS manually:

```bash
# In Supabase SQL editor — test as anon user (should be blocked)
SET ROLE anon;
SELECT * FROM campaigns;  -- should return 0 rows or error

# Test with wrong venture context
SELECT set_config('app.venture_slug', 'wrong-venture', true);
SELECT * FROM campaigns;  -- should return 0 rows

# Test with correct venture context
SELECT set_config('app.venture_slug', 'novizio', true);
SELECT * FROM campaigns;  -- should return novizio rows only
```

---

## Common RLS Mistakes to Avoid

| Mistake | Consequence | Fix |
|---------|------------|-----|
| `FOR ALL USING (true)` | Open to everyone | Scope with auth.uid() or venture_slug |
| No INSERT policy | Anyone can write | Add WITH CHECK clause |
| Relying only on app-level filtering | Bug in app = data leak | RLS is the safety net, not the app filter |
| Using service role in client | Bypasses RLS everywhere | Service role server-side only |
| Forgetting to set `app.venture_slug` | RLS policy returns no rows | Set config at route start |
