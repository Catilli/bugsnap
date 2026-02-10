import axios from 'axios';
import { getAuthToken } from './clerkTokenBridge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'BugSnap',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Authenticated fetch wrapper — automatically injects Authorization and
 * X-Requested-With (CSRF) headers. Use instead of raw fetch() for API calls.
 *
 * Accepts the same arguments as native fetch(). The `headers` option is
 * merged (caller headers win on conflict).
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = getAuthToken();
  const extra: Record<string, string> = { 'X-Requested-With': 'BugSnap' };
  if (token) extra['Authorization'] = `Bearer ${token}`;

  const merged = new Headers(init?.headers);
  for (const [k, v] of Object.entries(extra)) {
    if (!merged.has(k)) merged.set(k, v);
  }

  return fetch(input, { ...init, headers: merged });
}

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect on expired session, not on auth endpoint failures
      // (login/register return 401 for invalid credentials — let callers handle those)
      const isAuthEndpoint = error.config?.url?.startsWith('/api/auth/');
      if (!isAuthEndpoint && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
