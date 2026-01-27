# Database Setup

This directory contains the Prisma schema and migrations for BugSnap.

## Prerequisites

- PostgreSQL database running locally or remotely
- Database connection string in `.env` file

## Database Schema

The schema includes the following models:

### User
- Stores user account information
- Handles authentication credentials
- Manages user roles

### Team
- Represents a team/organization
- Has a unique slug for URL-friendly access
- Owned by a user

### TeamMember
- Junction table for team membership
- Defines user roles within teams
- Ensures unique user-team combinations

### BugReport
- Main entity for bug reports
- Stores title, description, URL, and screenshot
- Includes status and priority tracking
- Contains environment data as JSON

### Annotation
- Stores visual annotations on screenshots
- Supports multiple annotation types (pen, highlighter, etc.)
- Stores coordinates and styling information

### Comment
- Enables team collaboration on bug reports
- Links users to specific reports
- Supports threaded discussions

## Setup Instructions

### 1. Configure Database Connection

Edit `apps/api/.env` and set your database URL:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/bugsnap?schema=public"
```

### 2. Create the Database

```bash
# Using psql
createdb bugsnap

# Or using PostgreSQL client
psql -U postgres
CREATE DATABASE bugsnap;
\q
```

### 3. Run Migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

This will:
- Create all tables in your database
- Generate Prisma Client
- Apply the migration

### 4. (Optional) Seed the Database

Create a seed file if needed:

```bash
# Create seed script
touch prisma/seed.ts
```

Then add to `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run the seed:

```bash
npx prisma db seed
```

## Common Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format schema file
npx prisma format
```

## Schema Relationships

```
User
├── owns → Team (one-to-many)
├── member of → TeamMember (one-to-many)
├── creates → BugReport (one-to-many)
└── writes → Comment (one-to-many)

Team
├── owned by → User (many-to-one)
├── has → TeamMember (one-to-many)
└── contains → BugReport (one-to-many)

BugReport
├── created by → User (many-to-one)
├── belongs to → Team (many-to-one)
├── has → Annotation (one-to-many)
└── has → Comment (one-to-many)
```

## Environment Data Structure

The `environmentData` JSON field in BugReport stores:

```json
{
  "browser": "Chrome",
  "browserVersion": "120.0.0",
  "os": "Windows 11",
  "screenResolution": "1920x1080",
  "viewportSize": "1366x768",
  "url": "https://example.com/page",
  "pageTitle": "Example Page",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-27T10:00:00Z",
  "timezone": "Asia/Manila",
  "consoleErrors": ["Error: ..."],
  "networkRequests": ["GET /api/data"]
}
```

## Troubleshooting

### Connection Issues

If you get connection errors:

1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Ensure database exists: `psql -l`
4. Check firewall settings

### Migration Issues

If migrations fail:

1. Check database permissions
2. Ensure no active connections
3. Review migration SQL in `prisma/migrations/`
4. Use `npx prisma migrate resolve` for stuck migrations

## Production Deployment

For production:

1. Set `DATABASE_URL` in production environment
2. Run `npx prisma migrate deploy`
3. Ensure connection pooling is configured
4. Consider using Prisma Data Proxy for serverless

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)