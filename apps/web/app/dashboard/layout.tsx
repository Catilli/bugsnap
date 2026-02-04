'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bug, Puzzle, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ProjectProvider, useProject } from './ProjectContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth, logout, token } = useAuthStore();
  const { projectName } = useProject();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState<boolean | null>(null);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  // Wait for zustand persist middleware to hydrate
  useEffect(() => {
    // Check if zustand has hydrated by checking if we have persisted state
    const checkHydration = () => {
      const persistedState = localStorage.getItem('auth-storage');
      if (persistedState) {
        try {
          const parsed = JSON.parse(persistedState);
          if (parsed.state) {
            setIsHydrated(true);
            return true;
          }
        } catch (e) {
          // Silently handle parsing errors
        }
      }
      return false;
    };

    // Try immediately, then retry if needed
    if (!checkHydration()) {
      const timer = setTimeout(() => {
        checkHydration();
        setIsHydrated(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Only check auth after hydration and if we don't have a persisted token
    if (isHydrated && !hasCheckedAuth && !token) {
      checkAuth().finally(() => setHasCheckedAuth(true));
    } else if (isHydrated && !hasCheckedAuth && token) {
      // We have a persisted token, mark as checked
      setHasCheckedAuth(true);
    }
  }, [checkAuth, token, hasCheckedAuth, isHydrated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && hasCheckedAuth && isHydrated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, hasCheckedAuth, isHydrated]);

  useEffect(() => {
    if (localStorage.getItem('bugsnap_extension_bubble_dismissed') === 'true') {
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
    localStorage.setItem('bugsnap_extension_bubble_dismissed', 'true');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

            {/* Avatar Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Account
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
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