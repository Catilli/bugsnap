// Extension sync utilities for BugSnap
// Note: Token and email sync is now handled by ClerkTokenSync component.
// These helpers remain for any imperative sync needs.

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
