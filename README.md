# BugSnap

> Visual bug capture and feedback tool that lets teams report website issues directly on the page where they occur.

## 🎯 Overview

BugSnap is a web-based application that helps teams capture, annotate, and manage bug reports with rich context. Users can upload screenshots, add annotations, and provide detailed environment information to help developers fix issues faster.

## 🏗️ Project Structure

This is a monorepo managed with Turborepo containing:

```
bugsnap/
├── apps/
│   ├── web/          # Next.js 14 web application
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
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: Zustand

### Backend (API)
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Language**: TypeScript
- **Testing**: Vitest

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

- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Quick Start Scripts

For Windows users, you can use the provided batch files:

- `start-dev.bat` - Start both API and web servers
- `clean-restart.bat` - Clean cache and restart servers

## 📋 Features

### Current
- ✅ Monorepo structure with Turborepo
- ✅ Next.js 14 web application with App Router
- ✅ Fastify API server
- ✅ Shared types and schemas
- ✅ TypeScript configuration
- ✅ ESLint and Prettier setup
- ✅ User authentication and authorization (JWT)
- ✅ Project management
- ✅ Project member management
- ✅ Dashboard with project listing
- ✅ Project creation and editing
- ✅ Task management (basic structure)
- ✅ Browser extension integration
- ✅ PostgreSQL database with Prisma ORM
- ✅ Comprehensive test suite (82+ test cases)

### Planned
- 🔲 Bug report creation with screenshot upload
- 🔲 Annotation tools (pen, highlighter, shapes, text)
- 🔲 Environment data collection
- 🔲 Comments and collaboration
- 🔲 Status and priority management
- 🔲 Shareable report links
- 🔲 Real-time updates
- 🔲 Third-party integrations (Jira, Linear, GitHub)

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
4. Test your changes
5. Commit and push
6. Create a pull request

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

**Current Version**: v0.1.0

**Next Steps**: Implement bug report creation with screenshot upload and annotation tools