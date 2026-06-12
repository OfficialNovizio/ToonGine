---
name: accessibility
description: Mia's WCAG 2.1 AA compliance framework for YVON. Covers contrast ratios for the glass system, semantic HTML patterns, focus management, keyboard navigation, and screen reader support. Run before any screen ships.
version: 1.0.0
---

# Accessibility — WCAG 2.1 AA

## Purpose

YVON's glass morphism system creates accessibility risk by default — semi-transparent backgrounds make contrast unpredictable, and layered visual effects can obscure focus indicators. This skill ensures Mia's UI ships accessible, not just beautiful.

**The standard:** WCAG 2.1 AA minimum. Not optional — legal standard in most markets.

---

## When It Runs

- Any new screen or component build
- Any change to the glass system (opacity, color, blur)
- Before any screen is marked complete
- When Quinn raises an accessibility finding in QA Pulse

---

## Contrast Ratios — Glass System

The glass system uses semi-transparent backgrounds. Contrast must be calculated against the **rendered background**, not the CSS value.

### YVON Glass Contrast Requirements

| Container | Background (rendered) | Text color | Min ratio | Status |
|-----------|----------------------|------------|-----------|--------|
| V1 Clear Ice | ~#f2f5f8 (white frosted) | `#000000` | 4.5:1 | ✅ Black on near-white passes |
| V2 Azure Tint | ~#1a3a6b (blue gradient) | `#ffffff` | 4.5:1 | ✅ White on navy passes |
| V3 Obsidian | ~#1a1f2e (dark smoke) | `#f1f5fb` | 4.5:1 | ✅ Light on dark passes |
| V4 Prism | ~#e8e0f0 (iridescent light) | `#2a1240` (plum) | 4.5:1 | ⚠️ Verify — iridescent shifts with viewport |

**Tool:** Use browser DevTools → Accessibility panel to check computed contrast on rendered elements.

**Rule from feedback.md:** Light containers (V1, V4) → PURE BLACK text. Dark containers (V2, V3) → PURE WHITE. No muted variants.

### Interactive Elements
Buttons, links, and focus rings require 3:1 contrast against their adjacent background (WCAG 1.4.11).

---

## Semantic HTML Patterns

YVON uses React + Next.js App Router. Semantic HTML is mandatory — glass cards are `<div>` visually but must use the correct semantic element:

```tsx
// ✅ Correct — semantic landmark regions
<main>
  <section aria-labelledby="analytics-heading">
    <h2 id="analytics-heading">Analytics Overview</h2>
  </section>
</main>

// ✅ Correct — interactive elements
<button onClick={handleTab} aria-selected={isActive} role="tab">Overview</button>
<a href="/analytics">View report</a>  // navigation = anchor, not button

// ❌ Wrong — clickable div
<div onClick={handleTab}>Overview</div>  // not keyboard accessible
```

### ARIA Patterns for YVON Components

| Component | ARIA pattern |
|-----------|-------------|
| Tab system (CEO dashboard) | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` |
| KPI cards | `<article>` or `<section>` with `aria-label="[metric name] KPI"` |
| Status badges | `aria-label="Status: [value]"` or `<span role="status">` |
| Loading states | `aria-busy="true"` on loading container |
| War Room messages | `role="log"` on message list, `aria-live="polite"` |
| Modal / overlay | `role="dialog"`, `aria-modal="true"`, focus trap |

---

## Focus Management

Every interactive element must have a visible focus indicator. YVON's glass system often removes or obscures default focus rings.

```css
/* globals.css — add to focus rule */
:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Never use outline: none without a custom focus style */
```

**Focus trap** is required for modals, drawers, and dropdown menus. Use the `focus-trap-react` pattern or implement manually:
```tsx
// Trap focus inside modal on open, return to trigger on close
useEffect(() => { if (isOpen) modalRef.current?.focus() }, [isOpen])
```

---

## Keyboard Navigation

All screens must be fully navigable by keyboard:

```
Tab / Shift+Tab   → navigate interactive elements in DOM order
Enter / Space     → activate buttons, checkboxes
Arrow keys        → navigate within tab lists, dropdowns, menus
Escape            → close modals, dropdowns, overlays
```

**DOM order = visual order.** If glass card layout uses CSS Grid with visual reordering, DOM order must still be logical for screen readers.

---

## Screen Reader Support

```
□ Every image has alt text (decorative images: alt="")
□ Icons without text labels have aria-label
□ Dynamic content updates use aria-live="polite"
□ Error messages are associated with their input via aria-describedby
□ Page title updates on route change (Next.js: update <title> per page)
```

---

## Accessibility Checklist

Before marking any screen complete:

```
□ All text meets 4.5:1 contrast on rendered glass background
□ All interactive elements are reachable and operable by keyboard
□ No click-only interactions (divs, spans with onClick without role/tabindex)
□ Focus indicators visible on all focusable elements
□ Images have meaningful alt text
□ Semantic landmarks present: main, nav, header, section with labels
□ Dynamic updates announced via aria-live
□ Tested at 200% zoom — no content lost or clipped
□ Tab order matches visual reading order
```
