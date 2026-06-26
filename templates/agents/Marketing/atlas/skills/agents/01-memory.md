---
priority: critical
applies-to: all-agents
load: always
model: qwen3.5-4b
conflicts: []
---

# Memory System Rules

## Session Start Protocol
Every agent MUST follow this order on session start:
1. Read `INDEX.md` for the active brand/project — always first
2. Read `known-issues.md` — required before touching any code
3. Read `stack.md` only if the task requires technical detail
4. Read `decisions.md` only if the task touches past decisions
5. Read `changelog.md` only to log changes at session end

**Never load all files at once. INDEX.md covers 90% of sessions.**

## Active Session Control
The `.active-session` file in memory root contains one word — the active brand name.
Never read memory files for a brand other than the active session brand.

## Session End Protocol
After every completed task:
1. Append one line to the relevant MEMORY.md: `[YYYY-MM-DD] — [task] — [outcome]`
2. Update INDEX.md `Last 3 Changes` section
3. If any error happened twice: add to `known-issues.md`

## What Goes in Memory vs Context
| Put in memory | Keep in context |
|--------------|-----------------|
| Decisions made | Current task details |
| Known issues | Code being written |
| Stack details | User instructions |
| Change history | Errors in this session |

## Token Budget
- INDEX.md: ~400 tokens (always fine)
- stack.md: ~600 tokens (load only if needed)
- decisions.md: ~800 tokens (load only if needed)
- changelog.md: ~1000 tokens (load only to write)
- NEVER exceed 3000 tokens of memory context per session
