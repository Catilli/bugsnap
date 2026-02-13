'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

const APP_VERSION = 'v0.10.7';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

const webChangelog: ChangelogEntry[] = [
  {
    version: 'v0.10.7',
    date: 'February 14, 2026',
    changes: [
      'Added About page with version info, tech stack, scrollable changelog, and documentation links',
      'Added "About" link to user menu dropdown',
      'Updated feedback bug icon tooltip to "Report Bug / Request Feature"',
      'Fixed blank Role display on Account page — added missing ADMIN role condition',
    ],
  },
  {
    version: 'v0.10.5',
    date: 'February 14, 2026',
    changes: [
      'Notify user when invited to a project — "You were added to project X" notification in the bell',
      'Notify assignee when assigned to an issue at creation time (previously only triggered on PATCH)',
      'Self-actions skipped — no notification if you invite yourself or assign an issue to yourself',
      'Clicking a notification navigates to the relevant project page or issue detail',
    ],
  },
  {
    version: 'v0.10.4',
    date: 'February 14, 2026',
    changes: [
      'Store raw (un-annotated) screenshot separately as rawScreenshotUrl on Issue model',
      'Annotation editor loads raw screenshot as clean canvas background — no old burned-in annotations',
      'API PATCH handler now accepts and uploads rawScreenshotUrl to Cloudinary alongside composited screenshotUrl',
      'Fix Dashboard and Admin status badge colors to match Project Detail page',
      'Fix Tailwind content scan missing providers/ directory — confirm dialog buttons now render correctly',
      'Fix crash when creating task from extension — SSE issue:created event now provides default _count for KanbanCard',
    ],
  },
  {
    version: 'v0.10.3',
    date: 'February 13, 2026',
    changes: [
      '@Mention autocomplete for comments — type @ in comment textarea to search and select project members',
      'Keyboard navigation for mention dropdown — ArrowDown/Up to highlight, Enter to insert, Escape to close',
      'Reusable MentionTextarea component replaces duplicated inline mention logic',
      'IssueDrawer eagerly loads project members on open (no longer requires clicking "Assign" first)',
      'Screenshot lightbox pin icon updated to blue task pin style (matches extension pins)',
      'Lightbox close button repositioned to upper-right corner of the image container',
    ],
  },
  {
    version: 'v0.10.2',
    date: 'February 13, 2026',
    changes: [
      'Removed web app annotation editor — annotations are burned into screenshots by the extension',
      'Restored clickable pin tagging in screenshot lightbox with scaled position',
      'Lightbox style matches extension Task Drawer — dark backdrop, centered image, close button',
      'DialogProvider lightbox no longer scrollable (constrained image fits viewport)',
      'PATCH /api/issues/:issueId extended to accept annotations array and screenshotUrl',
      'Fixed Zod validation rejecting null for annotation content and color fields',
    ],
  },
  {
    version: 'v0.9.0',
    date: 'February 12, 2026',
    changes: [
      'Public "anyone with link" project sharing with redesigned share dropdown',
      'Clickable pin in screenshot lightbox (navigate to element on page)',
      'QA Cycle management — create, add/remove issues, status tracking',
      'Cloudflare R2 backup for screenshots',
      'Removed OAuth — simplified to email/password only',
      'Show user names instead of UUIDs in activity timeline',
    ],
  },
  {
    version: 'v0.8.0',
    date: 'February 11, 2026',
    changes: [
      'Admin-only team member creation with Zod validation and bcrypt password hashing',
      'URL sanitization rejecting javascript:, data:, vbscript: protocols',
      'Zod validation for all query parameters and missing body schemas',
      'Fixed email HTML injection in notification service',
      'Frontend safeHref() guard on all user-provided URL links',
    ],
  },
  {
    version: 'v0.6.0',
    date: 'February 10, 2026',
    changes: [
      'Split notifications by type — bell icon for issues, bug icon for feedback',
      'Extracted shared Drawer component and global DialogProvider',
      'Admin dashboard with system stats, user management, and data export',
      'Feedback system parity (attachments, share links, comments, activity timeline)',
      'XSS sanitization and security hardening',
      'File attachments with upload and drag-and-drop',
      'Shareable issue and feedback links (token-based, 7-day expiry)',
    ],
  },
  {
    version: 'v0.4.0',
    date: 'February 07, 2026',
    changes: [
      'Added roles & permissions system (ADMIN, MANAGER, DEVELOPER, VIEWER)',
      'Renamed Task entity to Issue across project',
      'Unified filter components into reusable slot-based FilterBar',
      'Replaced project page grid/list with reusable KanbanBoard (drag-and-drop)',
    ],
  },
  {
    version: 'v0.3.1',
    date: 'February 06, 2026',
    changes: [
      'Migrated auth to self-hosted JWT',
      'Zustand auth store with persist middleware',
      'Password reset flow (crypto token + SHA-256, 1h TTL)',
    ],
  },
  {
    version: 'v0.3.0',
    date: 'February 05, 2026',
    changes: [
      'Codebase cleanup: removed unused files, dead code, and stale stubs',
      'Fixed wrong cross-dependencies',
      'Updated README with accurate tech stack versions',
    ],
  },
  {
    version: 'v0.2.0',
    date: 'January 30, 2026',
    changes: [
      'Fixed Vercel deployment configuration',
      'Updated deployment documentation with comprehensive guides',
      'Enhanced project structure and build configuration',
    ],
  },
  {
    version: 'v0.1.0',
    date: 'January 28, 2026',
    changes: [
      'Initial release with core bug tracking functionality',
      'User authentication and authorization',
      'Project and task management',
    ],
  },
];

