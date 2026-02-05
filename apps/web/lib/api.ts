import axios from 'axios';
import { getClerkToken } from './clerkTokenBridge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getClerkToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clerk middleware handles redirects, but clear stale tokens
      const isCheckAuthCall = error.config?.url === '/api/auth/me';
      if (!isCheckAuthCall) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
