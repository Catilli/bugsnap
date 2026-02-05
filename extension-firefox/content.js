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

// Check if should activate BugSnap UI
async function checkAndActivateBugSnap() {
  try {
    const result = await browser.storage.local.get(['token']);
    const token = result.token;

    if (!token) return;

    await activateWithToken(token);
  } catch (error) {
    // Ignore
  }
}

async function activateWithToken(token) {
  try {
    const response = await browser.runtime.sendMessage({ action: 'fetchProjects', token });

    if (response.error) return;

    const projects = response.projects;
    const currentDomain = window.location.hostname;

    const matchingProject = projects.find(project => {
      if (!project.websiteUrl) return false;
      try {
        const projectDomain = new URL(project.websiteUrl).hostname;
        return projectDomain === currentDomain;
      } catch (e) {
        return false;
      }
    });

    if (matchingProject) {
      loadBugSnapUI(matchingProject);
    }
  } catch (error) {
    // Ignore
  }
}

function loadBugSnapUI(project) {
  if (window.BugSnapUIInstance) return;

  if (window.BugSnapUI) {
    window.BugSnapUIInstance = new window.BugSnapUI(project);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkAndActivateBugSnap, 1000);
  });
} else {
  setTimeout(checkAndActivateBugSnap, 1000);
}
