# BugSnap - Technical Architecture Audit

**Version:** 0.10.1
**Audit Date:** 2026-02-12
**Repository:** Turborepo monorepo with npm workspaces

---

## Architecture Overview

```
bugsnap/
├── apps/
│   ├── web/              # Next.js 16.x frontend (Vercel)
│   └── api/              # Fastify 5.x backend (Render/Docker)
├── packages/
│   └── shared/           # Shared TypeScript package (@bugsnap/shared)
├── extension/            # Chrome extension (Manifest V3)
├── extension-firefox/    # Firefox extension (Manifest V2)
├── extension-safari/     # Safari extension (Manifest V3)
├── Dockerfile            # Multi-stage Docker build for API
├── render.yaml           # Render deployment config
├── turbo.json            # Turborepo pipeline config
└── package.json          # Root workspace config (npm workspaces)
```

**Data Flow:**
```
Browser Extensions  ──capture──>  Fastify API  <──manage──  Next.js Dashboard
(Chrome/Firefox/Safari)               │                         │
                                 PostgreSQL DB            Vercel Hosting
                                (Prisma ORM)
```

---

## Audit Results

### Frontend

| Component | Status | Details |
|-----------|--------|---------|
| Web Application | Implemented | Next.js 16.1.6, React 19, App Router, Tailwind CSS 3.4 — `apps/web/` |
| State Management | Implemented | Zustand 4.4 with persist middleware (auth state + client state), TanStack React Query 5.17 (server state) — `apps/web/store/authStore.ts`, `apps/web/package.json` |
| Dashboard Pages | Implemented | 11 routes: login, register, forgot-password, reset-password, dashboard, projects (list/new/detail), account, feedback, install-extension — `apps/web/app/` |
| Chrome Extension | Implemented | Manifest V3, content scripts injected on all URLs — `extension/manifest.json` |
| Annotation Layer | Implemented | Custom HTML5 Canvas 2D implementation (rectangle, arrow, pen, text, cursor tools) — `extension/mark-my-image.js` |
| Overlay / Bug Capture UI | Implemented | Injected via extension content scripts — `extension/bugsnap-ui.js`, `extension/content.js` |
| Extension Task Drawer | Implemented | View/manage project tasks from any webpage — grouped list, search, status filters, task detail panel with status dropdown, screenshot lightbox, comments section — `extension/bugsnap-ui.js` |
| Extension Annotation Editing | Implemented | Edit annotations on existing tasks from the extension — reuses annotation modal with "Update" button, fetches screenshot as data URL via background script to avoid CORS, composites annotations into screenshot on save — `extension/bugsnap-ui.js`, `extension/background.js`. **Note:** Web app annotation editor removed in v0.10.1 (annotations are burned into screenshots by the extension, no in-app editing needed). |
| Firefox Extension | Implemented | MV2 manifest with `browser.*` Promise-based API — `extension-firefox/manifest.json` |
| Safari Extension | Implemented | MV3 manifest with screenshot capture — `extension-safari/manifest.json` |
| Screen Recording | Implemented | `MediaRecorder` + `getDisplayMedia` in Chrome and Firefox extensions |

### Backend

