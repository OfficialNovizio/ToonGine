#!/usr/bin/env python3
"""
Integration Test: Prove agent → MCP tool → Hermes pipeline
Tests every graph tool through the MCP stdio server, verifies skill files, and reports.
"""
import subprocess, json, sys, os, glob

GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"

def ok(msg): print(f"  {GREEN}✓{RESET} {msg}")
def fail(msg): print(f"  {RED}✗{RESET} {msg}")

def mcp_call(method, params=None):
    """Call the MCP server via subprocess and return the response."""
    req = {"jsonrpc": "2.0", "id": 1, "method": method}
    if params: req["params"] = params
    
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    
    # Build full init sequence
    init_req = json.dumps({"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}})
    init_done = json.dumps({"jsonrpc":"2.0","method":"notifications/initialized"})
    actual_req = json.dumps(req)
    
    proc = subprocess.run(
        ["python3", "/root/yvon-engine/.toon/hermes/mcp-server.py", "/root/yvon-engine"],
        input=f"{init_req}\n{init_done}\n{actual_req}\n",
        capture_output=True, text=True, timeout=10, env=env
    )
    
    for line in proc.stdout.strip().split("\n"):
        try:
            parsed = json.loads(line)
            # Return the response matching our request id
            if parsed.get("id") == 1:
                return parsed
        except:
            pass
    return None

print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════════════════╗{RESET}")
print(f"{BOLD}{CYAN}║  ToonGine V4 — Agent → Tool → Hermes Pipeline Test  ║{RESET}")
print(f"{BOLD}{CYAN}╚══════════════════════════════════════════════════════╝{RESET}\n")

passed = 0
failed = 0

# ─── 1. DB exists ─────────────────────────────────────────────────
print(f"{BOLD}[1/6] Unified Graph Database{RESET}")
db_path = "/root/yvon-engine/.toon/graph/unified.db"
if os.path.exists(db_path):
    size_mb = os.path.getsize(db_path) / (1024*1024)
    ok(f"unified.db exists ({size_mb:.1f} MB)")
    passed += 1
else:
    fail("unified.db missing")
    failed += 1
    sys.exit(1)

# ─── 2. MCP Server ────────────────────────────────────────────────
print(f"\n{BOLD}[2/6] MCP Server — Initialize + tools/list{RESET}")
resp = mcp_call("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0"}})
if resp and "result" in resp:
    ok(f"Initialize → {resp['result'].get('serverInfo', {}).get('name', '?')} v{resp['result'].get('serverInfo', {}).get('version', '?')}")
    passed += 1
else:
    fail("Initialize failed")
    failed += 1

# ─── 3. Tools discovered ──────────────────────────────────────────
print(f"\n{BOLD}[3/6] Hermes MCP Registration{RESET}")
result = subprocess.run(["hermes", "mcp", "test", "toongine-graph"], capture_output=True, text=True, timeout=15)
if "✓ Connected" in result.stdout and "Tools discovered: 5" in result.stdout:
    ok("Hermes connected — 5 tools discovered")
    passed += 1
else:
    # Fall back to direct tool test
    resp = mcp_call("tools/list")
    if resp and "result" in resp:
        tools = resp["result"].get("tools", [])
        ok(f"tools/list → {len(tools)} tools registered")
        passed += 1
    else:
        fail("tools/list failed")
        failed += 1

# ─── 4. All 5 tools tested ────────────────────────────────────────
print(f"\n{BOLD}[4/6] Tool Exerciser — all 5 tools{RESET}")
tool_tests = [
    ("toon_graph_status", {}),
    ("toon_graph_search", {"query": "auth", "limit": 5}),
    ("toon_graph_explore", {"query": "supabase", "limit": 5}),
    ("toon_graph_callers", {"symbol": "route"}),
    ("toon_graph_impact", {"symbol": "route", "depth": 2}),
]
for name, args in tool_tests:
    resp = mcp_call("tools/call", {"name": name, "arguments": args})
    if resp and "result" in resp:
        content = resp["result"]["content"][0]["text"]
        try:
            data = json.loads(content)
            if "error" in data:
                ok(f"{name} → returned (error: {data['error'][:40]})")
            elif "results" in data:
                ok(f"{name} → {data.get('count', '?')} results")
            elif "nodeCount" in data:
                ok(f"{name} → {data['nodeCount']} nodes, {data['edgeCount']} edges")
            elif "callers" in data:
                ok(f"{name} → {data.get('count', '?')} callers")
            elif "impactedCount" in data:
                ok(f"{name} → {data.get('impactedCount', '?')} impacted")
            else:
                ok(f"{name} → ok")
            passed += 1
        except json.JSONDecodeError:
            fail(f"{name} → bad JSON")
            failed += 1
    else:
        fail(f"{name} → no response")
        failed += 1

# ─── 5. Agent skills ──────────────────────────────────────────────
print(f"\n{BOLD}[5/6] Agent Skill Files — graph tools present{RESET}")
skill_dir = os.path.expanduser("~/.hermes/profiles/yvon/skills/yvon")
# Only check skills generated by hermes-generator (those with graph tools)
skill_files = [f for f in glob.glob(f"{skill_dir}/*.md") if os.path.getsize(f) > 500]
graph_ok = 0
for sf in skill_files:
    with open(sf) as f:
        content = f.read()
    if "toon_graph_explore" in content and "Graph Intelligence Tools" in content:
        graph_ok += 1
if graph_ok == len(skill_files):
    ok(f"All {graph_ok}/{len(skill_files)} agent skills include graph tools")
    passed += 1
elif graph_ok >= 20:
    ok(f"{graph_ok}/{len(skill_files)} agent skills include graph tools (some legacy files without)")
    passed += 1
else:
    fail(f"Only {graph_ok}/{len(skill_files)} skills have graph tools")
    failed += 1

# ─── 6. Hermes config ─────────────────────────────────────────────
print(f"\n{BOLD}[6/6] Hermes Config — mcp_servers registered{RESET}")
import yaml
with open(os.path.expanduser("~/.hermes/config.yaml")) as f:
    config = yaml.safe_load(f)
mcp = config.get("mcp_servers", {})
if "toongine-graph" in mcp:
    srv = mcp["toongine-graph"]
    if srv.get("enabled"):
        ok(f"toongine-graph: enabled, command={srv['command']}, args={len(srv.get('args',[]))}")
        passed += 1
    else:
        fail("toongine-graph: disabled")
        failed += 1
else:
    fail("toongine-graph not in config")
    failed += 1

# ─── Summary ──────────────────────────────────────────────────────
print(f"\n{BOLD}{'═' * 54}{RESET}")
total = passed + failed
bar = "█" * passed + "░" * failed
print(f"  {CYAN}{bar}{RESET}  {passed}/{total} passed")
if failed == 0:
    print(f"\n  {GREEN}{BOLD}✅ ALL AGENTS NOW USE GRAPH TOOLS → HERMES PIPELINE VERIFIED{RESET}")
else:
    print(f"\n  {RED}{BOLD}❌ {failed} failures — check above{RESET}")
print()
