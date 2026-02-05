'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bug, Puzzle, X } from 'lucide-react';
import { useUser, useClerk, UserButton } from '@clerk/nextjs';
import { ProjectProvider, useProject } from './ProjectContext';
import ClerkTokenSync from '@/components/ClerkTokenSync';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { projectName } = useProject();
  const [extensionInstalled, setExtensionInstalled] = useState<boolean | null>(null);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('bugsnap_extension_bubble_dismissed') === 'true') {
      setBubbleDismissed(true);
    }

    const timer = setTimeout(() => {
      const hasExtension = document.documentElement.hasAttribute('data-bugsnap-extension');
      setExtensionInstalled(hasExtension);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const dismissExtensionBubble = () => {
    setBubbleDismissed(true);
    sessionStorage.setItem('bugsnap_extension_bubble_dismissed', 'true');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClerkTokenSync />

      {/* Top Toolbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Logo and Breadcrumb */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              Bug<span className="text-indigo-600">Snap</span>
            </Link>
            {projectName && (
              <>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-lg font-medium text-gray-700">{projectName}</span>
              </>
            )}
          </div>

          {/* Right side - Bug icon and Avatar Menu */}
          <div className="flex items-center gap-3">
            {/* Bug Report Button */}
            <Link
              href="/dashboard/feedback"
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Bug Reports & Feature Requests"
            >
              <Bug className="w-5 h-5" />
            </Link>

            {/* Install Extension Button */}
            <div className="relative">
              <Link
                href="/dashboard/install-extension"
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Install Extension"
              >
                <Puzzle className="w-5 h-5" />
              </Link>

              {extensionInstalled === false && !bubbleDismissed && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-indigo-600 text-white rounded-lg shadow-lg p-3 z-50">
                  <div className="absolute -top-2 right-3 w-4 h-4 bg-indigo-600 rotate-45" />
                  <div className="relative">
                    <button
                      onClick={(e) => { e.preventDefault(); dismissExtensionBubble(); }}
                      className="absolute -top-1 -right-1 text-indigo-200 hover:text-white"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Link href="/dashboard/install-extension" onClick={dismissExtensionBubble}>
                      <p className="text-sm font-medium pr-4">Install the BugSnap Extension</p>
                      <p className="text-xs text-indigo-200 mt-1">
                        Required to capture bugs directly on websites.
                      </p>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Clerk UserButton */}
            <UserButton
              afterSignOutUrl="/login"
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="pt-16">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <DashboardContent>{children}</DashboardContent>
    </ProjectProvider>
  );
}
