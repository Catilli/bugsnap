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
| Firefox Extension | Not Implemented | No Firefox-specific manifest or WebExtension polyfill |
| Safari Extension | Not Implemented | No Xcode project or Safari extension wrapper |

### Backend

| Component | Status | Details |
|-----------|--------|---------|
| API Framework | Implemented | Fastify 5.7.4 with TypeScript — `apps/api/src/index.ts` |
| JWT Authentication | Implemented | `@fastify/jwt` 10.0, 7-day tokens, bcrypt password hashing — `apps/api/src/plugins/auth.ts`, `apps/api/src/routes/auth.ts` |
| API Routes | Implemented | 5 route modules: auth, projects, projectMembers, tasks, feedback — `apps/api/src/routes/` |
| CORS Configuration | Implemented | Dynamic origin validation (localhost, Vercel, Render, chrome-extension://) — `apps/api/src/index.ts:28-69` |
| Error Handling | Implemented | Custom Fastify error handler plugin — `apps/api/src/plugins/errorHandler.ts` |
| Input Validation | Implemented | Zod 3.22 for request validation — `apps/api/package.json` |
| File Upload Support | Partial | `@fastify/multipart` registered (10MB limit) but no upload route implementations — `apps/api/src/index.ts:71-75` |
| Health Check | Implemented | `/health` endpoint with database connectivity check — `apps/api/src/index.ts:81-89` |
| OAuth (Google/GitHub) | Not Implemented | No OAuth packages, no OAuth routes |
| Real-time (WebSockets) | Not Implemented | No socket.io, ws, or SSE implementation |
| Background Jobs (Queues) | Not Implemented | No Bull, BullMQ, or Agenda |
| Rate Limiting | Not Implemented | No `@fastify/rate-limit` or equivalent |

### Database & Storage

| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL | Implemented | Prisma 5.8.1 ORM — `apps/api/prisma/schema.prisma` |
| Schema Models | Implemented | 9 models: User, Project, ProjectMember, Task, Annotation, Comment, Feedback, FeedbackComment + enums (UserRole, TaskType, FeedbackType, FeedbackStatus) |
| Migrations | Implemented | 10 migrations applied — `apps/api/prisma/migrations/` |
| Database Indexes | Implemented | Indexes on foreign keys and frequently queried fields (status, priority, type) |
| File Storage (S3/Cloudinary) | Not Implemented | Cloudinary env vars exist in `.env.example` but zero code references. Screenshots stored as URL strings in `Task.screenshotUrl`. No upload routes. |
| Redis Caching | Not Implemented | No Redis packages or caching layer |
| Database Backups | Not Implemented | No automated backup configuration |

### Infrastructure & DevOps

| Component | Status | Details |
|-----------|--------|---------|
| Frontend Hosting | Implemented | Vercel with custom build config — `apps/web/vercel.json` |
| Backend Hosting | Implemented | Render (Docker) on free tier, Oregon region — `render.yaml`, `Dockerfile` |
| Docker Build | Implemented | Node 20 Alpine, multi-stage build with bcrypt native compilation — `Dockerfile` |
| Monorepo Tooling | Implemented | Turborepo 1.11, npm workspaces — root `package.json`, `turbo.json` |
| Shared Package | Implemented | `@bugsnap/shared` TypeScript package — `packages/shared/` |
| CI/CD (GitHub Actions) | Not Implemented | No `.github/workflows/` directory |
| Environment Separation | Partial | Dev/Prod `.env` files, NODE_ENV-aware error handling; no formal staging environment |
| Monitoring & Logging | Not Implemented | Fastify stdout logger only. No Sentry, Datadog, or structured logging |
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
| OAuth login (Google/GitHub) | High | Reduces registration friction |
| File upload (Cloudinary/S3) | High | Currently no image upload pipeline — screenshots are URL-only |
| CI/CD pipeline | High | No automated testing, linting, or deployment gates |
| Firefox/Safari extensions | Medium | Limits browser reach |
| Real-time updates (WebSockets) | Medium | Dashboard requires manual refresh |
| Rate limiting | Medium | API is unprotected against abuse |
| Monitoring/error tracking | Medium | No visibility into production errors |
| Redis caching | Low | Not needed at current scale |
| Background jobs | Low | No long-running tasks currently |
| Database backups | Low | Managed by database provider, but no app-level strategy |

---

## Identified Gaps

### Security

1. **No rate limiting** — API endpoints are unprotected against brute force or abuse
2. **Hardcoded JWT fallback** — `JWT_SECRET` defaults to a static string if env var is missing (`apps/api/src/index.ts:24`)
3. **CORS allows all origins** — The origin callback ultimately returns `true` for all origins (`apps/api/src/index.ts:61`)
4. **No CSRF protection** — JWT-only auth without CSRF tokens
5. **No input sanitization beyond Zod** — Zod validates structure but not XSS content

### Reliability

1. **No CI/CD** — Changes go to production without automated tests or checks
2. **No monitoring** — Production errors are only visible in Render logs
3. **No health check alerting** — `/health` endpoint exists but nothing monitors it
4. **Free-tier hosting** — Render free tier has cold start delays and limited resources

### Data

1. **No file storage integration** — Cloudinary is referenced in `.env.example` but never used in code
2. **No database backup strategy** — Relies entirely on hosting provider defaults
3. **Screenshots stored as URLs only** — If external sources go down, screenshot data is lost

---

## Recommended Next Steps

### High Priority

| # | Action | Rationale |
|---|--------|-----------|
| 1 | **Add CI/CD pipeline** (GitHub Actions: lint, type-check, test) | Prevents regressions, gates broken code from deploying |
| 2 | **Implement rate limiting** (`@fastify/rate-limit`) | Protects auth endpoints from brute force attacks |
| 3 | **Remove JWT fallback secret** — fail hard if `JWT_SECRET` is unset | Prevents accidental deployment with predictable secret |
| 4 | **Implement file upload** (Cloudinary or S3) with upload routes | Unblocks screenshot and attachment persistence |
| 5 | **Restrict CORS origins** to explicit allowlist | Current config effectively allows all origins |

### Medium Priority

| # | Action | Rationale |
|---|--------|-----------|
| 6 | **Add error tracking** (Sentry or similar) | Gain visibility into production errors |
| 7 | **Add OAuth login** (Google, GitHub) | Reduces signup friction for developers |
| 8 | **Add WebSocket or SSE support** for live dashboard updates | Eliminates need for manual refresh |
| 9 | **Port extension to Firefox** (WebExtension API is mostly compatible) | Expands browser coverage |
| 10 | **Add automated tests** (Vitest for API, Playwright for E2E) | Enables safe refactoring and CI gates |

### Low Priority

| # | Action | Rationale |
|---|--------|-----------|
| 11 | **Add Redis caching** for frequently-read project/task data | Not needed until scale demands it |
| 12 | **Add structured logging** (pino-pretty for dev, JSON for prod) | Fastify already uses pino — just needs configuration |
| 13 | **Upgrade to paid hosting tier** | Eliminates cold starts, improves reliability |
| 14 | **Custom domain setup** | More professional URLs for production |
| 15 | **Safari extension** | Smallest browser market share among targets |

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
| `Dockerfile` | Docker build for API (Node 20 Alpine) |
| `render.yaml` | Render deployment config |
| `turbo.json` | Turborepo pipeline config |
