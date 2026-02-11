// Signal extension presence to the web app
document.documentElement.setAttribute('data-bugsnap-extension', 'true');

// Sync localStorage to browser storage periodically
function syncToBrowserStorage() {
  try {
    const token = localStorage.getItem('bugsnap_token');
    const userEmail = localStorage.getItem('bugsnap_user_email');

    if (token || userEmail) {
      browser.storage.local.set({
        token: token || null,
        userEmail: userEmail || null
      });
    }
  } catch (error) {
    // Extension context invalidated
  }
}

// Sync on load
syncToBrowserStorage();

// Sync every 2 seconds to catch login changes
setInterval(syncToBrowserStorage, 2000);

// Load BugSnap UI script
function loadBugSnapUI(project) {
  if (window.BugSnapUIInstance) return;

  if (window.BugSnapUI) {
    window.BugSnapUIInstance = new window.BugSnapUI(project);
  }
}

// Disable BugSnap UI
function disableBugSnapUI() {
  if (window.BugSnapUIInstance) {
    if (typeof window.BugSnapUIInstance.destroy === 'function') {
      window.BugSnapUIInstance.destroy();
    }
    window.BugSnapUIInstance = null;
  }
  const overlay = document.getElementById('bugsnap-overlay');
  if (overlay) overlay.remove();
  document.body.style.cursor = '';
}

// Listen for messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleBugSnap') {
    if (message.enabled) {
      loadBugSnapUI(message.project);
    } else {
      disableBugSnapUI();
    }
    sendResponse({ success: true });
  } else if (message.action === 'getBugSnapState') {
    sendResponse({ enabled: !!window.BugSnapUIInstance });
  }
  return true;
});
