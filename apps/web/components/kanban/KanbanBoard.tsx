'use client';

import { useState, useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { KanbanFilters } from './KanbanFilters';

interface Issue {
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
  issues: Issue[];
  onIssueClick: (issueId: string) => void;
  onStatusChange: (issueId: string, newStatus: string) => Promise<void>;
  columns?: ColumnConfig[];
  showFilters?: boolean;
}

export function KanbanBoard({ issues, onIssueClick, onStatusChange, columns, showFilters }: KanbanBoardProps) {
  const activeColumns = columns ?? DEFAULT_COLUMNS;
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<('BUG' | 'FEATURE')[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // Filter issues based on search and filters
  const filteredIssues = useMemo(() => {
    if (showFilters === false) {
      return issues;
    }

    return issues.filter((issue) => {
      // Only show BUG and FEATURE types (not TASK)
      if (issue.type !== 'BUG' && issue.type !== 'FEATURE') {
        return false;
      }

      // Type filter
      if (typeFilter.length > 0 && !typeFilter.includes(issue.type)) {
        return false;
      }

      // Priority filter
      if (priorityFilter && issue.priority !== priorityFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = issue.title.toLowerCase().includes(searchLower);
        const descMatch = issue.description?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  }, [issues, typeFilter, priorityFilter, searchQuery, showFilters]);

  // Group issues by status (dynamically from active columns)
  const issuesByStatus = useMemo(() => {
    const grouped: Record<string, Issue[]> = {};
    activeColumns.forEach((col) => {
      grouped[col.status] = [];
    });

    filteredIssues.forEach((issue) => {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      }
    });

    return grouped;
  }, [filteredIssues, activeColumns]);

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    e.dataTransfer.setData('issueId', issueId);
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

    const issueId = e.dataTransfer.getData('issueId');
    if (!issueId) return;

    const issue = issues.find((i) => i.id === issueId);
    if (!issue || issue.status === newStatus) return;

    await onStatusChange(issueId, newStatus);
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
            count={issuesByStatus[column.status].length}
            color={column.color}
            status={column.status}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDrop={handleDrop}
            isDragOver={dragOverColumn === column.status}
          >
            {issuesByStatus[column.status].length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No items
              </div>
            ) : (
              issuesByStatus[column.status].map((issue) => (
                <KanbanCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => onIssueClick(issue.id)}
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
