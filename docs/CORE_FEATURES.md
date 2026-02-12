# BugSnap — Core Features Audit

> **Date:** 2026-02-06 (original audit) | **Updated:** 2026-02-13
> **Scope:** Read-only codebase analysis — no code changes
> **Commit:** `692eaae` (original) | `8ffe74a` (latest update)
>
> *Items resolved since the original audit are marked with ~~strikethrough~~ and **RESOLVED**.*

---

## Summary

| Status | Count | Meaning |
|--------|-------|---------|
| ✅ Implemented | 49 | Feature is fully functional |
| 🟡 Partial | 0 | Feature exists but has gaps |
| ❌ Not Implemented | 1 | Feature is missing entirely |
| **Total** | **50** | |

**Completion rate:** ~98% fully implemented, 0% partial, 2% missing.

---

## 1. Visual Bug Capture

| Feature | Status | Evidence |
|---------|--------|----------|
| Click-to-report on live websites | ✅ Implemented | `extension/bugsnap-ui.js:23-51` — `startTagging()` adds overlay, crosshair cursor, click handler. Element selected via `handleElementTag()` |
| Pin-based issue placement | ✅ Implemented | `extension/bugsnap-ui.js` — `addPinMarker()` renders persistent red pin at element position after selection. **RESOLVED** — pin markers added |
| Automatic screenshot capture | ✅ Implemented | `extension/background.js:127` — `chrome.tabs.captureVisibleTab(null, {format:'png'})`. Firefox equivalent at `extension-firefox/background.js:24` |
| Screen recording | ✅ Implemented | `MediaRecorder` + `getDisplayMedia` in Chrome and Firefox extensions. **RESOLVED** in v0.9.0 |
| Extension task drawer | ✅ Implemented | `extension/bugsnap-ui.js` — `openTasksDrawer()` shows grouped task list with search, status filters, and task detail panel. Auto-initializes on matched project URLs via `content.js` |
| Extension task detail panel | ✅ Implemented | `extension/bugsnap-ui.js` — `renderTaskDetail()` shows status dropdown, screenshot with lightbox, comments section, and "Open in BugSnap" link |
| Extension annotation editing | ✅ Implemented | `extension/bugsnap-ui.js` — `showAnnotationModalForEdit()` reopens annotation modal on existing tasks with "Update" button, loads existing annotations via `setAnnotations()` |
| Screenshot compositing | ✅ Implemented | `extension/bugsnap-ui.js` — `_compositeScreenshot()` burns annotations into screenshot image (canvas compositing), uploaded to Cloudinary CDN via PATCH `/api/issues/:issueId` |

---

## 2. Annotation & Markup Tools

| Feature | Status | Evidence |
|---------|--------|----------|
| Rectangle drawing | ✅ Implemented | `extension/mark-my-image.js:326-341` — `ctx.strokeRect()` |
| Arrow drawing | ✅ Implemented | `extension/mark-my-image.js:343-361` — Trigonometric arrowhead calculation |
| Pen/freehand drawing | ✅ Implemented | `extension/mark-my-image.js:363-378` — Path points on mousemove |
| Text labels | ✅ Implemented | `extension/mark-my-image.js:250-324` — Input element, dynamic width, save on blur/Enter |
| Highlight tool | ✅ Implemented | `extension/mark-my-image.js` — `drawHighlighter()` with `globalAlpha=0.3` transparent fill. Toolbar button added. **RESOLVED** |
| Color selection | ✅ Implemented | `extension/bugsnap-ui.js:240-287` — 5 colors (red, blue, green, yellow, purple) |
| Stroke width | ✅ Implemented | `extension/bugsnap-ui.js:220-235` — Dropdown 1-5px |
| Undo/Redo | ✅ Implemented | `extension/mark-my-image.js:506-543` — 50-state history |
| Select & move annotations | ✅ Implemented | `extension/mark-my-image.js:76-154` — Click detection + drag |
| Delete annotation | ✅ Implemented | `extension/mark-my-image.js:497-504` |
| Multiple annotations per issue | ✅ Implemented | `extension/mark-my-image.js:16` — `this.annotations = []` array, all submitted at `bugsnap-ui.js:886` |

