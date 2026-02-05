'use client';

import { UserProfile, useUser } from '@clerk/nextjs';

export default function AccountPage() {
  const { user } = useUser();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'shadow-none border border-gray-200 rounded-lg w-full',
          },
        }}
      />

      {/* Account Info */}
      <div className="bg-gray-50 rounded-lg p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">Email:</span> {user?.primaryEmailAddress?.emailAddress}
          </p>
          <p>
            <span className="font-medium">Role:</span>{' '}
            {(user?.publicMetadata?.role as string) === 'MANAGER' && 'Manager'}
            {(user?.publicMetadata?.role as string) === 'DEVELOPER' && 'Developer'}
            {(user?.publicMetadata?.role as string) === 'VIEWER' && 'Viewer'}
            {!(user?.publicMetadata?.role) && 'Manager'}
          </p>
        </div>
      </div>
    </div>
  );
}
