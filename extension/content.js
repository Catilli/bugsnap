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
    console.log('BugSnap: Extension context invalidated');
  }
}

// Sync on load
syncToChromeStorage();

// Sync every 2 seconds to catch login changes
setInterval(syncToChromeStorage, 2000);

// Check if should activate BugSnap UI
async function checkAndActivateBugSnap() {
  console.log('[BugSnap] Checking activation...');
  
  // Get token from Chrome storage (works across all domains)
  chrome.storage.local.get(['token'], async (result) => {
    const token = result.token;
    console.log('[BugSnap] Token found from Chrome storage:', !!token);
    
    if (!token) {
      console.log('[BugSnap] No token found, skipping activation');
      return;
    }
    
    await activateWithToken(token);
  });
}

async function activateWithToken(token) {

  try {
    console.log('[BugSnap] Fetching projects...');
    const response = await fetch('http://localhost:3001/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('[BugSnap] Response status:', response.status);

    if (response.ok) {
      const projects = await response.json();
      const currentDomain = window.location.hostname;
      console.log('[BugSnap] Current domain:', currentDomain);
      console.log('[BugSnap] Projects:', projects.length, projects);
      
      const matchingProject = projects.find(project => {
        if (!project.websiteUrl) {
          console.log('[BugSnap] Project', project.name, 'has no websiteUrl');
          return false;
        }
        try {
          const projectDomain = new URL(project.websiteUrl).hostname;
          console.log('[BugSnap] Comparing:', projectDomain, 'with', currentDomain);
          return projectDomain === currentDomain;
        } catch (e) {
          console.log('[BugSnap] Invalid URL for project:', project.name, project.websiteUrl);
          return false;
        }
      });

      if (matchingProject) {
        console.log('[BugSnap] Matching project found:', matchingProject.name);
        console.log('[BugSnap] Initializing UI...');
        // Load and initialize BugSnap UI
        loadBugSnapUI(matchingProject);
      } else {
        console.log('[BugSnap] No matching project for this domain');
      }
    } else {
      console.log('[BugSnap] Failed to fetch projects:', response.status, await response.text());
    }
  } catch (error) {
    console.error('[BugSnap] Error checking projects:', error);
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

console.log('BugSnap content script loaded');