---

## 3. Automatic Technical Context Capture

| Feature | Status | Evidence |
|---------|--------|----------|
| Page URL and path | ✅ Implemented | `extension/bugsnap-ui.js:892` — `url: window.location.href` |
| Browser and version | ✅ Implemented | `extension/bugsnap-ui.js:897` — `browser: navigator.userAgent` (full UA string) |
| OS and device type | ✅ Implemented | `extension/bugsnap-ui.js` — `deviceType` detects mobile/tablet/desktop via UA + viewport width. **RESOLVED** |
| Screen resolution / viewport | ✅ Implemented | `extension/bugsnap-ui.js` — `screenResolution: screen.width x screen.height`, `viewportSize: innerWidth x innerHeight`. **RESOLVED** |
| Timestamp | ✅ Implemented | `extension/bugsnap-ui.js:899` — `timestamp: new Date().toISOString()` |
| User identity (reporter) | ✅ Implemented | `extension/bugsnap-ui.js` — `reporterEmail` loaded from `chrome.storage.local` and included in `environmentData`. **RESOLVED** |
| Selected element metadata | ✅ Implemented | `extension/bugsnap-ui.js:900-908` — tagName, innerText (100 chars), bounding rect (x, y, width, height) |

---

## 4. Structured Bug Reports

| Feature | Status | Evidence |
|---------|--------|----------|
| Issue title | ✅ Implemented | `apps/api/prisma/schema.prisma` — `Issue.title String` |
| Detailed description | ✅ Implemented | `apps/api/prisma/schema.prisma` — `Issue.description String @db.Text` |
| Priority level | ✅ Implemented | `apps/api/prisma/schema.prisma` — Enum: low, medium, high, critical. **Note:** Priority was **removed from issues** in v0.9.0 (still exists on feedback). |
| Severity (separate field) | ✅ Implemented | `apps/api/prisma/schema.prisma` — `Issue.severity String?`. **Note:** Severity was **removed from issues** in v0.9.0. |
| Status tracking | ✅ Implemented | Values: `open, in_progress, qa, resolved, closed`. QA column added to Kanban board. **RESOLVED** — QA status added |
| Assigned owner | ✅ Implemented | `assignedToId` optional FK to User |
| Screenshot attachments | ✅ Implemented | `screenshotUrl String?`. Upload route at `routes/uploads.ts` (PNG/JPEG/WebP) |
| Video/recording attachments | ✅ Implemented | Screen recordings uploaded as attachments via extension. **RESOLVED** in v0.9.0 |
| Generic file attachments | ✅ Implemented | `Attachment` model with `fileName`, `fileUrl`, `fileType`, `fileSize`. Upload routes at `routes/uploads.ts`. Drag-and-drop UI in `IssueDrawer.tsx` and `FeedbackDrawer.tsx`. **RESOLVED** |
| Embedded technical metadata | ✅ Implemented | `environmentData Json?`. Stores browser, OS, timestamp, element metadata |
| Annotations stored | ✅ Implemented | `Annotation` model with type, coordinates (Json), content, color |

---

## 5. Collaboration & Feedback

| Feature | Status | Evidence |
|---------|--------|----------|
| Comment threads (issues) | ✅ Implemented | `Comment` model with full CRUD at `routes/comments.ts`. Frontend `CommentSection.tsx` with role-gated create/edit/delete. **RESOLVED** — was partial |
| Comment threads (feedback) | ✅ Implemented | Full CRUD at `routes/feedback.ts:321-422` |
| Activity timeline / change history | ✅ Implemented | `ActivityLog` model with action/field/oldValue/newValue tracking. `activityLogger.ts` utility integrated into issue + feedback routes. `ActivityTimeline.tsx` component in both drawers. **RESOLVED** |
| @mentions | ✅ Implemented | `@username` parsing in comment creation (`routes/comments.ts`, `routes/feedback.ts`). Matched users receive in-app notification. **RESOLVED** |
| Notifications | ✅ Implemented | `Notification` model with `notificationService.ts`. Routes at `routes/notifications.ts` (list, mark read, mark all read). `NotificationBell.tsx` in navbar with unread badge + dropdown. BullMQ email worker integrated with Resend. **RESOLVED** |

