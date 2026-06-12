---
name: migration-management
description: Raj's safe Supabase migration protocol for YVON. Covers migration naming, RLS verification, rollback scripts, dev-to-production workflow, and the 33-migration audit pattern. Run before creating any new migration.
version: 1.0.0
---

# Migration Management — Supabase

## Purpose

YVON has 33 applied migrations with no structured rollback protocol. As the schema grows with P3-B (`daily_logs`), P6-A (cost tracking), and new venture tables, unmanaged migrations create irreversible state in production. This skill defines the protocol for every migration Raj writes.

---

## When It Runs

- Before writing any new `.sql` migration file
- Before running `npm run db:migrate` on any environment
- After any schema change — RLS verification step is always required
- When a migration contains a destructive operation (DROP, ALTER, TRUNCATE)

---

## Migration Naming Convention

```
[timestamp]_[action]_[table]_[detail].sql

Examples:
20260528_create_daily_logs_table.sql
20260528_add_rls_daily_logs_per_venture.sql
20260528_alter_decisions_add_venture_slug.sql
20260601_drop_deprecated_agent_sessions_v1.sql
```

**Rules:**
- Timestamp = YYYYMMDD (date only — not time, to avoid ordering conflicts on the same day)
- If two migrations run same day: add `_01`, `_02` suffix
- Never use generic names like `schema_update.sql`

---

## Pre-Migration Checklist

Before writing any migration:

```
□ Is this additive (new table, new column) → LOW RISK — proceed
□ Is this altering a column type or removing a column → HIGH RISK — write rollback first
□ Is this dropping a table → CRITICAL RISK — get Marcus approval before proceeding
□ Does this touch a table used by both ventures? → Add RLS per venture BEFORE data is written
□ Does this table need a venture_slug column? → YES for any multi-venture table
□ Is there existing data that will be affected? → Test on dev first
```

---

## RLS Rule (Mandatory for Multi-Venture Tables)

Every table that can contain data from both Novizio and Hourbour MUST have Row Level Security enabled before any data is written to it.

```sql
-- Enable RLS on the table
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Novizio access policy
CREATE POLICY "[table]_novizio_isolation"
ON [table_name]
USING (venture_slug = 'novizio');

-- Hourbour access policy  
CREATE POLICY "[table]_hourbour_isolation"
ON [table_name]
USING (venture_slug = 'hourbour');

-- Service role bypass (for admin operations only)
CREATE POLICY "[table]_service_role_bypass"
ON [table_name]
TO service_role
USING (true);
```

**Non-negotiable:** If a table has no RLS and contains data from both ventures, Novizio data is visible in Hourbour context and vice versa. This is a data leak — not a future concern, a current risk.

---

## Rollback Script Template

Every destructive or ALTER migration MUST have a paired rollback:

```sql
-- Migration: 20260528_alter_decisions_add_venture_slug.sql
ALTER TABLE decisions ADD COLUMN venture_slug text NOT NULL DEFAULT 'novizio';

-- Rollback: 20260528_rollback_alter_decisions_add_venture_slug.sql
ALTER TABLE decisions DROP COLUMN IF EXISTS venture_slug;
```

Store rollback scripts in `scripts/migrations/rollbacks/` alongside the main migration.

---

## Post-Migration Verification

After every migration runs:

```
1. Confirm row count unchanged (for ALTER) or table created (for CREATE)
2. Run RLS policy check:
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   → Verify rowsecurity = true for all multi-venture tables
3. Test read from each venture context:
   → Novizio context should not see Hourbour rows
   → Hourbour context should not see Novizio rows
4. Run npx tsc --noEmit — confirm no TypeScript type errors from schema change
5. Log the migration: scripts/migrate.mjs confirms applied migrations
```

---

## Destructive Operation Protocol

For any migration with DROP, TRUNCATE, or column removal:

```
1. Get explicit approval from Marcus (or Stark) in SESSION.md
   → Record: "Approved by [who] on [date]: [what was approved]"
2. Back up affected table data before running:
   INSERT INTO [table_backup] SELECT * FROM [table];
3. Run on dev environment first and verify
4. Run on production only after dev verification
5. Keep backup table for 7 days before dropping
```

---

## Current Migration State

33 migrations applied as of 2026-05-27. Before creating migration #34+:
- Run `npm run db:migrate` to confirm no pending migrations
- Check `scripts/migrate.mjs` for the applied migration list
- New table for P3-B (`daily_logs`) requires RLS from day one
