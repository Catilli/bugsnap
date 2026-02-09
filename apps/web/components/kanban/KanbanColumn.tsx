'use client';

import { ReactNode } from 'react';

interface KanbanColumnProps {
  title: string;
  count: number;
  color: 'yellow' | 'blue' | 'gray' | 'green' | 'purple' | 'teal';
  status: string;
  children: ReactNode;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  isDragOver: boolean;
}

export function KanbanColumn({
  title,
  count,
  color,
  status,
  children,
  onDragOver,
  onDrop,
  isDragOver,
}: KanbanColumnProps) {
  const colorStyles = {
    yellow: {
      header: 'bg-yellow-100',
      dot: 'bg-yellow-500',
      border: 'border-yellow-300',
    },
    blue: {
      header: 'bg-blue-100',
      dot: 'bg-blue-500',
      border: 'border-blue-300',
    },
    gray: {
      header: 'bg-gray-100',
      dot: 'bg-gray-500',
      border: 'border-gray-300',
    },
    green: {
      header: 'bg-green-100',
      dot: 'bg-green-500',
      border: 'border-green-300',
    },
    purple: {
      header: 'bg-purple-100',
      dot: 'bg-purple-500',
      border: 'border-purple-300',
    },
    teal: {
      header: 'bg-teal-100',
      dot: 'bg-teal-500',
      border: 'border-teal-300',
    },
  };

  const styles = colorStyles[color];

  return (
    <div
      className={`flex flex-col bg-gray-50 rounded-lg flex-shrink-0 ${
        isDragOver ? `ring-2 ring-indigo-400 ${styles.border}` : ''
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      {/* Column Header */}
      <div className={`px-3 py-2 rounded-t-lg ${styles.header}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`}></span>
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      {/* Column Body */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {children}
      </div>
    </div>
  );
}
