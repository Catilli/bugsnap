import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../lib/api';
import { ExtensionSync } from '../lib/extensionSync';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'DEVELOPER' | 'VIEWER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  handleOAuthCallback: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/api/auth/login', { email, password });
          const { user, token } = response.data;

          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });

          ExtensionSync.syncTokenToExtension(token);
          ExtensionSync.setUserEmail(user.email);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/api/auth/register', { email, password, name });
          const { user, token } = response.data;

          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });

          ExtensionSync.syncTokenToExtension(token);
          ExtensionSync.setUserEmail(user.email);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      handleOAuthCallback: async (token: string) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true, isLoading: true });
        try {
          const response = await api.get('/api/auth/me');
          const user = response.data;
          set({ user, isAuthenticated: true, isLoading: false });

          ExtensionSync.syncTokenToExtension(token);
          ExtensionSync.setUserEmail(user.email);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });

        ExtensionSync.syncLogoutToExtension();
        ExtensionSync.clearUserEmail();
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await api.get('/api/auth/me');
          set({ user: response.data, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: false,
    }
  )
);
