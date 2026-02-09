# BugSnap — Core Features Audit

> **Date:** 2026-02-06 (original audit) | **Updated:** 2026-02-07
> **Scope:** Read-only codebase analysis — no code changes
> **Commit:** `692eaae` (original) | `f4719b7` (latest update)
>
> *Items resolved since the original audit are marked with ~~strikethrough~~ and **RESOLVED**.*

---

## Summary

| Status | Count | Meaning |
|--------|-------|---------|
| ✅ Implemented | 28 | Feature is fully functional |
| 🟡 Partial | 4 | Feature exists but has gaps |
| ❌ Not Implemented | 14 | Feature is missing entirely |
| **Total** | **46** | |

**Completion rate:** 61% fully implemented, 9% partial, 30% missing.

---

## 1. Visual Bug Capture

| Feature | Status | Evidence |
|---------|--------|----------|
| Click-to-report on live websites | ✅ Implemented | `extension/bugsnap-ui.js:23-51` — `startTagging()` adds overlay, crosshair cursor, click handler. Element selected via `handleElementTag()` |
| Pin-based issue placement | 🟡 Partial | `extension/bugsnap-ui.js:74-80` — Selected element highlighted with blue outline + bounding rect captured. No persistent pin marker rendered on page; highlight disappears after selection |
| Automatic screenshot capture | ✅ Implemented | `extension/background.js:127` — `chrome.tabs.captureVisibleTab(null, {format:'png'})`. Firefox equivalent at `extension-firefox/background.js:24` |
| Screen recording | ❌ Not implemented | No `MediaRecorder`, `getDisplayMedia`, or any recording API in codebase |

---

## 2. Annotation & Markup Tools

| Feature | Status | Evidence |
|---------|--------|----------|
| Rectangle drawing | ✅ Implemented | `extension/mark-my-image.js:326-341` — `ctx.strokeRect()` |
| Arrow drawing | ✅ Implemented | `extension/mark-my-image.js:343-361` — Trigonometric arrowhead calculation |
| Pen/freehand drawing | ✅ Implemented | `extension/mark-my-image.js:363-378` — Path points on mousemove |
| Text labels | ✅ Implemented | `extension/mark-my-image.js:250-324` — Input element, dynamic width, save on blur/Enter |
| Highlight tool | ❌ Not implemented | No semi-transparent overlay or highlight-specific tool; only opaque rectangle outlines |
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
| OS and device type | 🟡 Partial | `extension/bugsnap-ui.js:898` — `os: navigator.platform` captures only platform string ("Win32"), not device type (mobile/desktop/tablet) |
| Screen resolution / viewport | ❌ Not implemented | No `window.innerWidth`, `screen.width`, or viewport capture in extension code |
| Timestamp | ✅ Implemented | `extension/bugsnap-ui.js:899` — `timestamp: new Date().toISOString()` |
| User identity (reporter) | ❌ Not implemented | Reporter email/ID stored in popup (`extension/popup.js:10`) but not included in task submission payload; only `assignedToId` sent |
| Selected element metadata | ✅ Implemented | `extension/bugsnap-ui.js:900-908` — tagName, innerText (100 chars), bounding rect (x, y, width, height) |

---

## 4. Structured Bug Reports

| Feature | Status | Evidence |
|---------|--------|----------|
| Issue title | ✅ Implemented | `apps/api/prisma/schema.prisma` — `Issue.title String` |
| Detailed description | ✅ Implemented | `apps/api/prisma/schema.prisma` — `Issue.description String @db.Text` |
| Priority level | ✅ Implemented | `apps/api/prisma/schema.prisma` — Enum: low, medium, high, critical |
| Severity (separate field) | ❌ Not implemented | No severity field in Issue model; only priority exists |
| Status tracking | 🟡 Partial | Values: `open, in_progress, resolved, closed`. Missing `QA` status. No workflow enforcement |
| Assigned owner | ✅ Implemented | `assignedToId` optional FK to User |
| Screenshot attachments | ✅ Implemented | `screenshotUrl String?`. Upload route at `routes/uploads.ts` (PNG/JPEG/WebP) |
| Video/recording attachments | ❌ Not implemented | Upload route rejects non-image types; no video support |
| Generic file attachments | ❌ Not implemented | Only single screenshot URL per issue; no attachment array/model |
| Embedded technical metadata | ✅ Implemented | `environmentData Json?`. Stores browser, OS, timestamp, element metadata |
| Annotations stored | ✅ Implemented | `Annotation` model with type, coordinates (Json), content, color |

---

## 5. Collaboration & Feedback

| Feature | Status | Evidence |
|---------|--------|----------|
| Comment threads (issues) | ✅ Implemented | `Comment` model with full CRUD at `routes/comments.ts`. Frontend `CommentSection.tsx` with role-gated create/edit/delete. **RESOLVED** — was partial |
| Comment threads (feedback) | ✅ Implemented | Full CRUD at `routes/feedback.ts:321-422` |
| Activity timeline / change history | ❌ Not implemented | No Activity, History, or AuditLog model; only `createdAt`/`updatedAt` timestamps |
| @mentions | ❌ Not implemented | No mention parsing, no user lookup in comment text |
| Notifications | ❌ Not implemented | No notification model, no email/push/in-app alerts. BullMQ email worker is a TODO stub (`lib/queue.ts:71`) |

---

## 6. Project, Page & Issue Management

