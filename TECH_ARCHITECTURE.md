# BugSnap - Technical Architecture Audit

**Version:** 0.3.0
**Audit Date:** 2026-02-05
**Repository:** Turborepo monorepo with npm workspaces

---

## Architecture Overview

```
bugsnap/
├── apps/
│   ├── web/          # Next.js 16.x frontend (Vercel)
│   └── api/          # Fastify 5.x backend (Render/Docker)
├── packages/
│   └── shared/       # Shared TypeScript package (@bugsnap/shared)
├── extension/        # Chrome extension (Manifest V3)
├── Dockerfile        # Multi-stage Docker build for API
├── render.yaml       # Render deployment config
├── turbo.json        # Turborepo pipeline config
└── package.json      # Root workspace config (npm workspaces)
```

**Data Flow:**
```
Chrome Extension  ──capture──>  Fastify API  <──manage──  Next.js Dashboard
   (any website)                    │                         │
                              PostgreSQL DB            Vercel Hosting
                             (Prisma ORM)
```

---

## Audit Results

### Frontend

| Component | Status | Details |
|-----------|--------|---------|
| Web Application | Implemented | Next.js 16.1.6, React 19, App Router, Tailwind CSS 3.4 — `apps/web/` |
| State Management | Implemented | Zustand 4.4 (client state), TanStack React Query 5.17 (server state) — `apps/web/package.json` |
| Dashboard Pages | Implemented | 9 routes: login, register, dashboard, projects (list/new/detail), account, feedback, install-extension — `apps/web/app/` |
| Chrome Extension | Implemented | Manifest V3, content scripts injected on all URLs — `extension/manifest.json` |
| Annotation Layer | Implemented | Custom HTML5 Canvas 2D implementation (rectangle, arrow, pen, text, cursor tools) — `extension/mark-my-image.js` |
| Overlay / Bug Capture UI | Implemented | Injected via extension content scripts — `extension/bugsnap-ui.js`, `extension/content.js` |
| Firefox Extension | Implemented | MV2 manifest with `browser.*` Promise-based API — `extension-firefox/manifest.json` |
| Safari Extension | Not Implemented | No Xcode project or Safari extension wrapper |

### Backend

| Component | Status | Details |
|-----------|--------|---------|
| API Framework | Implemented | Fastify 5.7.4 with TypeScript — `apps/api/src/index.ts` |
| JWT Authentication | Implemented | `@fastify/jwt` 10.0, 7-day tokens, bcrypt password hashing, startup validation of `JWT_SECRET` — `apps/api/src/plugins/auth.ts`, `apps/api/src/routes/auth.ts`, `apps/api/src/index.ts:19-23` |
| API Routes | Implemented | 6 route modules: auth, projects, projectMembers, tasks, feedback, uploads — `apps/api/src/routes/` |
| CORS Configuration | Implemented | Explicit `ALLOWED_ORIGINS` env-based allowlist + chrome-extension + localhost (dev only) — `apps/api/src/index.ts:35-59` |
| Error Handling | Implemented | Custom Fastify error handler plugin — `apps/api/src/plugins/errorHandler.ts` |
| Input Validation | Implemented | Zod 3.22 for request validation — `apps/api/package.json` |
| File Upload Support | Implemented | `@fastify/multipart` (10MB limit) + Cloudinary upload route — `apps/api/src/routes/uploads.ts`, `apps/api/src/lib/cloudinary.ts` |
| Health Check | Implemented | `/health` endpoint with database connectivity check — `apps/api/src/index.ts:81-89` |
| OAuth (Google/GitHub) | Implemented | `@fastify/oauth2` — Google Discovery + GitHub config, `findOrCreateOAuthUser` — `apps/api/src/routes/oauth.ts` |
| Real-time (SSE) | Implemented | Server-Sent Events with EventEmitter pub/sub — `apps/api/src/routes/events.ts`, `apps/api/src/lib/eventBus.ts` |
| Background Jobs (Queues) | Implemented | BullMQ with email, screenshot, cleanup queues — `apps/api/src/lib/queue.ts` |
| Rate Limiting | Implemented | `@fastify/rate-limit` — global 100 req/min, auth routes 10 req/min — `apps/api/src/index.ts:61-65`, `apps/api/src/routes/auth.ts:7-14` |
| Structured Logging | Implemented | Pino with `pino-pretty` for dev, JSON for production — `apps/api/src/index.ts:36-53` |

### Database & Storage

| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL | Implemented | Prisma 5.8.1 ORM — `apps/api/prisma/schema.prisma` |
| Schema Models | Implemented | 9 models: User, Project, ProjectMember, Task, Annotation, Comment, Feedback, FeedbackComment + enums (UserRole, TaskType, FeedbackType, FeedbackStatus) |
| Migrations | Implemented | 10 migrations applied — `apps/api/prisma/migrations/` |
| Database Indexes | Implemented | Indexes on foreign keys and frequently queried fields (status, priority, type) |
| File Storage (Cloudinary) | Implemented | Cloudinary SDK integration with `POST /api/uploads` route — `apps/api/src/lib/cloudinary.ts`, `apps/api/src/routes/uploads.ts` |
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
| Automated Tests | Implemented | Vitest 4.x, 25 unit tests (auth + projects) — `apps/api/src/__tests__/`, `apps/api/vitest.config.ts` |
| SSL/TLS | Implemented | Handled by Vercel (frontend) and Render (backend) platform-level TLS |
| Domain Configuration | Partial | Default platform subdomains (`bugsnap-web-dun.vercel.app`, `bugsnap-xgfd.onrender.com`). Custom domain `leidback.viewourdesign.info` referenced in CORS. |

---

## Phase 1 (Built) vs Phase 2 (Planned)

### Phase 1 — Current State

The core product loop is functional:

1. **User registers/logs in** via the dashboard (JWT auth)
2. **Creates a project** with a website URL, gets an API key
3. **Installs the Chrome extension** and links it to the project
4. **Captures bugs** on any website via the extension overlay (screenshot + annotations)
5. **Tasks appear** on the project dashboard with screenshots, annotations, metadata
6. **Team members** can be invited (Manager/Developer/Viewer roles)
7. **Comments** can be added to tasks
8. **Feedback system** exists as a separate module (BUG/FEATURE types)

### Phase 2 — Not Yet Built

| Feature | Priority | Notes |
|---------|----------|-------|
| ~~OAuth login (Google/GitHub)~~ | ~~High~~ | **DONE** — `@fastify/oauth2` with Google/GitHub, `findOrCreateOAuthUser` |
| ~~File upload (Cloudinary/S3)~~ | ~~High~~ | **DONE** — Cloudinary upload route at `POST /api/uploads` |
| ~~CI/CD pipeline~~ | ~~High~~ | **DONE** — GitHub Actions: lint, type-check, test, build |
| ~~Firefox extension~~ | ~~Medium~~ | **DONE** — MV2 manifest with `browser.*` API in `extension-firefox/` |
| Safari extension | Medium | Requires macOS/Xcode — skipped |
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
4. **No CSRF protection** — JWT-only auth without CSRF tokens
5. **No input sanitization beyond Zod** — Zod validates structure but not XSS content

### Reliability

1. ~~**No CI/CD**~~ — **RESOLVED:** GitHub Actions CI pipeline (lint, type-check, test, build) on push/PR
2. ~~**No monitoring**~~ — **RESOLVED:** Sentry error tracking for both API and frontend
3. **No health check alerting** — `/health` endpoint exists but nothing monitors it
4. **Free-tier hosting** — Render free tier has cold start delays and limited resources

### Data

1. ~~**No file storage integration**~~ — **RESOLVED:** Cloudinary SDK integration with upload route (`POST /api/uploads`)
2. ~~**No database backup strategy**~~ — **RESOLVED:** pg_dump scripts with gzip compression and 30-day retention (`scripts/backup-db.sh`, `scripts/restore-db.sh`)
3. **Screenshots stored as URLs only** — If external sources go down, screenshot data is lost

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
| 7 | ~~**Add OAuth login**~~ | **DONE** — Google/GitHub via `@fastify/oauth2` |
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
| 18 | **Safari extension** | Smallest browser market share among targets |

---

## Key File Reference

| File | Purpose |
|------|---------|
| `apps/web/package.json` | Frontend dependencies and scripts |
| `apps/web/app/` | Next.js App Router pages |
| `apps/web/vercel.json` | Vercel build configuration |
| `apps/api/package.json` | Backend dependencies and scripts |
| `apps/api/src/index.ts` | Fastify server entry point |
| `apps/api/src/routes/` | API route modules (auth, projects, tasks, feedback, members) |
| `apps/api/src/plugins/` | Fastify plugins (auth, errorHandler) |
| `apps/api/prisma/schema.prisma` | Database schema (9 models, 4 enums) |
| `extension/manifest.json` | Chrome extension Manifest V3 config |
| `extension/mark-my-image.js` | Canvas annotation engine |
| `extension/bugsnap-ui.js` | Extension overlay UI |
| `extension/content.js` | Content script (page injection) |
| `extension/background.js` | Extension service worker |
| `extension-firefox/manifest.json` | Firefox extension MV2 config |
| `extension-firefox/bugsnap-ui.js` | Firefox extension overlay UI (browser.* API) |
| `apps/api/src/lib/sentry.ts` | Sentry SDK initialization |
| `apps/api/src/routes/oauth.ts` | OAuth2 login routes (Google/GitHub) |
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