| Component | Status | Details |
|-----------|--------|---------|
| API Framework | Implemented | Fastify 5.7.4 with TypeScript — `apps/api/src/index.ts` |
| JWT Authentication | Implemented | `@fastify/jwt` 9.1, 7-day tokens, bcrypt password hashing, startup validation of `JWT_SECRET`. Auth plugin wrapped with `fastify-plugin` (fp) to break encapsulation — `apps/api/src/plugins/auth.ts`, `apps/api/src/routes/auth.ts`, `apps/api/src/index.ts` |
| Auth Service | Implemented | Full auth service: register, login, password change, password reset (crypto token + SHA-256 hash, 1h TTL) — `apps/api/src/services/authService.ts` |
| Email Service | ~~Implemented~~ | **REMOVED** in v0.9.0 — admin creates users with password directly. Resend SDK removed. |
| API Routes | Implemented | 13 route modules: auth, projects, projectMembers, issues, comments, feedback, uploads, users, admin, events, notifications, share, qaCycles — `apps/api/src/routes/` |
| CORS Configuration | Implemented | Explicit `ALLOWED_ORIGINS` env-based allowlist + chrome-extension + localhost (dev only) — `apps/api/src/index.ts:35-59` |
| Error Handling | Implemented | Custom Fastify error handler plugin — `apps/api/src/plugins/errorHandler.ts` |
| Input Validation | Implemented | Zod 3.22 for request validation — `apps/api/package.json` |
| File Upload Support | Implemented | `@fastify/multipart` (10MB limit) + Cloudinary upload route — `apps/api/src/routes/uploads.ts`, `apps/api/src/lib/cloudinary.ts` |
| Screenshot Compositing | Implemented | PATCH `/api/issues/:issueId` accepts `screenshotUrl` (data URL with annotations burned in) → uploaded to Cloudinary CDN + R2 backup — `apps/api/src/routes/issues.ts`, `apps/api/src/utils/processScreenshot.ts` |
| Health Check | Implemented | `/health` endpoint with database connectivity check — `apps/api/src/index.ts:81-89` |
| OAuth (Google/GitHub) | ~~Implemented~~ | **REMOVED** in v0.9.0 — simplified to email/password only. `@fastify/oauth2` and `apps/api/src/routes/oauth.ts` removed. |
| Real-time (SSE) | Implemented | Server-Sent Events with EventEmitter pub/sub — `apps/api/src/routes/events.ts`, `apps/api/src/lib/eventBus.ts` |
| Background Jobs (Queues) | Implemented | BullMQ with email, screenshot, cleanup queues — `apps/api/src/lib/queue.ts` |
| Rate Limiting | Implemented | `@fastify/rate-limit` — global 100 req/min, auth routes 10 req/min — `apps/api/src/index.ts:61-65`, `apps/api/src/routes/auth.ts:7-14` |
| Structured Logging | Implemented | Pino with `pino-pretty` for dev, JSON for production — `apps/api/src/index.ts:36-53` |

### Database & Storage

| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL | Implemented | Prisma 5.8.1 ORM — `apps/api/prisma/schema.prisma` |
| Schema Models | Implemented | 16 models: User, Project, ProjectMember, Issue, Annotation, Comment, Feedback, ShareToken, Attachment, Notification, ActivityLog, QACycle, QACycleIssue, PasswordResetToken + enums (UserRole, IssueType, FeedbackType, FeedbackStatus) |
| Migrations | Implemented | 15 migrations applied — `apps/api/prisma/migrations/` |
| Database Indexes | Implemented | Indexes on foreign keys and frequently queried fields (status, priority, type) |
| File Storage (Cloudinary) | Implemented | Cloudinary SDK integration with `POST /api/uploads` route — `apps/api/src/lib/cloudinary.ts`, `apps/api/src/routes/uploads.ts` |
| File Storage (Cloudflare R2) | Implemented | Secondary screenshot backup storage via S3-compatible API — `apps/api/src/lib/r2.ts` |
| Redis Caching | Implemented | ioredis with get-or-compute pattern + SCAN-based invalidation — `apps/api/src/lib/redis.ts` |
| Database Backups | Implemented | pg_dump with gzip compression, 30-day retention — `scripts/backup-db.sh`, `scripts/restore-db.sh` |

### Infrastructure & DevOps

