'use client';

import { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../lib/api';
import { notifySuccess, notifyError } from '../../../lib/toast';

export default function AccountPage() {
  const { user, checkAuth } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      await api.put('/api/auth/profile', { name, email });
      await checkAuth();
      notifySuccess('Profile updated successfully.');
    } catch (err: any) {
      notifyError(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      notifyError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      notifyError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      await api.put('/api/auth/password', { currentPassword, newPassword });
      notifySuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      notifyError(err.response?.data?.error?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">Email:</span> {user?.email}
          </p>
          <p>
            <span className="font-medium">Role:</span>{' '}
            {user?.role === 'ADMIN' && 'Admin'}
            {user?.role === 'MANAGER' && 'Manager'}
            {user?.role === 'DEVELOPER' && 'Developer'}
            {user?.role === 'VIEWER' && 'Viewer'}
          </p>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmNewPassword"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
