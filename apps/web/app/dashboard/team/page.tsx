'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Mail, Shield, Calendar, ChevronDown } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { getAuthToken } from '@/lib/clerkTokenBridge';
import { useRole, UserRole } from '@/lib/useRole';

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

export default function TeamPage() {
  const { isAdmin, hasRole } = useRole();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  // Role editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const hasActiveFilters = roleFilter !== null || searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter(null);
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (roleFilter && member.role !== roleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!member.name.toLowerCase().includes(q) && !member.email.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [members, roleFilter, searchQuery]);

  const fetchMembers = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 403) {
        setError('You need Manager or Admin access to view team members.');
        setIsLoading(false);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setMembers(data);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${userId}/role`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === userId ? { ...m, role: newRole as UserRole } : m))
        );
      }
    } catch {
      // silently fail
    } finally {
      setEditingUserId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
        }
        title="Team"
        description={`${members.length} member${members.length !== 1 ? 's' : ''} in your workspace`}
      />

      {/* Filters */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or email..."
        slots={[
          {
            kind: 'select',
            key: 'role',
            placeholder: 'All Roles',
            value: roleFilter,
            options: [
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Manager', value: 'MANAGER' },
              { label: 'Developer', value: 'DEVELOPER' },
              { label: 'Viewer', value: 'VIEWER' },
            ],
            onChange: setRoleFilter,
          },
        ]}
        showClear={hasActiveFilters}
        onClear={clearFilters}
      />

      {/* Member List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {hasActiveFilters ? 'No members match your filters.' : 'No team members found.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">Member</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Projects</div>
            <div className="col-span-2">Assigned Issues</div>
            <div className="col-span-2">Joined</div>
          </div>

          {/* Member Rows */}
          {filteredMembers.map((member) => (
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
                {isAdmin && editingUserId === member.id ? (
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
                    onClick={() => isAdmin && setEditingUserId(member.id)}
                    className={`group flex items-center gap-1 ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                    disabled={!isAdmin}
                  >
                    <RoleBadge role={member.role} />
                    {isAdmin && (
                      <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )}
              </div>

              {/* Projects count */}
              <div className="col-span-2">
                <span className="text-sm text-gray-600">{member._count.ownedProjects}</span>
                <span className="text-xs text-gray-400 ml-1 md:hidden">projects</span>
              </div>

              {/* Assigned issues count */}
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
      )}
    </div>
  );
}
