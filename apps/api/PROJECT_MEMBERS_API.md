# Project Members API Documentation

This API allows you to manage project members and control access to projects.

## Access Control Model

### User Roles

Projects have a hierarchical role system:

1. **Owner** - User who created the project (highest permissions)
2. **Admin** - Can manage members and project settings
3. **Member** - Can view and contribute to the project
4. **Viewer** - Read-only access

### Access Rules

- **Project Owner**: Has full access automatically (cannot be removed)
- **Project Members**: Must be added explicitly with a specific role
- Users can only see projects they own or are members of
- Only users with accounts can be added as members

## API Endpoints

### 1. Get User's Projects

Get all projects accessible by the authenticated user (both owned and member projects).

```http
GET /api/projects
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "project-uuid",
    "name": "BugSnap Website",
    "description": "Main website project",
    "apiKey": "api-key-uuid",
    "createdById": "user-uuid",
    "createdAt": "2024-01-27T12:00:00.000Z",
    "updatedAt": "2024-01-27T12:00:00.000Z",
    "createdBy": {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "id": "member-uuid",
        "projectId": "project-uuid",
        "userId": "user-uuid-2",
        "role": "admin",
        "addedAt": "2024-01-27T12:00:00.000Z",
        "user": {
          "id": "user-uuid-2",
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      }
    ],
    "_count": {
      "bugReports": 15
    }
  }
]
```

### 2. Get Project Members

Get all members of a specific project (requires project access).

```http
GET /api/projects/:projectId/members
Authorization: Bearer {token}
```

**Response:**
```json
{
  "owner": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "members": [
    {
      "id": "member-uuid",
      "projectId": "project-uuid",
      "userId": "user-uuid-2",
      "role": "admin",
      "addedAt": "2024-01-27T12:00:00.000Z",
      "user": {
        "id": "user-uuid-2",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  ]
}
```

### 3. Add Project Member

Add a new member to a project (requires admin role).

```http
POST /api/projects/:projectId/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Request Body:**
- `email` (required): Email address of the user to add (must have an account)
- `role` (optional): Role to assign. Options: `owner`, `admin`, `member`, `viewer`. Default: `member`

**Response:**
```json
{
  "id": "member-uuid",
  "projectId": "project-uuid",
  "userId": "user-uuid",
  "role": "member",
  "addedAt": "2024-01-27T12:00:00.000Z",
  "user": {
    "id": "user-uuid",
    "name": "New Member",
    "email": "newmember@example.com"
  }
}
```

**Error Responses:**
- `404`: User not found with this email
- `400`: User is already a member of this project
- `403`: You need admin permissions to add members

### 4. Update Member Role

Update a member's role in a project (requires admin role).

```http
PATCH /api/projects/:projectId/members/:userId
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "admin"
}
```

**Request Body:**
- `role` (required): New role. Options: `owner`, `admin`, `member`, `viewer`

**Response:**
```json
{
  "id": "member-uuid",
  "projectId": "project-uuid",
  "userId": "user-uuid",
  "role": "admin",
  "addedAt": "2024-01-27T12:00:00.000Z",
  "user": {
    "id": "user-uuid",
    "name": "Member Name",
    "email": "member@example.com"
  }
}
```

**Error Responses:**
- `404`: User is not a member of this project
- `403`: You need admin permissions to update member roles

### 5. Remove Project Member

Remove a member from a project (requires admin role).

```http
DELETE /api/projects/:projectId/members/:userId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Member removed successfully"
}
```

**Error Responses:**
- `400`: Cannot remove project owner from members
- `403`: You need admin permissions to remove members

## Service Functions

The [`ProjectMemberService`](src/services/projectMemberService.ts) provides helper functions for access control:

### Check Project Access

```typescript
import { ProjectMemberService } from './services/projectMemberService';

// Check if user has access to a project
const hasAccess = await ProjectMemberService.isMemberOfProject(userId, projectId);

// Check if user has specific role or higher
const isAdmin = await ProjectMemberService.hasRole(userId, projectId, 'admin');
```

### Get User's Projects

```typescript
// Get all projects user can access
const projects = await ProjectMemberService.getUserProjects(userId);
```

### Manage Members

```typescript
// Add a member
await ProjectMemberService.addMember(projectId, 'user@example.com', 'member');

// Remove a member
await ProjectMemberService.removeMember(projectId, userId);

// Update role
await ProjectMemberService.updateMemberRole(projectId, userId, 'admin');

// Get all members
const members = await ProjectMemberService.getProjectMembers(projectId);
```

## Database Schema

### ProjectMember Model

```prisma
model ProjectMember {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  role      String   @default("member") // owner, admin, member, viewer
  addedAt   DateTime @default(now())

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId]) // One user can only be added once per project
  @@index([projectId])
  @@index([userId])
  @@map("project_members")
}
```

## Usage Examples

### Frontend: Get User's Projects

```typescript
const response = await fetch('/api/projects', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const projects = await response.json();
```

### Frontend: Add Team Member

```typescript
const response = await fetch(`/api/projects/${projectId}/members`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'teammate@example.com',
    role: 'member'
  })
});
```

### Backend: Middleware to Check Access

```typescript
// Example middleware to protect project routes
async function requireProjectAccess(request, reply) {
  const userId = request.user.id;
  const projectId = request.params.projectId;
  
  const hasAccess = await ProjectMemberService.isMemberOfProject(userId, projectId);
  
  if (!hasAccess) {
    return reply.status(403).send({ 
      error: 'You do not have access to this project' 
    });
  }
}

// Use in route
fastify.get('/projects/:projectId/reports', {
  preHandler: [authenticate, requireProjectAccess]
}, async (request, reply) => {
  // User has verified access to this project
  // ... fetch and return reports
});
```

## Security Considerations

1. **Email Verification**: Only users with registered accounts can be added as members
2. **Unique Constraint**: Prevents duplicate memberships (`@@unique([projectId, userId])`)
3. **Cascade Delete**: When a project or user is deleted, all memberships are automatically removed
4. **Role Hierarchy**: Higher roles inherit permissions of lower roles
5. **Owner Protection**: Project owner cannot be removed from the project
6. **Authorization**: All endpoints require authentication and appropriate permissions

## Best Practices

1. **Always verify project access** before performing operations on project resources
2. **Use the service layer** (`ProjectMemberService`) for consistent access control
3. **Check role permissions** for sensitive operations (adding/removing members, changing settings)
4. **Log member changes** for audit trails
5. **Send notifications** when users are added to or removed from projects
6. **Validate email addresses** exist in the system before adding members

## Related Files

- Service: [`src/services/projectMemberService.ts`](src/services/projectMemberService.ts)
- Routes: [`src/routes/projectMembers.ts`](src/routes/projectMembers.ts)
- Schema: [`prisma/schema.prisma`](prisma/schema.prisma)
- Migration: [`prisma/migrations/20260127214457_add_project_members/`](prisma/migrations/20260127214457_add_project_members/)