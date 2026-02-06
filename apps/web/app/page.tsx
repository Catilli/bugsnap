'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Wait for Zustand to rehydrate before deciding where to go
    if (isLoading) return;
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [isLoading, isAuthenticated, router]);

  return null;
}