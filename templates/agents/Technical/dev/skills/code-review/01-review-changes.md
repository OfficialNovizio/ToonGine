---
priority: high
applies-to: dev
load: on-request
model: qwen3.5-4b
conflicts: []
source: github.com/tirth8205/code-review-graph
---

# Code Review — Change Analysis

Skill for reviewing code changes using the code-review-graph knowledge graph.
Achieves 6.8× fewer tokens on reviews by reading only what matters.

## Protocol

### Step 1 — Get minimal context (always first)
```
get_minimal_context(task="<describe what changed>")
```
~100 tokens. Gives full picture. Do this BEFORE reading any files.

### Step 2 — Query only what you need
```
query_graph(target="<specific function/class>", detail_level="minimal")
```
Never use broad `list_*` calls. Target specific nodes.

### Step 3 — Analyse impact
```
detect_changes()
```
Returns risk-scored change analysis. Read the `risk_level` field first.

## Review Checklist
- [ ] Does this change break any callers? (check `edge` nodes)
- [ ] Are tests affected? (check test coverage nodes)
- [ ] Are there orphaned imports/functions created by this change?
- [ ] Does the change match the stated success criteria?
- [ ] Is the diff minimal — no unrelated changes?

## Token Budget
- Max 5 tool calls per review
- Max 800 tokens of graph context
- `next_tool_suggestions` tells you optimal next step — follow it

## Output Format
```
RISK: [low/medium/high]
CHANGED: [list of affected nodes]
CONCERNS: [numbered list, or "none"]
VERDICT: [approve / request changes]
```
