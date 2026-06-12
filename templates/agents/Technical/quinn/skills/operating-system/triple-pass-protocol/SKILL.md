---
name: triple-pass-protocol
description: Quinn's pre-verdict validation gate. Three passes — Audit, Adversarial Critique, Fix — before APPROVED or BLOCKED is issued. Ensures completeness of testing, security coverage, and honest verdict calibration.
version: 1.0.0
---

## Purpose

A QA verdict issued without internal challenge is itself a quality failure. Skipping the last 3 ACs, missing the security checklist, or issuing BLOCKED for a style issue are all calibration errors. This protocol forces Quinn to audit the audit before delivering a verdict.

---

## The Three Passes

### Pass 1 — Audit
Run the full QA checklist against the feature. Check build gates, all AC items, edge states, and the security test checklist. Draft the verdict (APPROVED / BLOCKED) and the bug list.

### Pass 2 — Critique (Adversarial)
Stop before issuing the verdict. Become the adversarial reviewer. Ask every question:

**Completeness pass:**
- Did I test every AC item — or did I stop at the first 3 and assume the rest passed?
- Did I explicitly test empty state, loading state, and error state — or just the happy path?
- Did I run `npx tsc --noEmit` and `npm run lint` — actually run them, not assume they passed?

**Security pass:**
- Did I run the full security test checklist (`skills/custom/security-test-checklist/SKILL.md`)?
  - Auth bypass test (unauthenticated → 401)?
  - Cross-venture isolation test (Venture A creds → Venture B data)?
  - Rate limit test (exceed threshold → 429 + Retry-After)?
  - Client bundle key scan?
  - XSS test on all user-input fields?
- If I skipped any security item: why? Was it "N/A" or was it "I forgot"?

**Build gate pass:**
- Did I actually run tsc and lint — or am I relying on the developer's assertion that they passed?
- If they passed locally: did I verify in the same environment, or did I trust "it works on my machine"?

**Verdict calibration:**
- Is BLOCKED for a real functional or security failure — or am I over-weighting a style issue not in the AC?
- Is APPROVED confident enough? Would I stand behind this verdict in a post-incident review?
- Am I issuing APPROVED to avoid conflict — or because the feature genuinely passes every gate?

**Edge case pass:**
- Did I test what happens when the API is down (network error state)?
- Did I test with an empty dataset (empty state)?
- Did I test the form with invalid inputs?

### Pass 3 — Fix
Revise anything the critique found. Add missing test results to the bug list. Recalibrate the verdict if the critique revealed a gap. Then deliver.

---

## Output Rule
Dev and Stark see the Pass 3 output only. Never narrate the triple-pass process.

Verdict format:
```
APPROVED / BLOCKED
tsc: ✅/❌ | lint: ✅/❌
AC coverage: [each item: ✅/⚠️/❌]
Security: ✅ all clear / ❌ [failed item]
Bug list: [if BLOCKED — each bug with steps + fix proposal]
Logged to MEMORY.md: [date] — [feature] — [verdict]
```
