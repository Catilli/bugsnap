# Kanban Bug Dashboard & Reporting

> Audit and implementation tracking document for the Kanban Bug Dashboard & Reporting feature set in BugSnap.

---

## 1. Overview

The **Kanban Bug Dashboard & Reporting** feature provides a visual, workflow-driven board for tracking bugs and issues through their lifecycle — from initial report through resolution. It is designed to give Project Managers, QA engineers, and development teams a real-time, at-a-glance view of every reported issue organised by stage.

Key capabilities:

- A four-stage Kanban board (NEW → IN PROGRESS → READY FOR QA → COMPLETED).
- Per-QA-cycle reports, each with a unique shareable URL.
- A unified all-reports view that aggregates data across QA cycles with advanced filters.
- Real-time dynamic updates so that annotation changes and status transitions are immediately visible.
- QA cycle management with the ability to create, continue, and close cycles.

### Relationship to Feedback Items

Each major area of this feature has been captured as a **FEATURE** feedback item on the BugSnap Feedback page (see §2 below). These feedback items serve as the product backlog — their status on the Feedback Kanban tracks progress from OPEN → IN_PROGRESS → RESOLVED → CLOSED.

---

## 2. Feature Breakdown

### 2.1 Visual Kanban Board

| Field | Value |
|-------|-------|
| **Feedback Item** | Feature #50 – *Kanban Board – workflow stages and status mapping* |
| **Status** | Planned |

**Description**

A visual Kanban Board that summarises all reported bugs/issues for quick overview. The board is organised into four workflow stages:

| Stage | Purpose |
|-------|---------|
| **NEW** | Newly reported bugs logged by the Project Manager or QA. |
| **IN PROGRESS** | Issues actively being addressed by the development team. |
| **READY FOR QA** | Fixes completed and ready for validation/testing. |
| **COMPLETED** | Verified and resolved issues. |

**Key Implementation Notes**

- The existing Feedback page already uses a four-column Kanban (OPEN / IN_PROGRESS / RESOLVED / CLOSED). The new board will follow the same drag-and-drop pattern but operate on the **Issue** model with the new stage names.
- Existing components: `apps/web/app/dashboard/feedback/page.tsx` (Kanban reference), `apps/web/components/KanbanBoard.tsx` (reusable board component).
- New route/page TBD under `apps/web/app/dashboard/kanban/` or similar.

---

### 2.2 Multiple Kanban Reports

| Field | Value |
|-------|-------|
| **Feedback Item** | Feature #51 – *Multiple Kanban reports per QA cycle with unique URLs* |
| **Status** | Planned |

**Description**

Each QA cycle can generate a separate Kanban report with a unique URL. Project Managers and QA engineers can track issues per QA iteration independently. Previous reports remain accessible for historical reference.

**Key Implementation Notes**

- Will require a new **QA Cycle** (or **Report**) entity in the Prisma schema linking a set of issues to a named cycle.
- Unique URL likely follows the pattern `/dashboard/reports/:reportId`.
- Share tokens from the existing `ShareToken` model can be reused for external sharing.

---

### 2.3 Unified All-Reports View

| Field | Value |
|-------|-------|
| **Feedback Item** | Feature #52 – *Unified All-Reports view with filters and historical context* |
| **Status** | Planned |

**Description**

An optional mode to combine multiple Kanban reports into a single, aggregated view for full project visibility. Available filters:

- QA cycle
- Status
- Priority
- Assignee
- Page (URL where the bug was captured)

The view maintains historical context from previous QA cycles while enabling high-level tracking.

**Key Implementation Notes**

- Aggregation query across all QA cycles for a given project.
- Filter UI can extend the existing `FilterBar` component with additional slots for QA cycle and page.
- Historical context preserved by retaining closed cycles in the database (soft archive, not deletion).

---

### 2.4 Real-Time Updates

| Field | Value |
|-------|-------|
| **Feedback Item** | Feature #53 – *Real-time updates for annotations and issue status in Kanban* |
| **Status** | Planned |

**Description**

Changes to annotations or issue status are reflected in the Kanban board in real time. All team members see the latest state without manual page refreshes.

**Key Implementation Notes**

- BugSnap already has an SSE (Server-Sent Events) infrastructure for real-time updates.
- Extend existing SSE channels (or add a new `/api/sse/kanban` endpoint) to push issue status changes and annotation updates.
- Fallback: polling every N seconds if SSE is not available in the client environment.

---

### 2.5 QA Cycle Management & Filters

