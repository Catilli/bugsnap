'use client';

import { MessageSquare } from 'lucide-react';
import { TypeBadge } from '../TypeBadge';

interface KanbanCardProps {
  issue: {
    id: string;
    title: string;
    description: string | null;
    type?: 'BUG' | 'FEATURE' | 'TASK';
    status: string;
    createdBy: {
      id: string;
      name: string;
    };
    _count?: {
      comments: number;
    };
  };
  onClick: () => void;
  onDragStart?: (e: React.DragEvent, issueId: string) => void;
}

export function KanbanCard({ issue, onClick, onDragStart }: KanbanCardProps) {
  // Extract issue/bug/feature number from title
  const getNumber = (title: string) => {
    const match = title.match(/(Bug|Feature|Task) #(\d+)/);
    return match ? `#${match[2]}` : '';
  };

  // Get clean title without prefix
  const getCleanTitle = (title: string) => {
    return title.replace(/^(Bug|Feature|Task) #\d+\s*-\s*/, '');
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, issue.id) : undefined}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Header with number and type */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">{getNumber(issue.title)}</span>
        {issue.type && <TypeBadge type={issue.type} size="sm" />}
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
        {getCleanTitle(issue.title)}
      </h4>

      {/* Description preview */}
      {issue.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {issue.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div />
        <div className="flex items-center gap-2">
          {/* Creator avatar */}
          <div
            className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium"
            title={issue.createdBy.name}
          >
            {issue.createdBy.name.charAt(0).toUpperCase()}
          </div>
          {/* Comment count */}
          {(issue._count?.comments ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-gray-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-xs">{issue._count!.comments}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