| Component | Status | Details |
|-----------|--------|---------|
| Frontend Hosting | Implemented | Vercel with custom build config — `apps/web/vercel.json` |
| Backend Hosting | Implemented | Render (Docker) on free tier, Oregon region — `render.yaml`, `Dockerfile` |
| Docker Build | Implemented | Node 20 Alpine, multi-stage build with bcrypt native compilation — `Dockerfile` |
| Monorepo Tooling | Implemented | Turborepo 1.11, npm workspaces — root `package.json`, `turbo.json` |
| Shared Package | Implemented | `@bugsnap/shared` TypeScript package — `packages/shared/` |
| CI/CD (GitHub Actions) | Implemented | Lint, type-check, test, build on push/PR — `.github/workflows/ci.yml` |
| Environment Separation | Implemented | Dev/Staging/Prod `.env` files, NODE_ENV-aware logging, staging CI workflow — `.env.staging.example`, `.github/workflows/staging.yml` |
| Error Tracking (Sentry) | Implemented | `@sentry/node` (API) + `@sentry/nextjs` (web) — `apps/api/src/lib/sentry.ts`, `apps/web/sentry.*.config.ts` |
| Automated Tests | Implemented | Vitest 4.x, 12 unit tests (projects) — `apps/api/src/__tests__/`, `apps/api/vitest.config.ts` |
| SSL/TLS | Implemented | Handled by Vercel (frontend) and Render (backend) platform-level TLS |
| Domain Configuration | Partial | Default platform subdomains (`bugsnap-web-dun.vercel.app`, `bugsnap-xgfd.onrender.com`). No custom domain configured yet. |

---

## Phase 1 (Built) vs Phase 2 (Planned)

### Phase 1 — Current State

The core product loop is functional:

1. **User registers/logs in** via the dashboard (JWT auth)
2. **Creates a project** with a website URL, gets an API key
3. **Installs the Chrome extension** and links it to the project
4. **Captures bugs** on any website via the extension overlay (screenshot + annotations)
5. **Issues appear** on the project dashboard with screenshots, annotations, metadata
6. **Team members** can be invited with role-based access (ADMIN/Manager/Developer/Viewer)
7. **Comments** can be added to issues (full CRUD)
8. **Feedback system** exists as a separate module (BUG/FEATURE types)
9. **Roles & permissions** enforced at global and project-scoped levels

### Phase 2 — Not Yet Built

| Feature | Priority | Notes |
|---------|----------|-------|
| ~~OAuth login (Google/GitHub)~~ | ~~High~~ | **DONE** then **REMOVED** in v0.9.0 — simplified to email/password only |
| ~~File upload (Cloudinary/S3)~~ | ~~High~~ | **DONE** — Cloudinary upload route at `POST /api/uploads` |
| ~~CI/CD pipeline~~ | ~~High~~ | **DONE** — GitHub Actions: lint, type-check, test, build |
| ~~Firefox extension~~ | ~~Medium~~ | **DONE** — MV2 manifest with `browser.*` API in `extension-firefox/` |
| ~~Safari extension~~ | ~~Medium~~ | **DONE** — MV3 manifest in `extension-safari/` |
| ~~Real-time updates (SSE)~~ | ~~Medium~~ | **DONE** — SSE endpoint + EventEmitter pub/sub |
| ~~Rate limiting~~ | ~~Medium~~ | **DONE** — `@fastify/rate-limit` (100/min global, 10/min auth) |
| ~~Error tracking (Sentry)~~ | ~~Medium~~ | **DONE** — `@sentry/node` (API) + `@sentry/nextjs` (web) |
| ~~Automated tests~~ | ~~Medium~~ | **DONE** — Vitest with 25 unit tests, CI-integrated |
| ~~Redis caching~~ | ~~Low~~ | **DONE** — ioredis with TTL-based caching + SCAN invalidation |
| ~~Background jobs~~ | ~~Low~~ | **DONE** — BullMQ queues (email, screenshot, cleanup) |
| ~~Database backups~~ | ~~Low~~ | **DONE** — pg_dump scripts with 30-day retention |

---

## Identified Gaps

### Security

