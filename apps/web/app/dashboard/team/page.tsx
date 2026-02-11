'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Mail, Shield, Calendar, ChevronDown, UserPlus, X, KeyRound, Copy, Check } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { FilterBar } from '@/components/FilterBar';
import { getAuthToken } from '@/lib/clerkTokenBridge';
import { authFetch } from '@/lib/api';
import { useRole, UserRole } from '@/lib/useRole';
import { notifySuccess } from '@/lib/toast';

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

  // Add member modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('DEVELOPER');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState<string | null>(null);
  const [copiedCreated, setCopiedCreated] = useState(false);

  // Reset password modal
  const [resetTempPassword, setResetTempPassword] = useState<string | null>(null);
  const [resetMemberName, setResetMemberName] = useState('');
  const [copiedReset, setCopiedReset] = useState(false);
  const [isResetting, setIsResetting] = useState<string | null>(null);

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
    if (!getAuthToken()) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users`,
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
    if (!getAuthToken()) return;

    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${userId}/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !newMemberName.trim()) {
      setAddError('Name and email are required.');
      return;
    }

    if (newMemberPassword && newMemberPassword.length < 8) {
      setAddError('Password must be at least 8 characters.');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newMemberEmail.trim(),
            name: newMemberName.trim(),
            role: newMemberRole,
            ...(newMemberPassword && { password: newMemberPassword }),
          }),
        }
      );

      if (response.status === 409) {
        setAddError('A user with this email already exists.');
        return;
      }

      if (response.status === 403) {
        setAddError('You do not have permission to add users.');
        return;
      }

      if (!response.ok) {
        setAddError('Failed to add member. Please try again.');
        return;
      }

      const created = await response.json();
      setMembers((prev) => [...prev, created]);

      if (created.tempPassword) {
        // Show the generated password so admin can share it
        setCreatedTempPassword(created.tempPassword);
        setCopiedCreated(false);
      } else {
        // Admin provided their own password — just close and toast
        setShowAddModal(false);
        notifySuccess(`${created.name} has been added to the team.`);
      }
    } catch {
      setAddError('Failed to add member. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleResetPassword = async (member: TeamMember) => {
    if (!getAuthToken()) return;
    setIsResetting(member.id);

    try {
      const response = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${member.id}/reset-password`,
        { method: 'PATCH' }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        notifySuccess(data.error || 'Failed to reset password.');
        return;
      }

      const { tempPassword } = await response.json();
      setResetTempPassword(tempPassword);
      setResetMemberName(member.name);
      setCopiedReset(false);
    } catch {
      // silently fail
    } finally {
      setIsResetting(null);
    }
  };

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        primaryAction={
          isAdmin ? (
            <button
              onClick={() => {
                setNewMemberEmail('');
                setNewMemberName('');
                setNewMemberPassword('');
                setNewMemberRole('DEVELOPER');
                setAddError(null);
                setCreatedTempPassword(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          ) : undefined
        }
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
          <div className={`hidden md:grid gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isAdmin ? 'grid-cols-[3fr_2fr_1.5fr_1.5fr_2fr_auto]' : 'grid-cols-12'}`}>
            <div className={isAdmin ? '' : 'col-span-4'}>Member</div>
            <div className={isAdmin ? '' : 'col-span-2'}>Role</div>
            <div className={isAdmin ? '' : 'col-span-2'}>Projects</div>
            <div className={isAdmin ? '' : 'col-span-2'}>Assigned Issues</div>
            <div className={isAdmin ? '' : 'col-span-2'}>Joined</div>
            {isAdmin && <div className="w-8"></div>}
          </div>

          {/* Member Rows */}
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className={`grid grid-cols-1 gap-2 md:gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors items-center ${isAdmin ? 'md:grid-cols-[3fr_2fr_1.5fr_1.5fr_2fr_auto]' : 'md:grid-cols-12'}`}
            >
              {/* Member info */}
              <div className={`${isAdmin ? '' : 'col-span-4'} flex items-center gap-3 min-w-0`}>
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
              <div className={`${isAdmin ? '' : 'col-span-2'} flex items-center`}>
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
              <div className={isAdmin ? '' : 'col-span-2'}>
                <span className="text-sm text-gray-600">{member._count.ownedProjects}</span>
                <span className="text-xs text-gray-400 ml-1 md:hidden">projects</span>
              </div>

              {/* Assigned issues count */}
              <div className={isAdmin ? '' : 'col-span-2'}>
                <span className="text-sm text-gray-600">{member._count.assignedIssues}</span>
                <span className="text-xs text-gray-400 ml-1 md:hidden">issues</span>
              </div>

              {/* Joined date */}
              <div className={`${isAdmin ? '' : 'col-span-2'} flex items-center gap-1 text-sm text-gray-500`}>
                <Calendar className="w-3.5 h-3.5 flex-shrink-0 hidden md:block" />
                {formatDate(member.createdAt)}
              </div>

              {/* Reset password */}
              {isAdmin && (
                <div className="flex items-center justify-end w-8">
                  <button
                    onClick={() => handleResetPassword(member)}
                    disabled={isResetting === member.id}
                    title="Reset password"
                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    <KeyRound className={`w-4 h-4 ${isResetting === member.id ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !createdTempPassword && setShowAddModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            {createdTempPassword ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Member Added</h2>
                  <button
                    onClick={() => { setShowAddModal(false); setCreatedTempPassword(null); }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  <strong>{newMemberName}</strong> has been added. Share this temporary password with them:
                </p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <code className="flex-1 text-sm font-mono text-gray-800 break-all select-all">{createdTempPassword}</code>
                  <button
                    onClick={() => copyToClipboard(createdTempPassword, setCopiedCreated)}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
                    title="Copy password"
                  >
                    {copiedCreated ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">This password will not be shown again.</p>
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => { setShowAddModal(false); setCreatedTempPassword(null); }}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Add Team Member</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="add-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      id="add-name"
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="add-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="add-email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="add-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="add-password"
                      type="password"
                      value={newMemberPassword}
                      onChange={(e) => setNewMemberPassword(e.target.value)}
                      placeholder="Min. 8 characters (optional)"
                      minLength={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave blank to auto-generate a temporary password.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="add-role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      id="add-role"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="DEVELOPER">Developer</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </div>

                  {addError && (
                    <p className="text-sm text-red-600">{addError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddMember}
                      disabled={isAdding}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAdding ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Password Reset</h2>
              <button
                onClick={() => setResetTempPassword(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              New temporary password for <strong>{resetMemberName}</strong>:
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <code className="flex-1 text-sm font-mono text-gray-800 break-all select-all">{resetTempPassword}</code>
              <button
                onClick={() => copyToClipboard(resetTempPassword, setCopiedReset)}
                className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
                title="Copy password"
              >
                {copiedReset ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">This password will not be shown again.</p>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setResetTempPassword(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
