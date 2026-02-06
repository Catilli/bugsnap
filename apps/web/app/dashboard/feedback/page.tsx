'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Bug, Plus, Lightbulb } from 'lucide-react';
import { KanbanBoard } from '../../../components/kanban/KanbanBoard';
import { FeedbackForm } from '../../../components/FeedbackForm';
import FeedbackDrawer from '../../../components/FeedbackDrawer';
import { PageHeader } from '../../../components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { getAuthToken } from '@/lib/clerkTokenBridge';

interface Feedback {
  id: string;
  title: string;
  description: string | null;
  type: 'BUG' | 'FEATURE';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  createdBy: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
  };
}

// Map Feedback status (uppercase) to KanbanBoard status (lowercase)
const statusToLowercase = (status: Feedback['status']): 'open' | 'in_progress' | 'resolved' | 'closed' => {
  const map: Record<Feedback['status'], 'open' | 'in_progress' | 'resolved' | 'closed'> = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
  };
  return map[status];
};

// Map KanbanBoard status (lowercase) to Feedback status (uppercase)
const statusToUppercase = (status: string): Feedback['status'] => {
  const map: Record<string, Feedback['status']> = {
    open: 'OPEN',
    in_progress: 'IN_PROGRESS',
    resolved: 'RESOLVED',
    closed: 'CLOSED',
  };
  return map[status] || 'OPEN';
};

// Transform Feedback to KanbanBoard Issue format
interface KanbanIssue {
  id: string;
  title: string;
  description: string | null;
  type: 'BUG' | 'FEATURE' | 'TASK';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  createdBy: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
  };
}

const feedbackToKanbanIssue = (feedback: Feedback): KanbanIssue => ({
  ...feedback,
  status: statusToLowercase(feedback.status),
});

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<('BUG' | 'FEATURE')[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const toggleType = (type: 'BUG' | 'FEATURE') => {
    setTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const hasActiveFilters = typeFilter.length > 0 || priorityFilter !== null || searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter([]);
    setPriorityFilter(null);
  };

  // Filter feedback then convert to kanban format
  const filteredKanbanIssues = useMemo(() => {
    return feedbackList
      .filter((item) => {
        if (typeFilter.length > 0 && !typeFilter.includes(item.type)) return false;
        if (priorityFilter && item.priority !== priorityFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!item.title.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) {
            return false;
          }
        }
        return true;
      })
      .map(feedbackToKanbanIssue);
  }, [feedbackList, typeFilter, priorityFilter, searchQuery]);

  // Fetch all feedback
  const fetchFeedback = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/feedback`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch feedback');

      const data = await response.json();
      setFeedbackList(data);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize: fetch feedback
  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  // Handle feedback submission
  const handleSubmitFeedback = async (data: {
    type: 'BUG' | 'FEATURE';
    title: string;
    description: string;
    priority: string | null;
  }) => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: data.type,
          title: data.title,
          description: data.description,
          priority: data.priority,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit feedback');
    }

    // Refresh feedback after submission
    await fetchFeedback();
  };

  // Handle status change (drag and drop)
  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    const token = getAuthToken();
    if (!token) return;

    const uppercaseStatus = statusToUppercase(newStatus);

    // Optimistic update
    setFeedbackList((prevList) =>
      prevList.map((item) =>
        item.id === feedbackId
          ? { ...item, status: uppercaseStatus }
          : item
      )
    );

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/feedback/${feedbackId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: uppercaseStatus }),
        }
      );

      if (!response.ok) {
        // Revert on error
        await fetchFeedback();
      }
    } catch (err) {
      // Revert on error
      await fetchFeedback();
    }
  };

  // Handle feedback click - open drawer
  const handleFeedbackClick = (feedbackId: string) => {
    setSelectedFeedbackId(feedbackId);
    setIsDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedFeedbackId(null);
  };

  // Handle drawer update - refresh list
  const handleDrawerUpdate = () => {
    fetchFeedback();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Bug className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Bug className="w-5 h-5 text-red-600" />
          </div>
        }
        title="Bug Reports & Feature Requests"
        description="Track and manage feedback for BugSnap"
        primaryAction={
          <button
            onClick={() => setShowFeedbackForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Submit Feedback
          </button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search feedback..."
        slots={[
          {
            kind: 'toggle',
            key: 'bug',
            label: 'Bug',
            icon: <Bug className="w-4 h-4" />,
            active: typeFilter.includes('BUG'),
            activeClassName: 'bg-red-100 text-red-700 border border-red-300',
            onClick: () => toggleType('BUG'),
          },
          {
            kind: 'toggle',
            key: 'feature',
            label: 'Feature',
            icon: <Lightbulb className="w-4 h-4" />,
            active: typeFilter.includes('FEATURE'),
            activeClassName: 'bg-purple-100 text-purple-700 border border-purple-300',
            onClick: () => toggleType('FEATURE'),
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
        ]}
        showClear={hasActiveFilters}
        onClear={clearFilters}
      />

      {/* Kanban Board */}
      <KanbanBoard
        issues={filteredKanbanIssues}
        onIssueClick={handleFeedbackClick}
        onStatusChange={handleStatusChange}
      />

      {/* Feedback Form Modal */}
      <FeedbackForm
        isOpen={showFeedbackForm}
        onClose={() => setShowFeedbackForm(false)}
        onSubmit={handleSubmitFeedback}
      />

      {/* Feedback Drawer */}
      <FeedbackDrawer
        feedbackId={selectedFeedbackId}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onUpdate={handleDrawerUpdate}
      />
    </div>
  );
}
