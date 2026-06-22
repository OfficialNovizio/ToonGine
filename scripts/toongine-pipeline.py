#!/usr/bin/env python3
"""
toongine-pipeline.py — Hermes → Supabase Bridge (schema-compliant)
Reads Hermes state.db, attributes sessions to projects via cwd/.toon/config.json,
pushes to Supabase tables with correct column names.

Tables written:
  toongine_activity_log   (repo_id, agent_id, agent_name, tokens_in, tokens_out,
                           cost_usd, duration_ms, provider, model, department, task, status)
  toongine_snapshots      (repo_id, granularity='hour', slot, period_start, period_end,
                           tokens_total, cost_total, run_count, active_agents)
  toongine_provider_ledger(repo_id, provider, state, total_spent, total_tokens, is_current)
  toongine_hermes_agents  (id, name, role, department, status, last_active)
  toongine_projects       (repo_id, repo_name, owner, last_active_at, total_runs, total_tokens, total_cost)
"""

import sqlite3
import json
import os
import time
import http.client
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict

# ─── Config ───────────────────────────────────────────────────────────────────
HERMES_DB = os.path.expanduser("~/.hermes/state.db")
SUPABASE_HOST = "mcejxdjrwzjxafciuely.supabase.co"
SUPABASE_KEY = os.environ.get("TOONGINE_SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZWp4ZGpyd3pqeGFmY2l1ZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDI0MDAsImV4cCI6MjA2NTM3ODQwMH0.EaNqg9MZNfYLpBh7GX6hEK4xJfRLMj1DlE")  # anon key baked in

LOOKBACK_HOURS = 24
MAX_SESSIONS = 200


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


# ─── Project Detection ────────────────────────────────────────────────────────
def find_project_config(cwd: str) -> dict | None:
    if not cwd:
        return None
    p = Path(cwd).resolve()
    for parent in [p] + list(p.parents):
        cfg = parent / ".toon" / "config.json"
        if cfg.exists():
            try:
                return json.loads(cfg.read_text())
            except:
                pass
        cfg = parent / ".toongine.json"
        if cfg.exists():
            try:
                data = json.loads(cfg.read_text())
                rid = data.get("repo", "unknown/unknown")
                parts = rid.split("/")
                return {"repo_id": rid, "name": parts[-1] if len(parts) > 1 else rid, "owner": parts[0] if len(parts) > 1 else ""}
            except:
                pass
    return None


# ─── Supabase Helpers ─────────────────────────────────────────────────────────
def supabase_post(table: str, payload: dict, on_conflict: str = ""):
    body = json.dumps(payload)
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    path = f"/rest/v1/{table}"
    if on_conflict:
        headers["Prefer"] += ",resolution=merge-duplicates"
        path += f"?on_conflict={on_conflict}"

    conn = http.client.HTTPSConnection(SUPABASE_HOST, timeout=15)
    try:
        conn.request("POST", path, body, headers)
        resp = conn.getresponse()
        resp.read()
        return resp.status in (200, 201)
    except Exception as e:
        log(f"  Supabase POST failed ({table}): {e}")
        return False
    finally:
        conn.close()


def supabase_get(table: str, params: dict) -> list:
    """GET rows from Supabase with query params."""
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    path = f"/rest/v1/{table}?{qs}"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    conn = http.client.HTTPSConnection(SUPABASE_HOST, timeout=15)
    try:
        conn.request("GET", path, headers=headers)
        resp = conn.getresponse()
        data = json.loads(resp.read())
        return data if isinstance(data, list) else []
    except:
        return []
    finally:
        conn.close()


