import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../lib/api';
import { ExtensionSync } from '../lib/extensionSync';

const isBrowser = typeof window !== 'undefined';

// No-op storage for SSR — prevents "Cannot read properties of undefined
// (reading 'getItem')" during static page generation on the server.
const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  length: 0,
  clear: () => {},
  key: () => null,
};

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';
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
      // Start as true so we never redirect before Zustand rehydrates
      // persisted auth state from localStorage. onRehydrateStorage sets
      // this to false once hydration completes.
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/api/auth/login', { email, password });
          const { user, token } = response.data;

          if (isBrowser) localStorage.setItem('token', token);
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

          if (isBrowser) localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });

          ExtensionSync.syncTokenToExtension(token);
          ExtensionSync.setUserEmail(user.email);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      handleOAuthCallback: async (token: string) => {
        if (isBrowser) localStorage.setItem('token', token);
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
        if (isBrowser) localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });

        ExtensionSync.syncLogoutToExtension();
        ExtensionSync.clearUserEmail();
      },

      checkAuth: async () => {
        const token = isBrowser ? localStorage.getItem('token') : null;
        if (!token) {
          if (isBrowser) localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          return;
        }

        // Don't set isLoading: true here — the persisted state (user, token,
        // isAuthenticated) was already rehydrated and is being displayed.
        // Setting isLoading: true would flash a loading spinner on every refresh.
        try {
          const response = await api.get('/api/auth/me');
          set({ user: response.data, token, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          if (error.response?.status === 401) {
            // Token expired or invalid — clear auth so user is redirected to login
            if (isBrowser) localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          } else {
            // Network error — keep persisted auth state, just stop loading
            set({ isLoading: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => (isBrowser ? localStorage : noopStorage)),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // After Zustand rehydrates persisted state from localStorage, set
      // isLoading to false. This is the signal that we know the real auth
      // state: either the user has a persisted token+isAuthenticated (show
      // dashboard) or they don't (redirect to login). Without this, isLoading
      // stays true forever because checkAuth() no longer sets it to true.
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Auth hydration failed:', error);
        }
        useAuthStore.setState({ isLoading: false });
      },
    }
  )
);
