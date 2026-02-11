document.addEventListener('DOMContentLoaded', async () => {
  const appDiv = document.getElementById('app');
  
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentDomain = new URL(tab.url).hostname;
  
  // Get token and user email from storage
  chrome.storage.local.get(['token', 'userEmail'], async (result) => {
    const { token, userEmail } = result;
    
    if (!token) {
      // Not logged in
      appDiv.innerHTML = `
        <div class="inactive">
          <div class="inactive-title">BugSnap</div>
          <div class="inactive-status">Not logged in</div>
          <button class="primary" id="loginBtn">Login to BugSnap</button>
        </div>
      `;
      
      document.getElementById('loginBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: `${BUGSNAP_WEB_URL}/login` });
      });
      return;
    }
    
    // Fetch projects
    try {
      // Send message to background script to fetch projects (avoids CORS issues)
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'fetchProjects', token }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
      
      const projects = response.projects;
      const matchingProject = projects.find(project => {
        if (!project.websiteUrl) return false;
        try {
          return new URL(project.websiteUrl).hostname === currentDomain;
        } catch {
          return false;
        }
      });
      
      if (matchingProject) {
        // Show project info
        appDiv.innerHTML = `
          <div class="container">
            <div class="header">
              <span class="project-label">Current Project</span>
              <button class="reload-btn" id="reloadBtn">
                <i data-lucide="refresh-cw" width="16" height="16"></i>
                <span>Reload</span>
              </button>
            </div>
            <div class="project-name">${matchingProject.name}</div>
            <button class="primary" id="viewBtn">View on BugSnap</button>
            <div class="user-info">Logged in as ${userEmail || 'user@example.com'}</div>
          </div>
        `;
        
        lucide.createIcons();
        
        document.getElementById('viewBtn').addEventListener('click', () => {
          chrome.tabs.create({ url: `${BUGSNAP_WEB_URL}/dashboard/projects/${matchingProject.id}` });
        });
        
        document.getElementById('reloadBtn').addEventListener('click', () => {
          chrome.tabs.reload(tab.id);
          window.close();
        });
      } else {
        // No matching project
        appDiv.innerHTML = `
          <div class="inactive">
            <div class="inactive-title">BugSnap</div>
            <div class="inactive-status">No project found for this website</div>
            <button class="primary" id="dashboardBtn">Go to Dashboard</button>
          </div>
        `;
        
        document.getElementById('dashboardBtn').addEventListener('click', () => {
          chrome.tabs.create({ url: `${BUGSNAP_WEB_URL}/dashboard` });
        });
      }
    } catch (error) {
      appDiv.innerHTML = `
        <div class="inactive">
          <div class="inactive-title">BugSnap</div>
          <div class="inactive-status">Error loading projects</div>
          <button class="primary" id="retryBtn">Retry</button>
        </div>
      `;
      
      document.getElementById('retryBtn').addEventListener('click', () => {
        window.location.reload();
      });
    }
  });
});