#!/usr/bin/env python3
"""
toongine-pipeline.py — Hermes Session → Supabase Telemetry Bridge
Reads Hermes state.db, attributes sessions to projects via cwd/.toon/config.json,
pushes token/cost/session data to Supabase.

Runs every 5 minutes via cron. $0 LLM cost — pure read+POST.
"""

import sqlite3
import json
import os
import sys
import time
import http.client
from pathlib import Path
from datetime import datetime, timezone

# ─── Config ───────────────────────────────────────────────────────────────────
HERMES_DB = os.path.expanduser("~/.hermes/state.db")
SUPABASE_HOST = "mcejxdjrwzjxafciuely.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZWp4ZGpyd3pqeGFmY2l1ZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MjYyMTksImV4cCI6MjA2NDUwMjIxOX0.kqEvFZQU8Wl4KcWl0Ms5xuIaa32RlnZQsyGn0DM1DlE"

# How far back to look for new sessions
LOOKBACK_HOURS = 24
# Max sessions to process per run
MAX_SESSIONS = 200


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


# ─── Project Detection ────────────────────────────────────────────────────────
def find_project_config(cwd: str) -> dict | None:
    """Walk up from cwd to find .toon/config.json or .toongine.json."""
    if not cwd:
        return None

    p = Path(cwd).resolve()
    for parent in [p] + list(p.parents):
        # Check .toon/config.json first
        cfg_path = parent / ".toon" / "config.json"
        if cfg_path.exists():
            try:
                return json.loads(cfg_path.read_text())
            except:
                pass

        # Fallback: .toongine.json
        cfg_path = parent / ".toongine.json"
        if cfg_path.exists():
            try:
                data = json.loads(cfg_path.read_text())
                return {"repo_id": data.get("repo", "unknown/unknown"), "name": data.get("repo", "unknown").split("/")[-1]}
            except:
                pass

    return None


# ─── Supabase Helpers ─────────────────────────────────────────────────────────
def supabase_post(table: str, payload: dict, on_conflict: str = ""):
    """POST a row to Supabase REST API."""
    body = json.dumps(payload)
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    if on_conflict:
        headers["Prefer"] += ",resolution=merge-duplicates"
        table_path = f"/rest/v1/{table}?on_conflict={on_conflict}"
    else:
        table_path = f"/rest/v1/{table}"

    conn = http.client.HTTPSConnection(SUPABASE_HOST, timeout=15)
    try:
        conn.request("POST", table_path, body, headers)
        resp = conn.getresponse()
        resp.read()
        return resp.status in (200, 201)
    except Exception as e:
        log(f"  Supabase POST failed: {e}")
        return False
    finally:
        conn.close()


