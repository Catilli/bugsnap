// Extension token sync utilities

/**
 * Send authentication token to BugSnap extension
 * This allows users to login once in the web app and automatically
 * authenticate in the extension
 */
export function syncTokenToExtension(token: string) {
  // Check if extension is installed
  if (typeof window === 'undefined') return;

  // Extension ID - will be generated after first installation
  // For development, we'll use a message that the extension listens for
  const EXTENSION_ID = 'bugsnap-extension-sync';

  try {
    // Post message to window that extension can listen for
    window.postMessage(
      {
        type: 'BUGSNAP_AUTH_TOKEN',
        source: 'bugsnap-webapp',
        token: token,
        timestamp: Date.now()
      },
      '*'
    );

    console.log('Token sync message sent to extension');
  } catch (error) {
    console.error('Failed to sync token to extension:', error);
  }
}

/**
 * Send logout signal to BugSnap extension
 * This allows users to logout once in the web app and automatically
 * logout in the extension
 */
export function syncLogoutToExtension() {
  // Check if extension is installed
  if (typeof window === 'undefined') return;

  try {
    // Post message to window that extension can listen for
    window.postMessage(
      {
        type: 'BUGSNAP_LOGOUT',
        source: 'bugsnap-webapp',
        timestamp: Date.now()
      },
      '*'
    );

    console.log('Logout sync message sent to extension');
  } catch (error) {
    console.error('Failed to sync logout to extension:', error);
  }
}

/**
 * Check if BugSnap extension is installed
 */
export async function checkExtensionInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    // Send ping message
    window.postMessage(
      {
        type: 'BUGSNAP_EXTENSION_PING',
        source: 'bugsnap-webapp'
      },
      '*'
    );

    // Listen for response
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === 'BUGSNAP_EXTENSION_PONG' &&
        event.data.source === 'bugsnap-extension'
      ) {
        window.removeEventListener('message', handleMessage);
        resolve(true);
      }
    };

    window.addEventListener('message', handleMessage);

    // Timeout after 1 second
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve(false);
    }, 1000);
  });
}

/**
 * Request user info from extension
 */
export async function getUserFromExtension(): Promise<any> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    window.postMessage(
      {
        type: 'BUGSNAP_GET_USER',
        source: 'bugsnap-webapp'
      },
      '*'
    );

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === 'BUGSNAP_USER_DATA' &&
        event.data.source === 'bugsnap-extension'
      ) {
        window.removeEventListener('message', handleMessage);
        resolve(event.data.user);
      }
    };

    window.addEventListener('message', handleMessage);

    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve(null);
    }, 1000);
  });
}