# ─── Main Pipeline ────────────────────────────────────────────────────────────
def main():
    start_time = time.time()
    log("ToonGine Pipeline v2 — starting")

    if not os.path.exists(HERMES_DB):
        log(f"ERROR: Hermes DB not found at {HERMES_DB}")
        return

    db = sqlite3.connect(f"file:{HERMES_DB}?mode=ro", uri=True)
    db.row_factory = sqlite3.Row

    cutoff = time.time() - (LOOKBACK_HOURS * 3600)

    # Fetch agent roster from Hermes (from skills dir)
    skills_dir = os.path.expanduser("~/.hermes/skills")
    herm_agents = set()
    if os.path.exists(skills_dir):
        for cat in os.listdir(skills_dir):
            cat_path = os.path.join(skills_dir, cat)
            if os.path.isdir(cat_path):
                # Agent skills might be in subdirectories
                for item in os.listdir(cat_path):
                    item_path = os.path.join(cat_path, item)
                    if os.path.isdir(item_path) and os.path.exists(os.path.join(item_path, "SKILL.md")):
                        herm_agents.add(item)

    # Fetch sessions
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
    project_sessions: dict[str, list] = defaultdict(list)
    project_configs: dict[str, dict] = {}
    unattributed = []

    for s in sessions:
        cfg = find_project_config(s["cwd"])
        if cfg and cfg.get("repo_id"):
            rid = cfg["repo_id"]
            project_configs.setdefault(rid, cfg)
            project_sessions[rid].append(s)
        else:
            unattributed.append(s)

    log(f"  {len(project_configs)} projects, {len(unattributed)} unattributed")

    # ── Per-project processing ────────────────────────────────────────────────
    for repo_id, config in project_configs.items():
        sess_list = project_sessions[repo_id]
        log(f"\n  📦 {repo_id}: {len(sess_list)} sessions")

        name = config.get("name", repo_id.split("/")[-1])
        owner = config.get("owner", repo_id.split("/")[0])

        # ── Upsert project ────────────────────────────────────────────────────
        project_tokens = sum(
            (s["input_tokens"] or 0) + (s["output_tokens"] or 0) +
            (s["cache_read_tokens"] or 0) + (s["reasoning_tokens"] or 0)
            for s in sess_list
        )
        project_cost = sum(s["estimated_cost_usd"] or s["actual_cost_usd"] or 0 for s in sess_list)

        supabase_post("toongine_projects", {
            "repo_id": repo_id,
            "repo_name": name,
            "owner": owner,
            "last_active_at": datetime.now(timezone.utc).isoformat(),
            "total_runs": len(sess_list),
            "total_tokens": project_tokens,
            "total_cost": round(project_cost, 6),
        }, on_conflict="repo_id")

        # ── Activity log ──────────────────────────────────────────────────────
        activity_count = 0
        for s in sess_list:
            tokens_in = (s["input_tokens"] or 0) + (s["cache_read_tokens"] or 0)
            tokens_out = (s["output_tokens"] or 0) + (s["reasoning_tokens"] or 0)
            if tokens_in + tokens_out == 0:
                continue

            cost = s["estimated_cost_usd"] or s["actual_cost_usd"] or 0
            duration_ms = int(((s["ended_at"] or s["started_at"]) - s["started_at"]) * 1000)
            provider = s["billing_provider"] or "deepseek"
            model = s["model"] or "unknown"
            agent_name = s["title"] or "agent"

            # Try to detect agent from title
            agent_id = "unknown"
            if s["title"]:
                title_lower = s["title"].lower()
                for a in herm_agents:
                    if a.lower() in title_lower:
                        agent_id = a
                        agent_name = a.title()
                        break

            payload = {
                "repo_id": repo_id,
                "agent_id": agent_id,
                "agent_name": agent_name,
                "department": "unknown",
                "provider": provider,
                "model": model,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "cost_usd": round(cost, 8),
                "duration_ms": duration_ms,
                "task": s["title"] or "—",
                "status": "completed" if s["ended_at"] else "running",
                "created_at": datetime.fromtimestamp(s["started_at"], tz=timezone.utc).isoformat(),
            }
            if supabase_post("toongine_activity_log", payload):
                activity_count += 1

        log(f"    Activity: {activity_count} rows")

        # ── Snapshots (hour granularity) ──────────────────────────────────────
        if sess_list:
            total_tokens = sum(
                (s["input_tokens"] or 0) + (s["output_tokens"] or 0) +
                (s["cache_read_tokens"] or 0) + (s["reasoning_tokens"] or 0)
                for s in sess_list
            )
            total_cost = sum(s["estimated_cost_usd"] or s["actual_cost_usd"] or 0 for s in sess_list)
            active_agents = len(set(
                s["title"] or "unknown" for s in sess_list
            ))

            # Use current hour as slot
            now = datetime.now(timezone.utc)
            hour_slot = now.hour
            hour_start = now.replace(minute=0, second=0, microsecond=0)

            snapshot = {
                "repo_id": repo_id,
                "granularity": "hour",
                "slot": hour_slot,
                "period_start": hour_start.isoformat(),
                "period_end": (hour_start.replace(hour=hour_start.hour + 1)).isoformat(),
                "tokens_total": total_tokens,
                "cost_total": round(total_cost, 6),
                "run_count": activity_count,
                "active_agents": active_agents,
                "efficiency_pct": 0,
                "created_at": now.isoformat(),
            }
            supabase_post("toongine_snapshots", snapshot)

        # ── Provider ledger ────────────────────────────────────────────────────
        provider_map: dict[str, dict] = {}
        for s in sess_list:
            provider = s["billing_provider"] or "deepseek"
            tokens_total = (s["input_tokens"] or 0) + (s["output_tokens"] or 0) + \
                           (s["cache_read_tokens"] or 0) + (s["reasoning_tokens"] or 0)
            cost = s["estimated_cost_usd"] or s["actual_cost_usd"] or 0

            if provider not in provider_map:
                provider_map[provider] = {"tokens": 0, "cost": 0}
            provider_map[provider]["tokens"] += tokens_total
            provider_map[provider]["cost"] += cost

        for provider, data in provider_map.items():
            payload = {
                "repo_id": repo_id,
                "provider": provider,
                "state": "active",
                "total_spent": round(data["cost"], 6),
                "total_tokens": data["tokens"],
                "is_current": True,
                "activated_at": datetime.now(timezone.utc).isoformat(),
            }
            supabase_post("toongine_provider_ledger", payload)

        # ── Agent Memory Sync ───────────────────────────────────────────────────
        # Push MEMORY.md content to Supabase (Vercel dashboard can't read VPS files)
        memory_count = 0
        try:
            toon_dir = Path(config.get("_cwd", "")) / ".toon" if config.get("_cwd") else None
            if not toon_dir:
                # Derive from first session's cwd
                first_cwd = sess_list[0]["cwd"] if sess_list else None
                if first_cwd:
                    toon_dir = Path(first_cwd) / ".toon"
            if not toon_dir or not toon_dir.exists():
                toon_dir = Path("/root") / repo_id.split("/")[-1] / ".toon"  # fallback
            agent_dir = toon_dir / "agents" if toon_dir else None
            if agent_dir and agent_dir.exists():
                for dept_dir in agent_dir.iterdir():
                    if not dept_dir.is_dir():
                        continue
                    for agent_sub in dept_dir.iterdir():
                        if not agent_sub.is_dir():
                            continue
                        mem_file = agent_sub / "MEMORY.md"
                        if not mem_file.exists():
                            continue
                        mtime = mem_file.stat().st_mtime
                        size = mem_file.stat().st_size
                        content = mem_file.read_text()[:200]
                        # Health heuristic
                        health = 100
                        if size < 200: health -= 30
                        if not content.startswith("#"): health -= 10
                        if "undefined" in content or "null" in content: health -= 5
                        health = max(0, min(100, health))
                        supabase_post("toongine_agent_memories", {
                            "repo_id": repo_id,
                            "agent_id": f"{dept_dir.name}/{agent_sub.name}",
                            "agent_name": agent_sub.name,
                            "department": dept_dir.name,
                            "content_size": size,
                            "health_score": health,
                            "last_modified": datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat(),
                        }, on_conflict="repo_id,agent_id")
                        memory_count += 1
                log(f"    Memory: {memory_count} agents synced")
        except Exception as e:
            log(f"    ⚠️ Memory sync: {e}")

    # ── Sync agents ───────────────────────────────────────────────────────────
    if herm_agents and project_configs:
        # Use first project as default for agent sync
        first_repo = list(project_configs.keys())[0]
        agent_count = 0
        for agent_name in herm_agents:
            payload = {
                "id": agent_name,
                "name": agent_name.replace("-", " ").title(),
                "role": "",
                "department": "unknown",
                "status": "idle",
                "last_active": datetime.now(timezone.utc).isoformat(),
            }
            supabase_post("toongine_hermes_agents", payload, on_conflict="id")
            agent_count += 1
        log(f"\n  Agents: {agent_count} synced")

    # ── Unattributed ──────────────────────────────────────────────────────────
    if unattributed:
        log(f"\n  ⚠️  {len(unattributed)} unattributed (cwd=None or no .toon/config.json)")
        for s in unattributed[:3]:
            log(f"     cwd={s['cwd']}  title={str(s['title'])[:60]}")

    elapsed = time.time() - start_time
    log(f"\nPipeline complete ({elapsed:.1f}s)")


if __name__ == "__main__":
    main()
