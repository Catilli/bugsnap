# User Roles & Permissions -- Implementation Tracker

> Living document that tracks the RBAC (Role-Based Access Control) implementation across BugSnap.
> Update the **Status** column as features ship. Add new rows for newly scoped capabilities.

---

## Role Hierarchy

```
VIEWER (0)  <  DEVELOPER (1)  <  MANAGER (2)  <  ADMIN (3)
```

- **ADMIN** bypasses all permission checks (global override).
- **Project Owner** is treated as MANAGER within their project regardless of global role.
- Permissions are enforced at two levels: **global** (User.role) and **project-scoped** (ProjectMember.role).

---

## Admin

Full system access. ADMIN bypasses every guard on both backend and frontend.

| Status | Capability | Implementation Notes | Links |
|--------|-----------|----------------------|-------|
| Done | Manage projects (CRUD) | ADMIN bypass in project routes | [`projects.ts`](../apps/api/src/routes/projects.ts) |
| Done | Manage teams and user access | ADMIN bypass in projectMemberService | [`projectMembers.ts`](../apps/api/src/routes/projectMembers.ts), [`projectMemberService.ts`](../apps/api/src/services/projectMemberService.ts) |
| Done | Add new users to the system | ADMIN-only `POST /users` with temp password + Forgot Password onboarding | [`users.ts`](../apps/api/src/routes/users.ts), [`team/page.tsx`](../apps/web/app/dashboard/team/page.tsx) |
| Done | Assign and reassign issues across teams | ADMIN bypass in issue PATCH | [`issues.ts`](../apps/api/src/routes/issues.ts) |
| Done | View all projects (including non-member) | `getUserProjects` returns ALL for ADMIN | [`projectMemberService.ts`](../apps/api/src/services/projectMemberService.ts) |
| Done | Delete any issue or comment | ADMIN bypass in delete handlers | [`issues.ts`](../apps/api/src/routes/issues.ts), [`comments.ts`](../apps/api/src/routes/comments.ts) |
| Done | Manage user passwords (reset for team members) | Admin password management — commit `17a5d86` | [`users.ts`](../apps/api/src/routes/users.ts) |
| Todo | Configure system-level settings | No admin settings panel or routes exist | -- |
| Todo | Define workflows, statuses, and priorities | Statuses/priorities are hardcoded enums | -- |
| Todo | Export reports and project data | No export endpoints exist | -- |

---

## Project Manager / QA

Can manage projects they own or are a MANAGER member of. Controls issue triage, assignment, and member management.

| Status | Capability | Implementation Notes | Links |
|--------|-----------|----------------------|-------|
| Done | Log, document, and validate bugs/issues | MANAGER can create and fully update issues | [`issues.ts`](../apps/api/src/routes/issues.ts) |
| Done | Set issue priority, severity, and reproduction details | MANAGER+ can change priority/assignee | [`issues.ts`](../apps/api/src/routes/issues.ts), [`IssueDrawer.tsx`](../apps/web/components/IssueDrawer.tsx) |
| Done | Assign issues to development teams | Assignee field editable for MANAGER+ | [`IssueDrawer.tsx`](../apps/web/components/IssueDrawer.tsx) |
| Done | Move issues through QA and resolution stages | Status change unrestricted for MANAGER | [`IssueDrawer.tsx`](../apps/web/components/IssueDrawer.tsx) |
| Done | Annotate UI elements and add technical notes | Comments and annotations available | [`comments.ts`](../apps/api/src/routes/comments.ts) |
| Done | Add/remove project members and change roles | `requireProjectRole('MANAGER')` on member routes | [`projectMembers.ts`](../apps/api/src/routes/projectMembers.ts) |
| Done | Edit project name | Inline edit gated to MANAGER+ on frontend | [`[id]/page.tsx`](../apps/web/app/dashboard/projects/[id]/page.tsx) |
| Done | Delete project (if owner) | Owner-only check in DELETE route | [`projects.ts`](../apps/api/src/routes/projects.ts) |
| Done | Delete others' comments (if project owner) | Owner check in comment DELETE | [`comments.ts`](../apps/api/src/routes/comments.ts) |
| In Progress | Capture visual feedback directly on live pages | Feedback routes exist but require DEVELOPER+; no visual capture UI yet | [`feedback.ts`](../apps/api/src/routes/feedback.ts) |

---

## Team Member (Developer / Designer)

Can work on issues they are assigned to or created. Limited management capabilities.

