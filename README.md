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

## 📦 Tech Stack

### Frontend (Web App)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **State Management**: React Query (planned)

### Backend (API)
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **File Storage**: Cloudinary (planned)
- **Language**: TypeScript

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

## 📋 Features

### Current
- ✅ Monorepo structure with Turborepo
- ✅ Next.js web application
- ✅ Fastify API server
- ✅ Shared types and schemas
- ✅ TypeScript configuration
- ✅ ESLint and Prettier setup

### Planned
- 🔲 User authentication and authorization
- 🔲 Team management
- 🔲 Bug report creation with screenshot upload
- 🔲 Annotation tools (pen, highlighter, shapes, text)
- 🔲 Environment data collection
- 🔲 Bug report dashboard
- 🔲 Comments and collaboration
- 🔲 Status and priority management
- 🔲 Shareable report links
- 🔲 Real-time updates
- 🔲 Third-party integrations (Jira, Linear, GitHub)

## 🗄️ Database Schema

The database schema will include:
- Users
- Teams
- TeamMembers
- BugReports
- Annotations
- Comments

(Prisma schema to be implemented in Phase 1, Step 2)

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

**Status**: Phase 1 - Project Setup Complete ✅

**Next Steps**: Proceed with Phase 1, Step 2 - Design Database Schema