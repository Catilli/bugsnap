# BugSnap

> Visual bug capture and feedback tool that lets teams report website issues directly on the page where they occur.

## 🎯 Overview

BugSnap is a web-based application that helps teams capture, annotate, and manage bug reports with rich context. Users can upload screenshots, add annotations, and provide detailed environment information to help developers fix issues faster.

## 📚 Documentation Index

### Architecture & Audits

| Document | Description |
|----------|-------------|
| [Technical Architecture](./docs/TECH_ARCHITECTURE.md) | Full architecture audit — frontend, backend, database, infrastructure, identified gaps, and recommended next steps |
| [Input Sanitization](./docs/SECURITY_INPUT_SANITIZATION.md) | Security guide for input validation, HTML sanitization, URL safety, and defense-in-depth patterns |
| [Core Features Audit](./docs/CORE_FEATURES.md) | Read-only codebase analysis of 46 features across 7 categories with implementation status and evidence |
| [User Roles & Permissions](./docs/USER_ROLES.md) | Implementation tracker for the 4-role RBAC system -- capabilities, status, and verification steps |
| [Kanban Dashboard](./docs/KANBAN_DASHBOARD.md) | Audit and implementation tracker for the Kanban dashboard, QA cycle reports, unified views, and real-time updates |


## 🏗️ Project Structure

This is a monorepo managed with Turborepo containing:

```
bugsnap/
├── apps/
│   ├── web/              # Next.js 16 web application
│   └── api/              # Fastify backend API
├── packages/
│   └── shared/           # Shared types and schemas
├── extension/            # Chrome extension (Manifest V3)
├── extension-firefox/    # Firefox extension (Manifest V2)
├── extension-safari/     # Safari extension (Manifest V3)
└── ...config files
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bugsnap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   For the API:
   ```bash
   cd apps/api
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the development servers**
    ```bash
    # From the root directory
    npm run dev
    ```

    This will start:
    - Web app: http://localhost:3000
    - API server: http://localhost:3001

### Browser Extension

The BugSnap browser extension allows users to capture bugs directly from any website. Supported browsers: **Chrome**, **Firefox**, and **Safari**.

1. **Install the extension**
   - Download the extension from the dashboard at `/dashboard/install-extension`
   - **Chrome/Edge**: Load `extension/` in Developer Mode
   - **Firefox**: Load `extension-firefox/` via `about:debugging`
   - **Safari**: Load `extension-safari/` via Xcode

2. **Use the extension**
   - Navigate to any website
   - Click the BugSnap extension icon
   - Capture screenshots, record screen (Chrome/Firefox), and report bugs
   - Reports are automatically sent to your BugSnap project

## 📦 Tech Stack

### Frontend (Web App)
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: Zustand

### Backend (API)
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (email/password)
- **Authorization**: Role-based (ADMIN, MANAGER, DEVELOPER, VIEWER)
- **File Storage**: Cloudinary + Cloudflare R2 (screenshot backup)
- **Language**: TypeScript

### Browser Extensions
- **Chrome**: Manifest V3, screenshot capture + screen recording
- **Firefox**: Manifest V2, screenshot capture + screen recording
- **Safari**: Manifest V3, screenshot capture
- **Language**: JavaScript
- **Integration**: PostMessage API for web app communication

### Shared
- **Validation**: Zod schemas
- **Types**: Shared TypeScript types

## 🛠️ Available Scripts

From the root directory:

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all apps for production
- `npm run lint` - Lint all apps
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

From the API directory:

- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Lint TypeScript files
- `npm run type-check` - Run TypeScript type checking

## 📋 Features

### Current
- ✅ Monorepo structure with Turborepo
- ✅ Next.js 16 web application with App Router
- ✅ Fastify API server
- ✅ Shared types and schemas
- ✅ TypeScript configuration
- ✅ ESLint and Prettier setup
- ✅ User authentication and authorization (JWT, email/password)
- ✅ Role-based access control (ADMIN, MANAGER, DEVELOPER, VIEWER)
- ✅ Project management
- ✅ Project member management with role assignment
- ✅ Dashboard with project listing (grid and list views)
- ✅ Project creation and editing
- ✅ Issue management with full CRUD operations
- ✅ Kanban board with drag-and-drop (role-gated)
- ✅ Issue filtering and sorting (by date, status, assignee)
- ✅ Reusable FilterBar and PageHeader components
- ✅ Multi-browser extension support (Chrome, Firefox, Safari)
- ✅ Screen recording in Chrome and Firefox extensions
- ✅ PostgreSQL database with Prisma ORM
- ✅ Issue creation with custom titles and auto-numbering
- ✅ Screenshot capture and annotation tools
- ✅ Clickable pin in screenshot lightbox (navigate to element on page)
- ✅ Environment data collection
- ✅ Comments and collaboration
- ✅ Real-time updates (SSE)
- ✅ Rate limiting
- ✅ Error tracking (Sentry)
- ✅ Shareable issue and feedback links
- ✅ Public "anyone with link" project sharing
- ✅ File attachments (upload + drag-and-drop)
- ✅ Activity timeline and audit logging
- ✅ Notification system (split by issue/feedback)
- ✅ Admin dashboard with system stats and user management
- ✅ Team management UI with admin-only member creation
- ✅ Admin password management for team members
- ✅ QA Cycle management (create, add/remove issues, status tracking)
- ✅ Feedback system (bug reports & feature requests)
- ✅ Shared Drawer component and DialogProvider
- ✅ Cloudflare R2 backup for screenshots
- ✅ XSS sanitization and security hardening
- ✅ Extension task drawer (view/manage tasks from any webpage)
- ✅ Extension task detail panel (status, screenshot, comments)
- ✅ Annotation editing on existing tasks from the extension (burned into screenshot)
- ✅ Screenshot compositing (annotations burned into screenshot on save via extension)
- ✅ Cloudinary CDN for screenshot uploads