# ─── Main Pipeline ────────────────────────────────────────────────────────────
def main():
    log("ToonGine Pipeline — starting")

    if not os.path.exists(HERMES_DB):
        log(f"ERROR: Hermes DB not found at {HERMES_DB}")
        return

    db = sqlite3.connect(f"file:{HERMES_DB}?mode=ro", uri=True)
    db.row_factory = sqlite3.Row

    # Fetch sessions from last N hours
    cutoff = time.time() - (LOOKBACK_HOURS * 3600)
    sessions = db.execute(
        """SELECT id, cwd, title, model, source, started_at, ended_at,
                  input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
                  reasoning_tokens, estimated_cost_usd, actual_cost_usd,
                  message_count, tool_call_count, billing_provider
           FROM sessions
           WHERE started_at > ? AND archived = 0
           ORDER BY started_at DESC
           LIMIT ?""",
        (cutoff, MAX_SESSIONS),
    ).fetchall()

    log(f"Found {len(sessions)} sessions in last {LOOKBACK_HOURS}h")

    # Group by project
    project_sessions: dict[str, list] = {}
    project_configs: dict[str, dict] = {}
    unknown_sessions = []
    processed_snapshots = set()

    for s in sessions:
        cfg = find_project_config(s["cwd"])
        if cfg and cfg.get("repo_id"):
            rid = cfg["repo_id"]
            if rid not in project_configs:
                project_configs[rid] = cfg
            project_sessions.setdefault(rid, []).append(s)
        else:
            unknown_sessions.append(s)

    log(f"  {len(project_configs)} projects, {len(unknown_sessions)} unattributed sessions")

    # ── Per-project processing ───────────────────────────────────────────────
    for repo_id, config in project_configs.items():
        sess_list = project_sessions[repo_id]
        log(f"\n  📦 {repo_id}: {len(sess_list)} sessions")

        # ── Activity log ─────────────────────────────────────────────────────
        activity_count = 0
        for s in sess_list:
            tokens_total = (s["input_tokens"] or 0) + (s["output_tokens"] or 0) + \
                           (s["cache_read_tokens"] or 0) + (s["reasoning_tokens"] or 0)
            if tokens_total == 0:
                continue

            cost = s["estimated_cost_usd"] or s["actual_cost_usd"] or 0
            duration_sec = (s["ended_at"] - s["started_at"]) if s["ended_at"] else 0

            payload = {
                "repo_id": repo_id,
                "session_id": s["id"],
                "agent": config.get("name", "unknown"),
                "agent_name": config.get("name", "unknown"),
                "task": s["title"] or "—",
                "model": s["model"] or "unknown",
                "total_tokens": tokens_total,
                "input_tokens": s["input_tokens"] or 0,
                "output_tokens": s["output_tokens"] or 0,
                "estimated_cost": round(cost, 8),
                "duration_sec": round(duration_sec, 1) if duration_sec else None,
                "source": s["source"] or "hermes",
                "status": "completed" if s["ended_at"] else "running",
                "created_at": datetime.fromtimestamp(s["started_at"], tz=timezone.utc).isoformat(),
            }
            if supabase_post("toongine_activity_log", payload):
                activity_count += 1

        log(f"    Activity: {activity_count} rows pushed")

        # ── Snapshots ────────────────────────────────────────────────────────
        if sess_list:
            latest = sess_list[0]  # most recent
            total_input = sum((s["input_tokens"] or 0) for s in sess_list)
            total_output = sum((s["output_tokens"] or 0) for s in sess_list)
            total_cost = sum((s["estimated_cost_usd"] or s["actual_cost_usd"] or 0) for s in sess_list)
            message_count = sum(s["message_count"] or 0 for s in sess_list)
            tool_calls = sum(s["tool_call_count"] or 0 for s in sess_list)

            # Collect unique models
            models = set()
            for s in sess_list:
                if s["model"]:
                    models.add(s["model"])

            snapshot = {
                "repo_id": repo_id,
                "score": 87,  # default — real scoring is in health analyzer
                "metrics": json.dumps({
                    "sessions": len(sess_list),
                    "total_tokens": total_input + total_output,
                    "input_tokens": total_input,
                    "output_tokens": total_output,
                    "total_cost": round(total_cost, 6),
                    "message_count": message_count,
                    "tool_calls": tool_calls,
                    "models": sorted(models),
                }),
                "created_at": datetime.fromtimestamp(latest["started_at"], tz=timezone.utc).isoformat(),
            }
            snapshot_key = f"{repo_id}:{latest['started_at']:.0f}"
            if snapshot_key not in processed_snapshots:
                if supabase_post("toongine_snapshots", snapshot):
                    processed_snapshots.add(snapshot_key)
                    log(f"    Snapshot pushed")
            else:
                log(f"    Snapshot skipped (duplicate)")

            # ── Provider ledger ──────────────────────────────────────────────
            provider_map: dict[str, dict] = {}
            for s in sess_list:
                provider = s["billing_provider"] or (s["model"] or "unknown")
                tokens_total = (s["input_tokens"] or 0) + (s["output_tokens"] or 0) + \
                               (s["cache_read_tokens"] or 0) + (s["reasoning_tokens"] or 0)
                cost = s["estimated_cost_usd"] or s["actual_cost_usd"] or 0

                if provider not in provider_map:
                    provider_map[provider] = {"calls": 0, "tokens": 0, "cost": 0, "errors": 0}
                provider_map[provider]["calls"] += 1
                provider_map[provider]["tokens"] += tokens_total
                provider_map[provider]["cost"] += cost

            for provider, data in provider_map.items():
                payload = {
                    "repo_id": repo_id,
                    "provider_name": provider,
                    "calls": data["calls"],
                    "total_tokens": data["tokens"],
                    "total_cost": round(data["cost"], 8),
                    "errors": data["errors"],
                    "last_used_at": datetime.fromtimestamp(sess_list[0]["started_at"], tz=timezone.utc).isoformat(),
                }
                supabase_post("toongine_provider_ledger", payload)
            log(f"    Providers: {len(provider_map)} updated")

    # ── Unattributed report ──────────────────────────────────────────────────
    if unknown_sessions:
        log(f"\n  ⚠️  {len(unknown_sessions)} unattributed sessions (no .toon/config.json found)")
        for s in unknown_sessions[:5]:
            log(f"     cwd={s['cwd']}  title={s['title']}")

    log("\nPipeline complete.")


if __name__ == "__main__":
    main()
