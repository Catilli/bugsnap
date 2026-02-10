'use client';

import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';

interface ActivityEntry {
  id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityTimelineProps {
  issueId?: string | null;
  feedbackId?: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  created: 'created this',
  status_changed: 'changed status',
  assigned: 'changed assignee',
  commented: 'added a comment',
  updated: 'updated',
  deleted: 'deleted this',
};

function formatFieldChange(field: string, oldValue: string, newValue: string): string {
  const fieldLabels: Record<string, string> = {
    status: 'status',
    priority: 'priority',
    severity: 'severity',
    title: 'title',
    assignedToId: 'assignee',
    type: 'type',
    visibility: 'visibility',
    description: 'description',
  };
  const label = fieldLabels[field] || field;
  if (oldValue && newValue) {
    return `${label} from "${oldValue}" to "${newValue}"`;
  }
  if (newValue) {
    return `${label} to "${newValue}"`;
  }
  return label;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityTimeline({ issueId, feedbackId }: ActivityTimelineProps) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const entityId = issueId || feedbackId;
  const entityType = issueId ? 'issues' : 'feedback';

  useEffect(() => {
    if (!entityId) return;
    fetchActivity();
  }, [entityId]);

  const fetchActivity = async () => {
    if (!entityId) return;
    setIsLoading(true);
    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${entityType}/${entityId}/activity`,
      );
      if (response.ok) {
        setActivity(await response.json());
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (activity.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
      <div className="space-y-3">
        {activity.map((entry) => (
          <div key={entry.id} className="flex gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs flex-shrink-0 mt-0.5">
              {entry.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700">
                <span className="font-medium text-gray-900">{entry.user.name}</span>{' '}
                {ACTION_LABELS[entry.action] || entry.action}
                {entry.field && entry.action !== 'commented' && (
                  <span className="text-gray-500">
                    {' '}{formatFieldChange(entry.field, entry.oldValue || '', entry.newValue || '')}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(entry.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
