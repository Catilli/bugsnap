# Input Sanitization Guide

Internal guide for handling user input across the BugSnap codebase.

## Principles

1. **All user input must be validated with Zod** — body, query params, and URL params
2. **All user-facing text must be sanitized** — via `sanitizeString` / `zSanitizedString()`
3. **All user-provided URLs must be protocol-checked** — via `sanitizeUrl` / `zSanitizedUrl()`
4. **Frontend renders all user content as plain text** — React auto-escapes everything

## Backend: Zod Validation

Every route handler must parse input through a Zod schema before use:

```ts
// Body
const data = createIssueSchema.parse(request.body);

// Query params
const { search, status } = querySchema.parse(request.query);

// Never use: request.body as { ... } or request.query as { ... }
```

## Backend: Text Sanitization

Use `sanitizeString` (strips all HTML) on every user-facing text field:

```ts
import { sanitizeString, zSanitizedString } from '../utils/sanitize';

const schema = z.object({
  title: z.string().min(1).transform(sanitizeString),
  // or use the helper:
  description: zSanitizedString().optional(),
});
```

## Backend: URL Sanitization

Use `sanitizeUrl` / `zSanitizedUrl()` on any field that stores a user-provided URL:

```ts
import { sanitizeUrl, zSanitizedUrl } from '../utils/sanitize';

const schema = z.object({
  url: z.string().url().transform(sanitizeUrl).optional(),
  // or use the helper:
  websiteUrl: zSanitizedUrl(),
});
```

Allowed protocols: `http:`, `https:`, `mailto:`. Everything else (including `javascript:`, `data:`, `vbscript:`) is rejected.

## Frontend: Safe URL Rendering

All `<a href>` attributes that use user-provided data must go through `safeHref()`:

```tsx
import { safeHref } from '@/lib/safeUrl';

<a href={safeHref(issue.url)} target="_blank" rel="noopener noreferrer">
  {issue.url}
</a>
```

This guards against `javascript:` URLs in existing data predating the backend validation.

## Email Templates

Always sanitize values interpolated into HTML email templates:

```ts
import { sanitizeString } from '../utils/sanitize';

html: `<p>Hi ${sanitizeString(user.name)},</p>`;
```

## What NOT To Do

- Never use `z.any()` in route schemas for user input
- Never cast `request.body as { ... }` or `request.query as { ... }` without Zod
- Never render raw HTML with user data on the frontend
- Never interpolate unsanitized values into HTML strings (emails, SSR)
- Never trust that the backend alone is sufficient — defense-in-depth applies