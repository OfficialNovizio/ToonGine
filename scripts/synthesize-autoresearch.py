#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Synthesize autoresearch setup → .toon/autoresearch/ (4th ToonGine tool)"""
import sys, io, os, subprocess, shutil
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def synthesize(project_root):
    toon_dir = os.path.join(project_root, '.toon', 'autoresearch')
    scripts_dir = os.path.join(project_root, 'scripts')
    os.makedirs(toon_dir, exist_ok=True)
    
    source_files = ['prepare.py', 'train.py', 'program.md', 'pyproject.toml']
    missing = [f for f in source_files if not os.path.exists(os.path.join(scripts_dir, f))]
    if missing:
        print(f"  ⚠️  Missing autoresearch files: {missing}")
        print(f"     Run: curl -sL https://github.com/karpathy/autoresearch/archive/refs/heads/main.tar.gz | tar xz")
        return False
    
    # Copy files into .toon/autoresearch/
    for f in source_files:
        src = os.path.join(scripts_dir, f)
        dst = os.path.join(toon_dir, f)
        shutil.copy2(src, dst)
    print(f"  ✅ Copied {len(source_files)} autoresearch files → .toon/autoresearch/")
    
    # Try uv sync and prepare
    print(f"\n  📦 Setting up autoresearch environment...")
    
    # Check for uv
    uv_path = shutil.which('uv')
    if not uv_path:
        # Try to install
        print(f"     Installing uv package manager...")
        try:
            subprocess.run(['curl', '-LsSf', 'https://astral.sh/uv/install.sh'], 
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            subprocess.run(['sh'], input=b'', capture_output=True)
            uv_path = os.path.expanduser('~/.local/bin/uv')
        except Exception:
            pass
    
    if uv_path and os.path.exists(uv_path):
        # uv sync
        print(f"     Running uv sync...")
        result = subprocess.run(
            [uv_path, 'sync'],
            cwd=toon_dir,
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            print(f"     ✅ uv sync complete")
            
            # Download data and train tokenizer
            print(f"     Downloading training data + tokenizer...")
            result2 = subprocess.run(
                [uv_path, 'run', 'prepare.py'],
                cwd=toon_dir,
                capture_output=True, text=True, timeout=300
            )
            if result2.returncode == 0:
                print(f"     ✅ Data + tokenizer ready")
            else:
                print(f"     ⚠️  prepare.py had issues (may not have GPU): {result2.stderr[:200]}")
        else:
            print(f"     ⚠️  uv sync failed: {result.stderr[:200]}")
    else:
        print(f"     ⚠️  uv not available — run 'curl -LsSf https://astral.sh/uv/install.sh | sh'")
        print(f"     Then run: cd .toon/autoresearch && uv sync && uv run prepare.py")
    
    # Generate TOON report
    report = []
    report.append("SRC autoresearch")
    report.append("VERSION 1.0")
    report.append("")
    report.append("## Files")
    for f in source_files:
        fp = os.path.join(toon_dir, f)
        if os.path.exists(fp):
            size = os.path.getsize(fp)
            lines = len(open(fp, encoding='utf-8', errors='replace').readlines())
            report.append(f"  {f}: {lines} lines, {size:,}B")
    report.append("")
    report.append("## Setup Commands")
    report.append("  uv sync")
    report.append("  uv run prepare.py")
    report.append("  uv run train.py")
    report.append("")
    report.append("## MCP Tools")
    report.append("  autoresearch_run  — run a training experiment (5 min)")
    report.append("  autoresearch_list — list past experiments")
    report.append("  autoresearch_best — show best experiment so far")
    report.append("")
    
    output = '\n'.join(report)
    md_path = os.path.join(toon_dir, 'GRAPH_REPORT.md')
    toon_path = os.path.join(toon_dir, 'GRAPH_REPORT.toon')
    
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(output)
    with open(toon_path, 'w', encoding='utf-8') as f:
        f.write(output)
    
    print(f"\n  ✅ Synthesized autoresearch → .toon/autoresearch/")
    print(f"     REPORT: {len(output)} bytes")
    return True

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    synthesize(os.path.abspath(root))
