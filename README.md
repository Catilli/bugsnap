# BugSnap

> Visual bug capture and feedback tool that lets teams report website issues directly on the page where they occur.

## 🎯 Overview

BugSnap is a web-based application that helps teams capture, annotate, and manage bug reports with rich context. Users can upload screenshots, add annotations, and provide detailed environment information to help developers fix issues faster.

## 📚 Documentation Index

### Architecture & Audits

| Document | Description |
|----------|-------------|
| [Technical Architecture](./docs/TECH_ARCHITECTURE.md) | Full architecture audit — frontend, backend, database, infrastructure, identified gaps, and recommended next steps |
| [Core Features Audit](./docs/CORE_FEATURES.md) | Read-only codebase analysis of 46 features across 7 categories with implementation status and evidence |
| [User Roles & Permissions](./docs/user-roles-permissions-progress.md) | Implementation tracker for the 4-role RBAC system -- capabilities, status, and verification steps |
| [Kanban Bug Dashboard & Reporting](./docs/Kanban%20Bug%20Dashboard%20%26%20Reporting.md) | Audit and implementation tracker for the Kanban dashboard, QA cycle reports, unified views, and real-time updates |


## 🏗️ Project Structure

This is a monorepo managed with Turborepo containing:

```
bugsnap/
├── apps/
│   ├── web/          # Next.js 16 web application
│   └── api/          # Fastify backend API
├── packages/
│   └── shared/       # Shared types and schemas
├── extension/        # Browser extension for bug capture
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

The BugSnap browser extension allows users to capture bugs directly from any website:

1. **Install the extension**
   - Download the extension from the dashboard at `/dashboard/install-extension`
   - Load the extension in Chrome/Edge (Developer Mode)
   - Or install from the Chrome Web Store (when published)

2. **Use the extension**
   - Navigate to any website
   - Click the BugSnap extension icon
   - Capture screenshots and report bugs
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
- **Authentication**: JWT + OAuth (Google, GitHub)
- **Authorization**: Role-based (ADMIN, MANAGER, DEVELOPER, VIEWER)
- **Language**: TypeScript

### Browser Extension
- **Platform**: Chrome Extension (Manifest V3)
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

### Quick Start Scripts

For Windows users, you can use the provided batch files:

- `start-dev.bat` - Start both API and web servers
- `clean-restart.bat` - Clean cache and restart servers

## 📋 Features

### Current
- ✅ Monorepo structure with Turborepo
- ✅ Next.js 16 web application with App Router
- ✅ Fastify API server
- ✅ Shared types and schemas
- ✅ TypeScript configuration
- ✅ ESLint and Prettier setup
- ✅ User authentication and authorization (JWT + OAuth)
- ✅ Role-based access control (ADMIN, MANAGER, DEVELOPER, VIEWER)
- ✅ Project management
- ✅ Project member management with role assignment
- ✅ Dashboard with project listing (grid and list views)
- ✅ Project creation and editing
- ✅ Issue management with full CRUD operations
- ✅ Kanban board with drag-and-drop (role-gated)
- ✅ Issue filtering and sorting (by date, priority, status)
- ✅ Reusable FilterBar and PageHeader components
- ✅ Browser extension integration
- ✅ PostgreSQL database with Prisma ORM
- ✅ Issue creation with custom titles and auto-numbering
- ✅ Screenshot capture and annotation tools
- ✅ Environment data collection
- ✅ Comments and collaboration
- ✅ Status and priority management
- ✅ Real-time updates (SSE)
- ✅ OAuth login (Google, GitHub)
- ✅ Rate limiting
- ✅ Error tracking (Sentry)

### Planned
- 🔲 Shareable issue links
- 🔲 Third-party integrations (Jira, Linear, GitHub)
- 🔲 Advanced filtering and search
- 🔲 Issue templates
- 🔲 Email notifications
- 🔲 Admin settings panel (workflows, statuses, priorities)
- 🔲 Report export

## 🗄️ Database Schema

The database schema includes:
- Users (with authentication and roles)
- Projects (bug tracking projects)
- ProjectMembers (project access control with per-project roles)
- Issues (bug reports)
- Annotations (visual annotations on issues)
- Comments (issue comments and collaboration)
- Feedback and FeedbackComments
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
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
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

**Current Version**: v0.4.0

**Next Steps**: Implement shareable issue links and admin settings panel

**Recent Updates**:
- Added 4-role RBAC system (ADMIN, MANAGER, DEVELOPER, VIEWER)
- Unified filter components into slot-based FilterBar
- Renamed Task entity to Issue across the project
- Reusable KanbanBoard and PageHeader components


## 📝 Changelog

### v0.4.0 (February 2026)
- ✅ Added roles & permissions system (ADMIN, MANAGER, DEVELOPER, VIEWER)
- ✅ Global role guards (`requireRole`) and project-scoped guards (`requireProjectRole`)
- ✅ Frontend `useRole` / `useProjectRole` hooks and `<RoleGate>` component
- ✅ Fine-grained issue update permissions (DEVELOPER: own/assigned only; MANAGER: full)
- ✅ Renamed Task entity to Issue across project (routes, components, schema)
- ✅ Unified filter components into reusable slot-based FilterBar
- ✅ Extracted reusable PageHeader component with icon support
- ✅ Replaced project page grid/list with reusable KanbanBoard (drag-and-drop)

### v0.3.1 (February 2026)
- ✅ Migrated auth back to self-hosted JWT + OAuth (Google, GitHub)
- ✅ Zustand auth store with persist middleware
- ✅ OAuth routes conditional on env vars
- ✅ Email service with lazy Resend initialization
- ✅ Password reset flow (crypto token + SHA-256, 1h TTL)

### v0.3.0 (February 2026)
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

### v0.1.0 (January 2026)
- ✅ Initial release with core bug tracking functionality
- ✅ User authentication and authorization
- ✅ Project and task management
- ✅ Browser extension integration
- ✅ Screenshot capture and annotation