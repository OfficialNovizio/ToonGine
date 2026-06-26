---
priority: medium
applies-to: all-agents
load: on-request
model: qwen3.5-4b
conflicts: []
---

# Prompt Writing Standards

## Anatomy of a Good Prompt
```
1. Role context (1 sentence)
2. Task description (what, not how)
3. Constraints (what NOT to do)
4. Success criteria (how you'll know it's done)
5. Output format (if specific format needed)
```

## Rules
- Start with the goal, not the method
- State constraints before asking for output — not after
- Include one concrete example if the format is non-obvious
- Never use vague success criteria ("make it better", "clean it up")

## Agent Communication Pattern
All inter-agent communication routes through Marcus.
Marcus formats tasks as:
```
TASK: [one line description]
AGENT: [target agent name]
CONTEXT: [relevant memory files to read]
DONE WHEN: [specific verifiable criterion]
```

## Prompt Anti-patterns
- ❌ "Improve this code" → ✅ "Fix the N+1 query on line 42 so it uses a single JOIN"
- ❌ "Make it look better" → ✅ "Match the Card component's border-radius and shadow to the design in Figma frame X"
- ❌ "Handle errors" → ✅ "Return `{ error: 'NOT_FOUND' }` with 404 status when user ID doesn't exist"
