#!/usr/bin/env python3
"""autoresearch MCP stdio server — 4th ToonGine tool.
Provides: autoresearch_run, autoresearch_list, autoresearch_best, autoresearch_status
"""
import sys, os, json, subprocess, glob, time
from pathlib import Path

TOON_DIR = os.environ.get('TOONGINE_PROJECT', 
               os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # scripts/ → parent = project root
AR_DIR = os.path.join(TOON_DIR, '.toon', 'autoresearch')

def find_uv():
    for p in ['uv', os.path.expanduser('~/.local/bin/uv'), os.path.expanduser('~/.cargo/bin/uv')]:
        if os.path.exists(p):
            return p
    return None

def run_experiment(description: str = ""):
    """Run one training experiment (5 min). Returns metrics."""
    if not os.path.exists(AR_DIR):
        return {"error": "autoresearch not set up — run npx toongine init"}
    
    uv = find_uv()
    if not uv:
        return {"error": "uv not found — install: curl -LsSf https://astral.sh/uv/install.sh | sh"}
    
    train_py = os.path.join(AR_DIR, 'train.py')
    if not os.path.exists(train_py):
        return {"error": "train.py not found"}
    
    start = time.time()
    try:
        result = subprocess.run(
            [uv, 'run', 'train.py'],
            cwd=AR_DIR,
            capture_output=True, text=True, timeout=420  # 7 min max
        )
        elapsed = time.time() - start
        
        # Parse output for metrics
        output = result.stdout + result.stderr
        metrics = {}
        for line in output.split('\n'):
            line = line.strip()
            if ': ' in line:
                key, _, val = line.partition(': ')
                key = key.strip().lower().replace(' ', '_')
                try:
                    metrics[key] = float(val)
                except ValueError:
                    metrics[key] = val
        
        # Log to results.tsv
        tsv_path = os.path.join(AR_DIR, 'results.tsv')
        exists = os.path.exists(tsv_path)
        with open(tsv_path, 'a') as f:
            if not exists:
                f.write("commit\tval_bpb\tmemory_gb\tstatus\tdescription\n")
            f.write(f"experiment\t{metrics.get('val_bpb', 'crash')}\t"
                   f"{metrics.get('peak_vram_mb', 0)/1024:.1f}\t"
                   f"{'keep' if metrics.get('val_bpb', 1) < 1.0 else 'discard'}\t{description}\n")
        
        return {
            "success": result.returncode == 0,
            "elapsed": elapsed,
            "metrics": {k: v for k, v in metrics.items() if k in ('val_bpb', 'training_seconds', 'num_params_M', 'depth', 'peak_vram_mb')},
            "description": description,
        }
    except subprocess.TimeoutExpired:
        return {"error": "Experiment timed out (>7 min)", "success": False}
    except Exception as e:
        return {"error": str(e), "success": False}

def list_experiments():
    """List all past experiments from results.tsv."""
    tsv_path = os.path.join(AR_DIR, 'results.tsv')
    if not os.path.exists(tsv_path):
        return {"experiments": [], "total": 0}
    
    experiments = []
    with open(tsv_path) as f:
        lines = f.readlines()
    for line in lines[1:]:  # Skip header
        parts = line.strip().split('\t')
        if len(parts) >= 5:
            experiments.append({
                "commit": parts[0],
                "val_bpb": parts[1],
                "memory_gb": parts[2],
                "status": parts[3],
                "description": parts[4],
            })
    
    return {"experiments": experiments[-20:], "total": len(experiments)}

def best_experiment():
    """Return the best experiment so far (lowest val_bpb)."""
    data = list_experiments()
    exps = [e for e in data['experiments'] if e['status'] == 'keep']
    if not exps:
        return {"best": None, "message": "No successful experiments yet"}
    
    best = min(exps, key=lambda e: float(e['val_bpb']) if e['val_bpb'] != 'crash' else 999)
    return {"best": best}

def check_status():
    """Check autoresearch setup status."""
    status = {
        "installed": os.path.exists(AR_DIR),
        "uv_available": find_uv() is not None,
        "train_py_exists": os.path.exists(os.path.join(AR_DIR, 'train.py')),
        "prepare_py_exists": os.path.exists(os.path.join(AR_DIR, 'prepare.py')),
        "data_ready": os.path.exists(os.path.expanduser('~/.cache/autoresearch/')),
        "results_count": list_experiments()['total'],
    }
    return status

# ─── MCP stdio server ────────────────────────────────────

def handle_request(request):
    method = request.get('method', '')
    params = request.get('params', {})
    req_id = request.get('id', 0)
    
    if method == 'tools/list':
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": [
                    {
                        "name": "autoresearch_run",
                        "description": "Run one training experiment (5 min). Returns val_bpb and metrics.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "description": {"type": "string", "description": "What this experiment tests"}
                            }
                        }
                    },
                    {
                        "name": "autoresearch_list",
                        "description": "List all past experiments and their results.",
                        "inputSchema": {"type": "object", "properties": {}}
                    },
                    {
                        "name": "autoresearch_best",
                        "description": "Show the best experiment so far (lowest val_bpb).",
                        "inputSchema": {"type": "object", "properties": {}}
                    },
                    {
                        "name": "autoresearch_status",
                        "description": "Check autoresearch setup status.",
                        "inputSchema": {"type": "object", "properties": {}}
                    },
                ]
            }
        }
    
    elif method == 'tools/call':
        tool_name = params.get('name', '')
        args = params.get('arguments', {})
        
        if tool_name == 'autoresearch_run':
            result = run_experiment(args.get('description', ''))
        elif tool_name == 'autoresearch_list':
            result = list_experiments()
        elif tool_name == 'autoresearch_best':
            result = best_experiment()
        elif tool_name == 'autoresearch_status':
            result = check_status()
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
        
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "content": [{"type": "text", "text": json.dumps(result, indent=2)}]
            }
        }
    
    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Unknown method: {method}"}}

if __name__ == '__main__':
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
            response = handle_request(request)
            print(json.dumps(response), flush=True)
        except json.JSONDecodeError:
            pass