---

## 6. Project, Page & Issue Management

| Feature | Status | Evidence |
|---------|--------|----------|
| Multiple projects per account | ✅ Implemented | Project model. CRUD at `routes/projects.ts`. Dashboard at `dashboard/page.tsx` |
| Group issues by page/URL | ✅ Implemented | "Group by URL" toggle in FilterBar. Groups issues by URL with collapsible sections. **RESOLVED** |
| Filter by status | ✅ Implemented | `routes/issues.ts`. Frontend FilterBar on project detail page |
| Filter by priority | ✅ Implemented | `routes/issues.ts`. Frontend FilterBar with priority sort |
| Filter by assignee | ✅ Implemented | `assignedToId` query param in `GET /projects/:id/issues`. API where clause filters by assignee. **RESOLVED** |
| Search by title/description | ✅ Implemented | `routes/issues.ts`. Frontend search in FilterBar |

---

## 7. Sharing & Access Control

| Feature | Status | Evidence |
|---------|--------|----------|
| Shareable project/issue links | ✅ Implemented | `ShareToken` model with unique token + optional expiry. `routes/share.ts` — `POST /issues/:id/share`, `POST /feedback/:feedbackId/share`, `GET /share/:token` (no auth). Share button in `IssueDrawer.tsx` and `FeedbackDrawer.tsx`. **RESOLVED** |
| Role-based permissions | ✅ Implemented | 4-role hierarchy (ADMIN > MANAGER > DEVELOPER > VIEWER). Global guards (`requireRole`), project-scoped guards (`requireProjectRole`), frontend `useRole`/`useProjectRole` hooks, `<RoleGate>` component. **RESOLVED** — ADMIN role and VIEWER enforcement added |
| Team member management | ✅ Implemented | API: add/remove/update at `routes/projectMembers.ts` (MANAGER only). Frontend member list on project detail page. Admin-only `POST /users` endpoint + "Add Member" modal on team page for creating new users. **RESOLVED** — standalone user creation added |
| External stakeholder access | ❌ Not implemented | `schema.prisma:107` — `visibility` field with `members_and_clients` option exists, but no mechanism to grant access without a registered account |

---

## Gaps & Missing Features

### Critical Gaps (expected core functionality that is absent)

1. ~~**Issue comment CRUD**~~ — **RESOLVED:** Full CRUD at `routes/comments.ts` with `CommentSection.tsx` frontend. Role-gated (VIEWER blocked).
2. ~~**Screen resolution / viewport capture**~~ — **RESOLVED:** `screenResolution` and `viewportSize` added to `environmentData` in extension.
3. ~~**Reporter identity in submissions**~~ — **RESOLVED:** `reporterEmail` loaded from `chrome.storage.local` and included in `environmentData`.
4. ~~**Team member management UI**~~ — **RESOLVED:** Member list on project detail page with add/remove/role-change. Gated to MANAGER+.

### Notable Absences

5. ~~**Activity timeline / audit log**~~ — **RESOLVED:** `ActivityLog` model + `activityLogger.ts` utility. `ActivityTimeline.tsx` component in both Issue and Feedback drawers.
6. ~~**Notification system**~~ — **RESOLVED:** `Notification` model + `notificationService.ts` + `NotificationBell.tsx`. BullMQ email worker integrated with Resend.
7. ~~**Assignee filtering**~~ — **RESOLVED:** `assignedToId` query param in GET issues API.
8. ~~**VIEWER role enforcement**~~ — **RESOLVED:** VIEWER is now fully read-only. Backend returns 403 on writes; frontend hides create/edit/delete UI via `useRole` and `<RoleGate>`.
9. ~~**Shareable links**~~ — **RESOLVED:** `ShareToken` model + share routes for issues and feedback. Share button in both drawers.
10. ~~**Screen recording**~~ — **RESOLVED:** `MediaRecorder` + `getDisplayMedia` in Chrome and Firefox extensions (v0.9.0).

