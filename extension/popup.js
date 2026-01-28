// Popup JavaScript
document.addEventListener('DOMContentLoaded', async () => {
  const notAuthView = document.getElementById('notAuthView');
  const projectView = document.getElementById('projectView');
  const noProjectView = document.getElementById('noProjectView');
  const loadingView = document.getElementById('loadingView');
  const viewProjectBtn = document.getElementById('viewProjectBtn');
  const reloadLink = document.getElementById('reloadLink');

  // Check authentication status
  try {
    const response = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });

    loadingView.classList.add('hidden');

    if (response.authenticated) {
      await loadUserAndDetectProject();
    } else {
      showNotAuthenticatedView();
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    loadingView.classList.add('hidden');
    showNotAuthenticatedView();
  }

  // Show not authenticated view
  function showNotAuthenticatedView() {
    notAuthView.classList.remove('hidden');
    projectView.classList.add('hidden');
    noProjectView.classList.add('hidden');
  }

  // Load user and detect project
  async function loadUserAndDetectProject() {
    // Load user info
    try {
      const authData = await chrome.storage.local.get(['user']);
      if (authData.user) {
        document.getElementById('userEmail').textContent = authData.user.email;
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }

    // Detect project based on current URL
    await detectProjectByURL();
  }

  // Detect project based on current URL
  async function detectProjectByURL() {
    try {
      // Get current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        showNoProject();
        return;
      }

      // Parse current tab URL
      let currentUrl;
      try {
        currentUrl = new URL(tab.url);
      } catch (e) {
        showNoProject();
        return;
      }

      // Get current domain (e.g., "example.com")
      const currentHostname = currentUrl.hostname;

      // Get all projects from API
      const response = await chrome.runtime.sendMessage({ action: 'GET_PROJECTS' });

      if (response.success && response.projects) {
        // Find project matching current domain
        const matchingProject = response.projects.find(project => {
          if (!project.websiteUrl) return false;

          try {
            const projectUrl = new URL(project.websiteUrl);
            const projectHostname = projectUrl.hostname;

            // Match by hostname (works for all pages under domain)
            // example.com matches example.com, www.example.com, app.example.com, etc.
            return currentHostname === projectHostname ||
                   currentHostname.endsWith(`.${projectHostname}`) ||
                   projectHostname.endsWith(`.${currentHostname}`);
          } catch (e) {
            return false;
          }
        });

        if (matchingProject) {
          // Set active project automatically
          await chrome.runtime.sendMessage({
            action: 'SET_ACTIVE_PROJECT',
            data: { projectId: matchingProject.id }
          });

          showProjectInfo(matchingProject);
        } else {
          showNoProject();
        }
      } else {
        showNoProject();
      }
    } catch (error) {
      console.error('Error detecting project:', error);
      showNoProject();
    }
  }

  // Show project info
  function showProjectInfo(project) {
    projectView.classList.remove('hidden');
    noProjectView.classList.add('hidden');
    notAuthView.classList.add('hidden');

    document.getElementById('projectName').textContent = project.name;
  }

  // Show no project message
  function showNoProject() {
    projectView.classList.add('hidden');
    noProjectView.classList.remove('hidden');
    notAuthView.classList.add('hidden');
  }

  // Reload button handler
  if (reloadLink) {
    reloadLink.addEventListener('click', async (e) => {
      e.preventDefault();
      loadingView.classList.remove('hidden');
      projectView.classList.add('hidden');
      noProjectView.classList.add('hidden');

      await loadUserAndDetectProject();
      loadingView.classList.add('hidden');
    });
  }

  // View project button handler
  if (viewProjectBtn) {
    viewProjectBtn.addEventListener('click', async () => {
      try {
        // Get active project
        const result = await chrome.storage.local.get(['activeProject']);
        if (result.activeProject) {
          // Open project page in new tab
          chrome.tabs.create({
            url: `http://localhost:3000/dashboard/projects/${result.activeProject}`
          });
        }
      } catch (error) {
        console.error('Error opening project:', error);
      }
    });
  }

});