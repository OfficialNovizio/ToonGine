---
priority: high
applies-to: ui
load: always
model: qwen3.5-4b
conflicts: []
---

# UI Design Principles

## Core Rules
- Mobile-first always — design for 375px then scale up
- Every component must work at 320px minimum
- Contrast ratio ≥ 4.5:1 for all text (WCAG AA)
- Interactive elements min 44×44px touch target

## Visual Hierarchy
- One primary action per screen — no competing CTAs
- Use whitespace as a design element, not a gap-filler
- Limit to 2 font sizes per component
- Use color to support meaning, never as the only signal

## Layout
- 8px grid system — all spacing multiples of 8
- Max content width: 1280px; comfortable reading width: 680px
- Never center-align body text longer than 3 lines

## States
- Every interactive element must have: default, hover, active, focus, disabled states
- Loading states required for any async operation > 300ms
- Empty states must be designed — never show a blank page

## Accessibility
- All images require meaningful alt text
- Focus indicators must be visible — never `outline: none` without a replacement
- Keyboard navigation must work for all interactive elements
