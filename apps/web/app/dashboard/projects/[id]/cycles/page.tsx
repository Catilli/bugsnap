'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, RefreshCw, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { getAuthToken } from '@/lib/clerkTokenBridge';
import { authFetch } from '@/lib/api';
import { RoleGate } from '@/components/RoleGate';
import { useProject } from '../../../ProjectContext';
import { notifySuccess, notifyError } from '@/lib/toast';

interface QACycle {
  id: string;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
  _count: { issues: number };
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
};

export default function QACyclesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { setProjectName } = useProject();
  const [cycles, setCycles] = useState<QACycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  const fetchCycles = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}/qa-cycles?${params.toString()}`,
      );
      if (res.ok) {
        setCycles(await res.json());
      }
    } catch {
      notifyError('Failed to load QA cycles');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, statusFilter]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}/qa-cycles`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle.trim(),
            description: newDescription.trim() || undefined,
          }),
        },
      );
      if (res.ok) {
        notifySuccess('QA Cycle created');
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        fetchCycles();
      } else {
        const err = await res.json().catch(() => null);
        notifyError(err?.error || 'Failed to create cycle');
      }
    } catch {
      notifyError('Failed to create cycle');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-purple-600" />
          </div>
        }
        title="QA Cycles"
        description="Manage testing iterations for this project"
        primaryAction={
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Board
            </Link>
            <RoleGate minRole="MANAGER">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                New Cycle
              </button>
            </RoleGate>
          </div>
        }
      />

      <FilterBar
        searchQuery=""
        onSearchChange={() => {}}
        searchPlaceholder=""
        slots={[
          {
            kind: 'select',
            key: 'status',
            placeholder: 'All Statuses',
            value: statusFilter,
            options: [
              { label: 'Open', value: 'open' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Completed', value: 'completed' },
            ],
            onChange: setStatusFilter,
          },
        ]}
        showClear={statusFilter !== null}
        onClear={() => setStatusFilter(null)}
      />

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cycles...</p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No QA cycles yet</h3>
          <p className="text-gray-600">Create a cycle to group issues for testing</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {cycles.map((cycle) => {
            const badge = STATUS_BADGES[cycle.status] || STATUS_BADGES.open;
            return (
              <button
                key={cycle.id}
                onClick={() => router.push(`/dashboard/projects/${projectId}/cycles/${cycle.id}`)}
                className="w-full text-left bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{cycle.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    {cycle.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{cycle.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{cycle._count.issues} issue{cycle._count.issues !== 1 ? 's' : ''}</span>
                      <span>Created by {cycle.createdBy.name}</span>
                      <span>{new Date(cycle.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create Cycle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New QA Cycle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="e.g., Sprint 12 QA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the scope of this QA cycle..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setNewTitle(''); setNewDescription(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !newTitle.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
