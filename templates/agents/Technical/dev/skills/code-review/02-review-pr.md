---
priority: high
applies-to: dev
load: on-request
model: qwen3.5-4b
conflicts: []
source: github.com/tirth8205/code-review-graph
---

# PR Review Protocol

Full pull request review using code-review-graph for token-efficient analysis.

## Pre-Review Setup
```bash
# Build/update the graph before reviewing
uv run code-review-graph update
```

## Review Steps

1. **Get PR context** — `get_minimal_context(task="PR #[number]: [title]")`
2. **Check impact** — `detect_changes()` — read risk scores
3. **Spot broken callers** — `query_graph(target="[changed function]")`
4. **Verify tests exist** — check test coverage nodes in response
5. **Write verdict** — use output format below

## PR Verdict Format
```
## PR Review — #[number]

**Risk:** [low / medium / high]
**Changed nodes:** [list]
**Test coverage:** [covered / partial / missing]

### Issues
1. [Specific issue with file:line reference]
2. ...

### Verdict
[APPROVE / REQUEST CHANGES / NEEDS DISCUSSION]
Reason: [one sentence]
```

## Hard Rules
- Never approve a PR with HIGH risk and no tests
- Never approve if unrelated files were modified
- Always check that the PR touches only what the task required (karpathy surgical rule)
