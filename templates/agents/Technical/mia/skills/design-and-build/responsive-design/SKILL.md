---
name: responsive-design
description: Mia's responsive design framework for YVON's glass morphism system. Covers breakpoints, mobile glass adaptations, touch targets, fluid typography, and the responsive pass checklist for each screen.
version: 1.0.0
---

# Responsive Design — YVON Glass System

## Purpose

YVON's glass morphism design system (V1–V4 containers, backdrop-blur, layered gradients) was built desktop-first. Mobile requires deliberate adaptation — backdrop-blur is GPU-expensive on mobile, glass overlays collapse at narrow widths, and touch targets are a separate constraint from click targets. This skill prevents Mia from shipping a screen that looks correct on desktop but breaks on mobile.

---

## When It Runs

- Any new screen build
- Any existing screen responsive pass (flagged in SESSION.md)
- When a component uses `backdrop-filter`, `glass-*` class, or layered gradient background
- Before any screen is marked "done" in Diana's sprint tracking

---

## YVON Breakpoints

```css
/* globals.css — use these exact custom properties */
--bp-mobile:  480px   /* small phones */
--bp-tablet:  768px   /* tablets and large phones landscape */
--bp-desktop: 1024px  /* desktop default */
--bp-wide:    1280px  /* wide desktop */
```

Tailwind equivalents: `sm: (640)`, `md: (768)`, `lg: (1024)`, `xl: (1280)`.

**Mobile-first rule:** Base CSS = mobile. Augment with `md:` and `lg:` breakpoints. Never write desktop-first and try to override down.

---

## Glass System Mobile Adaptations

| Property | Desktop | Mobile (< 768px) |
|----------|---------|-----------------|
| `backdrop-blur` | `blur(20px)` | `blur(8px)` — GPU performance |
| Glass opacity | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` — more visible on small screens |
| Border radius | `16–24px` | `12px` — tighter on small viewport |
| Padding (glass card) | `24px` | `16px` |
| Box shadow depth | Full 3-layer | Single layer — mobile doesn't need depth |
| `border: 1px solid rgba(...)` | Keep | Keep — defines container edge clearly |

**Disable backdrop-blur completely on screens narrower than 380px.** Use a solid background fallback.

---

## Touch Targets

All interactive elements on mobile MUST meet:
```
Minimum touch target: 44px × 44px (Apple HIG) / 48dp × 48dp (Material)
Spacing between adjacent targets: ≥ 8px
```

Common failures in YVON:
- Tab buttons in CEO dashboard (often < 32px tall) → add `min-h-[44px]` on mobile
- Icon buttons in NavBar → ensure `p-3` minimum
- Small KPI delta badges with `onClick` → wrap in a larger hit area

---

## Typography Scale on Mobile

YVON uses large display fonts for KPIs and section headers. These must scale:

| Element | Desktop | Mobile |
|---------|---------|--------|
| KPI values (52px) | `text-[52px]` | `text-[32px]` |
| Page title (48px) | `text-[48px]` | `text-[28px]` |
| Section labels (12px) | `text-[12px]` | `text-[12px]` — do not reduce further |
| Body text (14px) | `text-[14px]` | `text-[14px]` — floor, do not reduce |

Use `clamp()` for fluid scaling where the range is smooth:
```css
font-size: clamp(28px, 4vw, 52px);  /* scales from 28px to 52px */
```

---

## Responsive Pass Checklist

Before any screen is marked complete, run this checklist at 375px, 768px, and 1280px:

```
□ No horizontal scroll at any breakpoint
□ Glass containers visible (not invisible at < 768px)
□ Touch targets ≥ 44px for all interactive elements
□ Text does not overflow glass card bounds
□ Navigation is accessible (mobile menu or collapsed state)
□ KPI values do not clip at 375px
□ Scrollable lists have visible scroll indicator on touch
□ No fixed-width elements wider than 100vw
□ backdrop-blur disabled or reduced at < 768px
□ All images use next/image with responsive sizes prop
```

Fail any item → fix before marking done.

---

## Screen-Specific Notes

| Screen | Known mobile issues | Fix |
|--------|--------------------|----|
| CEO Command Dashboard | Tab row overflows on 375px | Horizontal scroll on tabs + `scroll-snap-x` |
| Analytics | Multi-column KPI strip collapses | Stack to 1-col grid below `md:` |
| War Room | Chat bubbles overflow glass container | `max-w-[calc(100%-32px)]` on message cards |
| Competitor | Wide data tables | `overflow-x-auto` wrapper + `min-w-[600px]` on table |