1. ~~**No rate limiting**~~ — **RESOLVED:** `@fastify/rate-limit` with 100 req/min global, 10 req/min on auth routes
2. ~~**Hardcoded JWT fallback**~~ — **RESOLVED:** Startup fails if `JWT_SECRET` is unset
3. ~~**CORS allows all origins**~~ — **RESOLVED:** Explicit `ALLOWED_ORIGINS` env-based allowlist
4. ~~**No CSRF protection**~~ — **Not Applicable:** App uses `localStorage` + `Authorization: Bearer` headers (not cookies). CSRF attacks exploit auto-attached cookies, so this architecture is inherently CSRF-resistant.
5. ~~**No input sanitization beyond Zod**~~ — **RESOLVED:** `sanitize-html` on API write path (v0.7.0)

### Reliability

1. ~~**No CI/CD**~~ — **RESOLVED:** GitHub Actions CI pipeline (lint, type-check, test, build) on push/PR
2. ~~**No monitoring**~~ — **RESOLVED:** Sentry error tracking for both API and frontend
3. ~~**No health check alerting**~~ — **RESOLVED:** Health monitoring implemented (`healthMonitor.start()` in `apps/api/src/index.ts`)
4. **Free-tier hosting** — Render free tier has cold start delays and limited resources

### Data

1. ~~**No file storage integration**~~ — **RESOLVED:** Cloudinary SDK integration with upload route (`POST /api/uploads`)
2. ~~**No database backup strategy**~~ — **RESOLVED:** pg_dump scripts with gzip compression and 30-day retention (`scripts/backup-db.sh`, `scripts/restore-db.sh`)
3. ~~**Screenshots stored as URLs only**~~ — **RESOLVED:** Cloudflare R2 backup storage for screenshots (`apps/api/src/lib/r2.ts`)

---

## Recommended Next Steps

### High Priority

| # | Action | Rationale |
|---|--------|-----------|
| 1 | ~~**Add CI/CD pipeline**~~ | **DONE** — `.github/workflows/ci.yml` |
| 2 | ~~**Implement rate limiting**~~ | **DONE** — `@fastify/rate-limit` registered globally |
| 3 | ~~**Remove JWT fallback secret**~~ | **DONE** — Startup fails if `JWT_SECRET` unset |
| 4 | ~~**Implement file upload**~~ | **DONE** — Cloudinary SDK + `POST /api/uploads` |
| 5 | ~~**Restrict CORS origins**~~ | **DONE** — `ALLOWED_ORIGINS` env-based allowlist |

### Medium Priority

| # | Action | Rationale |
|---|--------|-----------|
| 6 | ~~**Add error tracking**~~ | **DONE** — `@sentry/node` + `@sentry/nextjs` |
| 7 | ~~**Add OAuth login**~~ | **DONE** then **REMOVED** in v0.9.0 — simplified to email/password only |
| 8 | ~~**Add SSE support**~~ | **DONE** — SSE endpoint + EventEmitter pub/sub |
| 9 | ~~**Port extension to Firefox**~~ | **DONE** — MV2 with `browser.*` API |
| 10 | ~~**Add automated tests**~~ | **DONE** — Vitest with 25 API unit tests |

### Low Priority

| # | Action | Rationale |
|---|--------|-----------|
| 11 | ~~**Add Redis caching**~~ | **DONE** — ioredis with TTL-based get-or-compute pattern |
| 12 | ~~**Add structured logging**~~ | **DONE** — pino-pretty for dev, JSON for prod |
| 13 | ~~**Add background jobs**~~ | **DONE** — BullMQ queues (email, screenshot, cleanup) |
| 14 | ~~**Add database backups**~~ | **DONE** — pg_dump scripts with 30-day retention |
| 15 | ~~**Add environment separation**~~ | **DONE** — Staging env configs + CI deploy workflow |
| 16 | **Upgrade to paid hosting tier** | Eliminates cold starts, improves reliability |
| 17 | **Custom domain setup** | More professional URLs for production |
| 18 | ~~**Safari extension**~~ | **DONE** — MV3 manifest in `extension-safari/` |

