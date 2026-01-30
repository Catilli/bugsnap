'use client';

import { useState, useEffect } from 'react';
import { X, Maximize2, MapPin, ExternalLink } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';

interface TaskDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  screenshotUrl: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TaskDrawer({ taskId, isOpen, onClose }: TaskDrawerProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch task details when drawer opens
  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
      fetchComments();
    }
  }, [isOpen, taskId]);

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTask(data);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!taskId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${taskId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const updateTask = async (field: string, value: any) => {
    if (!taskId || !task) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${taskId}`,
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
        const updatedTask = await response.json();
        setTask(updatedTask);
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Task #{taskId?.substring(0, 8)}</span>
            {task?.status && <StatusBadge status={task.status} />}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
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
        ) : task ? (
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={task.title}
                onChange={(e) => {
                  setTask({ ...task, title: e.target.value });
                }}
                onBlur={(e) => updateTask('title', e.target.value)}
                className="text-2xl font-semibold text-gray-900 w-full border-none focus:outline-none focus:ring-0 px-0"
                placeholder="Task title"
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                value={task.description || ''}
                onChange={(e) => {
                  setTask({ ...task, description: e.target.value });
                }}
                onBlur={(e) => updateTask('description', e.target.value)}
                className="text-gray-600 w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Add description..."
                rows={3}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={task.status}
                onChange={(e) => updateTask('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Screenshot */}
            {task.screenshotUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Screenshot</label>
                  <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors">
                    FOCUS
                  </button>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={task.screenshotUrl}
                    alt="Screenshot"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            {/* Location */}
            {task.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm break-all"
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{task.url}</span>
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => updateTask('priority', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              {task.assignedTo ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                    {task.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{task.assignedTo.name}</div>
                    <div className="text-xs text-gray-500">{task.assignedTo.email}</div>
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
                Reported {new Date(task.createdAt).toLocaleString()}, by {task.createdBy.name}
              </p>
            </div>

            {/* Comments */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Comments ({comments.length})
              </h3>
              
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{comment.user.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No comments yet</p>
              )}

              {/* Add comment form */}
              <div className="mt-4">
                <textarea
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
                <button className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Task not found</p>
          </div>
        )}
      </div>
    </>
  );
}