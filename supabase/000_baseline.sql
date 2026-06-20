-- =============================================================================
-- ToonGine Baseline Schema — consolidated from v1, v2, v3, v4, 051 (pruned)
-- One file, fully idempotent. Safe to re-run any number of times.
-- Handles v3→v4 migration: fixes issues table schema, adds missing columns.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/mcejxdjrwzjxafciuely/sql
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: Agent Roster & Hermes Sync (v1)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS toongine_hermes_agents (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  role            TEXT DEFAULT '',
  department      TEXT NOT NULL,
  level           INTEGER DEFAULT 1,
  status          TEXT DEFAULT 'idle' CHECK (status IN ('active','idle','offline')),
  skills_count    INTEGER DEFAULT 0,
  skills          JSONB DEFAULT '[]'::jsonb,
  memory_size     TEXT DEFAULT '0 KB',
  memory_health   INTEGER DEFAULT 0,
  last_active     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS toongine_hermes_activity (
  id              BIGSERIAL PRIMARY KEY,
  agent_name      TEXT NOT NULL,
  task            TEXT DEFAULT '',
  tokens          INTEGER DEFAULT 0,
  duration_sec    FLOAT DEFAULT 0,
  status          TEXT DEFAULT 'completed',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS toongine_hermes_council (
  id              BIGSERIAL PRIMARY KEY,
  topic           TEXT NOT NULL,
  decision        TEXT DEFAULT '',
  votes           JSONB DEFAULT '{}'::jsonb,
  summary         TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS toongine_hermes_sync_log (
  id              BIGSERIAL PRIMARY KEY,
  synced_at       TIMESTAMPTZ DEFAULT now(),
  agents_count    INTEGER DEFAULT 0,
  activity_count  INTEGER DEFAULT 0,
  council_count   INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'ok'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: Token Burn Engine (v2) — Repo-scoped activity & provider ledger
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS toongine_projects (
  repo_id         TEXT PRIMARY KEY,
  repo_name       TEXT NOT NULL,
  owner           TEXT NOT NULL,
  first_seen_at   TIMESTAMPTZ DEFAULT now(),
  last_active_at  TIMESTAMPTZ DEFAULT now(),
  total_runs      BIGINT DEFAULT 0,
  total_tokens    BIGINT DEFAULT 0,
  total_cost      DECIMAL(12,6) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS toongine_activity_log (
  run_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id         TEXT NOT NULL REFERENCES toongine_projects(repo_id),
  agent_id        TEXT NOT NULL,
  agent_name      TEXT DEFAULT '',
  department      TEXT DEFAULT '',
  provider        TEXT NOT NULL,
  model           TEXT NOT NULL,
  tokens_in       INTEGER DEFAULT 0,
  tokens_out      INTEGER DEFAULT 0,
  cost_usd        DECIMAL(10,6) DEFAULT 0,
  duration_ms     INTEGER DEFAULT 0,
  task            TEXT DEFAULT '',
  status          TEXT DEFAULT 'completed',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS toongine_snapshots (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL REFERENCES toongine_projects(repo_id),
  granularity     TEXT NOT NULL CHECK (granularity IN ('hour','day','month')),
  slot            INTEGER NOT NULL,
  period_start    TIMESTAMPTZ NOT NULL,
  period_end      TIMESTAMPTZ NOT NULL,
  tokens_total    BIGINT DEFAULT 0,
  cost_total      DECIMAL(12,6) DEFAULT 0,
  run_count       INTEGER DEFAULT 0,
  active_agents   INTEGER DEFAULT 0,
  top_agent       TEXT DEFAULT '',
  top_task        TEXT DEFAULT '',
  efficiency_pct  DECIMAL(6,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(repo_id, granularity, slot)
);

CREATE TABLE IF NOT EXISTS toongine_provider_ledger (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL REFERENCES toongine_projects(repo_id),
  provider        TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT 'active'
                  CHECK (state IN ('activated','active','low','depleted','switched')),
  balance_start   DECIMAL(12,4) DEFAULT 0,
  balance_current DECIMAL(12,4) DEFAULT 0,
  total_spent     DECIMAL(12,4) DEFAULT 0,
  total_tokens    BIGINT DEFAULT 0,
  avg_cost_per_1k DECIMAL(10,6) DEFAULT 0,
  efficiency_pct  DECIMAL(6,2) DEFAULT 0,
  activated_at    TIMESTAMPTZ DEFAULT now(),
  depleted_at     TIMESTAMPTZ,
  switched_at     TIMESTAMPTZ,
  is_current      BOOLEAN DEFAULT true
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: Project Health Engine (v3/v4 merged)
--   toongine_issues: v4 schema (priority 0-3, category, file_path, line_number, status)
--   toongine_toon_health: v4 (TOON compression & graph health)
--   toongine_codebase_snapshots: v3 base + v4 extra columns
--   toongine_api_health: v3 base + v4 extra columns
--   toongine_health_events: v3 (timeline)
--   toongine_recommendations: v3 (fix suggestions)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 3a. Issues (v4 schema — supersedes v3's different column layout)
-- DROP first: v3 already created this table with incompatible columns (severity 1-4, resolved boolean).
-- The pipeline repopulates from scratch, so data loss is safe.
DROP TABLE IF EXISTS toongine_issues CASCADE;
CREATE TABLE toongine_issues (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL,
  priority        INTEGER NOT NULL DEFAULT 2 CHECK (priority >= 0 AND priority <= 3),
  category        TEXT NOT NULL DEFAULT 'bug',
  title           TEXT NOT NULL,
  detail          TEXT,
  source          TEXT,
  file_path       TEXT,
  line_number     INTEGER,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','wontfix')),
  severity        INTEGER NOT NULL DEFAULT 1 CHECK (severity >= 0 AND severity <= 3),
  impact_points   REAL DEFAULT 0,
  effort_minutes  INTEGER DEFAULT 0,
  assigned_to     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ
);

-- 3b. TOON Compression Health (v4)
CREATE TABLE IF NOT EXISTS toongine_toon_health (
  id                BIGSERIAL PRIMARY KEY,
  repo_id           TEXT NOT NULL,
  sampled_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  files_cached      INTEGER DEFAULT 0,
  cache_size_bytes  INTEGER DEFAULT 0,
  graph_nodes       INTEGER DEFAULT 0,
  graph_edges       INTEGER DEFAULT 0,
  graph_size_bytes  INTEGER DEFAULT 0,
  total_docs        INTEGER DEFAULT 0,
  total_files       INTEGER DEFAULT 0,
  toon_dir_size_bytes INTEGER DEFAULT 0,
  agents_with_skills INTEGER DEFAULT 0,
  total_skills      INTEGER DEFAULT 0,
  avg_skills_per_agent REAL DEFAULT 0,
  cache_stale       BOOLEAN DEFAULT false,
  graph_orphaned    BOOLEAN DEFAULT false,
  compression_ratio REAL DEFAULT 0,
  compile_errors    INTEGER DEFAULT 0,
  graph_errors      INTEGER DEFAULT 0
);

-- 3c. Codebase Snapshots (v3 base + v4 extras merged)
CREATE TABLE IF NOT EXISTS toongine_codebase_snapshots (
  repo_id           TEXT NOT NULL,
  slot              INT NOT NULL,
  sampled_at        TIMESTAMPTZ DEFAULT now(),
  ts_errors         INT DEFAULT 0,
  ts_error_free     BOOLEAN DEFAULT true,
  files_total       INT DEFAULT 0,
  lines_total       INT DEFAULT 0,
  build_duration_ms INT DEFAULT 0,
  dependencies      INT DEFAULT 0,
  outdated_deps     INT DEFAULT 0,
  lint_errors       INT DEFAULT 0,
  lint_warnings     INT DEFAULT 0,
  UNIQUE(repo_id, slot)
);

-- If table already existed from v3 (without lint columns), add them safely
DO $$ BEGIN
  ALTER TABLE toongine_codebase_snapshots ADD COLUMN lint_errors INT DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE toongine_codebase_snapshots ADD COLUMN lint_warnings INT DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 3d. API Health (v3 base + v4 extras merged)
CREATE TABLE IF NOT EXISTS toongine_api_health (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL,
  endpoint        TEXT NOT NULL,
  status_code     INT NOT NULL,
  duration_ms     INT DEFAULT 0,
  latency_ms      INT DEFAULT 0,
  error_message   TEXT DEFAULT '',
  user_agent      TEXT,
  ip_hash         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- If table already existed from v3 (without v4 columns), add them safely
DO $$ BEGIN
  ALTER TABLE toongine_api_health ADD COLUMN latency_ms INT DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE toongine_api_health ADD COLUMN user_agent TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE toongine_api_health ADD COLUMN ip_hash TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 3e. Health Events Timeline (v3)
CREATE TABLE IF NOT EXISTS toongine_health_events (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  severity        INT DEFAULT 0,
  title           TEXT NOT NULL,
  detail          TEXT DEFAULT '',
  linked_commit   TEXT,
  linked_agent    TEXT,
  health_impact   FLOAT DEFAULT 0,
  occurred_at     TIMESTAMPTZ DEFAULT now()
);

-- 3f. Recommendations Cache (v3)
CREATE TABLE IF NOT EXISTS toongine_recommendations (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL,
  priority        INT NOT NULL,
  category        TEXT NOT NULL,
  title           TEXT NOT NULL,
  detail          TEXT DEFAULT '',
  impact_points   FLOAT DEFAULT 0,
  effort_minutes  INT DEFAULT 30,
  generated_at    TIMESTAMPTZ DEFAULT now(),
  dismissed       BOOLEAN DEFAULT false
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: Engine Metrics (051) — TOON compression telemetry
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS metrics;

CREATE TABLE IF NOT EXISTS metrics.toon_calls (
  id            BIGSERIAL PRIMARY KEY,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider      TEXT NOT NULL DEFAULT 'unknown',
  model         TEXT NOT NULL DEFAULT 'unknown',
  format        TEXT NOT NULL,
  input_tokens  INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  bytes_before  INTEGER NOT NULL,
  bytes_after   INTEGER NOT NULL,
  cost_saved    REAL NOT NULL DEFAULT 0,
  agent_id      TEXT,
  venture_id    TEXT,
  task_type     TEXT
);

CREATE TABLE IF NOT EXISTS metrics.engine_queries (
  id               BIGSERIAL PRIMARY KEY,
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider         TEXT NOT NULL DEFAULT 'unknown',
  model            TEXT NOT NULL DEFAULT 'unknown',
  agent_id         TEXT,
  venture_id       TEXT,
  task_type        TEXT,
  query_hash       TEXT,
  original_chars   INTEGER NOT NULL,
  injected_chars   INTEGER NOT NULL,
  savings_percent  REAL NOT NULL,
  chunks_matched   INTEGER DEFAULT 0,
  chunks_injected  INTEGER DEFAULT 0,
  injection_level  TEXT DEFAULT 'L2',
  latency_ms       INTEGER DEFAULT 0,
  doc_count        INTEGER DEFAULT 0,
  memory_count     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS metrics.compiles (
  id               BIGSERIAL PRIMARY KEY,
  timestamp        TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms      INTEGER NOT NULL,
  files_scanned    INTEGER DEFAULT 0,
  chunks_built     INTEGER DEFAULT 0,
  terms_indexed    INTEGER DEFAULT 0,
  bpe_tokens       INTEGER DEFAULT 0,
  corpus_size_bytes INTEGER DEFAULT 0,
  bin_size_bytes   INTEGER DEFAULT 0,
  error            TEXT
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: Materialized Views (engine metrics only)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Daily engine summary (051)
DROP MATERIALIZED VIEW IF EXISTS metrics.daily_summary;
CREATE MATERIALIZED VIEW metrics.daily_summary AS
SELECT 
  date(timestamp) as day,
  COUNT(*) as queries,
  COUNT(DISTINCT agent_id) as active_agents,
  SUM(original_chars) as total_orig_chars,
  SUM(injected_chars) as total_inj_chars,
  AVG(savings_percent)::NUMERIC(5,1) as avg_savings,
  ROUND((SUM(original_chars::float)/1000000)*3 + (SUM(injected_chars::float)/1000000)*15, 4) as est_cost
FROM metrics.engine_queries
GROUP BY date(timestamp)
ORDER BY day;

-- Agent weekly efficiency (051)
DROP MATERIALIZED VIEW IF EXISTS metrics.agent_weekly;
CREATE MATERIALIZED VIEW metrics.agent_weekly AS
SELECT 
  COALESCE(agent_id, 'unknown') as agent_id,
  date_trunc('week', timestamp)::date as week_start,
  COUNT(*) as queries,
  ROUND(AVG(savings_percent)::numeric, 1) as avg_savings,
  ROUND(AVG(latency_ms)::numeric, 0) as avg_latency_ms,
  COUNT(DISTINCT task_type) as task_types_used,
  ROUND((SUM(original_chars::float)/1000000)*3::numeric, 4) as est_cost
FROM metrics.engine_queries
WHERE timestamp > now() - interval '90 days'
GROUP BY agent_id, date_trunc('week', timestamp)::date
ORDER BY week_start DESC, queries DESC;

-- MV refresh helper (051)
CREATE OR REPLACE FUNCTION metrics.refresh_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW metrics.daily_summary;
  REFRESH MATERIALIZED VIEW metrics.agent_weekly;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 6: Row Level Security (anon read — repo filtering done in plugin)
-- ═══════════════════════════════════════════════════════════════════════════════

-- v1 tables
ALTER TABLE toongine_hermes_agents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_hermes_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_hermes_council  ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_hermes_sync_log ENABLE ROW LEVEL SECURITY;

-- v2 tables
ALTER TABLE toongine_projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_snapshots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_provider_ledger ENABLE ROW LEVEL SECURITY;

-- v3/v4 tables
ALTER TABLE toongine_issues           ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_toon_health      ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_codebase_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_api_health       ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_health_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_recommendations  ENABLE ROW LEVEL SECURITY;

-- Anon read policies (drop first to avoid duplicate errors on re-run)
DO $$ BEGIN
  DROP POLICY IF EXISTS "anon read agents"    ON toongine_hermes_agents;
  DROP POLICY IF EXISTS "anon read activity"  ON toongine_hermes_activity;
  DROP POLICY IF EXISTS "anon read council"   ON toongine_hermes_council;
  DROP POLICY IF EXISTS "anon read sync_log"  ON toongine_hermes_sync_log;
  DROP POLICY IF EXISTS "anon read projects"   ON toongine_projects;
  DROP POLICY IF EXISTS "anon read actlog"     ON toongine_activity_log;
  DROP POLICY IF EXISTS "anon read snapshots"  ON toongine_snapshots;
  DROP POLICY IF EXISTS "anon read providers"  ON toongine_provider_ledger;
  DROP POLICY IF EXISTS "anon read issues"     ON toongine_issues;
  DROP POLICY IF EXISTS "anon read toon_health" ON toongine_toon_health;
  DROP POLICY IF EXISTS "anon read codebase"   ON toongine_codebase_snapshots;
  DROP POLICY IF EXISTS "anon read api"        ON toongine_api_health;
  DROP POLICY IF EXISTS "anon read events"     ON toongine_health_events;
  DROP POLICY IF EXISTS "anon read recs"       ON toongine_recommendations;
  DROP POLICY IF EXISTS "issues_repo_isolation" ON toongine_issues;
  DROP POLICY IF EXISTS "toon_health_repo_isolation" ON toongine_toon_health;
END $$;

CREATE POLICY "anon read agents"    ON toongine_hermes_agents   FOR SELECT TO anon USING (true);
CREATE POLICY "anon read activity"  ON toongine_hermes_activity FOR SELECT TO anon USING (true);
CREATE POLICY "anon read council"   ON toongine_hermes_council  FOR SELECT TO anon USING (true);
CREATE POLICY "anon read sync_log"  ON toongine_hermes_sync_log FOR SELECT TO anon USING (true);
CREATE POLICY "anon read projects"   ON toongine_projects       FOR SELECT TO anon USING (true);
CREATE POLICY "anon read actlog"     ON toongine_activity_log   FOR SELECT TO anon USING (true);
CREATE POLICY "anon read snapshots"  ON toongine_snapshots      FOR SELECT TO anon USING (true);
CREATE POLICY "anon read providers"  ON toongine_provider_ledger FOR SELECT TO anon USING (true);
CREATE POLICY "anon read issues"     ON toongine_issues         FOR SELECT TO anon USING (true);
CREATE POLICY "anon read toon_health" ON toongine_toon_health   FOR SELECT TO anon USING (true);
CREATE POLICY "anon read codebase"   ON toongine_codebase_snapshots FOR SELECT TO anon USING (true);
CREATE POLICY "anon read api"        ON toongine_api_health     FOR SELECT TO anon USING (true);
CREATE POLICY "anon read events"     ON toongine_health_events  FOR SELECT TO anon USING (true);
CREATE POLICY "anon read recs"       ON toongine_recommendations FOR SELECT TO anon USING (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 7: Indexes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_agents_dept       ON toongine_hermes_agents(department);
CREATE INDEX IF NOT EXISTS idx_agents_status     ON toongine_hermes_agents(status);
CREATE INDEX IF NOT EXISTS idx_activity_time     ON toongine_hermes_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_agent    ON toongine_hermes_activity(agent_name);
CREATE INDEX IF NOT EXISTS idx_council_time      ON toongine_hermes_council(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_repo_time ON toongine_activity_log(repo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_agent_v2  ON toongine_activity_log(repo_id, agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_repo    ON toongine_snapshots(repo_id, granularity, slot);
CREATE INDEX IF NOT EXISTS idx_provider_current  ON toongine_provider_ledger(repo_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_codebase_repo     ON toongine_codebase_snapshots(repo_id, slot);
CREATE INDEX IF NOT EXISTS idx_api_repo_time     ON toongine_api_health(repo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_repo       ON toongine_issues(repo_id);
CREATE INDEX IF NOT EXISTS idx_issues_priority   ON toongine_issues(repo_id, priority, status);
CREATE INDEX IF NOT EXISTS idx_issues_category   ON toongine_issues(repo_id, category);
CREATE INDEX IF NOT EXISTS idx_issues_open       ON toongine_issues(repo_id, severity) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_issues_resolved   ON toongine_issues(repo_id, resolved_at DESC) WHERE status = 'resolved';
CREATE INDEX IF NOT EXISTS idx_toon_health_repo  ON toongine_toon_health(repo_id);
CREATE INDEX IF NOT EXISTS idx_toon_health_ts    ON toongine_toon_health(repo_id, sampled_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_repo_time  ON toongine_health_events(repo_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_recs_active       ON toongine_recommendations(repo_id, priority) WHERE dismissed = false;
CREATE INDEX IF NOT EXISTS idx_metrics_toon_ts      ON metrics.toon_calls(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_toon_agent   ON metrics.toon_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_metrics_toon_provider ON metrics.toon_calls(provider, model);
CREATE INDEX IF NOT EXISTS idx_metrics_engine_ts    ON metrics.engine_queries(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_engine_agent ON metrics.engine_queries(agent_id);
CREATE INDEX IF NOT EXISTS idx_metrics_engine_task  ON metrics.engine_queries(task_type);
CREATE INDEX IF NOT EXISTS idx_metrics_compile_ts   ON metrics.compiles(timestamp);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 8: Supabase Realtime (live dashboard updates)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE toongine_hermes_agents;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE toongine_hermes_activity;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE toongine_activity_log;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 9: Grant service_role write access
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA metrics TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA metrics TO service_role;