| Status | Capability | Implementation Notes | Links |
|--------|-----------|----------------------|-------|
| Done | View assigned bugs and related annotations | Member-scoped project access | [`projectMemberService.ts`](../apps/api/src/services/projectMemberService.ts) |
| Done | Comment and collaborate on issues | DEVELOPER+ can create comments | [`comments.ts`](../apps/api/src/routes/comments.ts), [`CommentSection.tsx`](../apps/web/components/CommentSection.tsx) |
| Done | Update issue status (own/assigned only) | Backend enforces own-or-assigned; frontend disables for others | [`issues.ts`](../apps/api/src/routes/issues.ts), [`IssueDrawer.tsx`](../apps/web/components/IssueDrawer.tsx) |
| Done | Upload fixes, screenshots, or validation notes | Issue creation + annotation upload available | [`issues.ts`](../apps/api/src/routes/issues.ts) |
| Done | Create new projects | `requireRole('DEVELOPER')` on POST /projects | [`projects.ts`](../apps/api/src/routes/projects.ts) |
| Done | Create and manage own feedback | Feedback CRUD gated to DEVELOPER+ | [`feedback.ts`](../apps/api/src/routes/feedback.ts) |
| Done | Edit and delete own comments | Author check in PATCH/DELETE | [`comments.ts`](../apps/api/src/routes/comments.ts) |

---

## Viewer / Client

Read-only access. Cannot create, edit, or delete content.

| Status | Capability | Implementation Notes | Links |
|--------|-----------|----------------------|-------|
| Done | View reported bugs and visual annotations | Full read access if project member | [`issues.ts`](../apps/api/src/routes/issues.ts) |
| Done | Review comments and activity history | Comment list visible to all members | [`CommentSection.tsx`](../apps/web/components/CommentSection.tsx) |
| Done | No access to assignment, priority, or system settings | Frontend shows read-only badges; backend rejects writes | [`IssueDrawer.tsx`](../apps/web/components/IssueDrawer.tsx) |
| Done | Cannot create issues or comments | Backend returns 403; frontend hides forms | [`issues.ts`](../apps/api/src/routes/issues.ts), [`CommentSection.tsx`](../apps/web/components/CommentSection.tsx) |
| Done | Cannot drag-and-drop issues | Drag disabled for VIEWER on project detail and feedback pages | [`[id]/page.tsx`](../apps/web/app/dashboard/projects/[id]/page.tsx), [`feedback/page.tsx`](../apps/web/app/dashboard/feedback/page.tsx) |
| Todo | Leave feedback with restricted permissions | `requireRole('DEVELOPER')` on feedback POST currently blocks VIEWER entirely | [`feedback.ts`](../apps/api/src/routes/feedback.ts) |

---

## Route Permission Matrix

Quick-reference for every protected route.

| Method | Route | Minimum Role | Scope | Notes |
|--------|-------|-------------|-------|-------|
| POST | `/users` | ADMIN | Global | Create user (admin-only) |
| GET | `/users` | MANAGER | Global | List all users |
| PATCH | `/users/:userId/role` | ADMIN | Global | Change user role |
| POST | `/projects` | DEVELOPER | Global | Create project |
| GET | `/projects/:id` | -- (member check) | Project | ADMIN sees all |
| PATCH | `/projects/:id` | MANAGER / Owner | Project | Manual check |
| DELETE | `/projects/:id` | Owner / ADMIN | Project | Manual check |
| POST | `/projects/:id/members` | MANAGER | Project | `hasRole` check |
| PATCH | `/projects/:id/members/:userId` | MANAGER | Project | `hasRole` check |
| DELETE | `/projects/:id/members/:userId` | MANAGER | Project | `hasRole` check |
| POST | `/issues` | DEVELOPER | Global | VIEWER blocked |
| PATCH | `/issues/:id` | DEVELOPER (scoped) | Project | MANAGER for priority/assignee |
| DELETE | `/issues/:id` | MANAGER / Owner / ADMIN | Project | Manual check |
| POST | `/issues/:id/comments` | DEVELOPER | Global | VIEWER blocked |
| PATCH | `/comments/:id` | Author only | -- | Author check |
| DELETE | `/comments/:id` | Author / Owner | Project | Owner = project or feedback owner |
| POST | `/feedback` | DEVELOPER | Global | `requireRole` middleware |
| PATCH | `/feedback/:id` | DEVELOPER | Global | `requireRole` middleware |
| DELETE | `/feedback/:id` | DEVELOPER (author) | Global | Author + role check |
| POST | `/feedback/:id/comments` | DEVELOPER | Global | `requireRole` middleware |
| GET | `/projects/:id/events` | -- (member check) | Project | SSE; ADMIN bypass |
| GET | `/projects/:id/qa-cycles` | DEVELOPER | Project | List QA cycles |
| POST | `/projects/:id/qa-cycles` | MANAGER | Project | Create QA cycle |
| PATCH | `/qa-cycles/:id` | MANAGER | Project | Update QA cycle |
| DELETE | `/qa-cycles/:id` | MANAGER | Project | Delete QA cycle |
| POST | `/qa-cycles/:id/issues` | MANAGER | Project | Add issue to cycle |
| DELETE | `/qa-cycles/:id/issues/:issueId` | MANAGER | Project | Remove issue from cycle |
| POST | `/projects/:id/share` | MANAGER | Project | Create/update share settings |
| GET | `/share/:token` | -- (public) | -- | View shared project (no auth) |
| GET | `/notifications` | -- (authenticated) | Global | List user notifications |
| PATCH | `/notifications/:id/read` | -- (authenticated) | Global | Mark notification read |
| PATCH | `/notifications/read-all` | -- (authenticated) | Global | Mark all notifications read |

