'use client';

import { useState, useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { KanbanFilters } from './KanbanFilters';

interface Task {
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
}

export interface ColumnConfig {
  status: string;
  title: string;
  color: 'yellow' | 'blue' | 'gray' | 'green' | 'purple';
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { status: 'open', title: 'New', color: 'yellow' },
  { status: 'in_progress', title: 'In Progress', color: 'blue' },
  { status: 'closed', title: 'Rejected', color: 'gray' },
  { status: 'resolved', title: 'Completed', color: 'green' },
];

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  columns?: ColumnConfig[];
  showFilters?: boolean;
}

export function KanbanBoard({ tasks, onTaskClick, onStatusChange, columns, showFilters }: KanbanBoardProps) {
  const activeColumns = columns ?? DEFAULT_COLUMNS;
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<('BUG' | 'FEATURE')[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    if (showFilters === false) {
      return tasks;
    }

    return tasks.filter((task) => {
      // Only show BUG and FEATURE types (not TASK)
      if (task.type !== 'BUG' && task.type !== 'FEATURE') {
        return false;
      }

      // Type filter
      if (typeFilter.length > 0 && !typeFilter.includes(task.type)) {
        return false;
      }

      // Priority filter
      if (priorityFilter && task.priority !== priorityFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, typeFilter, priorityFilter, searchQuery, showFilters]);

  // Group tasks by status (dynamically from active columns)
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    activeColumns.forEach((col) => {
      grouped[col.status] = [];
    });

    filteredTasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [filteredTasks, activeColumns]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    await onStatusChange(taskId, newStatus);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters !== false && (
        <KanbanFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
        />
      )}

      {/* Board */}
      <div
        className="grid grid-cols-4 gap-4 pb-4"
        onDragLeave={handleDragLeave}
      >
        {activeColumns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            count={tasksByStatus[column.status].length}
            color={column.color}
            status={column.status}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDrop={handleDrop}
            isDragOver={dragOverColumn === column.status}
          >
            {tasksByStatus[column.status].length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No items
              </div>
            ) : (
              tasksByStatus[column.status].map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                  onDragStart={handleDragStart}
                />
              ))
            )}
          </KanbanColumn>
        ))}
      </div>
    </div>
  );
}
