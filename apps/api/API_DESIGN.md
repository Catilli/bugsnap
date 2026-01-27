# BugSnap API Design

## Base URL
```
Development: http://localhost:3001
Production: https://api.bugsnap.com
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 📋 API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "member"
  },
  "token": "jwt-token"
}
```

**Errors:**
- `400` - Validation error (invalid email, weak password)
- `409` - Email already exists

---

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "member"
  },
  "token": "jwt-token"
}
```

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials

---

#### POST /api/auth/logout
Logout current user (invalidate token).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

#### GET /api/auth/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "member",
  "createdAt": "2024-01-27T10:00:00Z"
}
```

**Errors:**
- `401` - Unauthorized (invalid/expired token)

---

### Teams

#### GET /api/teams
Get all teams for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "teams": [
    {
      "id": "uuid",
      "name": "My Team",
      "slug": "my-team",
      "role": "owner",
      "memberCount": 5,
      "createdAt": "2024-01-27T10:00:00Z"
    }
  ]
}
```

---

#### POST /api/teams
Create a new team.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My Team",
  "slug": "my-team"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "My Team",
  "slug": "my-team",
  "ownerId": "uuid",
  "createdAt": "2024-01-27T10:00:00Z"
}
```

**Errors:**
- `400` - Validation error (invalid slug format)
- `409` - Slug already exists

---

#### GET /api/teams/:teamId
Get team details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "My Team",
  "slug": "my-team",
  "owner": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "members": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin"
    }
  ],
  "createdAt": "2024-01-27T10:00:00Z"
}
```

**Errors:**
- `403` - Not a member of this team
- `404` - Team not found

---

#### PATCH /api/teams/:teamId
Update team details.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Team Name"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Updated Team Name",
  "slug": "my-team",
  "updatedAt": "2024-01-27T10:00:00Z"
}
```

**Errors:**
- `403` - Not an owner/admin
- `404` - Team not found

---

#### DELETE /api/teams/:teamId
Delete a team (owner only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Errors:**
- `403` - Not the team owner
- `404` - Team not found

---

#### POST /api/teams/:teamId/members
Invite a member to the team.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "teamId": "uuid",
  "role": "member",
  "user": {
    "name": "New Member",
    "email": "newmember@example.com"
  }
}
```

**Errors:**
- `403` - Not an owner/admin
- `404` - User or team not found
- `409` - User already a member

---

#### DELETE /api/teams/:teamId/members/:userId
Remove a member from the team.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Errors:**
- `403` - Not an owner/admin
- `404` - Member not found

---

### Bug Reports

#### GET /api/teams/:teamId/reports
Get all bug reports for a team.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (optional): Filter by status (open, in_progress, resolved, closed)
- `priority` (optional): Filter by priority (low, medium, high, critical)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "reports": [
    {
      "id": "uuid",
      "title": "Button not working",
      "description": "The submit button doesn't respond to clicks",
      "url": "https://example.com/form",
      "screenshotUrl": "https://cdn.example.com/screenshot.png",
      "status": "open",
      "priority": "high",
      "createdBy": {
        "id": "uuid",
        "name": "John Doe"
      },
      "createdAt": "2024-01-27T10:00:00Z",
      "commentCount": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

#### POST /api/reports
Create a new bug report.

**Headers:** `Authorization: Bearer <token>`

**Request Body (multipart/form-data):**
```
title: "Button not working"
description: "The submit button doesn't respond to clicks"
url: "https://example.com/form"
priority: "high"
teamId: "uuid"
screenshot: <file>
environmentData: {
  "browser": "Chrome",
  "browserVersion": "120.0.0",
  "os": "Windows 11",
  "screenResolution": "1920x1080",
  "viewportSize": "1366x768",
  "url": "https://example.com/form",
  "pageTitle": "Contact Form",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-27T10:00:00Z",
  "timezone": "Asia/Manila",
  "consoleErrors": ["Error: Cannot read property..."],
  "networkRequests": ["GET /api/submit"]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "Button not working",
  "description": "The submit button doesn't respond to clicks",
  "url": "https://example.com/form",
  "screenshotUrl": "https://cdn.example.com/screenshot.png",
  "status": "open",
  "priority": "high",
  "environmentData": { ... },
  "createdById": "uuid",
  "teamId": "uuid",
  "createdAt": "2024-01-27T10:00:00Z",
  "shareLink": "https://bugsnap.com/reports/uuid"
}
```

**Errors:**
- `400` - Validation error
- `403` - Not a team member
- `413` - File too large

---

#### GET /api/reports/:id
Get a single bug report with full details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Button not working",
  "description": "The submit button doesn't respond to clicks",
  "url": "https://example.com/form",
  "screenshotUrl": "https://cdn.example.com/screenshot.png",
  "status": "open",
  "priority": "high",
  "environmentData": {
    "browser": "Chrome",
    "browserVersion": "120.0.0",
    "os": "Windows 11",
    "screenResolution": "1920x1080",
    "viewportSize": "1366x768",
    "url": "https://example.com/form",
    "pageTitle": "Contact Form",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2024-01-27T10:00:00Z",
    "timezone": "Asia/Manila",
    "consoleErrors": ["Error: Cannot read property..."],
    "networkRequests": ["GET /api/submit"]
  },
  "createdBy": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "team": {
    "id": "uuid",
    "name": "My Team"
  },
  "annotations": [
    {
      "id": "uuid",
      "type": "rectangle",
      "coordinates": { "x": 100, "y": 200, "width": 50, "height": 30 },
      "color": "#ff0000"
    }
  ],
  "comments": [
    {
      "id": "uuid",
      "content": "I can reproduce this issue",
      "user": {
        "id": "uuid",
        "name": "Jane Smith"
      },
      "createdAt": "2024-01-27T10:05:00Z"
    }
  ],
  "createdAt": "2024-01-27T10:00:00Z",
  "updatedAt": "2024-01-27T10:05:00Z"
}
```