---

## Key File Reference

| File | Purpose |
|------|---------|
| `apps/web/package.json` | Frontend dependencies and scripts |
| `apps/web/app/` | Next.js App Router pages |
| `apps/web/vercel.json` | Vercel build configuration |
| `apps/api/package.json` | Backend dependencies and scripts |
| `apps/api/src/index.ts` | Fastify server entry point |
| `apps/api/src/routes/` | API route modules (auth, projects, issues, comments, feedback, members, uploads, users, admin, events, notifications, share, qaCycles) |
| `apps/api/src/plugins/` | Fastify plugins (auth with fastify-plugin, errorHandler) |
| `apps/api/src/services/authService.ts` | Auth service (register, login, password reset) |
| `apps/web/store/authStore.ts` | Zustand auth state with persist middleware |
| `apps/web/lib/clerkTokenBridge.ts` | Auth token bridge (`getAuthToken()` from localStorage) |
| `apps/web/lib/useRole.ts` | Global role hook (`hasRole`, `isAdmin`, `isViewer`) |
| `apps/web/lib/useProjectRole.ts` | Project-scoped role hook |
| `apps/web/components/RoleGate.tsx` | Conditional render by minimum role |
| `apps/api/src/middleware/requireRole.ts` | Global role guard middleware |
| `apps/api/src/middleware/requireProjectRole.ts` | Project-scoped role guard middleware |
| `apps/web/app/forgot-password/page.tsx` | Forgot password page |
| `apps/web/app/reset-password/page.tsx` | Reset password page (token from URL) |
| `apps/api/prisma/schema.prisma` | Database schema (10 models, 4 enums) |
| `extension/manifest.json` | Chrome extension Manifest V3 config |
| `extension/mark-my-image.js` | Canvas annotation engine |
| `extension/bugsnap-ui.js` | Extension overlay UI |
| `extension/content.js` | Content script (page injection) |
| `extension/background.js` | Extension service worker |
| `extension-firefox/manifest.json` | Firefox extension MV2 config |
| `extension-firefox/bugsnap-ui.js` | Firefox extension overlay UI (browser.* API) |
| `extension-safari/manifest.json` | Safari extension MV3 config |
| `extension-safari/bugsnap-ui.js` | Safari extension overlay UI |
| `apps/api/src/lib/sentry.ts` | Sentry SDK initialization |
| `apps/api/src/routes/qaCycles.ts` | QA Cycle CRUD routes |
| `apps/api/src/routes/share.ts` | Shareable link routes |
| `apps/api/src/routes/notifications.ts` | Notification routes |
| `apps/api/src/lib/eventBus.ts` | SSE event emitter pub/sub |
| `apps/api/src/routes/events.ts` | SSE endpoint for live updates |
| `apps/api/vitest.config.ts` | Vitest test configuration |
| `apps/api/src/__tests__/` | API unit tests (auth, projects) |
| `apps/web/sentry.client.config.ts` | Frontend Sentry client config |
| `apps/api/src/lib/redis.ts` | Redis caching layer (ioredis) |
| `apps/api/src/lib/queue.ts` | BullMQ background job queues |
| `scripts/backup-db.sh` | Database backup script (pg_dump) |
| `scripts/restore-db.sh` | Database restore script |
| `apps/api/.env.staging.example` | API staging environment template |
| `apps/web/.env.staging.example` | Web staging environment template |
| `.github/workflows/staging.yml` | Staging deploy workflow |
| `Dockerfile` | Docker build for API (Node 20 Alpine) |
| `render.yaml` | Render deployment config |
| `turbo.json` | Turborepo pipeline config |

---

## Open Architecture TODOs

> Extracted 2026-02-09 by scanning for unresolved gaps, "Not Implemented", "Partial", and non-struck-through items.

### Checklist

