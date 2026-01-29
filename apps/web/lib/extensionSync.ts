// Extension sync utilities for BugSnap
//Note: This requires the BugSnap extension to be installed

export const ExtensionSync = {
  // Set user email in extension storage
  setUserEmail: (email: string) => {
    // Store in localStorage for the content script to access
    if (typeof window !== 'undefined') {
      localStorage.setItem('bugsnap_user_email', email);
    }
  },

  // Clear user email from extension storage
  clearUserEmail: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bugsnap_user_email');
    }
  },

  // Sync token to extension
  syncTokenToExtension: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bugsnap_token', token);
    }
  },

  // Sync logout to extension
  syncLogoutToExtension: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bugsnap_token');
      localStorage.removeItem('bugsnap_user_email');
    }
  }
};