'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useProject } from '../../ProjectContext';
import { KanbanBoard, ColumnConfig } from '@/components/kanban/KanbanBoard';
import { FilterBar } from '@/components/FilterBar';
import IssueDrawer from '@/components/IssueDrawer';
import { StatusBadge } from '@/components/StatusBadge';
import { Pencil, ExternalLink, RefreshCw, BadgeAlert, Globe, Trash2, FlaskConical, Share2, Link2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { getAuthToken } from '@/lib/clerkTokenBridge';
import { authFetch } from '@/lib/api';
import { useRole } from '@/lib/useRole';
import { RoleGate } from '@/components/RoleGate';
import { safeHref } from '@/lib/safeUrl';
import { useDialog } from '@/providers/DialogProvider';
import { useRouter } from 'next/navigation';
import { notifySuccess, notifyError } from '@/lib/toast';

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
  const router = useRouter();
  const { isViewer, hasRole } = useRole();
  const { openConfirm } = useDialog();
  const [project, setProject] = useState<Project | null>(null);
  const { setProjectName } = useProject();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Issue state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isIssuesLoading, setIsIssuesLoading] = useState(true);

  // Members state
  const [projectMembers, setProjectMembers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);

  // Issue drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // URL-persisted filter state
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState<string | null>(searchParams.get('type') || null);
  const [statusFilter, setStatusFilter] = useState<string | null>(searchParams.get('status') || null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(searchParams.get('assignee') || null);
  const [groupByUrl, setGroupByUrl] = useState(searchParams.get('groupByUrl') === 'true');

  // Sync filter changes to URL
  const updateUrlFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Wrapped setters that also update URL
  const setSearchQueryWithUrl = useCallback((value: string) => {
    setSearchQuery(value);
    updateUrlFilters({ search: value || null });
  }, [updateUrlFilters]);

  const setTypeFilterWithUrl = useCallback((value: string | null) => {
    setTypeFilter(value);
    updateUrlFilters({ type: value });
  }, [updateUrlFilters]);

  const setStatusFilterWithUrl = useCallback((value: string | null) => {
    setStatusFilter(value);
    updateUrlFilters({ status: value });
  }, [updateUrlFilters]);

  const setAssigneeFilterWithUrl = useCallback((value: string | null) => {
    setAssigneeFilter(value);
    updateUrlFilters({ assignee: value });
  }, [updateUrlFilters]);

  const toggleGroupByUrl = useCallback(() => {
    const newValue = !groupByUrl;
    setGroupByUrl(newValue);
    updateUrlFilters({ groupByUrl: newValue ? 'true' : null });
  }, [groupByUrl, updateUrlFilters]);

  // QA Cycle filter
  const [cycleFilter, setCycleFilter] = useState<string | null>(searchParams.get('cycle') || null);
  const [qaCycles, setQaCycles] = useState<{ id: string; title: string }[]>([]);

  const setCycleFilterWithUrl = useCallback((value: string | null) => {
    setCycleFilter(value);
    updateUrlFilters({ cycle: value });
  }, [updateUrlFilters]);

  // Fetch QA cycles for filter dropdown
  useEffect(() => {
    const fetchCycles = async () => {
      if (!getAuthToken()) return;
      try {
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}/qa-cycles`,
        );
        if (res.ok) {
          const data = await res.json();
          setQaCycles(data.map((c: any) => ({ id: c.id, title: c.title })));
        }
      } catch { /* ignore */ }
    };
    fetchCycles();
  }, [projectId]);

  // When cycle filter is active, fetch cycle issues
  const [cycleIssueIds, setCycleIssueIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    if (!cycleFilter) {
      setCycleIssueIds(null);
      return;
    }
    const fetchCycleIssues = async () => {
      try {
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/qa-cycles/${cycleFilter}`,
        );
        if (res.ok) {
          const data = await res.json();
          setCycleIssueIds(new Set(data.issues.map((ci: any) => ci.issue.id)));
        }
      } catch { /* ignore */ }
    };
    fetchCycleIssues();
  }, [cycleFilter]);

  // Settings dropdown & invite modal
  const [shareOpen, setShareOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'DEVELOPER' | 'VIEWER' | 'MANAGER'>('DEVELOPER');
  const [isInviting, setIsInviting] = useState(false);
  const [generalAccess, setGeneralAccess] = useState<'invited' | 'anyone'>('invited');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isTogglingAccess, setIsTogglingAccess] = useState(false);
  const [accessDropdownOpen, setAccessDropdownOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Email autocomplete state
  const [emailSuggestions, setEmailSuggestions] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setEmailSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users?search=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const users: { id: string; name: string; email: string }[] = await res.json();
          const memberIds = new Set(projectMembers.map(m => m.id));
          const filtered = users.filter(u => !memberIds.has(u.id)).slice(0, 5);
          setEmailSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        }
      } catch { /* ignore */ }
    }, 300);
  }, [projectMembers]);

  // Close share dropdown on outside click or Escape
  useEffect(() => {
    if (!shareOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      // Skip if the target was removed from the DOM (e.g. suggestion re-rendered away)
      if (!target.isConnected) return;
      if (shareRef.current && !shareRef.current.contains(target)) {
        setShareOpen(false);
        setAccessDropdownOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShareOpen(false); setAccessDropdownOpen(false); }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [shareOpen]);

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;
    const emails = inviteEmail.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) return;
    setIsInviting(true);
    try {
      if (!getAuthToken()) return;
      let successCount = 0;
      for (const email of emails) {
        const response = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}/members`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role: inviteRole }),
          }
        );
        if (response.ok) {
          const member = await response.json();
          if (member.user && !projectMembers.some(m => m.id === member.user.id)) {
            setProjectMembers(prev => [...prev, { ...member.user, role: member.role || inviteRole }]);
          }
          successCount++;
        } else {
          const err = await response.json().catch(() => null);
          notifyError(err?.error || `Failed to invite ${email}`);
        }
      }
      if (successCount > 0) {
        notifySuccess(`${successCount} user${successCount > 1 ? 's' : ''} invited`);
        setInviteEmail('');
        setEmailSuggestions([]);
      }
    } catch {
      notifyError('Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const confirmDeleteProject = async () => {
    const confirmed = await openConfirm({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${project?.name}"? This will permanently delete all associated issues, comments, attachments, and feedback. This action cannot be undone.`,
      icon: <Trash2 className="w-6 h-6 text-red-600" />,
      variant: 'danger',
      confirmLabel: 'Delete Project',
    });
    if (!confirmed) return;

    try {
      if (!getAuthToken()) return;
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
        {
          method: 'DELETE',
        }
      );
      if (response.ok) {
        notifySuccess('Project and all its data have been deleted');
        router.push('/dashboard');
      } else {
        notifyError('Failed to delete project');
      }
    } catch {
      notifyError('Failed to delete project');
    }
  };

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
      if (cycleIssueIds && !cycleIssueIds.has(issue.id)) return false;
      if (typeFilter && issue.type !== typeFilter) return false;
      if (statusFilter && issue.status !== statusFilter) return false;
      if (assigneeFilter && issue.assignedTo?.id !== assigneeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!issue.title.toLowerCase().includes(q) && !issue.description?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [issues, cycleIssueIds, typeFilter, statusFilter, assigneeFilter, searchQuery]);

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

  const hasActiveFilters = typeFilter !== null || statusFilter !== null || assigneeFilter !== null || cycleFilter !== null || searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter(null);
    setStatusFilter(null);
    setAssigneeFilter(null);
    setCycleFilter(null);
    setGroupByUrl(false);
    router.replace('?', { scroll: false });
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
      if (!getAuthToken()) return;

      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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
      notifyError('Failed to update issue status');
    }
  };

  // Handle issue deletion
  const handleDeleteIssue = async (issueId: string) => {
    try {
      if (!getAuthToken()) return;

      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setIssues(issues.filter(i => i.id !== issueId));
      }
    } catch {
      notifyError('Failed to delete issue');
    }
  };

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!getAuthToken()) return;

        const response = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
        );

        if (response.ok) {
          const data = await response.json();
          setProject(data);
          setEditedName(data.name);
          setProjectName(data.name);

          // Initialize general access state from server
          setGeneralAccess(data.generalAccess === 'ANYONE' ? 'anyone' : 'invited');
          if (data.shareTokens?.[0]?.token) {
            setShareToken(data.shareTokens[0].token);
          }

          // Populate members from project data (includes createdBy + members)
          const members: { id: string; name: string; email: string; role: string }[] = [];
          if (data.createdBy) members.push({ ...data.createdBy, role: 'OWNER' });
          if (data.members) {
            for (const m of data.members) {
              if (m.user && !members.some((existing) => existing.id === m.user.id)) {
                members.push({ ...m.user, role: m.role || 'MEMBER' });
              }
            }
          }
          setProjectMembers(members);
        }
      } catch {
        notifyError('Failed to load project');
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
        if (!getAuthToken()) return;

        const response = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}/issues`,
        );

        if (response.ok) {
          const data = await response.json();
          setIssues(data);
        }
      } catch {
        notifyError('Failed to load issues');
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
      if (!getAuthToken()) return;

      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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
            <div className="flex items-center gap-2">
              <a
                href={safeHref(project?.websiteUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open website
              </a>
              {hasRole('MANAGER') && (
                <>
                  <div className="relative" ref={shareRef}>
                    <button
                      onClick={() => setShareOpen(!shareOpen)}
                      aria-label="Share project"
                      className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    {shareOpen && (
                      <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
                        {/* Row 1: Email invite */}
                        <div className="p-3 border-b border-gray-100">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={inviteEmail}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setInviteEmail(value);
                                  const currentQuery = value.split(',').pop()?.trim() || '';
                                  searchUsers(currentQuery);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleInviteUser()}
                                onFocus={() => {
                                  if (blurTimeoutRef.current) { clearTimeout(blurTimeoutRef.current); blurTimeoutRef.current = null; }
                                  if (emailSuggestions.length > 0) setShowSuggestions(true);
                                }}
                                onBlur={() => { blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 150); }}
                                placeholder="Email, separated by commas"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                autoFocus
                              />
                              {showSuggestions && emailSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 max-h-48 overflow-y-auto">
                                  {emailSuggestions.map(user => (
                                    <button
                                      key={user.id}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        const parts = inviteEmail.split(',');
                                        parts[parts.length - 1] = user.email;
                                        setInviteEmail(parts.join(', ') + ', ');
                                        setEmailSuggestions([]);
                                        setShowSuggestions(false);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                                    >
                                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={handleInviteUser}
                              disabled={isInviting || !inviteEmail.trim()}
                              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {isInviting ? 'Inviting...' : 'Invite'}
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Member list */}
                        <div className="py-1 border-b border-gray-100 max-h-48 overflow-y-auto">
                          {projectMembers.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 px-3 py-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                              </div>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {member.role === 'OWNER' ? 'Owner' : member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                              </span>
                            </div>
                          ))}
                          {projectMembers.length === 0 && (
                            <p className="px-3 py-2 text-sm text-gray-400">No members yet</p>
                          )}
                        </div>

                        {/* Row 3: General access */}
                        <div className="px-3 py-3 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <Globe className="w-4 h-4 text-gray-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">General access</span>
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => setAccessDropdownOpen(!accessDropdownOpen)}
                                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                {generalAccess === 'invited' ? 'Only people invited' : 'Anyone with link'}
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              {accessDropdownOpen && (
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
                                  <button
                                    onClick={async () => {
                                      setAccessDropdownOpen(false);
                                      if (generalAccess === 'invited') return;
                                      setIsTogglingAccess(true);
                                      try {
                                        const res = await authFetch(
                                          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
                                          { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generalAccess: 'INVITED' }) }
                                        );
                                        if (res.ok) {
                                          setGeneralAccess('invited');
                                          setShareToken(null);
                                        } else { notifyError('Failed to update access'); }
                                      } catch { notifyError('Failed to update access'); }
                                      finally { setIsTogglingAccess(false); }
                                    }}
                                    disabled={isTogglingAccess}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${generalAccess === 'invited' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
                                  >
                                    Only people invited
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setAccessDropdownOpen(false);
                                      if (generalAccess === 'anyone') return;
                                      setIsTogglingAccess(true);
                                      try {
                                        const res = await authFetch(
                                          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
                                          { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generalAccess: 'ANYONE' }) }
                                        );
                                        if (res.ok) {
                                          const data = await res.json();
                                          setGeneralAccess('anyone');
                                          if (data.shareToken) setShareToken(data.shareToken);
                                        } else { notifyError('Failed to update access'); }
                                      } catch { notifyError('Failed to update access'); }
                                      finally { setIsTogglingAccess(false); }
                                    }}
                                    disabled={isTogglingAccess}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${generalAccess === 'anyone' ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
                                  >
                                    Anyone with link
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {generalAccess === 'anyone' && (
                            <p className="mt-1.5 text-xs text-gray-500 pl-10">Anyone on the internet with the link can view</p>
                          )}
                        </div>

                        {/* Footer: Copy link */}
                        <div className="p-3">
                          <button
                            onClick={() => {
                              const url = generalAccess === 'anyone' && shareToken
                                ? `${window.location.origin}/shared/${shareToken}`
                                : `${window.location.origin}/dashboard/projects/${projectId}`;
                              navigator.clipboard.writeText(url);
                              notifySuccess('Link copied to clipboard');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <Link2 className="w-4 h-4" />
                            Copy link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={confirmDeleteProject}
                    aria-label="Delete project"
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          }
        />

      {/* Project Members */}
      {projectMembers.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {projectMembers.map((member, index) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-xs border-2 border-white"
                title={`${member.name}${index === 0 ? ' (Owner)' : ''}`}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {projectMembers.length} member{projectMembers.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <span className="px-4 py-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">
          Issues
        </span>
        <Link
          href={`/dashboard/projects/${projectId}/cycles`}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1.5"
        >
          <FlaskConical className="w-4 h-4" />
          QA Cycles
        </Link>
      </div>

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
              onSearchChange={setSearchQueryWithUrl}
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
                  onChange: setTypeFilterWithUrl,
                },
                {
                  kind: 'select',
                  key: 'status',
                  placeholder: 'All Statuses',
                  value: statusFilter,
                  options: [
                    { label: 'New', value: 'open' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Ready for QA', value: 'qa' },
                    { label: 'Completed', value: 'closed' },
                  ],
                  onChange: setStatusFilterWithUrl,
                },
                ...(assigneeOptions.length > 0
                  ? [
                      {
                        kind: 'select' as const,
                        key: 'assignee',
                        placeholder: 'All Assignees',
                        value: assigneeFilter,
                        options: assigneeOptions,
                        onChange: setAssigneeFilterWithUrl,
                      },
                    ]
                  : []),
                ...(qaCycles.length > 0
                  ? [
                      {
                        kind: 'select' as const,
                        key: 'cycle',
                        placeholder: 'All Cycles',
                        value: cycleFilter,
                        options: qaCycles.map((c) => ({ label: c.title, value: c.id })),
                        onChange: setCycleFilterWithUrl,
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
                  onClick: toggleGroupByUrl,
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