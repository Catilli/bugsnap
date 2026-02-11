'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { Bug, MessageSquare, Calendar, User, ExternalLink, MapPin } from 'lucide-react';
import { safeHref } from '@/lib/safeUrl';
import { ScreenshotImage } from '@/components/ScreenshotImage';

interface SharedUser {
  id: string;
  name: string;
  email: string;
}

interface SharedComment {
  id: string;
  content: string;
  createdAt: string;
  user: SharedUser;
}

interface SharedIssue {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  screenshotUrl: string | null;
  screenshotBackupUrl: string | null;
  status: 'open' | 'in_progress' | 'qa' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  severity?: 'low' | 'medium' | 'high' | 'critical' | null;
  type?: 'BUG' | 'FEATURE' | 'TASK';
  createdAt: string;
  createdBy: SharedUser;
  assignedTo: SharedUser | null;
  comments: SharedComment[];
}

interface SharedFeedback {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string | null;
  createdAt: string;
  createdBy: SharedUser;
  comments: SharedComment[];
}

interface SharedProjectIssue {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  status: 'open' | 'in_progress' | 'qa' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  type?: 'BUG' | 'FEATURE' | 'TASK';
  createdAt: string;
  createdBy: SharedUser;
  assignedTo: SharedUser | null;
  _count: { comments: number };
}

interface SharedProject {
  id: string;
  name: string;
  websiteUrl: string;
  generalAccess: string;
  issues: SharedProjectIssue[];
}

type SharedData =
  | { type: 'issue'; data: SharedIssue }
  | { type: 'feedback'; data: SharedFeedback }
  | { type: 'project'; data: SharedProject };

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SharedContentPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchSharedContent = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/share/${token}`
        );

        if (response.status === 404) {
          setError({ status: 404, message: 'This shared link is invalid or has been removed.' });
          return;
        }
        if (response.status === 410) {
          setError({ status: 410, message: 'This shared link has expired.' });
          return;
        }
        if (!response.ok) {
          setError({ status: response.status, message: 'Something went wrong loading this content.' });
          return;
        }

        const result = await response.json();
        setData(result);
      } catch {
        setError({ status: 0, message: 'Unable to connect to the server. Please try again later.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedContent();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bug className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {error.status === 410 ? 'Link Expired' : 'Link Not Found'}
            </h1>
            <p className="text-gray-600">{error.message}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data) return null;

  const isProject = data.type === 'project';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className={`flex-1 ${isProject ? 'max-w-5xl' : 'max-w-3xl'} mx-auto w-full px-4 py-8`}>
        {data.type === 'issue' ? (
          <IssueCard issue={data.data} />
        ) : data.type === 'project' ? (
          <ProjectView project={data.data} />
        ) : (
          <FeedbackCard feedback={data.data} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
        <Bug className="w-6 h-6 text-indigo-600" />
        <span className="text-lg font-bold text-gray-900">BugSnap</span>
        <span className="text-sm text-gray-400 ml-2">Shared Content</span>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
        Shared via BugSnap
      </div>
    </footer>
  );
}

function IssueCard({ issue }: { issue: SharedIssue }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {issue.type && <TypeBadge type={issue.type} size="sm" />}
          <StatusBadge status={issue.status} size="sm" />
          {issue.priority && <PriorityBadge priority={issue.priority} size="sm" />}
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{issue.title}</h1>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {/* Description */}
        {issue.description && (
          <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
        )}

        {/* Screenshot */}
        {issue.screenshotUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Screenshot</label>
            <ScreenshotImage
              src={issue.screenshotUrl}
              backupSrc={issue.screenshotBackupUrl}
              alt="Screenshot"
              className="w-full rounded-lg border border-gray-200 max-h-96 object-cover"
            />
          </div>
        )}

        {/* URL */}
        {issue.url && (
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <a
              href={safeHref(issue.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline"
            >
              {issue.url}
            </a>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </div>
        )}

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>Reported by {issue.createdBy.name}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(issue.createdAt)}</span>
          </div>
          {issue.assignedTo && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>Assigned to {issue.assignedTo.name}</span>
            </div>
          )}
        </div>

        {/* Comments */}
        {issue.comments.length > 0 && (
          <CommentsSection comments={issue.comments} />
        )}
      </div>
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: SharedFeedback }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full font-medium px-2 py-0.5 text-xs bg-purple-100 text-purple-800">
            {feedback.type}
          </span>
          <span className="inline-flex items-center rounded-full font-medium px-2 py-0.5 text-xs bg-gray-100 text-gray-800 capitalize">
            {feedback.status}
          </span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{feedback.title}</h1>
      </div>

      <div className="px-6 py-5 space-y-5">
        {feedback.description && (
          <p className="text-gray-700 whitespace-pre-wrap">{feedback.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>Submitted by {feedback.createdBy.name}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(feedback.createdAt)}</span>
          </div>
        </div>

        {feedback.comments.length > 0 && (
          <CommentsSection comments={feedback.comments} />
        )}
      </div>
    </div>
  );
}

function ProjectView({ project }: { project: SharedProject }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Project header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5">
        <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <ExternalLink className="w-4 h-4" />
          <a
            href={safeHref(project.websiteUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline truncate"
          >
            {project.websiteUrl}
          </a>
        </div>
        <p className="mt-2 text-sm text-gray-500">{project.issues.length} issue{project.issues.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Issue list */}
      {project.issues.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No issues in this project yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {project.issues.map((issue) => (
            <div key={issue.id}>
              <button
                onClick={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                {issue.type && <TypeBadge type={issue.type} size="sm" />}
                <StatusBadge status={issue.status} size="sm" />
                <span className="text-sm text-gray-900 flex-1 truncate">{issue.title}</span>
                {issue.priority && <PriorityBadge priority={issue.priority} size="sm" />}
                {issue.assignedTo && (
                  <span className="text-xs text-gray-500 flex-shrink-0">{issue.assignedTo.name}</span>
                )}
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(issue.createdAt)}</span>
                {issue._count.comments > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MessageSquare className="w-3 h-3" />{issue._count.comments}
                  </span>
                )}
              </button>
              {expandedId === issue.id && (
                <div className="px-6 pb-4 pt-1 border-t border-gray-50 bg-gray-50/50">
                  {issue.description ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{issue.description}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No description</p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>Reported by {issue.createdBy.name}</span>
                    {issue.url && (
                      <a href={safeHref(issue.url)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-xs">
                        {issue.url}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentsSection({ comments }: { comments: SharedComment[] }) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          Comments ({comments.length})
        </span>
      </div>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
              {comment.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">{comment.user.name}</span>
                <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