**Errors:**
- `403` - Not a team member
- `404` - Report not found

---

#### PATCH /api/reports/:id
Update a bug report.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "critical"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Updated title",
  "status": "in_progress",
  "priority": "critical",
  "updatedAt": "2024-01-27T10:10:00Z"
}
```

**Errors:**
- `403` - Not authorized
- `404` - Report not found

---

#### DELETE /api/reports/:id
Delete a bug report.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Errors:**
- `403` - Not the creator or team admin
- `404` - Report not found

---

### Comments

#### POST /api/reports/:reportId/comments
Add a comment to a bug report.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "I can reproduce this issue on Firefox as well"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "reportId": "uuid",
  "content": "I can reproduce this issue on Firefox as well",
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "createdAt": "2024-01-27T10:15:00Z"
}
```

**Errors:**
- `400` - Validation error
- `403` - Not a team member
- `404` - Report not found

---

#### GET /api/reports/:reportId/comments
Get all comments for a bug report.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "I can reproduce this issue",
      "user": {
        "id": "uuid",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "createdAt": "2024-01-27T10:05:00Z"
    }
  ]
}
```

---

#### PATCH /api/comments/:id
Update a comment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "content": "Updated comment text",
  "updatedAt": "2024-01-27T10:20:00Z"
}
```

**Errors:**
- `403` - Not the comment author
- `404` - Comment not found

---

#### DELETE /api/comments/:id
Delete a comment.

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

**Errors:**
- `403` - Not the comment author or team admin
- `404` - Comment not found

---

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

- **Authenticated requests**: 100 requests per minute
- **Unauthenticated requests**: 20 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706356800
```

---

## Pagination

List endpoints support pagination with these query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## File Uploads

Screenshot uploads:
- **Max size**: 10MB
- **Formats**: PNG, JPEG, WebP
- **Storage**: Cloudinary CDN

---

## Webhooks (Future)

Teams can configure webhooks for events:
- `report.created`
- `report.updated`
- `report.commented`
- `report.status_changed`

---

## API Versioning

Current version: `v1`

Version is included in the URL: `/api/v1/...`

Breaking changes will increment the version number.