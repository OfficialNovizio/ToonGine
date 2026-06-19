-- 060_project_health_v4.sql
-- Complete project health schema: issues, TOON health, codebase, API, events, recommendations
-- Executes against Supabase (public schema, toongine_* namespace)

-- ── 1. Issues Priority Queue ──────────────────────────────────────────────────
DROP TABLE IF EXISTS toongine_issues CASCADE;
CREATE TABLE toongine_issues (
  id BIGSERIAL PRIMARY KEY,
  repo_id TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority >= 0 AND priority <= 3),
  category TEXT NOT NULL DEFAULT 'bug',
  title TEXT NOT NULL,
  detail TEXT,
  source TEXT,            -- 'tsc', 'lint', 'api', 'manual', 'agent'
  file_path TEXT,         -- source file if applicable
  line_number INTEGER,    -- source line if applicable
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wontfix')),
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity >= 0 AND severity <= 3),
  impact_points REAL DEFAULT 0,
  effort_minutes INTEGER DEFAULT 0,
  assigned_to TEXT,       -- agent_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_issues_repo ON toongine_issues(repo_id);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON toongine_issues(repo_id, priority, status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON toongine_issues(repo_id, category);

ALTER TABLE toongine_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY issues_repo_isolation ON toongine_issues
  FOR ALL USING (repo_id = current_setting('request.jwt.claims')::json->>'repo_id')
  WITH CHECK (repo_id = current_setting('request.jwt.claims')::json->>'repo_id');

-- ── 2. TOON Compression Health ───────────────────────────────────────────────
DROP TABLE IF EXISTS toongine_toon_health CASCADE;
CREATE TABLE toongine_toon_health (
  id BIGSERIAL PRIMARY KEY,
  repo_id TEXT NOT NULL,
  sampled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Compile cache
  files_cached INTEGER DEFAULT 0,        -- files tracked in compile-cache
  cache_size_bytes INTEGER DEFAULT 0,    -- size of .compile-cache.json
  
  -- Graph DB
  graph_nodes INTEGER DEFAULT 0,         -- unified_nodes count
  graph_edges INTEGER DEFAULT 0,         -- unified_edges count
  graph_size_bytes INTEGER DEFAULT 0,    -- unified.db size
  
  -- TOON compression stats
  total_docs INTEGER DEFAULT 0,          -- total documents in .toon/
  total_files INTEGER DEFAULT 0,         -- total files in .toon/ (incl assets)
  toon_dir_size_bytes INTEGER DEFAULT 0, -- total .toon/ directory size
  
  -- Agent skill compression
  agents_with_skills INTEGER DEFAULT 0,  -- agents with .skillfish.json
  total_skills INTEGER DEFAULT 0,        -- total skillfish files
  avg_skills_per_agent REAL DEFAULT 0,
  
  -- Health flags
  cache_stale BOOLEAN DEFAULT false,     -- cache older than 24h
  graph_orphaned BOOLEAN DEFAULT false,  -- nodes with no edges > 10%
  compression_ratio REAL DEFAULT 0,      -- estimated token savings ratio
  
  -- Errors
  compile_errors INTEGER DEFAULT 0,
  graph_errors INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_toon_health_repo ON toongine_toon_health(repo_id);
CREATE INDEX IF NOT EXISTS idx_toon_health_ts ON toongine_toon_health(repo_id, sampled_at DESC);

ALTER TABLE toongine_toon_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY toon_health_repo_isolation ON toongine_toon_health
  FOR ALL USING (repo_id = current_setting('request.jwt.claims')::json->>'repo_id')
  WITH CHECK (repo_id = current_setting('request.jwt.claims')::json->>'repo_id');

-- ── 3. Codebase Snapshots (enhanced) ────────────────────────────────────────
-- Already exists: toongine_codebase_snapshots
-- Add columns if missing (safe DDL)
DO $$ 
BEGIN
  BEGIN ALTER TABLE toongine_codebase_snapshots ADD COLUMN build_duration_ms INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE toongine_codebase_snapshots ADD COLUMN lines_total INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE toongine_codebase_snapshots ADD COLUMN dependencies INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE toongine_codebase_snapshots ADD COLUMN outdated_deps INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE toongine_codebase_snapshots ADD COLUMN lint_errors INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE toongine_codebase_snapshots ADD COLUMN lint_warnings INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- ── 4. API Health (enhanced) ─────────────────────────────────────────────────
-- Already exists: toongine_api_health
DO $$ 
BEGIN
  BEGIN ALTER TABLE toongine_api_health ADD COLUMN latency_ms INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE toongine_api_health ADD COLUMN user_agent TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE toongine_api_health ADD COLUMN ip_hash TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- ── 5. Health Dashboard Materialized View ────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS toongine_health_dashboard;
CREATE MATERIALIZED VIEW toongine_health_dashboard AS
SELECT
  repo_id,
  -- Codebase score (0-25)
  CASE 
    WHEN COUNT(*) FILTER (WHERE ts_error_free = true)::float / NULLIF(COUNT(*), 0) > 0.95 THEN 25
    WHEN COUNT(*) FILTER (WHERE ts_error_free = true)::float / NULLIF(COUNT(*), 0) > 0.8 THEN 15
    ELSE 5
  END as codebase_score,
  -- API score (0-25)
  CASE
    WHEN COUNT(*) FILTER (WHERE status_code >= 500)::float / NULLIF(COUNT(*), 0) < 0.01 THEN 25
    WHEN COUNT(*) FILTER (WHERE status_code >= 500)::float / NULLIF(COUNT(*), 0) < 0.05 THEN 15
    ELSE 5
  END as api_score,
  -- TOON score (0-25)
  CASE
    WHEN AVG(compression_ratio) > 0.99 THEN 25
    WHEN AVG(compression_ratio) > 0.95 THEN 15
    ELSE 5
  END as toon_score,
  -- Issues score (0-25)
  CASE
    WHEN COUNT(*) FILTER (WHERE priority = 0 AND status = 'open') = 0 THEN 25
    WHEN COUNT(*) FILTER (WHERE priority <= 1 AND status = 'open') <= 2 THEN 15
    ELSE 5
  END as issues_score,
  COUNT(*) FILTER (WHERE ts_error_free = true) as clean_builds,
  COUNT(*) FILTER (WHERE status_code >= 500) as api_errors,
  COUNT(*) FILTER (WHERE priority = 0 AND status = 'open') as p0_issues,
  COUNT(*) FILTER (WHERE priority <= 1 AND status = 'open') as critical_issues,
  AVG(compression_ratio) as avg_compression,
  MAX(sampled_at) as last_updated
FROM toongine_codebase_snapshots
FULL OUTER JOIN toongine_api_health USING (repo_id)
FULL OUTER JOIN toongine_toon_health USING (repo_id)
FULL OUTER JOIN toongine_issues USING (repo_id)
GROUP BY repo_id;
