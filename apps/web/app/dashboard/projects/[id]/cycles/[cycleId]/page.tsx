'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, Search, X } from 'lucide-react';
import Link from 'next/link';
import { KanbanBoard, ColumnConfig } from '@/components/kanban/KanbanBoard';
import IssueDrawer from '@/components/IssueDrawer';
import { PageHeader } from '@/components/PageHeader';
import { getAuthToken } from '@/lib/clerkTokenBridge';
import { authFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';
import { useRole } from '@/lib/useRole';
import { useProject } from '../../../../ProjectContext';
import { notifySuccess, notifyError } from '@/lib/toast';

interface Issue {
  id: string;
  title: string;
  description: string | null;
  type?: 'BUG' | 'FEATURE' | 'TASK';
  status: 'open' | 'in_progress' | 'qa' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  createdBy: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string; email: string } | null;
  _count: { comments: number };
}

interface QACycleDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  projectId: string;
  createdBy: { id: string; name: string; email: string };
  issues: { id: string; issueId: string; issue: Issue }[];
}

const CYCLE_COLUMNS: ColumnConfig[] = [
  { status: 'open', title: 'New', color: 'yellow' },
  { status: 'in_progress', title: 'In Progress', color: 'blue' },
  { status: 'qa', title: 'Ready for QA', color: 'purple' },
  { status: 'closed', title: 'Completed', color: 'green' },
];

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function CycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const cycleId = params.cycleId as string;
  const { isViewer, hasRole } = useRole();
  const { setProjectName } = useProject();

  const [cycle, setCycle] = useState<QACycleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Issue drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Add issues modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [allProjectIssues, setAllProjectIssues] = useState<Issue[]>([]);
  const [addSearch, setAddSearch] = useState('');
  const [selectedAddIds, setSelectedAddIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  // Fetch project name for breadcrumb
  useEffect(() => {
    const fetchProject = async () => {
      if (!getAuthToken()) return;
      try {
        const res = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setProjectName(data.name);
        }
      } catch { /* ignore */ }
    };
    fetchProject();
    return () => setProjectName(null);
  }, [projectId, setProjectName]);

  const fetchCycle = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/qa-cycles/${cycleId}`,
      );
      if (res.ok) {
        setCycle(await res.json());
      } else {
        notifyError('Failed to load QA cycle');
      }
    } catch {
      notifyError('Failed to load QA cycle');
    } finally {
      setIsLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchCycle();
  }, [fetchCycle]);

  // SSE for real-time updates
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
        // Refresh cycle data on any relevant event
        if (
          data.type === 'issue:updated' ||
          data.type === 'qacycle:updated' ||
          data.type === 'qacycle:issue_added' ||
          data.type === 'qacycle:issue_removed'
        ) {
          fetchCycle();
        }
      } catch { /* ignore */ }
    };

    return () => eventSource.close();
  }, [projectId, fetchCycle]);

  // Extract issues from cycle data
  const cycleIssues = useMemo(() => {
    if (!cycle) return [];
    return cycle.issues.map((ci) => ci.issue);
  }, [cycle]);

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    // Optimistic update
    setCycle((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        issues: prev.issues.map((ci) =>
          ci.issue.id === issueId
            ? { ...ci, issue: { ...ci.issue, status: newStatus as Issue['status'] } }
            : ci,
        ),
      };
    });

    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (!res.ok) fetchCycle();
    } catch {
      fetchCycle();
      notifyError('Failed to update issue status');
    }
  };

  const handleRemoveIssue = async (issueId: string) => {
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/qa-cycles/${cycleId}/issues/${issueId}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        notifySuccess('Issue removed from cycle');
        fetchCycle();
      } else {
        notifyError('Failed to remove issue');
      }
    } catch {
      notifyError('Failed to remove issue');
    }
  };

  // Fetch all project issues for the add modal
  const openAddModal = async () => {
    setShowAddModal(true);
    setAddSearch('');
    setSelectedAddIds(new Set());
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}/issues`,
      );
      if (res.ok) {
        setAllProjectIssues(await res.json());
      }
    } catch { /* ignore */ }
  };

  // Issues available to add (not already in cycle)
  const availableIssues = useMemo(() => {
    const cycleIssueIds = new Set(cycle?.issues.map((ci) => ci.issue.id) || []);
    return allProjectIssues
      .filter((i) => !cycleIssueIds.has(i.id))
      .filter((i) => {
        if (!addSearch) return true;
        const q = addSearch.toLowerCase();
        return i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
      });
  }, [allProjectIssues, cycle, addSearch]);

  const handleAddIssues = async () => {
    if (selectedAddIds.size === 0) return;
    setIsAdding(true);
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/qa-cycles/${cycleId}/issues`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueIds: Array.from(selectedAddIds) }),
        },
      );
      if (res.ok) {
        notifySuccess(`${selectedAddIds.size} issue(s) added`);
        setShowAddModal(false);
        fetchCycle();
      } else {
        const err = await res.json().catch(() => null);
        notifyError(err?.error || 'Failed to add issues');
      }
    } catch {
      notifyError('Failed to add issues');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCycleStatusChange = async (newStatus: string) => {
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/qa-cycles/${cycleId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        notifySuccess(`Cycle status updated to ${STATUS_LABELS[newStatus] || newStatus}`);
        fetchCycle();
      } else {
        notifyError('Failed to update cycle status');
      }
    } catch {
      notifyError('Failed to update cycle status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cycle...</p>
        </div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">QA cycle not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-bold text-sm">QA</span>
          </div>
        }
        title={
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{cycle.title}</h1>
            <RoleGate minRole="MANAGER">
              <select
                value={cycle.status}
                onChange={(e) => handleCycleStatusChange(e.target.value)}
                className="text-xs px-2 py-1 rounded-full border border-gray-200 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </RoleGate>
          </div>
        }
        description={cycle.description || `${cycleIssues.length} issues in this cycle`}
        primaryAction={
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/projects/${projectId}/cycles`}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              All Cycles
            </Link>
            <RoleGate minRole="MANAGER">
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Issues
              </button>
            </RoleGate>
          </div>
        }
      />

      {cycleIssues.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No issues in this cycle</h3>
          <p className="text-gray-600">Add issues to start tracking this QA cycle</p>
        </div>
      ) : (
        <KanbanBoard
          issues={cycleIssues}
          columns={CYCLE_COLUMNS}
          onIssueClick={(issueId) => {
            setSelectedIssueId(issueId);
            setIsDrawerOpen(true);
          }}
          onStatusChange={isViewer ? undefined : handleStatusChange}
        />
      )}

      {/* Remove issue button overlay — shown in issue drawer */}
      <IssueDrawer
        issueId={selectedIssueId}
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedIssueId(null); }}
        onCommentCountChange={() => {}}
        extraActions={
          hasRole('MANAGER') && selectedIssueId ? (
            <button
              onClick={() => {
                handleRemoveIssue(selectedIssueId);
                setIsDrawerOpen(false);
                setSelectedIssueId(null);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Remove from Cycle
            </button>
          ) : undefined
        }
      />

      {/* Add Issues Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6 z-10 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Issues to Cycle</h3>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="Search issues..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 min-h-0">
              {availableIssues.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {addSearch ? 'No matching issues' : 'All issues are already in this cycle'}
                </div>
              ) : (
                availableIssues.map((issue) => (
                  <label
                    key={issue.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAddIds.has(issue.id)}
                      onChange={() => {
                        setSelectedAddIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(issue.id)) next.delete(issue.id);
                          else next.add(issue.id);
                          return next;
                        });
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                      <p className="text-xs text-gray-500">{issue.status} {issue.priority ? `/ ${issue.priority}` : ''}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                {selectedAddIds.size} selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIssues}
                  disabled={isAdding || selectedAddIds.size === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? 'Adding...' : `Add ${selectedAddIds.size} Issue${selectedAddIds.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
