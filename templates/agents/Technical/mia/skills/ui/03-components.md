---
priority: medium
applies-to: ui
load: on-request
model: qwen3.5-4b
conflicts: []
---

# Component Structure Rules

## File Structure
```
components/
├── ui/          # Primitive, reusable (Button, Input, Card)
├── features/    # Feature-specific compositions
└── layout/      # Page structure (Header, Sidebar, Footer)
```

## Component Rules
- One component per file — no multi-export component files
- Props interface defined above the component, exported
- Default props via destructuring defaults, not defaultProps
- No business logic in UI components — pass data and handlers as props

## Naming
- PascalCase for component files and function names
- Props interface: `[ComponentName]Props`
- Event handlers: `onXxx` (e.g., `onSubmit`, `onChange`)

## Size Limits
- Max 80 lines per component
- If it exceeds: extract sub-components or move logic to a hook
