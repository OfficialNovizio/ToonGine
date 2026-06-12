---
priority: high
applies-to: dev
load: always
model: qwen3.5-4b
conflicts: []
---

# General Code Standards

## Language & Types
- TypeScript strict mode where applicable
- No `any` types unless absolutely necessary — add a comment explaining why
- Prefer explicit return types on all functions
- Use `const` by default; `let` only when reassignment is required

## Functions
- Keep functions small and single-purpose
- Max 30 lines per function; extract if longer
- Name functions after what they return, not what they do internally
- No side effects in pure functions

## Error Handling
- Never swallow errors silently
- Always log error context, not just the error message
- Use typed errors where possible

## Comments
- Comment the why, not the what
- If code needs a comment to be understood, consider simplifying it first
- Never leave TODO comments without a ticket reference

## File Structure
- One concern per file
- Keep files under 200 lines; split if larger
- Co-locate tests with implementation files

## Git
- All brand changes go to `dev` branch — never commit directly to `main`
- Commit messages: `type(scope): short description` (feat, fix, chore, docs)
