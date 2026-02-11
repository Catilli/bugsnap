// Signal extension presence to the web app
document.documentElement.setAttribute('data-bugsnap-extension', 'true');

// Sync localStorage to Chrome storage periodically
function syncToChromeStorage() {
  try {
    const token = localStorage.getItem('bugsnap_token');
    const userEmail = localStorage.getItem('bugsnap_user_email');
    
    if (token || userEmail) {
      chrome.storage.local.set({
        token: token || null,
        userEmail: userEmail || null
      });
    }
  } catch (error) {
    // Extension context invalidated - this happens when extension is reloaded
  }
}

// Sync on load
syncToChromeStorage();

// Sync every 2 seconds to catch login changes
setInterval(syncToChromeStorage, 2000);

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
  // Clean up overlay and cursor
  const overlay = document.getElementById('bugsnap-overlay');
  if (overlay) overlay.remove();
  document.body.style.cursor = '';
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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