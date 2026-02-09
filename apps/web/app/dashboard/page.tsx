'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FilterBar } from '@/components/FilterBar';
import { PageHeader } from '@/components/PageHeader';
import { Plus, RefreshCw, FileText, Search, Trash2, FolderRoot, Grid2x2, List } from 'lucide-react';
import { getAuthToken } from '@/lib/clerkTokenBridge';
import { RoleGate } from '@/components/RoleGate';
import { useDialog } from '@/providers/DialogProvider';

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'status' | 'lastViewed';
type OrderBy = 'asc' | 'desc';

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  updatedAt: string;
  createdAt: string;
  _count?: {
    tasks: number; // kept as "tasks" for API compatibility
    open?: number;
    in_progress?: number;
    resolved?: number;
    closed?: number;
  };
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('lastViewed');
  const [orderBy, setOrderBy] = useState<OrderBy>('desc');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { openConfirm } = useDialog();

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        // Silently fail on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Handle project deletion with confirmation dialog
  const confirmDeleteProject = async (projectId: string) => {
    const confirmed = await openConfirm({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? All associated issues and data will be permanently removed.',
      icon: <Trash2 className="w-6 h-6 text-red-600" />,
      variant: 'danger',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
      }
    } catch (error) {
      // Silently fail on error
    }
  };

  // Sort options for dropdown
  const sortOptions = [
    { label: 'Alphabetical', value: 'name' },
    { label: 'Date created', value: 'date' },
    { label: 'Last viewed', value: 'lastViewed' },
  ];

  const orderOptions = [
    { label: 'Oldest first', value: 'asc' },
    { label: 'Newest first', value: 'desc' },
  ];

  // Derive dropdown label from current sort selection
  const selectedSortLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Sort';

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

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'lastViewed') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return orderBy === 'asc' ? comparison : -comparison;
    });

  return (
    <div>
      {/* Header with search and controls */}
      <div className="mb-8">
        <div className="mb-6">
          <PageHeader
            icon={
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FolderRoot className="w-5 h-5 text-blue-600" />
              </div>
            }
            title="Projects"
            description="Manage your bug tracking projects"
            primaryAction={
              <RoleGate minRole="DEVELOPER">
                <Link
                  href="/dashboard/projects/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  New Project
                </Link>
              </RoleGate>
            }
          />
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
          <span className="font-medium">Issue Status:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Resolved</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-500"></span>
            <span>Closed</span>
          </div>
        </div>

        {/* Search and View Controls */}
        <FilterBar
          searchPlaceholder="Search projects..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          slots={[
            {
              kind: 'dropdown',
              key: 'sort',
              label: selectedSortLabel,
              sections: [
                {
                  title: 'Sort by',
                  options: sortOptions,
                  selected: sortBy,
                  onChange: (value) => setSortBy(value as SortBy),
                },
                {
                  title: 'Order',
                  options: orderOptions,
                  selected: orderBy,
                  onChange: (value) => setOrderBy(value as OrderBy),
                },
              ],
            },
            {
              kind: 'view-toggle',
              key: 'view',
              options: [
                { icon: <Grid2x2 className="w-5 h-5" />, value: 'grid', title: 'Grid View' },
                { icon: <List className="w-5 h-5" />, value: 'list', title: 'List View' },
              ],
              selected: viewMode,
              onChange: (value) => setViewMode(value as ViewMode),
            },
          ]}
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <RefreshCw className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by creating your first project'}
          </p>
          {!searchQuery && (
            <RoleGate minRole="DEVELOPER">
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Project
              </Link>
            </RoleGate>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden relative"
            >
              {/* Delete Button */}
              <RoleGate minRole="MANAGER">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmDeleteProject(project.id);
                  }}
                  className="absolute top-2 right-2 z-10 p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:text-red-600"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </RoleGate>

              {/* Project Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center relative overflow-hidden">
                {project.websiteUrl ? (
                  <>
                    <img
                      src={`https://api.screenshotone.com/take?access_key=xeAugLteYfiDnA&url=${encodeURIComponent(project.websiteUrl)}&full_page=false&viewport_width=1280&viewport_height=720&device_scale_factor=1&format=jpg&image_quality=80&cache=true`}
                      alt={`${project.name} screenshot`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to default icon on error
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <FileText className="w-12 h-12 text-indigo-300 hidden" />
                  </>
                ) : (
                  <FileText className="w-12 h-12 text-indigo-300" />
                )}
              </div>

              {/* Project Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1 truncate">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3 truncate">{project.websiteUrl}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Updated {getRelativeTime(project.updatedAt)}</span>
                  <div className="flex gap-1">
                    {project._count?.open && project._count.open > 0 && (
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {project._count.open}
                      </span>
                    )}
                    {project._count?.in_progress && project._count.in_progress > 0 && (
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                        {project._count.in_progress}
                      </span>
                    )}
                    {project._count?.resolved && project._count.resolved > 0 && (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        {project._count.resolved}
                      </span>
                    )}
                    {project._count?.closed && project._count.closed > 0 && (
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {project._count.closed}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Link wrapper for the card content */}
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="absolute inset-0 z-0"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Website URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 truncate max-w-md">{project.websiteUrl}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {project._count?.open && project._count.open > 0 && (
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">
                          {project._count.open}
                        </span>
                      )}
                      {project._count?.in_progress && project._count.in_progress > 0 && (
                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium text-xs">
                          {project._count.in_progress}
                        </span>
                      )}
                      {project._count?.resolved && project._count.resolved > 0 && (
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium text-xs">
                          {project._count.resolved}
                        </span>
                      )}
                      {project._count?.closed && project._count.closed > 0 && (
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-xs">
                          {project._count.closed}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getRelativeTime(project.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <RoleGate minRole="MANAGER">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteProject(project.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </RoleGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
