'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, ExternalLink } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { TypeBadge } from './TypeBadge';
import ButtonDropdown from './ButtonDropdown';
import CommentSection from './CommentSection';
import { getAuthToken } from '../lib/clerkTokenBridge';

interface IssueDrawerProps {
  issueId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (issueId: string, count: number) => void;
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  screenshotUrl: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical' | null;
  type?: 'BUG' | 'FEATURE' | 'TASK';
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
  environmentData?: {
    browser?: string;
    os?: string;
    timestamp?: string;
    selectedElement?: any;
  };
  annotations?: any[];
  _count: {
    comments: number;
  };
}

export default function IssueDrawer({ issueId, isOpen, onClose, onCommentCountChange }: IssueDrawerProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScreenshotEnlarged, setIsScreenshotEnlarged] = useState(false);

  // Extract issue/bug/feature number from title
  const getIssueNumber = (title: string) => {
    const match = title.match(/^(Bug|Feature|Task) #(\d+)/);
    return match ? match[2] : null;
  };

  // Get type prefix from title
  const getTypePrefix = (title: string) => {
    const match = title.match(/^(Bug|Feature|Task) #/);
    return match ? match[1] : 'Task';
  };

  // Remove issue number prefix from title
  const getCleanTitle = (title: string) => {
    return title.replace(/^(Bug|Feature|Task) #\d+\s*-\s*/, '');
  };

  // Format status for display (capitalize and replace underscores)
  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
    hours = hours ? hours : 12; // 0 should be 12

    return `${month} ${day}, ${year} at ${hours}:${minutes}${ampm}`;
  };

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  // Fetch issue details when drawer opens
  useEffect(() => {
    if (isOpen && issueId) {
      fetchIssueDetails();
    }
  }, [isOpen, issueId]);

  const fetchIssueDetails = async () => {
    if (!issueId) return;

    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIssue(data);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const updateIssue = async (field: string, value: any) => {
    if (!issueId || !issue) return;

    setIsSaving(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/issues/${issueId}`,
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
        const updatedIssue = await response.json();
        setIssue(updatedIssue);
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
              {issue?.title ? `${getTypePrefix(issue.title)} #${getIssueNumber(issue.title) || '1'}` : '...'}
            </span>
            {issue?.type && issue.type !== 'TASK' && <TypeBadge type={issue.type} size="sm" />}
            {issue?.status && <StatusBadge status={issue.status} size="sm" />}
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
        ) : issue ? (
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={getCleanTitle(issue.title)}
                onChange={(e) => {
                  const issueNumber = getIssueNumber(issue.title);
                  const typePrefix = getTypePrefix(issue.title);
                  const newTitle = issueNumber ? `${typePrefix} #${issueNumber} - ${e.target.value}` : e.target.value;
                  setIssue({ ...issue, title: newTitle });
                }}
                onBlur={(e) => {
                  const issueNumber = getIssueNumber(issue.title);
                  const typePrefix = getTypePrefix(issue.title);
                  const newTitle = issueNumber ? `${typePrefix} #${issueNumber} - ${e.target.value}` : e.target.value;
                  updateIssue('title', newTitle);
                }}
                className="text-2xl font-semibold text-gray-900 w-full border-none focus:outline-none focus:ring-0 px-0"
                placeholder="Issue title"
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                value={issue.description || ''}
                onChange={(e) => {
                  setIssue({ ...issue, description: e.target.value });
                }}
                onBlur={(e) => updateIssue('description', e.target.value)}
                className="text-gray-600 w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Add description..."
                rows={3}
              />
            </div>

            {/* Status */}
            <div>
              <ButtonDropdown
                label={`Mark as ${formatStatus(issue.status)}`}
                options={statusOptions}
                selectedValue={issue.status}
                onChange={(value) => updateIssue('status', value)}
              />
            </div>

            {/* Screenshot */}
            {issue.screenshotUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Screenshot</label>
                </div>
                <div
                  className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer group h-96"
                  onClick={() => setIsScreenshotEnlarged(true)}
                >
                  <img
                    src={issue.screenshotUrl}
                    alt="Screenshot"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to enlarge
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {issue.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm break-all"
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{issue.url}</span>
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority (Optional)</label>
              <select
                value={issue.priority || ''}
                onChange={(e) => updateIssue('priority', e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="">Not Set</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              {issue.assignedTo ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                    {issue.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{issue.assignedTo.name}</div>
                    <div className="text-xs text-gray-500">{issue.assignedTo.email}</div>
                  </div>
                </div>
              ) : (
                <button className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors text-left">
                  + Assign user
                </button>
              )}
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500">
                Reported {formatDateTime(issue.createdAt)}, by {issue.createdBy.name}
              </p>
            </div>

            {/* Comments */}
            <CommentSection
              issueId={issueId}
              onCommentCountChange={(count) => onCommentCountChange?.(issueId!, count)}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Issue not found</p>
          </div>
        )}
      </div>

      {/* Screenshot Enlarged Modal */}
      {isScreenshotEnlarged && issue?.screenshotUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
          onClick={() => setIsScreenshotEnlarged(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setIsScreenshotEnlarged(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={issue.screenshotUrl}
              alt="Screenshot (enlarged)"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
