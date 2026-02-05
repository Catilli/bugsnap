'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, ExternalLink } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { TypeBadge } from './TypeBadge';
import ButtonDropdown from './ButtonDropdown';

interface TaskDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (taskId: string, count: number) => void;
}

interface Task {
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

export default function TaskDrawer({ taskId, isOpen, onClose, onCommentCountChange }: TaskDrawerProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScreenshotEnlarged, setIsScreenshotEnlarged] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Extract task/bug/feature number from title
  const getTaskNumber = (title: string) => {
    const match = title.match(/^(Bug|Feature|Task) #(\d+)/);
    return match ? match[2] : null;
  };

  // Get type prefix from title
  const getTypePrefix = (title: string) => {
    const match = title.match(/^(Bug|Feature|Task) #/);
    return match ? match[1] : 'Task';
  };

  // Remove task number prefix from title
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

  const submitComment = async () => {
    if (!taskId || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${taskId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newComment.trim() }),
        }
      );

      if (response.ok) {
        const comment = await response.json();
        const updatedComments = [...comments, comment];
        setComments(updatedComments);
        setNewComment('');
        onCommentCountChange?.(taskId, updatedComments.length);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsSubmittingComment(false);
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {task?.title ? `${getTypePrefix(task.title)} #${getTaskNumber(task.title) || '1'}` : '...'}
            </span>
            {task?.type && task.type !== 'TASK' && <TypeBadge type={task.type} size="sm" />}
            {task?.status && <StatusBadge status={task.status} />}
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
        ) : task ? (
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={getCleanTitle(task.title)}
                onChange={(e) => {
                  const taskNumber = getTaskNumber(task.title);
                  const newTitle = taskNumber ? `Task #${taskNumber} - ${e.target.value}` : e.target.value;
                  setTask({ ...task, title: newTitle });
                }}
                onBlur={(e) => {
                  const taskNumber = getTaskNumber(task.title);
                  const newTitle = taskNumber ? `Task #${taskNumber} - ${e.target.value}` : e.target.value;
                  updateTask('title', newTitle);
                }}
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
              <ButtonDropdown
                label={`Mark as ${formatStatus(task.status)}`}
                options={statusOptions}
                selectedValue={task.status}
                onChange={(value) => updateTask('status', value)}
              />
            </div>

            {/* Screenshot */}
            {task.screenshotUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Screenshot</label>
                </div>
                <div
                  className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer group h-96"
                  onClick={() => setIsScreenshotEnlarged(true)}
                >
                  <img
                    src={task.screenshotUrl}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority (Optional)</label>
              <select
                value={task.priority || ''}
                onChange={(e) => updateTask('priority', e.target.value || null)}
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
                Reported {formatDateTime(task.createdAt)}, by {task.createdBy.name}
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
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={submitComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? 'Posting...' : 'Add Comment'}
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

      {/* Screenshot Enlarged Modal */}
      {isScreenshotEnlarged && task?.screenshotUrl && (
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
              src={task.screenshotUrl}
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