-- =============================================================================
-- ToonGine Schema v3 — Project Health Engine
-- 5 new tables: codebase_snapshots, api_health, issues, health_events, recommendations
-- All repo-scoped. DSA: Ring Buffer + Sliding Window + Priority Queue + Event Log + Rule Engine
-- =============================================================================

-- ── Codebase Snapshots (Ring Buffer — 30 daily slots per repo) ──────────────
CREATE TABLE IF NOT EXISTS toongine_codebase_snapshots (
  repo_id         TEXT NOT NULL,
  slot            INT NOT NULL,              -- 0–29, overwrites oldest
  sampled_at      TIMESTAMPTZ DEFAULT now(),
  ts_errors       INT DEFAULT 0,
  ts_error_free   BOOLEAN DEFAULT true,
  files_total     INT DEFAULT 0,
  lines_total     INT DEFAULT 0,
  build_duration_ms INT DEFAULT 0,
  dependencies    INT DEFAULT 0,
  outdated_deps   INT DEFAULT 0,
  UNIQUE(repo_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_codebase_repo ON toongine_codebase_snapshots(repo_id, slot);

-- ── API Health Log (Append-Only — sliding window queries) ────────────────────
CREATE TABLE IF NOT EXISTS toongine_api_health (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL,
  endpoint        TEXT NOT NULL,
  status_code     INT NOT NULL,
  duration_ms     INT DEFAULT 0,
  error_message   TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_repo_time ON toongine_api_health(repo_id, created_at DESC);

-- ── Issues (Priority Queue — ordered by severity × age) ─────────────────────
CREATE TABLE IF NOT EXISTS toongine_issues (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL,
  severity        INT NOT NULL DEFAULT 3,    -- 1=critical,2=high,3=medium,4=low
  source          TEXT DEFAULT 'manual',     -- tsc|build|api|system|manual|docs
  title           TEXT NOT NULL,
  detail          TEXT DEFAULT '',
  resolved        BOOLEAN DEFAULT false,
  resolution_time_h FLOAT,
  opened_at       TIMESTAMPTZ DEFAULT now(),
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_issues_open ON toongine_issues(repo_id, severity) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_issues_resolved ON toongine_issues(repo_id, resolved_at DESC) WHERE resolved = true;

-- ── Health Events (Timeline log) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS toongine_health_events (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL,
  event_type      TEXT NOT NULL,             -- commit|deploy|error_spike|fix|anomaly|pulse|recovery
  severity        INT DEFAULT 0,            -- 0=info 1=warn 2=critical
  title           TEXT NOT NULL,
  detail          TEXT DEFAULT '',
  linked_commit   TEXT,                     -- commit SHA
  linked_agent    TEXT,                     -- agent name
  health_impact   FLOAT DEFAULT 0,          -- ± health points
  occurred_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_repo_time ON toongine_health_events(repo_id, occurred_at DESC);

-- ── Recommendations Cache (pre-computed fix suggestions) ─────────────────────
CREATE TABLE IF NOT EXISTS toongine_recommendations (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL,
  priority        INT NOT NULL,             -- 0=P0 1=P1 2=P2
  category        TEXT NOT NULL,            -- codebase|api|toon|issues
  title           TEXT NOT NULL,
  detail          TEXT DEFAULT '',
  impact_points   FLOAT DEFAULT 0,          -- estimated health gain
  effort_minutes  INT DEFAULT 30,
  generated_at    TIMESTAMPTZ DEFAULT now(),
  dismissed       BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_recs_active ON toongine_recommendations(repo_id, priority) WHERE dismissed = false;

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE toongine_codebase_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_api_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read codebase"  ON toongine_codebase_snapshots FOR SELECT TO anon USING (true);
CREATE POLICY "anon read api"       ON toongine_api_health        FOR SELECT TO anon USING (true);
CREATE POLICY "anon read issues"    ON toongine_issues            FOR SELECT TO anon USING (true);
CREATE POLICY "anon read events"    ON toongine_health_events     FOR SELECT TO anon USING (true);
CREATE POLICY "anon read recs"      ON toongine_recommendations   FOR SELECT TO anon USING (true);