function ChangelogItem({ entry, defaultOpen }: { entry: ChangelogEntry; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 text-left hover:bg-gray-50 transition-colors -mx-1 px-1 rounded"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <span className="font-medium text-gray-900 text-sm">{entry.version}</span>
        <span className="text-xs text-gray-500">{entry.date}</span>
      </button>
      {open && (
        <ul className="ml-6 mb-3 space-y-1.5">
          {entry.changes.map((change, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-indigo-400 mt-1.5 flex-shrink-0">•</span>
              {change}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AboutPage() {
  const environment =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'Development (localhost)'
      : 'Production';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">About BugSnap</h1>
        <p className="text-gray-600">
          Visual bug capture and feedback tool for teams
        </p>
      </div>

      {/* Version Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Version</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">App version</span>
            <span className="font-medium text-gray-900">{APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Environment</span>
            <span className="font-medium text-gray-900">{environment}</span>
          </div>
        </div>
      </div>

      {/* Tech Stack Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tech Stack</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Frontend</h3>
            <p className="text-gray-600">Next.js 16, Tailwind CSS, TypeScript, Zustand</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Backend</h3>
            <p className="text-gray-600">Fastify, PostgreSQL, Prisma ORM</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Extensions</h3>
            <p className="text-gray-600">Chrome (MV3), Firefox (MV2), Safari (MV3)</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Infrastructure</h3>
            <p className="text-gray-600">Vercel, Render, Cloudinary, Cloudflare R2</p>
          </div>
        </div>
      </div>

      {/* Changelog Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Changelog</h2>
        <div className="max-h-[500px] overflow-y-auto">
          {webChangelog.map((entry, i) => (
            <ChangelogItem key={entry.version} entry={entry} defaultOpen={i < 2} />
          ))}
        </div>
      </div>

      {/* Links Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Links</h2>
        <div className="space-y-3 text-sm">
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Next.js Documentation
          </a>
          <a
            href="https://www.fastify.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Fastify Documentation
          </a>
          <a
            href="https://www.prisma.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Prisma Documentation
          </a>
          <a
            href="https://turbo.build/repo/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Turborepo Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