---

## Recommended Next Steps

### High Priority — Quick wins with no or minimal dependencies

| # | Feature | Gap | Dependencies | Effort |
|---|---------|-----|-------------|--------|
| ~~1~~ | ~~Issue comment CRUD endpoints~~ | ~~Model exists, no API routes~~ | | **RESOLVED** |
| ~~2~~ | ~~Screen resolution / viewport capture~~ | ~~Add `window.innerWidth/Height`, `screen.width/height` to metadata payload~~ | | **RESOLVED** |
| ~~3~~ | ~~Reporter identity in submissions~~ | ~~Include authenticated user email/ID in issue payload~~ | | **RESOLVED** |
| ~~4~~ | ~~Assign user UI~~ | ~~No handler~~ | | **RESOLVED** — MANAGER+ can assign in IssueDrawer |
| ~~5~~ | ~~Team member management UI~~ | ~~No frontend~~ | | **RESOLVED** — Member list on project detail page |

### Medium Priority — Require schema changes or moderate effort

| # | Feature | Gap | Dependencies | Effort |
|---|---------|-----|-------------|--------|
| ~~6~~ | ~~Activity timeline / audit log~~ | ~~No model or tracking~~ | | **RESOLVED** |
| ~~7~~ | ~~Filter issues by assignee~~ | ~~No API filter, no UI~~ | | **RESOLVED** |
| ~~8~~ | ~~VIEWER role enforcement~~ | ~~VIEWER can edit~~ | | **RESOLVED** — Full RBAC with 4 roles |
| ~~9~~ | ~~Highlight annotation tool~~ | ~~Only opaque rectangles~~ | | **RESOLVED** — `drawHighlighter()` with `globalAlpha=0.3` |
| ~~10~~ | ~~Severity field (separate from priority)~~ | ~~Only priority exists~~ | | **RESOLVED** — `severity String?` on Issue |
| ~~11~~ | ~~QA status value~~ | ~~Only open/in_progress/resolved/closed~~ | | **RESOLVED** — `qa` status added |

### Low Priority — Larger features or lower immediate impact

| # | Feature | Gap | Dependencies | Effort |
|---|---------|-----|-------------|--------|
| ~~12~~ | ~~Shareable public links~~ | ~~No share tokens or public routes~~ | | **RESOLVED** — ShareToken model + routes |
| ~~13~~ | ~~@mentions in comments~~ | ~~No parsing or notification~~ | | **RESOLVED** — `@username` parsing + notification |
| ~~14~~ | ~~Notification system~~ | ~~BullMQ stub exists, no implementation~~ | | **RESOLVED** — Full notification system |
| ~~15~~ | ~~Screen recording~~ | ~~No MediaRecorder integration~~ | | **RESOLVED** |
| 16 | External stakeholder access | Requires account currently | Auth redesign | Large |
| ~~17~~ | ~~Group issues by page/URL~~ | ~~URL field exists, no grouping UI~~ | | **RESOLVED** — "Group by URL" toggle in FilterBar |
| ~~18~~ | ~~Generic file attachments~~ | ~~Only single screenshot URL per issue~~ | | **RESOLVED** — Attachment model + drag-and-drop UI |
| ~~19~~ | ~~Device type detection~~ | ~~Only `navigator.platform`~~ | | **RESOLVED** — UA + viewport width detection |
| ~~20~~ | ~~Pin markers on page~~ | ~~Element highlighted but no persistent visual pin~~ | | **RESOLVED** — `addPinMarker()` in extension |
