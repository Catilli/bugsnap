# Database Migration Guide

This guide explains how to update your database models using Prisma.

## Understanding the Process

When you modify your database schema in [`schema.prisma`](prisma/schema.prisma), you need to:
1. Update the schema file
2. Create a migration
3. Apply the migration to the database

## Step-by-Step Instructions

### 1. Edit the Schema

Edit [`prisma/schema.prisma`](prisma/schema.prisma) to add, remove, or modify models.

**Example: Adding a new field**
```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?  @db.Text
  // Add new field here
  websiteUrl  String?  // Optional website URL field
  apiKey      String   @unique @default(uuid())
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  createdBy  User        @relation(fields: [createdById], references: [id], onDelete: Cascade)
  bugReports BugReport[]

  @@index([createdById])
  @@map("projects")
}
```

### 2. Create and Apply Migration

Run this command from the `apps/api` directory:

```bash
npx prisma migrate dev --name descriptive_migration_name
```

**What this does:**
- Analyzes changes to your schema
- Creates a new migration file in `prisma/migrations/`
- Applies the migration to your database
- Regenerates the Prisma Client

**Example:**
```bash
# Navigate to api directory
cd apps/api

# Create migration for adding projects
npx prisma migrate dev --name add_projects_model

# Create migration for a new field
npx prisma migrate dev --name add_website_url_to_projects

# Create migration for removing a field
npx prisma migrate dev --name remove_status_from_projects
```

### 3. Verify the Migration

After running the migration:
1. Check the terminal output for success/errors
2. Review the generated SQL in `prisma/migrations/[timestamp]_[name]/migration.sql`
3. Verify your database reflects the changes

## Common Operations

### Adding a New Model

```prisma
model NewModel {
  id        String   @id @default(uuid())
  field1    String
  field2    Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("new_models")
}
```

Then run:
```bash
npx prisma migrate dev --name add_new_model
```

### Adding a Relation

```prisma
model Project {
  // ... existing fields
  members   ProjectMember[]  // Add relation
}

model ProjectMember {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  role      String
  
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([userId])
  @@map("project_members")
}
```

Then run:
```bash
npx prisma migrate dev --name add_project_members
```

### Modifying a Field

```prisma
model BugReport {
  id          String   @id @default(uuid())
  title       String   @db.VarChar(500)  // Changed from String
  priority    String   @default("low")    // Changed default value
  // ... other fields
}
```

Then run:
```bash
npx prisma migrate dev --name update_bugreport_fields
```

### Removing a Field

Simply delete the field from the model and run:
```bash
npx prisma migrate dev --name remove_field_name
```

## Production Migrations

For production environments, use:

```bash
# Generate migration without applying
npx prisma migrate dev --create-only --name migration_name

# Review the SQL file, then apply
npx prisma migrate deploy
```

## Database Reset (Development Only)

⚠️ **WARNING: This will DELETE all data!**

```bash
# Reset database and apply all migrations
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Apply all migrations
# 4. Run seed scripts (if configured)
```

## Troubleshooting

### Migration Failed

If a migration fails:
1. Check the error message
2. Review the generated SQL in `prisma/migrations/`
3. Fix the schema issue
4. Delete the failed migration folder
5. Run the migration command again

### Database Out of Sync

If your database is out of sync with migrations:

```bash
# Mark migrations as applied without running them
npx prisma migrate resolve --applied "migration_name"

# Reset and reapply all migrations (DEV ONLY)
npx prisma migrate reset
```

### Generate Prisma Client Only

If you only need to regenerate the Prisma Client without migrating:

```bash
npx prisma generate
```

## Current Schema Overview

### Models
- **User** - User accounts with authentication
- **Project** - Bug tracking projects
- **BugReport** - Bug reports linked to projects
- **Annotation** - Visual annotations on bug reports
- **Comment** - Comments on bug reports

### Relationships
```
User (1) ──→ (N) Project
User (1) ──→ (N) BugReport
User (1) ──→ (N) Comment

Project (1) ──→ (N) BugReport

BugReport (1) ──→ (N) Annotation
BugReport (1) ──→ (N) Comment
```

## Best Practices

1. **Descriptive Migration Names**: Use clear, descriptive names
   - ✅ `add_website_url_to_projects`
   - ❌ `update` or `changes`

2. **Small, Focused Migrations**: One logical change per migration
   - Better to have multiple small migrations than one large one

3. **Test Migrations**: Test in development before applying to production

4. **Backup Production Data**: Always backup before running production migrations

5. **Review Generated SQL**: Check the SQL before applying to production

6. **Version Control**: Commit migration files to Git
   - Never manually edit migration files
   - Migration files are the "history" of your database

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- Project Schema: [`prisma/schema.prisma`](prisma/schema.prisma)