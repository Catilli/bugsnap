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

// Check if should activate BugSnap UI
async function checkAndActivateBugSnap() {
  // Get token from Chrome storage (works across all domains)
  chrome.storage.local.get(['token'], async (result) => {
    const token = result.token;
    
    if (!token) {
      return;
    }
    
    await activateWithToken(token);
  });
}

async function activateWithToken(token) {

  try {
    // Send message to background script to fetch projects (avoids CORS issues)
    chrome.runtime.sendMessage({ action: 'fetchProjects', token }, (response) => {
      if (chrome.runtime.lastError) {
        return;
      }

      if (response.error) {
        return;
      }

      const projects = response.projects;
      const currentDomain = window.location.hostname;

      const matchingProject = projects.find(project => {
        if (!project.websiteUrl) {
          return false;
        }
        try {
          const projectDomain = new URL(project.websiteUrl).hostname;
          return projectDomain === currentDomain;
        } catch (e) {
          return false;
        }
      });

      if (matchingProject) {
        // Load and initialize BugSnap UI
        loadBugSnapUI(matchingProject);
      }
    });
  } catch (error) {
  }
}

// Load BugSnap UI script
function loadBugSnapUI(project) {
  // Check if already loaded
  if (window.BugSnapUIInstance) return;

  // BugSnapUI is already loaded via manifest content_scripts
  if (window.BugSnapUI) {
    window.BugSnapUIInstance = new window.BugSnapUI(project);
  }
}

// Activate after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkAndActivateBugSnap, 1000);
  });
} else {
  setTimeout(checkAndActivateBugSnap, 1000);
}