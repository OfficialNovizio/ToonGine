-- =============================================================================
-- ToonGine Hermes Sync Schema
-- Run this in the ToonGine Supabase project's SQL Editor
-- =============================================================================

-- Agent roster — synced every 5 min from VPS
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

-- Activity feed — what agents did
CREATE TABLE IF NOT EXISTS toongine_hermes_activity (
  id              BIGSERIAL PRIMARY KEY,
  agent_name      TEXT NOT NULL,
  task            TEXT DEFAULT '',
  tokens          INTEGER DEFAULT 0,
  duration_sec    FLOAT DEFAULT 0,
  status          TEXT DEFAULT 'completed',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Advisory Council decisions
CREATE TABLE IF NOT EXISTS toongine_hermes_council (
  id              BIGSERIAL PRIMARY KEY,
  topic           TEXT NOT NULL,
  decision        TEXT DEFAULT '',
  votes           JSONB DEFAULT '{}'::jsonb,
  summary         TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Sync heartbeat — tracks when data was last refreshed
CREATE TABLE IF NOT EXISTS toongine_hermes_sync_log (
  id              BIGSERIAL PRIMARY KEY,
  synced_at       TIMESTAMPTZ DEFAULT now(),
  agents_count    INTEGER DEFAULT 0,
  activity_count  INTEGER DEFAULT 0,
  council_count   INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'ok'
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_agents_dept      ON toongine_hermes_agents (department);
CREATE INDEX IF NOT EXISTS idx_agents_status    ON toongine_hermes_agents (status);
CREATE INDEX IF NOT EXISTS idx_activity_time    ON toongine_hermes_activity (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_agent   ON toongine_hermes_activity (agent_name);
CREATE INDEX IF NOT EXISTS idx_council_time     ON toongine_hermes_council (created_at DESC);

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE toongine_hermes_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE toongine_hermes_activity;

-- Row-level security: allow service_role full access, anon read-only
ALTER TABLE toongine_hermes_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_hermes_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_hermes_council ENABLE ROW LEVEL SECURITY;
ALTER TABLE toongine_hermes_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read agents"    ON toongine_hermes_agents   FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read activity"  ON toongine_hermes_activity FOR SELECT TO anon USING (true);
CREATE POLICY "anon can read council"   ON toongine_hermes_council  FOR SELECT TO anon USING (true);