---

## Key Files

### Backend

| File | Purpose |
|------|---------|
| [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) | `UserRole` enum, User.role, ProjectMember.role |
| [`apps/api/src/plugins/auth.ts`](../apps/api/src/plugins/auth.ts) | JWT verify, `request.user` shape (`id`, `email`, `role`) |
| [`apps/api/src/middleware/requireRole.ts`](../apps/api/src/middleware/requireRole.ts) | Global role guard (hierarchy levels 0-3) |
| [`apps/api/src/middleware/requireProjectRole.ts`](../apps/api/src/middleware/requireProjectRole.ts) | Project-scoped role guard via `ProjectMemberService.hasRole` |
| [`apps/api/src/services/projectMemberService.ts`](../apps/api/src/services/projectMemberService.ts) | `isMemberOfProject`, `hasRole`, `getUserProjects` |
| [`apps/api/src/routes/projects.ts`](../apps/api/src/routes/projects.ts) | Project CRUD with role checks |
| [`apps/api/src/routes/issues.ts`](../apps/api/src/routes/issues.ts) | Issue CRUD with fine-grained role logic |
| [`apps/api/src/routes/comments.ts`](../apps/api/src/routes/comments.ts) | Comment CRUD with author/owner checks |
| [`apps/api/src/routes/feedback.ts`](../apps/api/src/routes/feedback.ts) | Feedback CRUD gated to DEVELOPER+ |
| [`apps/api/src/routes/projectMembers.ts`](../apps/api/src/routes/projectMembers.ts) | Member management gated to MANAGER+ |

### Frontend

| File | Purpose |
|------|---------|
| [`apps/web/lib/useRole.ts`](../apps/web/lib/useRole.ts) | Global role hook (`hasRole`, `isAdmin`, `isViewer`, etc.) |
| [`apps/web/lib/useProjectRole.ts`](../apps/web/lib/useProjectRole.ts) | Project-scoped role hook (fetches from API) |
| [`apps/web/components/RoleGate.tsx`](../apps/web/components/RoleGate.tsx) | Conditional render component (`<RoleGate minRole="MANAGER">`) |
| [`apps/web/components/IssueDrawer.tsx`](../apps/web/components/IssueDrawer.tsx) | Issue detail drawer with per-field role checks |
| [`apps/web/components/CommentSection.tsx`](../apps/web/components/CommentSection.tsx) | Comment form hidden for VIEWER |
| [`apps/web/app/dashboard/page.tsx`](../apps/web/app/dashboard/page.tsx) | Dashboard with RoleGate on create/delete buttons |
| [`apps/web/app/dashboard/projects/[id]/page.tsx`](../apps/web/app/dashboard/projects/[id]/page.tsx) | Project detail with inline edit and drag gating |
| [`apps/web/app/dashboard/feedback/page.tsx`](../apps/web/app/dashboard/feedback/page.tsx) | Feedback page with submit gating and drag disable |
| [`apps/web/store/authStore.ts`](../apps/web/store/authStore.ts) | Zustand store persisting `user.role` |

---

## Verification / Testing

### Manual verification per role

1. **Create test users** with each role (ADMIN, MANAGER, DEVELOPER, VIEWER) via the register endpoint or database seed.
2. **Log in** as each user and verify:

| Check | ADMIN | MANAGER | DEVELOPER | VIEWER |
|-------|-------|---------|-----------|--------|
| See all projects on dashboard | Yes | Own/member only | Own/member only | Member only |
| "New Project" button visible | Yes | Yes | Yes | No |
| Create issue | Yes | Yes | Yes | No |
| Change issue status (own) | Yes | Yes | Yes | No |
| Change issue status (others') | Yes | Yes | No | No |
| Change issue priority | Yes | Yes | No | No |
| Assign issue | Yes | Yes | No | No |
| Delete issue | Yes | Yes (if owner/manager) | No | No |
| Add comment | Yes | Yes | Yes | No |
| Delete others' comment | Yes | Yes (if project owner) | No | No |
| Manage project members | Yes | Yes (if project manager) | No | No |
| Submit feedback | Yes | Yes | Yes | No |
| Drag-and-drop issues | Yes | Yes | Yes | No |

### Known gaps

- **Shared types out of date**: `packages/shared/src/types.ts` defines `UserRole` without `ADMIN`. Backend and frontend work correctly because they define their own unions.
- **No automated role tests**: No integration tests exercise role-based access. Consider adding Fastify `inject()` tests per route/role combination.
- **Feedback for VIEWER**: Currently fully blocked. If restricted feedback (e.g., read-only comments) is desired, a new route or role check is needed.

---

*Last updated: 2026-02-12*
