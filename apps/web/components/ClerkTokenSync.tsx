'use client';

import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { setClerkToken } from '../lib/clerkTokenBridge';

export default function ClerkTokenSync() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sync = async () => {
      try {
        const token = await getToken();
        setClerkToken(token);

        // Write to localStorage for extension compatibility
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('bugsnap_token', token);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('bugsnap_token');
        }

        // Sync user email for extension
        if (user?.primaryEmailAddress?.emailAddress) {
          localStorage.setItem('bugsnap_user_email', user.primaryEmailAddress.emailAddress);
        }
      } catch {
        // Silently fail — token will be refreshed on next interval
      }
    };

    // Sync immediately on mount
    sync();

    // Refresh every 50 seconds (Clerk tokens are short-lived, ~60s)
    intervalRef.current = setInterval(sync, 50_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [getToken, user]);

  return null;
}
