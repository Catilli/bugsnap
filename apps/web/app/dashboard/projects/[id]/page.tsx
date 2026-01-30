'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProject } from '../../ProjectContext';
import FilterControls from '@/components/FilterControls';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import TaskDrawer from '@/components/TaskDrawer';
import { Pencil, ExternalLink, FileText, Search, RefreshCw, MessageSquare } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  createdAt: string;
  updatedAt: string;
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
  _count: {
    comments: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const { setProjectName } = useProject();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  
  // Task filter and view state
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskSortBy, setTaskSortBy] = useState('date');
  const [taskOrderBy, setTaskOrderBy] = useState('desc');
  const [taskViewMode, setTaskViewMode] = useState<'grid' | 'list'>('grid');
  
  // Task drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const openTaskDrawer = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDrawerOpen(true);
  };
  
  const closeTaskDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTaskId(null);
  };

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProject(data);
          setEditedName(data.name);
          setProjectName(data.name);
        }
      } catch (error) {
        // Silently fail on error
      }
    };

    fetchProject();

    // Cleanup: Clear project name when leaving the page
    return () => {
      setProjectName(null);
    };
  }, [projectId, setProjectName]);

  // Fetch tasks for the project
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}/tasks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        // Silently fail on error
      } finally {
        setIsTasksLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Save project name
  const saveProjectName = async () => {
    if (!editedName.trim() || editedName === project?.name) {
      setIsEditingName(false);
      setEditedName(project?.name || '');
      return;
    }

    setIsSavingName(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: editedName.trim() }),
        }
      );

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        setEditedName(updatedProject.name);
        setProjectName(updatedProject.name);
      }
    } catch (error) {
      setEditedName(project?.name || '');
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveProjectName();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditedName(project?.name || '');
    }
  };

  // Helper function to format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 60) return `${diffInMins} minute${diffInMins !== 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Priority order for sorting
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  
  // Status order for sorting
  const statusOrder = { open: 0, in_progress: 1, resolved: 2, closed: 3 };

  // Get priority-based background color for task card
  const getPriorityCardColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-50 border-gray-200',
      medium: 'bg-blue-50 border-blue-200',
      high: 'bg-orange-50 border-orange-200',
      critical: 'bg-red-50 border-red-200',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter((task) =>
      task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(taskSearchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;
      if (taskSortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (taskSortBy === 'priority') {
        comparison = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      } else if (taskSortBy === 'status') {
        comparison = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      }
      return taskOrderBy === 'asc' ? comparison : -comparison;
    });

  // Sort options for tasks
  const taskSortOptions = [
    { label: 'Date created', value: 'date' },
    { label: 'Priority', value: 'priority' },
    { label: 'Status', value: 'status' },
  ];

  const taskOrderOptions = [
    { label: 'Oldest first', value: 'asc' },
    { label: 'Newest first', value: 'desc' },
  ];

  return (
    <div>
      <div className="mb-8">
        {/* Project Title and Actions */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={saveProjectName}
                onKeyDown={handleNameKeyDown}
                className="text-3xl font-bold text-gray-900 border-2 border-indigo-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                disabled={isSavingName}
              />
            ) : (
              <h1
                className="text-3xl font-bold text-gray-900 cursor-text hover:text-indigo-600 transition-colors group flex items-center gap-2"
                onClick={() => setIsEditingName(true)}
              >
                {project?.name || 'Loading...'}
                <Pencil className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            )}
            {isSavingName && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <a
              href={project?.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open website
            </a>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          Project ID: {projectId}
        </p>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
          <FilterControls
            searchPlaceholder="Search tasks..."
            searchQuery={taskSearchQuery}
            onSearchChange={setTaskSearchQuery}
            sortOptions={taskSortOptions}
            orderOptions={taskOrderOptions}
            selectedSort={taskSortBy}
            selectedOrder={taskOrderBy}
            onSortChange={setTaskSortBy}
            onOrderChange={setTaskOrderBy}
            viewMode={taskViewMode}
            onViewModeChange={setTaskViewMode}
          />
        </div>

        {/* Loading State */}
        {isTasksLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <RefreshCw className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {taskSearchQuery ? 'No tasks found' : 'No tasks yet'}
            </h3>
            <p className="text-gray-600">
              {taskSearchQuery
                ? 'Try adjusting your search query'
                : 'Tasks created for this project will appear here'}
            </p>
          </div>
        ) : taskViewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => openTaskDrawer(task.id)}
                className={`group rounded-lg border hover:border-indigo-300 hover:shadow-md transition-all overflow-hidden cursor-pointer ${getPriorityCardColor(task.priority)}`}
              >
                {/* Task Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {task.title}
                    </h3>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={task.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{getRelativeTime(task.createdAt)}</span>
                    {task._count.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {task._count.comments}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => openTaskDrawer(task.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getRelativeTime(task.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task._count.comments > 0 ? (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {task._count.comments}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Drawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={closeTaskDrawer}
      />
    </div>
  );
}
