---
priority: high
applies-to: ui
load: always
model: qwen3.5-4b
conflicts: []
---

# Tailwind CSS Conventions

## Class Order
Follow Prettier Tailwind plugin order:
1. Layout (display, position, z-index)
2. Box model (w, h, m, p)
3. Typography (font, text, leading)
4. Visual (bg, border, shadow, opacity)
5. Interactive (hover, focus, active)
6. Responsive (sm:, md:, lg:)

## Naming Conventions
- Use semantic class extraction for repeated patterns: `@apply` in globals.css
- Never use arbitrary values `[17px]` when a standard token works
- Dark mode: always use `dark:` prefix, never manual class switching

## Do Not
- Never use `\!important` — fix specificity properly
- Never use inline styles — always Tailwind or CSS modules
- Don't mix Tailwind with styled-components or emotion

## Component Patterns
```tsx
// ✅ Good — readable, ordered
<div className="flex items-center gap-4 px-6 py-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">

// ❌ Bad — arbitrary values, no order
<div className="hover:shadow-md flex shadow-sm px-6 bg-white gap-4 py-4 rounded-xl items-center">
```
