'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useProject } from '../../ProjectContext';
import { KanbanBoard, ColumnConfig } from '@/components/kanban/KanbanBoard';
import { FilterBar } from '@/components/FilterBar';
import IssueDrawer from '@/components/IssueDrawer';
import { Pencil, ExternalLink, RefreshCw, Trash2, BadgeAlert } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getAuthToken } from '@/lib/clerkTokenBridge';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  type?: 'BUG' | 'FEATURE' | 'TASK';
  url: string | null;
  screenshotUrl: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    comments: number;
  };
}

const PROJECT_COLUMNS: ColumnConfig[] = [
  { status: 'open', title: 'New', color: 'yellow' },
  { status: 'in_progress', title: 'In Progress', color: 'blue' },
  { status: 'resolved', title: 'Ready for QA', color: 'purple' },
  { status: 'closed', title: 'Completed', color: 'green' },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const { setProjectName } = useProject();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Issue state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isIssuesLoading, setIsIssuesLoading] = useState(true);

  // Issue drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; issueId: string | null }>({ show: false, issueId: null });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

  const assigneeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    issues.forEach((issue) => {
      if (issue.assignedTo && !seen.has(issue.assignedTo.id)) {
        seen.set(issue.assignedTo.id, issue.assignedTo.name);
      }
    });
    return Array.from(seen, ([id, name]) => ({ label: name, value: id }));
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (typeFilter && issue.type !== typeFilter) return false;
      if (priorityFilter && issue.priority !== priorityFilter) return false;
      if (assigneeFilter && issue.assignedTo?.id !== assigneeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!issue.title.toLowerCase().includes(q) && !issue.description?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [issues, typeFilter, priorityFilter, assigneeFilter, searchQuery]);

  const hasActiveFilters = typeFilter !== null || priorityFilter !== null || assigneeFilter !== null || searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter(null);
    setPriorityFilter(null);
    setAssigneeFilter(null);
  };

  const openIssueDrawer = (issueId: string) => {
    setSelectedIssueId(issueId);
    setIsDrawerOpen(true);
  };

  const closeIssueDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedIssueId(null);
  };

  // Handle issue status change (optimistic update)
  const handleStatusChange = async (issueId: string, newStatus: string) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;

    const previousStatus = issue.status;

    // Optimistic update
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus as Issue['status'] } : i))
    );

    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        // Revert on error
        setIssues((prev) =>
          prev.map((i) => (i.id === issueId ? { ...i, status: previousStatus } : i))
        );
      }
    } catch {
      // Revert on error
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: previousStatus } : i))
      );
    }
  };

  // Handle issue deletion
  const handleDeleteIssue = async (issueId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setIssues(issues.filter(i => i.id !== issueId));
        setDeleteConfirm({ show: false, issueId: null });
      }
    } catch (error) {
      // Silently fail on error
    }
  };

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProject(data);
          setEditedName(data.name);
          setProjectName(data.name);
        }
      } catch (error) {
        // Silently fail on error
      }
    };

    fetchProject();

    // Cleanup: Clear project name when leaving the page
    return () => {
      setProjectName(null);
    };
  }, [projectId, setProjectName]);

  // SSE: Subscribe to real-time issue updates
  useEffect(() => {
    const token = getAuthToken();
    if (!token || !projectId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const eventSource = new EventSource(
      `${apiUrl}/api/projects/${projectId}/events?token=${encodeURIComponent(token)}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'issue:created') {
          setIssues((prev) => [data.data, ...prev]);
        } else if (data.type === 'issue:updated') {
          setIssues((prev) => prev.map((i) => (i.id === data.data.id ? { ...i, ...data.data } : i)));
        } else if (data.type === 'issue:deleted') {
          setIssues((prev) => prev.filter((i) => i.id !== data.data.id));
        }
      } catch {
        // Ignore parse errors (keepalive, connected events)
      }
    };

    return () => {
      eventSource.close();
    };
  }, [projectId]);

  // Fetch issues for the project
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}/issues`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIssues(data);
        }
      } catch (error) {
        // Silently fail on error
      } finally {
        setIsIssuesLoading(false);
      }
    };

    fetchIssues();
  }, [projectId]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Save project name
  const saveProjectName = async () => {
    if (!editedName.trim() || editedName === project?.name) {
      setIsEditingName(false);
      setEditedName(project?.name || '');
      return;
    }

    setIsSavingName(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: editedName.trim() }),
        }
      );

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        setEditedName(updatedProject.name);
        setProjectName(updatedProject.name);
      }
    } catch (error) {
      setEditedName(project?.name || '');
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveProjectName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditedName(project?.name || '');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <PageHeader
          icon={
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <BadgeAlert className="w-5 h-5 text-red-600" />
            </div>
          }
          title={
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={saveProjectName}
                  onKeyDown={handleNameKeyDown}
                  className="text-2xl font-bold text-gray-900 border-2 border-indigo-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={isSavingName}
                />
              ) : (
                <h1
                  className="text-2xl font-bold text-gray-900 cursor-text hover:text-indigo-600 transition-colors group flex items-center gap-2"
                  onClick={() => setIsEditingName(true)}
                >
                  {project?.name || 'Loading...'}
                  <Pencil className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}
              {isSavingName && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              )}
            </div>
          }
          description={`Project ID: ${projectId}`}
          primaryAction={
            <a
              href={project?.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open website
            </a>
          }
        />
      </div>

      {/* Issues Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Issues</h2>
        </div>

        {/* Loading State */}
        {isIssuesLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <RefreshCw className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No issues yet</h3>
            <p className="text-gray-600">
              Issues created for this project will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search issues..."
              slots={[
                {
                  kind: 'select',
                  key: 'type',
                  placeholder: 'All Types',
                  value: typeFilter,
                  options: [
                    { label: 'Bug', value: 'BUG' },
                    { label: 'Feature', value: 'FEATURE' },
                    { label: 'Task', value: 'TASK' },
                  ],
                  onChange: setTypeFilter,
                },
                {
                  kind: 'select',
                  key: 'priority',
                  placeholder: 'All Priorities',
                  value: priorityFilter,
                  options: [
                    { label: 'Critical', value: 'critical' },
                    { label: 'High', value: 'high' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'Low', value: 'low' },
                  ],
                  onChange: setPriorityFilter,
                },
                ...(assigneeOptions.length > 0
                  ? [
                      {
                        kind: 'select' as const,
                        key: 'assignee',
                        placeholder: 'All Assignees',
                        value: assigneeFilter,
                        options: assigneeOptions,
                        onChange: setAssigneeFilter,
                      },
                    ]
                  : []),
              ]}
              showClear={hasActiveFilters}
              onClear={clearFilters}
            />
            <KanbanBoard
              issues={filteredIssues}
              columns={PROJECT_COLUMNS}
              onIssueClick={openIssueDrawer}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </div>

      {/* Issue Drawer */}
      <IssueDrawer
        issueId={selectedIssueId}
        isOpen={isDrawerOpen}
        onClose={closeIssueDrawer}
        onCommentCountChange={(issueId, count) => {
          setIssues((prev) =>
            prev.map((i) =>
              i.id === issueId ? { ...i, _count: { ...i._count, comments: count } } : i
            )
          );
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Issue</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this issue? All associated data will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, issueId: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirm.issueId && handleDeleteIssue(deleteConfirm.issueId)}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
