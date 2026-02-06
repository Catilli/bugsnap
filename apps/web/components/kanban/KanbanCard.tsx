'use client';

import { MessageSquare } from 'lucide-react';
import { TypeBadge } from '../TypeBadge';
import { PriorityBadge } from '../PriorityBadge';

interface KanbanCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    type?: 'BUG' | 'FEATURE' | 'TASK';
    status: string;
    priority: 'low' | 'medium' | 'high' | 'critical' | null;
    createdBy: {
      id: string;
      name: string;
    };
    _count: {
      comments: number;
    };
  };
  onClick: () => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export function KanbanCard({ task, onClick, onDragStart }: KanbanCardProps) {
  // Extract task/bug/feature number from title
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
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Header with number and type */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">{getNumber(task.title)}</span>
        {task.type && <TypeBadge type={task.type} size="sm" />}
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
        {getCleanTitle(task.title)}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {task.priority && <PriorityBadge priority={task.priority} size="sm" />}
        </div>
        <div className="flex items-center gap-2">
          {/* Creator avatar */}
          <div
            className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium"
            title={task.createdBy.name}
          >
            {task.createdBy.name.charAt(0).toUpperCase()}
          </div>
          {/* Comment count */}
          {task._count.comments > 0 && (
            <div className="flex items-center gap-1 text-gray-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-xs">{task._count.comments}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