### Planned
- 🔲 Third-party integrations (Jira, Linear, GitHub)
- 🔲 Issue templates
- 🔲 Admin settings panel (workflows, statuses, priorities)
- 🔲 Report export

## 🗄️ Database Schema

The database schema includes:
- Users (with authentication and roles)
- Projects (bug tracking projects)
- ProjectMembers (project access control with per-project roles)
- Issues (bug reports with status, assignee, type)
- Annotations (visual annotations on issues)
- Comments (issue and feedback comments)
- Feedback and FeedbackComments (bug reports & feature requests)
- Attachments (file uploads on issues and feedback)
- Notifications (split by issue/feedback category)
- ActivityLog (audit trail for issue/feedback changes)
- ShareTokens (shareable links with expiry)
- QACycle and QACycleIssue (QA cycle management)
- PasswordResetTokens

See [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) for the complete schema definition.

## 🔐 Environment Variables

### API (`apps/api/.env`)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/bugsnap
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=bugsnap-screenshots
R2_PUBLIC_URL=https://your-r2-public-url.com
```

## 📝 Development Workflow

1. Create a new branch for your feature
2. Make your changes
3. Run `npm run lint` and `npm run type-check`
4. Commit and push
5. Create a pull request

## 🤝 Contributing

Contributions are welcome! Please follow the development workflow above.

## 📄 License

This project is private and proprietary.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Fastify Documentation](https://www.fastify.io/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

---

**Status**: Active Development ✅

**Current Version**: v0.10.2

**Next Steps**: Third-party integrations, issue templates, and admin settings panel

**Recent Updates (v0.10.2)**:
- Clean screenshot capture — extension hides pin marker, element outline, task pins, and tasks drawer before capturing
- UI elements are restored after capture (or on error) before the annotation modal opens


## 📝 Changelog

### v0.10.2 (February 13, 2026)
- ✅ Clean screenshot capture — `hideUIForCapture()` hides red pin, blue element outline, tasks button, task pin markers, and tasks drawer/backdrop before capture
- ✅ `restoreUIAfterCapture()` restores all hidden elements after capture completes (on both success and error paths)
- ✅ Applied to all three browser variants (Chrome, Firefox, Safari)

### v0.10.1 (February 13, 2026)
- ✅ Removed web app annotation editor (AnnotationEditorModal + MarkMyImage) — annotations are burned into screenshots by the extension
- ✅ Restored clickable pin tagging in screenshot lightbox with scaled position for constrained 90vw/90vh images
- ✅ Lightbox style matches extension Task Drawer — `rgba(0,0,0,0.9)` backdrop, centered image, `x` close button, 4px border radius
- ✅ Removed SVG annotation overlay rendering from lightbox (redundant since annotations are composited into screenshot)
- ✅ DialogProvider lightbox no longer scrollable (constrained image fits viewport)

### v0.10.0 (February 13, 2026)
- ✅ Extension task drawer — view and manage project tasks from any webpage with grouped list, search, and status filters
- ✅ Extension task detail panel — full detail view with back navigation, status dropdown, screenshot with lightbox, and comments section
- ✅ Annotation editing from extension — reopen annotation editor on existing tasks with "Update" button, loads existing annotations via `setAnnotations()`
- ✅ Screenshot compositing — annotations are burned into the screenshot image when saving/updating, uploaded to Cloudinary CDN
- ✅ PATCH `/api/issues/:issueId` extended to accept `annotations` array and `screenshotUrl` (data URL → Cloudinary)
- ✅ Background script fetches screenshot as data URL to avoid CORS taint during compositing
- ✅ Tasks button visible on matched project pages without enabling tagging mode
- ✅ Install extension page updated with permanent folder extraction warning and example paths
- ✅ Fixed task status case mismatch preventing tasks from rendering
- ✅ Fixed Zod validation rejecting `null` for annotation `content` and `color` fields (`.optional()` → `.nullish()`)
- ✅ Fixed duplicate text annotations from double `saveText()` execution (Enter + blur)

### v0.9.0 (February 12, 2026)
- ✅ Multi-browser extension support — Chrome (MV3), Firefox (MV2), Safari (MV3) (`extension-safari/`)
- ✅ Screen recording in Chrome and Firefox extensions (`MediaRecorder` + `getDisplayMedia`)
- ✅ Public "anyone with link" project sharing with redesigned share dropdown
- ✅ Clickable pin in screenshot lightbox (navigate to element on page)
- ✅ QA Cycle management — create, add/remove issues, status tracking (`QACycle` + `QACycleIssue` models)
- ✅ Cloudflare R2 backup for screenshots (`apps/api/src/lib/r2.ts`)
- ✅ Admin password management for team members
- ✅ Removed OAuth (Google/GitHub) — simplified to email/password only
- ✅ Removed Resend email service — admin creates users with password directly
- ✅ Removed priority and severity fields from issues
- ✅ Manual enable/disable toggle for browser extension
- ✅ Pin appears at click coordinates (one pin at a time)
- ✅ Readable background behind text annotations
- ✅ Show user names instead of UUIDs in activity timeline
- ✅ Screenshot lightbox moved into DialogProvider

### v0.8.0 (February 11, 2026)
- ✅ Admin-only team member creation — `POST /api/users` with Zod validation, bcrypt password hashing, and duplicate email detection
- ✅ "Add Member" modal on team page — admin-only button, role selection, error handling
- ✅ Fixed missing auth `preHandler` on user routes (`GET /users`, `POST /users`, `PATCH /users/:userId/role`)
- ✅ New users onboard via "Forgot Password" flow (temp password never exposed)

### v0.7.0 (February 11, 2026)
- ✅ URL sanitization (`sanitizeUrl` / `zSanitizedUrl`) rejecting `javascript:`, `data:`, `vbscript:` protocols
- ✅ Replaced `z.any()` on `environmentData` with proper permissive schema
- ✅ Zod validation for all query parameters (issues, feedback, users, notifications)
- ✅ Zod validation for missing body schemas (share, user role update)
- ✅ Fixed email HTML injection in notification service
- ✅ Frontend `safeHref()` guard on all user-provided URL links
- ✅ Sanitization test suite (backend + frontend)
- ✅ Added `SECURITY_INPUT_SANITIZATION.md` internal guide

### v0.6.0 (February 10, 2026)
- ✅ Split notifications by type — bell icon for issues, bug icon for feedback
- ✅ Extracted shared Drawer component and global DialogProvider (Promise-based confirm dialogs)
- ✅ Removed Resolved kanban column, renamed QA to Ready for QA
- ✅ Admin dashboard with system stats, user management, and data export
- ✅ Team management UI
- ✅ Screen recording capability in Chrome and Firefox extensions
- ✅ Feedback system parity (attachments, share links, comments, activity timeline)
- ✅ Health check alerting and shared content pages
- ✅ XSS sanitization and screenshot CDN upload

### v0.5.0 (February 10, 2026)
- ✅ Activity timeline and audit logging
- ✅ Notification system with email queue (Resend + Redis)
- ✅ Issue severity field and QA status column
- ✅ File attachments with upload and drag-and-drop
- ✅ Shareable issue and feedback links (token-based, 7-day expiry)
- ✅ Browser extension enhancements

### v0.4.0 (February 07, 2026)
- ✅ Added roles & permissions system (ADMIN, MANAGER, DEVELOPER, VIEWER)
- ✅ Global role guards (`requireRole`) and project-scoped guards (`requireProjectRole`)
- ✅ Frontend `useRole` / `useProjectRole` hooks and `<RoleGate>` component
- ✅ Fine-grained issue update permissions (DEVELOPER: own/assigned only; MANAGER: full)
- ✅ Renamed Task entity to Issue across project (routes, components, schema)
- ✅ Unified filter components into reusable slot-based FilterBar
- ✅ Extracted reusable PageHeader component with icon support
- ✅ Replaced project page grid/list with reusable KanbanBoard (drag-and-drop)

### v0.3.1 (February 06, 2026)
- ✅ Migrated auth back to self-hosted JWT + OAuth (Google, GitHub)
- ✅ Zustand auth store with persist middleware
- ✅ OAuth routes conditional on env vars
- ✅ Email service with lazy Resend initialization
- ✅ Password reset flow (crypto token + SHA-256, 1h TTL)

### v0.3.0 (February 05, 2026)
- ✅ Codebase cleanup: removed unused files, dead code, and stale stubs
- ✅ Fixed wrong cross-dependencies (next in API, fastify in web)
- ✅ Removed commented-out code and unused imports
- ✅ Updated README with accurate tech stack versions (Next.js 16)
- ✅ Version bump to 0.3.0 across all packages

### v0.2.0 (January 30, 2026)
- ✅ Fixed Vercel deployment configuration (git command syntax in [`vercel.json`](vercel.json:7))
- ✅ Updated deployment documentation with comprehensive guides
- ✅ Enhanced project structure and build configuration
- ✅ Added troubleshooting for common deployment issues

### v0.1.0 (January 28, 2026)
- ✅ Initial release with core bug tracking functionality
- ✅ User authentication and authorization
- ✅ Project and task management
- ✅ Browser extension integration
- ✅ Screenshot capture and annotation