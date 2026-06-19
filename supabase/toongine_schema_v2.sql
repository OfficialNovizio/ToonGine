-- =============================================================================
-- ToonGine Schema v2 — Repo-scoped Token Burn Engine
-- Data isolation by GitHub repo (owner/repo), auto-detected from git remote.
-- DSA: Append-Only Log + Ring Buffer Snapshots + State Machine Provider + Heap Leaderboard
-- =============================================================================

-- ── Project Registry (auto-registered on npm install) ──────────────────────
CREATE TABLE IF NOT EXISTS toongine_projects (
  repo_id         TEXT PRIMARY KEY,              -- "OfficialNovizio/YVON-OS"
  repo_name       TEXT NOT NULL,                 -- "YVON-OS"
  owner           TEXT NOT NULL,                 -- "OfficialNovizio"
  first_seen_at   TIMESTAMPTZ DEFAULT now(),
  last_active_at  TIMESTAMPTZ DEFAULT now(),
  total_runs      BIGINT DEFAULT 0,
  total_tokens    BIGINT DEFAULT 0,
  total_cost      DECIMAL(12,6) DEFAULT 0
);

-- ── Activity Log (Append-Only — never UPDATE, never DELETE) ─────────────────
CREATE TABLE IF NOT EXISTS toongine_activity_log (
  run_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id         TEXT NOT NULL REFERENCES toongine_projects(repo_id),
  agent_id        TEXT NOT NULL,
  agent_name      TEXT DEFAULT '',
  department      TEXT DEFAULT '',
  provider        TEXT NOT NULL,                 -- "deepseek" | "anthropic" | ...
  model           TEXT NOT NULL,                 -- "deepseek-chat" | "claude-opus-4" | ...
  tokens_in       INTEGER DEFAULT 0,             -- raw tokens before TOON
  tokens_out      INTEGER DEFAULT 0,             -- compressed tokens (after TOON)
  cost_usd        DECIMAL(10,6) DEFAULT 0,       -- actual $ charged
  duration_ms     INTEGER DEFAULT 0,             -- response latency
  task            TEXT DEFAULT '',               -- what the agent did
  status          TEXT DEFAULT 'completed',      -- completed | failed
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Composite index — covers 95% of queries
CREATE INDEX IF NOT EXISTS idx_activity_repo_time
  ON toongine_activity_log (repo_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_agent
  ON toongine_activity_log (repo_id, agent_id, created_at DESC);

-- ── Snapshots (Ring Buffer — pre-computed aggregates) ──────────────────────
-- 24 hourly + 30 daily + 12 monthly = 66 rows per repo. O(1) dashboard reads.
CREATE TABLE IF NOT EXISTS toongine_snapshots (
  id              BIGSERIAL PRIMARY KEY,
  repo_id         TEXT NOT NULL REFERENCES toongine_projects(repo_id),
  granularity     TEXT NOT NULL CHECK (granularity IN ('hour','day','month')),
  slot            INTEGER NOT NULL,              -- ring index (0-23, 0-29, 0-11)
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

CREATE INDEX IF NOT EXISTS idx_snapshots_repo
  ON toongine_snapshots (repo_id, granularity, slot);

-- ── Provider Ledger (Finite State Machine) ──────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_provider_current
  ON toongine_provider_ledger (repo_id, is_current)
  WHERE is_current = true;

-- ── Row Level Security (anon read, service_role write) ──────────────────────
ALTER TABLE toongine_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_provider_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read projects"   ON toongine_projects       FOR SELECT TO anon USING (true);
CREATE POLICY "anon read activity"   ON toongine_activity_log   FOR SELECT TO anon USING (true);
CREATE POLICY "anon read snapshots"  ON toongine_snapshots      FOR SELECT TO anon USING (true);
CREATE POLICY "anon read providers"  ON toongine_provider_ledger FOR SELECT TO anon USING (true);

-- ── Realtime for live dashboard ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE toongine_activity_log;
