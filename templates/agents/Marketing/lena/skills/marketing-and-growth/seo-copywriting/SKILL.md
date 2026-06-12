---
name: seo-copywriting
description: Lena's SEO copywriting framework for Novizio and Hourbour. Covers keyword intent mapping, meta title and description templates, heading hierarchy, semantic SEO patterns, and balancing brand voice with search optimization.
version: 1.0.0
---

# SEO Copywriting

## Purpose

Novizio and Hourbour both have organic search potential. Fashion DTC depends heavily on discovery (editorial, Pinterest, Google Shopping). Fintech SaaS depends on intent-driven search ("time tracking app", "invoice software for freelancers"). Lena writes brand-voice copy that also ranks — these are not mutually exclusive, but they require a deliberate framework.

**Rule:** Brand voice comes first. SEO is a constraint, not the driver. Copy that reads like it was written for a bot converts no one.

---

## When It Runs

- Any product page, landing page, or collection page copy for Novizio
- Any feature page, pricing page, or onboarding email for Hourbour
- Any long-form content (blog post, editorial) for either venture
- When Kai provides SEO data from `/api/analytics` and routes to Lena for copy

---

## Keyword Intent Framework

Before writing any SEO-optimized copy, classify the keyword intent:

| Intent type | What the user wants | Copy approach | Venture examples |
|-------------|--------------------|--------------|--------------------|
| **Informational** | Learn or discover | Educate → inspire → soft CTA | "how to style linen trousers" / "what is time blocking" |
| **Commercial investigation** | Compare options before buying | Show differentiators + social proof | "best minimalist fashion brands UK" / "best freelancer invoicing tool" |
| **Transactional** | Ready to buy or sign up | Clear CTA, benefit-led headline | "linen blazer women" / "invoice app free trial" |
| **Navigational** | Find a specific brand/product | Brand name in title + rich meta | "Novizio summer collection" / "Hourbour pricing" |

---

## Novizio SEO Patterns

### Product Page Copy Template
```
[H1]: [Primary keyword] — [brand differentiator]
Example: "Linen Trousers Women — Elevated Everyday Essentials"

[Meta title]: [Primary keyword] | Novizio (max 60 chars)
Example: "Linen Trousers for Women | Novizio"

[Meta description]: [Benefit] [keyword] [CTA]. (max 160 chars)
Example: "Discover effortless linen trousers designed for the everyday. Free UK delivery. Shop the SS26 edit at Novizio."

[Body copy rules]:
- Use H2s for fabric, fit, styling (keyword-rich subheadings)
- First paragraph contains primary keyword naturally
- No keyword stuffing — read aloud test: if it sounds robotic, remove
- Brand voice: editorial, understated luxury. Not "buy now" — "add to your edit"
```

### Collection Page Copy
```
H1: [Category keyword] — Collection (e.g., "Women's Linen Clothing — SS26 Collection")
200–300 word editorial description using semantic keywords (related terms, not just exact match)
Include: material, occasion, styling cues — these are the long-tail queries
```

---

## Hourbour SEO Patterns

### Feature/Landing Page Template
```
[H1]: [Primary keyword] — [unique value prop]
Example: "Time Tracking for Freelancers — Built for How You Actually Work"

[Meta title]: [Primary keyword] | Hourbour (max 60 chars)
[Meta description]: [Problem solved] + [unique mechanism] + [CTA]. (max 160 chars)

[Body copy rules]:
- H2s address the specific pain point each feature solves
- Include the keyword in H1, first paragraph, one H2, and one alt text
- Use trust signals near the CTA: "No credit card required", social proof
- Voice: trustworthy, clear, working-professional tone. Not SaaS-generic.
```

### Blog / Long-Form Content
```
Target informational + commercial investigation keywords
Structure: Problem → Cause → Solution (their workflow) → How [product] helps
Word count guide: 1200–2000 words for informational, 600–1000 for commercial investigation
Internal linking: 2–3 links to Hourbour feature pages per post
```

---

## Brand Voice + SEO Balance Rule

When the optimal keyword conflicts with the brand voice:

```
Novizio example:
Keyword: "cheap linen clothes women"    ← brand prohibits "cheap"
Fix: target "affordable linen fashion women" or "linen clothing women" instead
→ Never use keywords that undermine the brand positioning

Hourbour example:
Keyword: "free invoice software"       ← Hourbour may not have a free tier
Fix: target "invoice software free trial" if a trial exists
→ Never target keywords that make false promises
```

**Rule from venture FEEDBACK.md applies here too:** Kahneman framing check before any urgency or scarcity language in SEO copy.

---

## Checklist Before Delivering SEO Copy

```
□ Keyword intent classified (informational / commercial / transactional / navigational)
□ Primary keyword in H1, first paragraph, meta title
□ Meta title ≤ 60 characters
□ Meta description ≤ 160 characters with CTA
□ No keyword stuffing — read aloud test passed
□ Brand voice preserved — does not read like generic SEO copy
□ No keywords that contradict brand positioning or make false promises
□ Kahneman framing check: no manipulative urgency or loss framing
```
