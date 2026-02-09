'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useProject } from '../../ProjectContext';
import { KanbanBoard, ColumnConfig } from '@/components/kanban/KanbanBoard';
import { FilterBar } from '@/components/FilterBar';
import IssueDrawer from '@/components/IssueDrawer';
import { StatusBadge } from '@/components/StatusBadge';
import { Pencil, ExternalLink, RefreshCw, BadgeAlert, Globe } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { getAuthToken } from '@/lib/clerkTokenBridge';
import { useRole } from '@/lib/useRole';
import { RoleGate } from '@/components/RoleGate';

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
  status: 'open' | 'in_progress' | 'qa' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  severity?: 'low' | 'medium' | 'high' | 'critical' | null;
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
  { status: 'qa', title: 'Ready for QA', color: 'purple' },
  { status: 'closed', title: 'Completed', color: 'green' },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { isViewer, hasRole } = useRole();
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
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [groupByUrl, setGroupByUrl] = useState(false);

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

  const groupedByUrl = useMemo(() => {
    if (!groupByUrl) return null;
    const groups: Record<string, Issue[]> = {};
    filteredIssues.forEach((issue) => {
      const key = issue.url || '(no URL)';
      if (!groups[key]) groups[key] = [];
      groups[key].push(issue);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredIssues, groupByUrl]);

  const hasActiveFilters = typeFilter !== null || priorityFilter !== null || assigneeFilter !== null || searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter(null);
    setPriorityFilter(null);
    setAssigneeFilter(null);
    setGroupByUrl(false);
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
    <div className="space-y-6">
      <PageHeader
          icon={
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <BadgeAlert className="w-5 h-5 text-red-600" />
            </div>
          }
          title={
            <div className="flex items-center gap-3">
              {isEditingName && hasRole('MANAGER') ? (
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
                  className={`text-2xl font-bold text-gray-900 flex items-center gap-2 ${hasRole('MANAGER') ? 'cursor-text hover:text-indigo-600 transition-colors group' : ''}`}
                  onClick={hasRole('MANAGER') ? () => setIsEditingName(true) : undefined}
                >
                  {project?.name || 'Loading...'}
                  {hasRole('MANAGER') && (
                    <Pencil className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
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

      {/* Issues Section */}
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
                {
                  kind: 'toggle' as const,
                  key: 'groupByUrl',
                  label: 'Group by URL',
                  icon: <Globe className="w-4 h-4" />,
                  active: groupByUrl,
                  activeClassName: 'bg-indigo-600 text-white',
                  onClick: () => setGroupByUrl(!groupByUrl),
                },
              ]}
              showClear={hasActiveFilters}
              onClear={clearFilters}
            />
            {groupedByUrl && groupedByUrl.length > 0 ? (
              <div className="space-y-4">
                {groupedByUrl.map(([url, urlIssues]) => (
                  <div key={url} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 truncate flex-1">{url}</span>
                      <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                        {urlIssues.length}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {urlIssues.map((issue) => (
                        <button
                          key={issue.id}
                          onClick={() => openIssueDrawer(issue.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <StatusBadge status={issue.status} size="sm" />
                          <span className="text-sm text-gray-900 flex-1 truncate">{issue.title}</span>
                          {issue.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              issue.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              issue.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {issue.priority}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <KanbanBoard
                issues={filteredIssues}
                columns={PROJECT_COLUMNS}
                onIssueClick={openIssueDrawer}
                onStatusChange={isViewer ? undefined : handleStatusChange}
              />
            )}
          </div>
        )}

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

    </div>
  );
}