| Field | Value |
|-------|-------|
| **Feedback Item** | Feature #54 – *QA cycle management and advanced filters (priority, assignee, page, tag)* |
| **Status** | Planned |

**Description**

Generate a new report for each QA round or continue tracking using an existing Kanban report. Advanced filters allow focused analysis:

- Priority (low, medium, high, critical)
- Assignee
- Page (source URL)
- Tag

QA cycles are first-class entities that can be created, named, and closed.

**Key Implementation Notes**

- New Prisma model (e.g. `QaCycle`) with fields: `id`, `name`, `projectId`, `status` (active/closed), `createdAt`, `closedAt`.
- Join table or foreign key on `Issue` linking issues to a cycle.
- Filter UI extends the existing `FilterBar` component; tag-based filtering may require a new `Tag` model or a JSON array field on `Issue`.

---

## 3. Workflow Stages

### Stage Definitions

| # | Stage | Description | Mapped Issue Status |
|---|-------|-------------|---------------------|
| 1 | **NEW** | Newly reported bugs logged by PM / QA. | `open` |
| 2 | **IN PROGRESS** | Issues actively being worked on by the dev team. | `in_progress` |
| 3 | **READY FOR QA** | Fixes completed, awaiting validation/testing. | `resolved` *(reuse existing)* or new `ready_for_qa` |
| 4 | **COMPLETED** | Verified and fully resolved issues. | `closed` |

### Transition Rules

| From | To | Who Can Move | Validation |
|------|----|-------------|------------|
| NEW | IN PROGRESS | DEVELOPER+, or auto on assignment | Issue must have an assignee (recommended, not enforced). |
| IN PROGRESS | READY FOR QA | DEVELOPER+ (the assignee) | At least one commit or comment describing the fix (recommended). |
| READY FOR QA | COMPLETED | MANAGER+ (PM / QA) | QA has verified the fix; issue passes acceptance criteria. |
| READY FOR QA | IN PROGRESS | MANAGER+ (PM / QA) | QA rejects the fix; issue returns to dev with a comment. |
| Any | NEW | MANAGER+ | Reopen / reset if needed. |

> **Note:** The existing Issue model uses lowercase string statuses (`open`, `in_progress`, `resolved`, `closed`). A decision is needed on whether to add `ready_for_qa` as a fifth status or map READY FOR QA to `resolved`. Current recommendation: map to `resolved` initially to avoid a schema migration, then introduce `ready_for_qa` if the distinction proves necessary.

---

## 4. Reporting & QA Cycles

### 4.1 Multiple Reports per QA Cycle

- Each QA cycle is represented by a first-class entity (e.g. `QaCycle` model) linked to a **Project**.
- When a PM/QA starts a new QA round, they create a new cycle which generates a **unique URL** (`/dashboard/projects/:projectId/reports/:cycleId`).
- Issues are associated with a cycle either at creation time or when triaged into the cycle.
- Older cycles remain accessible in read-only or editable mode (configurable).

### 4.2 Unified All-Reports View

- Accessed via a toggle or dedicated route (e.g. `/dashboard/projects/:projectId/reports/all`).
- Aggregates issues from **all** cycles for the project into one Kanban board.
- Available filters:

| Filter | Source |
|--------|--------|
| QA Cycle | `QaCycle.name` / `QaCycle.id` |
| Status | Issue `status` field |
| Priority | Issue `priority` field |
| Assignee | Issue `assignedToId` → User |
| Page | Issue `url` field (the page where the bug was captured) |
| Tag | Future `Tag` model or JSON array on Issue |

- Historical context is preserved because closed cycles and their issues are never deleted — they are archived and remain queryable.

### 4.3 Dynamic Updates

| Mechanism | Current State | Target State |
|-----------|--------------|--------------|
| SSE | Exists for issue/feedback updates | Extend to push Kanban-specific events (stage transitions, annotation changes). |
| WebSocket | Not implemented | Optional upgrade path for lower latency. |
| Polling | Not implemented | Fallback if SSE is unavailable in the client environment. |
| Manual Refresh | Works today | Always available as baseline. |

---

## 5. Implementation Status Log

Track incremental progress here. Update this table as features are built.

| Date | What Was Implemented | Related Feedback Items | Key Code Locations |
|------|---------------------|----------------------|-------------------|
| 2026-02-10 | Created feedback items and audit document | Feature #50, #51, #52, #53, #54 | `apps/api/prisma/seed.ts`, `docs/Kanban Bug Dashboard & Reporting.md` |

---

*Last updated: 2026-02-10*