| Feature | Status | Evidence |
|---------|--------|----------|
| Multiple projects per account | ✅ Implemented | Project model. CRUD at `routes/projects.ts`. Dashboard at `dashboard/page.tsx` |
| Group issues by page/URL | 🟡 Partial | `Issue.url` field exists. Issues filterable by project but **no URL grouping UI or API** |
| Filter by status | ✅ Implemented | `routes/issues.ts`. Frontend FilterBar on project detail page |
| Filter by priority | ✅ Implemented | `routes/issues.ts`. Frontend FilterBar with priority sort |
| Filter by assignee | ❌ Not implemented | No assignee filter in API or frontend |
| Search by title/description | ✅ Implemented | `routes/issues.ts`. Frontend search in FilterBar |

---

## 7. Sharing & Access Control

| Feature | Status | Evidence |
|---------|--------|----------|
| Shareable project/issue links | ❌ Not implemented | No `shareToken`, `publicUrl`, or public access routes |
| Role-based permissions | ✅ Implemented | 4-role hierarchy (ADMIN > MANAGER > DEVELOPER > VIEWER). Global guards (`requireRole`), project-scoped guards (`requireProjectRole`), frontend `useRole`/`useProjectRole` hooks, `<RoleGate>` component. **RESOLVED** — ADMIN role and VIEWER enforcement added |
| Team member management | 🟡 Partial | API: add/remove/update at `routes/projectMembers.ts` (MANAGER only). Frontend member list on project detail page. No standalone invite form |
| External stakeholder access | ❌ Not implemented | `schema.prisma:107` — `visibility` field with `members_and_clients` option exists, but no mechanism to grant access without a registered account |

---

## Gaps & Missing Features

### Critical Gaps (expected core functionality that is absent)

1. ~~**Issue comment CRUD**~~ — **RESOLVED:** Full CRUD at `routes/comments.ts` with `CommentSection.tsx` frontend. Role-gated (VIEWER blocked).
2. **Screen resolution / viewport capture** — Basic technical metadata that most bug-reporting tools capture automatically.
3. **Reporter identity in submissions** — The user is authenticated but their identity is not attached to bug reports created from the extension.
4. ~~**Team member management UI**~~ — **RESOLVED:** Member list on project detail page with add/remove/role-change. Gated to MANAGER+.

### Notable Absences

5. **Activity timeline / audit log** — No history of changes to issues or projects.
6. **Notification system** — No alerts of any kind (email, push, or in-app). BullMQ worker is a stub.
7. **Assignee filtering** — Cannot filter the issue list by who is assigned.
8. ~~**VIEWER role enforcement**~~ — **RESOLVED:** VIEWER is now fully read-only. Backend returns 403 on writes; frontend hides create/edit/delete UI via `useRole` and `<RoleGate>`.
9. **Shareable links** — No way to share a project or issue with someone outside the platform.
10. **Screen recording** — No video capture capability in the extension.

---

## Recommended Next Steps

### High Priority — Quick wins with no or minimal dependencies

| # | Feature | Gap | Dependencies | Effort |
|---|---------|-----|-------------|--------|
| ~~1~~ | ~~Issue comment CRUD endpoints~~ | ~~Model exists, no API routes~~ | | **RESOLVED** |
| 2 | Screen resolution / viewport capture | Add `window.innerWidth/Height`, `screen.width/height` to metadata payload | None | Tiny |
| 3 | Reporter identity in submissions | Include authenticated user email/ID in issue payload | None | Tiny |
| ~~4~~ | ~~Assign user UI~~ | ~~No handler~~ | | **RESOLVED** — MANAGER+ can assign in IssueDrawer |
| ~~5~~ | ~~Team member management UI~~ | ~~No frontend~~ | | **RESOLVED** — Member list on project detail page |

### Medium Priority — Require schema changes or moderate effort

| # | Feature | Gap | Dependencies | Effort |
|---|---------|-----|-------------|--------|
| 6 | Activity timeline / audit log | No model or tracking | New Prisma model + migration | Medium |
| 7 | Filter issues by assignee | No API filter, no UI | Minor API + frontend change | Small |
| ~~8~~ | ~~VIEWER role enforcement~~ | ~~VIEWER can edit~~ | | **RESOLVED** — Full RBAC with 4 roles |
| 9 | Highlight annotation tool | Only opaque rectangles; no semi-transparent highlight | Extension canvas changes | Medium |
| 10 | Severity field (separate from priority) | Only priority exists | Schema migration | Small |
| 11 | QA status value | Only open/in_progress/resolved/closed | Schema enum + migration | Tiny |

### Low Priority — Larger features or lower immediate impact

| # | Feature | Gap | Dependencies | Effort |
|---|---------|-----|-------------|--------|
| 12 | Shareable public links | No share tokens or public routes | New model + routes | Medium |
| 13 | @mentions in comments | No parsing or notification | Needs notification system (#14) | Medium |
| 14 | Notification system | BullMQ stub exists, no implementation | Email service integration | Large |
| 15 | Screen recording | No MediaRecorder integration | Major extension feature | Large |
| 16 | External stakeholder access | Requires account currently | Auth redesign | Large |
| 17 | Group issues by page/URL | URL field exists, no grouping UI | API + frontend UI | Medium |
| 18 | Generic file attachments | Only single screenshot URL per issue | Schema + upload changes | Medium |
| 19 | Device type detection | Only `navigator.platform` | UA parsing library | Tiny |
| 20 | Pin markers on page | Element highlighted but no persistent visual pin | Extension UI changes | Medium |
