#!/usr/bin/env python3
"""
Hermes MCP Server — Graph Intelligence Bridge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Exposes 5 graph tools (toon_graph_*) to Hermes agents via Model Context Protocol.
Reads unified.db — the single source of truth built by `npx toongine init`.

Usage (called by Hermes, not manually):
  python3 .toon/hermes/mcp-server.py /root/yvon-engine

Protocol: JSON-RPC 2.0 over stdio (MCP 2024-11-05)
"""
import sys
import json
import sqlite3
import os
import traceback
from datetime import datetime


def log(msg: str) -> None:
    """Log to stderr so stdout stays clean for JSON-RPC."""
    print(f"[toon-mcp] {msg}", file=sys.stderr, flush=True)


# ─── SQLite Query Layer ────────────────────────────────────────────────

class GraphDB:
    """Read-only access to unified.db."""

    def __init__(self, db_path: str):
        conn = sqlite3.connect(db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        self.conn = conn

    def search(self, query: str, limit: int = 10) -> list[dict]:
        rows = self.conn.execute(
            """SELECT n.id, n.name, n.qualified_name, n.kind, n.file_path,
                      n.language, n.tool_source, n.community, n.extra
               FROM unified_nodes n
               JOIN nodes_fts fts ON n.rowid = fts.rowid
               WHERE nodes_fts MATCH ?
               ORDER BY rank
               LIMIT ?""",
            (query, limit)
        ).fetchall()
        return [dict(r) for r in rows]

    def find_callers(self, node_id: str, limit: int = 20) -> list[dict]:
        rows = self.conn.execute(
            """SELECT n.id, n.name, n.kind, n.file_path, e.kind as edge_kind
               FROM unified_nodes n
               JOIN unified_edges e ON n.id = e.source_id
               WHERE e.target_id = ?
               LIMIT ?""",
            (node_id, limit)
        ).fetchall()
        return [dict(r) for r in rows]

    def find_callees(self, node_id: str, limit: int = 20) -> list[dict]:
        rows = self.conn.execute(
            """SELECT n.id, n.name, n.kind, n.file_path, e.kind as edge_kind
               FROM unified_nodes n
               JOIN unified_edges e ON n.id = e.target_id
               WHERE e.source_id = ?
               LIMIT ?""",
            (node_id, limit)
        ).fetchall()
        return [dict(r) for r in rows]

    def impact(self, node_id: str, max_depth: int = 3) -> list[str]:
        visited: set[str] = set()
        queue: list[tuple[str, int]] = [(node_id, 0)]
        while queue:
            nid, depth = queue.pop(0)
            if nid in visited or depth >= max_depth:
                continue
            visited.add(nid)
            rows = self.conn.execute(
                "SELECT source_id FROM unified_edges WHERE target_id = ? LIMIT 50",
                (nid,)
            ).fetchall()
            for row in rows:
                sid = row["source_id"]
                if sid not in visited:
                    queue.append((sid, depth + 1))
        return list(visited)

    def stats(self) -> dict:
        nc = self.conn.execute("SELECT COUNT(*) as c FROM unified_nodes").fetchone()
        ec = self.conn.execute("SELECT COUNT(*) as c FROM unified_edges").fetchone()
        fc = self.conn.execute(
            "SELECT COUNT(DISTINCT file_path) as c FROM unified_nodes WHERE kind = 'File'"
        ).fetchone()
        tool_rows = self.conn.execute(
            "SELECT tool_source, COUNT(*) as c FROM unified_nodes GROUP BY tool_source ORDER BY c DESC"
        ).fetchall()
        lang_rows = self.conn.execute(
            "SELECT language, COUNT(*) as c FROM unified_nodes WHERE kind = 'File' AND language IS NOT NULL GROUP BY language ORDER BY c DESC"
        ).fetchall()
        meta_row = self.conn.execute(
            "SELECT value FROM unified_meta WHERE key = 'last_built'"
        ).fetchone()

        last_built = meta_row["value"] if meta_row else None
        stale = True
        if last_built:
            try:
                t = datetime.fromisoformat(last_built.replace("Z", "+00:00"))
                stale = (datetime.now().timestamp() - t.timestamp()) > 60
            except Exception:
                pass

        return {
            "nodeCount": nc["c"],
            "edgeCount": ec["c"],
            "fileCount": fc["c"],
            "toolBreakdown": {r["tool_source"]: r["c"] for r in tool_rows},
            "languageBreakdown": {r["language"]: r["c"] for r in lang_rows},
            "lastBuilt": last_built,
            "stale": stale,
        }

    def close(self) -> None:
        self.conn.close()


# ─── Tool Handlers ─────────────────────────────────────────────────────

class ToolHandlers:
    def __init__(self, db: GraphDB):
        self.db = db

    def explore(self, args: dict) -> str:
        query = args.get("query", "")
        if not query:
            return json.dumps({"error": "Missing required parameter: query"})
        limit = min(args.get("limit", 10), 50)
        results = self.db.search(query, limit)
        return json.dumps({
            "results": [{
                "name": r.get("name", ""),
                "kind": r.get("kind", ""),
                "file": r.get("file_path", ""),
                "language": r.get("language", ""),
                "source": r.get("tool_source", ""),
            } for r in results],
            "count": len(results),
        })

    def callers(self, args: dict) -> str:
        symbol = args.get("symbol", "")
        if not symbol:
            return json.dumps({"error": "Missing required parameter: symbol"})
        # Find node by name match
        matches = self.db.search(symbol, 1)
        if not matches:
            return json.dumps({"error": f"Symbol not found: {symbol}"})
        limit = min(args.get("limit", 20), 100)
        callers = self.db.find_callers(matches[0]["id"], limit)
        return json.dumps({
            "symbol": matches[0]["name"],
            "callers": [{
                "name": c.get("name", ""),
                "kind": c.get("kind", ""),
                "file": c.get("file_path", ""),
                "edge": c.get("edge_kind", ""),
            } for c in callers],
            "count": len(callers),
        })

    def impact(self, args: dict) -> str:
        symbol = args.get("symbol", "")
        if not symbol:
            return json.dumps({"error": "Missing required parameter: symbol"})
        matches = self.db.search(symbol, 1)
        if not matches:
            return json.dumps({"error": f"Symbol not found: {symbol}"})
        depth = min(args.get("depth", 3), 10)
        impacted = self.db.impact(matches[0]["id"], depth)
        return json.dumps({
            "symbol": matches[0]["name"],
            "impactedCount": len(impacted),
            "depth": depth,
        })

    def search(self, args: dict) -> str:
        query = args.get("query", "")
        if not query:
            return json.dumps({"error": "Missing required parameter: query"})
        limit = min(args.get("limit", 20), 100)
        results = self.db.search(query, limit)
        return json.dumps({
            "results": [r.get("name", "") for r in results],
            "count": len(results),
        })

    def status(self, _args: dict) -> str:
        stats = self.db.stats()
        return json.dumps(stats)

    def handle(self, tool_name: str, args: dict) -> str:
        handlers = {
            "toon_graph_explore": self.explore,
            "toon_graph_callers": self.callers,
            "toon_graph_impact": self.impact,
            "toon_graph_search": self.search,
            "toon_graph_status": self.status,
        }
        handler = handlers.get(tool_name)
        if handler is None:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})
        try:
            return handler(args)
        except Exception as e:
            log(f"Tool error [{tool_name}]: {e}")
            return json.dumps({"error": str(e)})


