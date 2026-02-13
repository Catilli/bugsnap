'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  FolderKanban,
  Bug,
  MessageSquare,
  Download,
  Mail,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { getAuthToken } from '@/lib/clerkTokenBridge';
import { authFetch } from '@/lib/api';
import { useRole, UserRole } from '@/lib/useRole';

interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalIssues: number;
  totalFeedback: number;
  usersByRole: Record<string, number>;
  issuesByStatus: Record<string, number>;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  oauthProvider: string | null;
  createdAt: string;
  _count: {
    ownedProjects: number;
    assignedIssues: number;
  };
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  DEVELOPER: 'Developer',
  VIEWER: 'Viewer',
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  DEVELOPER: 'bg-green-100 text-green-700',
  VIEWER: 'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-400',
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  data,
  colors,
}: {
  label: string;
  data: Record<string, number>;
  colors: Record<string, string>;
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
      <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
        {Object.entries(data).map(([key, count]) => (
          <div
            key={key}
            className={`${colors[key] || 'bg-gray-300'} transition-all`}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${key}: ${count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {Object.entries(data).map(([key, count]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={`w-2.5 h-2.5 rounded-full ${colors[key] || 'bg-gray-300'}`} />
            <span className="capitalize">{key.toLowerCase().replace('_', ' ')}</span>
            <span className="text-gray-400">({count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { isAdmin } = useRole();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchData = useCallback(async () => {
    if (!getAuthToken()) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      const [statsRes, usersRes] = await Promise.all([
        authFetch(`${apiUrl}/api/admin/stats`),
        authFetch(`${apiUrl}/api/users`),
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        setError('You need Admin access to view this page.');
        setIsLoading(false);
        return;
      }

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      if (!usersRes.ok) throw new Error('Failed to fetch users');

      const [statsData, usersData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
      ]);

      setStats(statsData);
      setMembers(usersData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!getAuthToken()) return;

    try {
      const response = await authFetch(`${apiUrl}/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, role: newRole as UserRole } : m))
        );
        // Refresh stats since role counts changed
        const statsRes = await authFetch(`${apiUrl}/api/admin/stats`);
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      }
    } catch {
      // silently fail
    } finally {
      setEditingUserId(null);
    }
  };

  const handleExportIssues = async () => {
    if (!getAuthToken()) return;

    setExporting(true);
    try {
      const response = await authFetch(`${apiUrl}/api/admin/export/issues`);

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bugsnap-issues-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-600">{error || 'Admin access required.'}</p>
        </div>
      </div>
    );
  }

  const roleBarColors: Record<string, string> = {
    ADMIN: 'bg-purple-500',
    MANAGER: 'bg-blue-500',
    DEVELOPER: 'bg-green-500',
    VIEWER: 'bg-gray-400',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
        }
        title="Admin Dashboard"
        description="System overview, user management, and data export"
      />

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-5 h-5 text-indigo-600" />}
              label="Total Users"
              value={stats.totalUsers}
              color="bg-indigo-100"
            />
            <StatCard
              icon={<FolderKanban className="w-5 h-5 text-emerald-600" />}
              label="Total Projects"
              value={stats.totalProjects}
              color="bg-emerald-100"
            />
            <StatCard
              icon={<Bug className="w-5 h-5 text-orange-600" />}
              label="Total Issues"
              value={stats.totalIssues}
              color="bg-orange-100"
            />
            <StatCard
              icon={<MessageSquare className="w-5 h-5 text-pink-600" />}
              label="Total Feedback"
              value={stats.totalFeedback}
              color="bg-pink-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BreakdownBar
              label="Users by Role"
              data={stats.usersByRole}
              colors={roleBarColors}
            />
            <BreakdownBar
              label="Issues by Status"
              data={stats.issuesByStatus}
              colors={STATUS_COLORS}
            />
          </div>
        </>
      )}

      {/* User Management */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">Member</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Projects</div>
            <div className="col-span-2">Issues</div>
            <div className="col-span-2">Joined</div>
          </div>

          {members.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors items-center"
            >
              {/* Member info */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {member.email}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="col-span-2 flex items-center">
                {editingUserId === member.id ? (
                  <select
                    defaultValue={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    onBlur={() => setEditingUserId(null)}
                    autoFocus
                    className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="DEVELOPER">Developer</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                ) : (
                  <button
                    onClick={() => setEditingUserId(member.id)}
                    className="group flex items-center gap-1 cursor-pointer"
                  >
                    <RoleBadge role={member.role} />
                    <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>

              {/* Projects count */}
              <div className="col-span-2">
                <span className="text-sm text-gray-600">{member._count.ownedProjects}</span>
                <span className="text-xs text-gray-400 ml-1 md:hidden">projects</span>
              </div>

              {/* Issues count */}
              <div className="col-span-2">
                <span className="text-sm text-gray-600">{member._count.assignedIssues}</span>
                <span className="text-xs text-gray-400 ml-1 md:hidden">issues</span>
              </div>

              {/* Joined date */}
              <div className="col-span-2 flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0 hidden md:block" />
                {formatDate(member.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Export */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Data Export</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Export Issues</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Download all issues as a CSV file with project, assignee, and status information.
              </p>
            </div>
            <button
              onClick={handleExportIssues}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
