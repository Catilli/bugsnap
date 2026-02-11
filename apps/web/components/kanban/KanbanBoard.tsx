'use client';

import { useState, useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface Issue {
  id: string;
  title: string;
  description: string | null;
  type?: 'BUG' | 'FEATURE' | 'TASK';
  status: string;
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
  color: 'yellow' | 'blue' | 'gray' | 'green' | 'purple' | 'teal';
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
  onStatusChange?: (issueId: string, newStatus: string) => Promise<void>;
  columns?: ColumnConfig[];
}

export function KanbanBoard({ issues, onIssueClick, onStatusChange, columns }: KanbanBoardProps) {
  const activeColumns = columns ?? DEFAULT_COLUMNS;
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Group issues by status (dynamically from active columns)
  const issuesByStatus = useMemo(() => {
    const grouped: Record<string, Issue[]> = {};
    activeColumns.forEach((col) => {
      grouped[col.status] = [];
    });

    issues.forEach((issue) => {
      if (grouped[issue.status]) {
        grouped[issue.status].push(issue);
      }
    });

    return grouped;
  }, [issues, activeColumns]);

  const isDragEnabled = !!onStatusChange;

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    if (!isDragEnabled) return;
    e.dataTransfer.setData('issueId', issueId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    if (!isDragEnabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    if (!onStatusChange) return;
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
    <div
      className={`grid gap-4 pb-4 ${activeColumns.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}
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
                onDragStart={isDragEnabled ? handleDragStart : undefined}
              />
            ))
          )}
        </KanbanColumn>
      ))}
    </div>
  );
}
