---
name: triple-pass-protocol
description: Mia's pre-delivery validation gate. Three passes — Audit, Adversarial Critique, Fix — before any component is marked ready for QA.
version: 1.0.0
---

## Purpose

A component shipped without internal challenge is a component with unchecked assumptions. This protocol forces Mia to audit her own implementation before it reaches Quinn — catching missing states, design deviations, and security issues before they become regression bugs.

---

## The Three Passes

### Pass 1 — Audit
Review the component implementation against Mia's full checklist. Name every issue found, where it appears, and what it breaks for the user. Draft the status (BUILT / BLOCKED) and any corrections needed.

### Pass 2 — Critique (Adversarial)
Stop before marking ready for QA. Become the adversarial reviewer. Ask every question:

**Design fidelity pass:**
- Does this match exactly what `docs/ventures/[active]/DESIGN.md` specifies?
- Are there any hardcoded color values — hex, rgb, or Tailwind arbitrary values?
- Is spacing using design system tokens or arbitrary px values?
- Does any element deviate from the spec without a documented reason?

**Accessibility pass:**
- Are all interactive elements keyboard-navigable (tab, enter, escape)?
- Do all images have meaningful `alt` text (or `alt=""` if decorative)?
- Is the color contrast ratio sufficient (≥ 4.5:1 for normal text, ≥ 3:1 for large text)?
- Are form inputs labelled with visible labels or `aria-label`?

**State coverage pass:**
- Is there a loading state? Does it show a skeleton or spinner — not a blank area?
- Is there an empty state? Does it tell the user what to do — not just blank space?
- Is there an error state? Does it tell the user what went wrong in plain language?
- Are all three states actually reachable through the component's props — not just designed but unreachable?

**Client/server pass:**
- Is `'use client'` justified? Can this component be a Server Component instead?
- If it's a Server Component, is there any client-side interactivity that would break?
- Are Server Actions used correctly, or is there unnecessary client fetch logic?

**Security pass:**
- No `dangerouslySetInnerHTML` without sanitization?
- No API keys, secrets, or sensitive data in component state or props?
- No `NEXT_PUBLIC_*` vars that expose anything sensitive?
- No inline event handlers that could be XSS vectors?

### Pass 3 — Fix
Revise anything the critique found. Add missing states, fix color tokens, add aria labels. Then mark ready for Quinn.

---

## Output Rule
Quinn sees the Pass 3 output only. Never narrate the triple-pass process.

Status format:
```
Component: [name] — BUILT / BLOCKED
Design fidelity: [matches spec / deviation: X]
States: loading ✅/❌ | empty ✅/❌ | error ✅/❌
QA handoff: [what to test, which states to exercise]
```
