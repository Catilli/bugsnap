// Extension sync utilities for BugSnap
// These helpers sync auth state to localStorage for the browser extension.

export const ExtensionSync = {
  setUserEmail: (email: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bugsnap_user_email', email);
    }
  },

  clearUserEmail: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bugsnap_user_email');
    }
  },

  syncTokenToExtension: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bugsnap_token', token);
    }
  },

  syncLogoutToExtension: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bugsnap_token');
      localStorage.removeItem('bugsnap_user_email');
    }
  },
};
