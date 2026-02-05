'use client';

import { useState, useEffect } from 'react';
import { X, Bug, Lightbulb } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import ButtonDropdown from './ButtonDropdown';
import CommentSection from './CommentSection';
import { getClerkToken } from '../lib/clerkTokenBridge';

interface FeedbackDrawerProps {
  feedbackId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface Feedback {
  id: string;
  type: 'BUG' | 'FEATURE';
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    comments: number;
  };
}

export default function FeedbackDrawer({ feedbackId, isOpen, onClose, onUpdate }: FeedbackDrawerProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extract feedback number from title
  const getFeedbackNumber = (title: string) => {
    const match = title.match(/^(Bug|Feature) #(\d+)/);
    return match ? match[2] : null;
  };

  // Get type prefix from title
  const getTypePrefix = (title: string) => {
    const match = title.match(/^(Bug|Feature) #/);
    return match ? match[1] : 'Feedback';
  };

  // Remove feedback number prefix from title
  const getCleanTitle = (title: string) => {
    return title.replace(/^(Bug|Feature) #\d+\s*-\s*/, '');
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  // Format date as "Jan 30, 2026 at 3:27am"
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${month} ${day}, ${year} at ${hours}:${minutes}${ampm}`;
  };

  const statusOptions = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || styles.OPEN;
  };

  const getTypeIcon = (type: 'BUG' | 'FEATURE') => {
    if (type === 'BUG') {
      return <Bug className="w-4 h-4" />;
    }
    return <Lightbulb className="w-4 h-4" />;
  };

  const getTypeStyles = (type: 'BUG' | 'FEATURE') => {
    if (type === 'BUG') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-purple-100 text-purple-800';
  };

  // Fetch feedback details when drawer opens
  useEffect(() => {
    if (isOpen && feedbackId) {
      fetchFeedbackDetails();
    }
  }, [isOpen, feedbackId]);

  const fetchFeedbackDetails = async () => {
    if (!feedbackId) return;

    setIsLoading(true);
    try {
      const token = getClerkToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/feedback/${feedbackId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedback = async (field: string, value: any) => {
    if (!feedbackId || !feedback) return;

    setIsSaving(true);
    try {
      const token = getClerkToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/feedback/${feedbackId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [field]: value }),
        }
      );

      if (response.ok) {
        const updatedFeedback = await response.json();
        setFeedback(updatedFeedback);
        onUpdate?.();
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {feedback?.title ? `${getTypePrefix(feedback.title)} #${getFeedbackNumber(feedback.title) || '1'}` : '...'}
            </span>
            {feedback?.type && (
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeStyles(feedback.type)}`}>
                {getTypeIcon(feedback.type)}
                {feedback.type === 'BUG' ? 'Bug' : 'Feature'}
              </span>
            )}
            {feedback?.status && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(feedback.status)}`}>
                {formatStatus(feedback.status)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : feedback ? (
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={getCleanTitle(feedback.title)}
                onChange={(e) => {
                  const feedbackNumber = getFeedbackNumber(feedback.title);
                  const typePrefix = feedback.type === 'BUG' ? 'Bug' : 'Feature';
                  const newTitle = feedbackNumber ? `${typePrefix} #${feedbackNumber} - ${e.target.value}` : e.target.value;
                  setFeedback({ ...feedback, title: newTitle });
                }}
                onBlur={(e) => {
                  const feedbackNumber = getFeedbackNumber(feedback.title);
                  const typePrefix = feedback.type === 'BUG' ? 'Bug' : 'Feature';
                  const newTitle = feedbackNumber ? `${typePrefix} #${feedbackNumber} - ${e.target.value}` : e.target.value;
                  updateFeedback('title', newTitle);
                }}
                className="text-2xl font-semibold text-gray-900 w-full border-none focus:outline-none focus:ring-0 px-0"
                placeholder="Feedback title"
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                value={feedback.description || ''}
                onChange={(e) => {
                  setFeedback({ ...feedback, description: e.target.value });
                }}
                onBlur={(e) => updateFeedback('description', e.target.value)}
                className="text-gray-600 w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Add description..."
                rows={3}
              />
            </div>

            {/* Status */}
            <div>
              <ButtonDropdown
                label={`Mark as ${formatStatus(feedback.status)}`}
                options={statusOptions}
                selectedValue={feedback.status}
                onChange={(value) => updateFeedback('status', value)}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateFeedback('type', 'BUG')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    feedback.type === 'BUG'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Bug className="w-4 h-4" />
                  Bug
                </button>
                <button
                  onClick={() => updateFeedback('type', 'FEATURE')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    feedback.type === 'FEATURE'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  Feature
                </button>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority (Optional)</label>
              <select
                value={feedback.priority || ''}
                onChange={(e) => updateFeedback('priority', e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="">Not Set</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500">
                Submitted {formatDateTime(feedback.createdAt)}, by {feedback.createdBy.name}
              </p>
            </div>

            {/* Comments */}
            <CommentSection feedbackId={feedbackId} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Feedback not found</p>
          </div>
        )}
      </div>
    </>
  );
}