# ─── MCP Protocol ──────────────────────────────────────────────────────

TOOLS_DEF = [
    {
        "name": "toon_graph_explore",
        "description": "Explore the code knowledge graph with a natural language query. Returns relevant symbols, their source, and relationships.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "What to explore (e.g., 'auth flow', 'database connection')"},
                "limit": {"type": "number", "description": "Max results (default 10)"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "toon_graph_callers",
        "description": "Find all callers of a symbol (who calls this function/class/method).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "symbol": {"type": "string", "description": "Symbol name to find callers for"},
                "limit": {"type": "number", "description": "Max results (default 20)"},
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "toon_graph_impact",
        "description": "Analyze blast radius — what code is affected by changing a symbol. Returns call chain up to 3 levels deep.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "symbol": {"type": "string", "description": "Symbol to analyze impact for"},
                "depth": {"type": "number", "description": "Max depth (default 3)"},
            },
            "required": ["symbol"],
        },
    },
    {
        "name": "toon_graph_search",
        "description": "Full-text search across all graph nodes (files, symbols, communities).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query (FTS5 syntax)"},
                "limit": {"type": "number", "description": "Max results (default 20)"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "toon_graph_status",
        "description": "Get graph health — node/edge counts, tool coverage, staleness, language breakdown.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
]


def run_mcp(project_root: str) -> None:
    """Main MCP loop: read JSON-RPC from stdin, respond to stdout."""
    db_path = os.path.join(project_root, ".toon", "graph", "unified.db")
    if not os.path.exists(db_path):
        log(f"FATAL: unified.db not found at {db_path} — run 'npx toongine init' first")
        sys.exit(1)

    db = GraphDB(db_path)
    handlers = ToolHandlers(db)

    initialized = False
    log(f"Server started, db={db_path}")

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
        except json.JSONDecodeError:
            log(f"Bad JSON: {line[:100]}")
            continue

        req_id = request.get("id")
        method = request.get("method", "")
        params = request.get("params", {})

        # ─── initialize ─────────────────────────────────────────────
        if method == "initialize":
            response = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "serverInfo": {
                        "name": "toongine-graph-bridge",
                        "version": "4.0.0",
                    },
                },
            }
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
            initialized = True

        # ─── notifications/initialized ──────────────────────────────
        elif method == "notifications/initialized":
            # No response needed for notifications
            log("Client initialized notification received")

        # ─── tools/list ─────────────────────────────────────────────
        elif method == "tools/list":
            if not initialized:
                log("ERROR: tools/list before initialize")
                continue
            response = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"tools": TOOLS_DEF},
            }
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()

        # ─── tools/call ─────────────────────────────────────────────
        elif method == "tools/call":
            if not initialized:
                log("ERROR: tools/call before initialize")
                continue
            tool_name = params.get("name", "")
            tool_args = params.get("arguments", {})
            log(f"CALL {tool_name} args={json.dumps(tool_args)[:100]}")
            result_text = handlers.handle(tool_name, tool_args)
            response = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {"type": "text", "text": result_text}
                    ]
                },
            }
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()

        # ─── ping ──────────────────────────────────────────────────
        elif method == "ping":
            response = {"jsonrpc": "2.0", "id": req_id, "result": {}}
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()

        # ─── Unknown ────────────────────────────────────────────────
        else:
            log(f"Unknown method: {method}")
            response = {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32601,
                    "message": f"Method not found: {method}",
                },
            }
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()

    db.close()
    log("Server stopped")


# ─── Entrypoint ────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 mcp-server.py <project-root>", file=sys.stderr)
        sys.exit(1)

    project_root = os.path.abspath(sys.argv[1])
    try:
        run_mcp(project_root)
    except KeyboardInterrupt:
        log("Interrupted")
    except Exception as e:
        log(f"FATAL: {e}\n{traceback.format_exc()}")
        sys.exit(1)
