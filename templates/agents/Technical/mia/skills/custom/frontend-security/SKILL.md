---
name: frontend-security
description: Mia's frontend security behavioral checklist. Runs before marking any component done. Covers dangerouslySetInnerHTML, API key exposure, client state PII, XSS-safe patterns, CSP compatibility, form validation, and user-facing error messages.
version: 1.0.0
---

## Purpose

Frontend security failures are invisible until they're exploited. Mia's responsibility is the client-side layer — and that layer has a specific attack surface: user input rendering, API key exposure through the bundle, sensitive data in client state, and XSS vectors. This checklist makes security review part of every component's definition of done.

---

## The 7-Item Checklist

Run before marking any component done. All 7 must pass.

---

**1. No `dangerouslySetInnerHTML`**

This is the most common XSS vector in React. If rendering user-generated content:

```typescript
// NEVER
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// CORRECT — if HTML rendering is needed
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userContent)
<div dangerouslySetInnerHTML={{ __html: clean }} />

// PREFERRED — render as text, not HTML
<p>{userContent}</p>
```

React's JSX escaping already handles plain text safely. Only use `dangerouslySetInnerHTML` if the content is genuinely HTML — and always sanitize it.

---

**2. No API Keys in Client Code**

`NEXT_PUBLIC_*` variables are compiled into the browser bundle — publicly visible to anyone who inspects the page source.

```typescript
// NEVER — exposed in browser
const key = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

// CORRECT — stays server-side (no NEXT_PUBLIC_ prefix)
// Only accessible in /app/api/ routes and Server Components
const key = process.env.ANTHROPIC_API_KEY
```

If a component needs data from an authenticated API — call an `/api/` route from the client. The route handler holds the keys.

---

**3. No Sensitive Data in Client State**

Data stored in component state (`useState`, `useReducer`) or Zustand/Redux persists across navigations and can be read by browser extensions or other scripts.

```typescript
// NEVER store in client state
const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_SOME_KEY)
const [userEmail, setUserEmail] = useState(userData.email)  // PII
const [sessionToken, setSessionToken] = useState(token)     // credential

// CORRECT — display only, don't store
<span>{user.name}</span>  // render directly, no state
```

---

**4. XSS-Safe Rendering Patterns**

React's default JSX escaping handles most cases. The dangerous patterns to avoid:

```typescript
// Safe — React escapes this
<p>{userInput}</p>

// Dangerous — no escaping
<p dangerouslySetInnerHTML={{ __html: userInput }} />

// Dangerous — script injection
document.getElementById('target').innerHTML = userInput

// Safe alternative
document.getElementById('target').textContent = userInput
```

**Rule:** If you find yourself leaving React's rendering model to manipulate the DOM directly, stop and use a React-native pattern instead.

---

**5. CSP-Compatible Patterns**

Content Security Policy blocks inline scripts and `eval()`. YVON's CSP must not be broken by new components.

```typescript
// NEVER — inline scripts break CSP
<script>window.config = { key: '...' }</script>

// NEVER
eval(someString)
new Function(someString)()

// CORRECT — all logic in React components, no inline scripts
// Pass config via Server Component props, not inline scripts
```

---

**6. Form Validation — Client + Server**

Client-side validation is UX. Server-side validation is security. Never treat them as the same thing.

```typescript
// Client — for immediate feedback only
const isValid = email.includes('@') && email.length > 0

// Server (in /api/ route) — always re-validates
const schema = z.object({ email: z.string().email() })
const parsed = schema.safeParse(body)
if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
```

Mia's responsibility: implement client validation for UX. Ensure the component shows the server's validation error response, not just the client validation state.

---

**7. User-Facing Error Messages Don't Expose Internals**

Error states shown to users must be generic:

```typescript
// NEVER — exposes route structure
<ErrorState message={`Error from /api/analytics/competitor-scan: ${err.message}`} />

// NEVER — exposes stack trace
<ErrorState message={err.stack} />

// CORRECT — generic, actionable
<ErrorState message="Something went wrong. Please try again." />

// CORRECT — specific about what failed, not how
<ErrorState message="Analytics data is temporarily unavailable." />
```

---

## Checklist Summary

Before marking any component done:
- [ ] No `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] No API keys in `NEXT_PUBLIC_*` or client component state
- [ ] No PII or credentials stored in client state
- [ ] All user input rendered via JSX (not innerHTML)
- [ ] No inline `<script>` tags or `eval()` calls
- [ ] Client validation present for UX; server validation error displayed when it fires
- [ ] Error states show generic messages — no route names, stack traces, or internal errors
