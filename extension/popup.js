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
        // Note: innerHTML used with extension-internal data (project name, email from own storage)
        appDiv.innerHTML = `
          <div class="container">
            <div class="header">
              <span class="project-label">Current Project</span>
              <div class="header-actions">
                <button class="enable-btn" id="enableBtn">
                  <i data-lucide="play" width="16" height="16"></i>
                  <span>Enable</span>
                </button>
                <button class="reload-btn" id="reloadBtn">
                  <i data-lucide="refresh-cw" width="16" height="16"></i>
                  <span>Reload</span>
                </button>
              </div>
            </div>
            <div class="project-name">${matchingProject.name}</div>
            <button class="primary" id="viewBtn">View on BugSnap</button>
            <div class="user-info">Logged in as ${userEmail || 'user@example.com'}</div>
          </div>
        `;

        lucide.createIcons();

        // Query current BugSnap state from content script
        let bugSnapEnabled = false;
        try {
          const state = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getBugSnapState' }, (response) => {
              resolve(response || { enabled: false });
            });
          });
          bugSnapEnabled = state.enabled;
        } catch {
          bugSnapEnabled = false;
        }

        const enableBtn = document.getElementById('enableBtn');

        function updateEnableButton(enabled) {
          bugSnapEnabled = enabled;
          const icon = enableBtn.querySelector('i');
          const label = enableBtn.querySelector('span');
          if (enabled) {
            enableBtn.classList.add('active');
            icon.setAttribute('data-lucide', 'square');
            label.textContent = 'Disable';
          } else {
            enableBtn.classList.remove('active');
            icon.setAttribute('data-lucide', 'play');
            label.textContent = 'Enable';
          }
          lucide.createIcons();
        }

        updateEnableButton(bugSnapEnabled);

        enableBtn.addEventListener('click', () => {
          const newState = !bugSnapEnabled;
          chrome.tabs.sendMessage(tab.id, {
            action: 'toggleBugSnap',
            enabled: newState,
            project: matchingProject
          });
          updateEnableButton(newState);
        });

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