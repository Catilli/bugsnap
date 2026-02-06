# BugSnap

> Visual bug capture and feedback tool that lets teams report website issues directly on the page where they occur.

## 🎯 Overview

BugSnap is a web-based application that helps teams capture, annotate, and manage bug reports with rich context. Users can upload screenshots, add annotations, and provide detailed environment information to help developers fix issues faster.

## 📚 Documentation Index

### Architecture & Audits

| Document | Description |
|----------|-------------|
| [Technical Architecture](./TECH_ARCHITECTURE.md) | Full architecture audit — frontend, backend, database, infrastructure, identified gaps, and recommended next steps |
| [Core Features Audit](./CORE_FEATURES_AUDIT.md) | Read-only codebase analysis of 46 features across 7 categories with implementation status and evidence |


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
- **Authentication**: JWT
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
- ✅ User authentication and authorization (JWT)
- ✅ Project management
- ✅ Project member management
- ✅ Dashboard with project listing
- ✅ Project creation and editing
- ✅ Task management with full CRUD operations
- ✅ Task display with grid and list views
- ✅ Task filtering and sorting (by date, priority, status)
- ✅ Browser extension integration
- ✅ PostgreSQL database with Prisma ORM
- ✅ Task creation with custom titles and auto-numbering
- ✅ Screenshot capture and annotation tools
- ✅ Environment data collection
- ✅ Comments and collaboration
- ✅ Status and priority management

### Planned
- 🔲 Shareable task links
- 🔲 Real-time updates
- 🔲 Third-party integrations (Jira, Linear, GitHub)
- 🔲 Task assignment workflow
- 🔲 Advanced filtering and search
- 🔲 Task templates
- 🔲 Email notifications

## 🗄️ Database Schema

The database schema includes:
- Users (with authentication)
- Projects (bug tracking projects)
- ProjectMembers (project access control)
- Tasks (bug reports/issues)
- Annotations (visual annotations on tasks)
- Comments (task comments and collaboration)

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

**Current Version**: v0.3.1

**Next Steps**: Implement shareable task links and real-time updates

**Recent Updates**:
- Migrated authentication from custom JWT to Clerk
- Removed @fastify/jwt, @fastify/oauth2, resend, zustand
- Added Clerk components (SignIn, SignUp, UserProfile, UserButton)
- Token bridge pattern for Clerk async tokens


## 📝 Changelog

### v0.3.1 (February 2026)
- ✅ Migrated authentication from custom JWT to Clerk
- ✅ Added Clerk auth plugin with account linking (clerkId/email)
- ✅ Replaced login/register pages with Clerk components
- ✅ Added ClerkProvider, middleware, ClerkTokenSync
- ✅ Removed authStore, oauth routes, emailService, forgot/reset-password pages
- ✅ Uninstalled @fastify/jwt, @fastify/oauth2, resend, zustand

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