- [x] **XSS Input Sanitization** — **RESOLVED** in v0.7.0. `sanitize-html` added on API write path for issue titles, comments, feedback descriptions. See `SECURITY_INPUT_SANITIZATION.md`.

- [x] **Health Check Alerting** — **RESOLVED.** `healthMonitor.start()` implemented in `apps/api/src/index.ts`.

- [x] **Screenshot Durability** — **RESOLVED.** Cloudflare R2 backup storage for screenshots (`apps/api/src/lib/r2.ts`). S3-compatible API with configurable bucket.

- [ ] **Custom Domain Configuration** — Both frontend and backend use platform default subdomains (`bugsnap-web-dun.vercel.app`, `bugsnap-xgfd.onrender.com`). Custom domains improve branding, trust, and cookie scoping. *Related:* [Infrastructure & DevOps table](#infrastructure--devops), `apps/web/vercel.json`, `render.yaml`. *Constraint:* Requires DNS access and TLS cert provisioning (auto on both platforms).

- [ ] **Paid Hosting Tier** — Render free tier has cold-start delays (~30s) and limited resources (512 MB RAM, shared CPU). Upgrade eliminates cold starts and enables persistent Redis/BullMQ connections. *Related:* [Identified Gaps > Reliability #4](#reliability), [Recommended Next Steps #16](#low-priority). *Constraint:* Render Starter is $7/mo; evaluate actual traffic before committing.

- [x] **Safari Extension** — **RESOLVED.** MV3 manifest in `extension-safari/` with screenshot capture support.

- [ ] **Expand Test Coverage** — Only 1 test file exists (`apps/api/src/__tests__/projects.test.ts`) with 12 test cases covering project CRUD. Auth routes, OAuth, comments, feedback, issues, uploads, and middleware have zero test coverage. *Related:* [Infrastructure & DevOps table](#infrastructure--devops), `apps/api/vitest.config.ts`. *Note:* Doc inconsistency — lines referencing "25 tests" should read "12 tests" (actual count).

### Needs Clarification

- [x] **CSRF Protection** — **Not Applicable.** The app uses `localStorage` + `Authorization: Bearer` headers (not cookies). CSRF attacks exploit auto-attached cookies, so this architecture is inherently CSRF-resistant. All extensions also use `Authorization` headers.

### Suggested Next Steps

#### High Priority (security & data integrity)

| # | TODO | Why |
|---|------|-----|
| 1 | ~~**XSS Input Sanitization**~~ | **RESOLVED** in v0.7.0 — `sanitize-html` on API write path. |
| 2 | ~~**Screenshot Durability**~~ | **RESOLVED** — Cloudflare R2 backup storage. |
| 3 | **Expand Test Coverage** | Auth, issues, feedback, and comments are undertested. Regressions ship silently. Start with auth routes (highest blast radius). Medium effort. |

#### Medium Priority (reliability & operations)

| # | TODO | Why |
|---|------|-----|
| 4 | ~~**Health Check Alerting**~~ | **RESOLVED** — `healthMonitor.start()` implemented. |
| 5 | **Custom Domain** | Improves user trust and enables proper cookie scoping if auth ever moves to httpOnly cookies. Low effort (DNS + platform config). |

#### Low Priority (nice-to-have)

| # | TODO | Why |
|---|------|-----|
| 6 | **Paid Hosting Tier** | Cold starts hurt DX/UX but aren't critical until real user traffic. Evaluate after traffic baseline. |
| 7 | ~~**Safari Extension**~~ | **RESOLVED** — MV3 manifest in `extension-safari/`. |

#### Cross-Cutting Concerns

- **Security** — XSS sanitization resolved (v0.7.0). CSRF not applicable (Bearer token auth). Consider CSP headers + review of all rendering contexts.
- **Observability** spans item #3 (tests). Expanding tests gives a stronger safety net.
- **Data resilience** — Screenshot durability resolved with Cloudflare R2 backup. Database backups via pg_dump scripts.
