---
priority: high
applies-to: all-agents
load: always
model: qwen3.5-4b
conflicts: []
---

# OpenRouter Model Routing Rules

## Model Selection Table
| Task Type | Model | Reason |
|-----------|-------|--------|
| Architecture decisions | claude-sonnet-4-6 | Needs deep reasoning |
| Coding tasks | claude-sonnet-4-6 | Accuracy over speed |
| UI generation | claude-haiku-4-5 | Fast, cheap, sufficient |
| Brand content writing | claude-haiku-4-5 | Fast, cheap |
| Memory reads/writes | claude-haiku-4-5 | Simple retrieval |
| Code review | claude-sonnet-4-6 | Needs full comprehension |

## Routing Rules
- Never manually select a model mid-task — skill frontmatter declares it
- Quinn reads the active skill's `model:` frontmatter and routes accordingly
- If no skill is active, default to `claude-sonnet-4-6`
- Never use Opus for routine tasks — only for explicit architecture reviews

## Config Location
`projects/yvon/.claude/settings.local.json`

## Cost Management
- Prefer Haiku for all non-reasoning tasks
- Batch content generation tasks to minimize round-trips
- Never stream responses for background/automated tasks
