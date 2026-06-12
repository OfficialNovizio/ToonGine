---
priority: medium
applies-to: dev
load: on-request
model: qwen3.5-4b
conflicts: []
source: github.com/tirth8205/code-review-graph
---

# Build & Maintain Code Graph

Setup and maintenance commands for the code-review-graph knowledge graph.

## Install
```bash
pip install code-review-graph
# or
uv add code-review-graph
```

## Initial Setup
```bash
# Build full graph (first time — takes 30–120s depending on codebase size)
uv run code-review-graph build

# Check status
uv run code-review-graph status
```

## Maintenance Commands
```bash
# Incremental update (run after any code change — fast)
uv run code-review-graph update

# Start MCP server (for Claude Code integration)
uv run code-review-graph serve

# Generate markdown wiki from graph
uv run code-review-graph wiki
```

## Automation
Add to `scripts/pre-session.sh`:
```bash
#\!/bin/bash
# Run before every Claude coding session
uv run code-review-graph update
echo "Graph updated — ready for review"
```

## Multi-repo Setup (YVON with multiple brands)
```bash
# Register each brand repo
uv run code-review-graph register ./brands/novizio/workspace
uv run code-review-graph register ./brands/hourbour/workspace

# List all registered repos
uv run code-review-graph repos
```
