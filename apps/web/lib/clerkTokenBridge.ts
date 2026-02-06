// Auth token bridge — sources token from localStorage (set by authStore).
// Kept as a separate module so API call sites have a single import to change.

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}
