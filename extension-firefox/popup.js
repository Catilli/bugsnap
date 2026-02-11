document.addEventListener('DOMContentLoaded', async () => {
  const appDiv = document.getElementById('app');

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const currentDomain = new URL(tab.url).hostname;

  const result = await browser.storage.local.get(['token', 'userEmail']);
  const { token, userEmail } = result;

  if (!token) {
    appDiv.innerHTML = `
      <div class="inactive">
        <div class="inactive-title">BugSnap</div>
        <div class="inactive-status">Not logged in</div>
        <button class="primary" id="loginBtn">Login to BugSnap</button>
      </div>
    `;

    document.getElementById('loginBtn').addEventListener('click', () => {
      browser.tabs.create({ url: 'http://localhost:3000/login' });
    });
    return;
  }

  try {
    const response = await browser.runtime.sendMessage({ action: 'fetchProjects', token });

    if (response.error) throw new Error(response.error);

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
        const state = await browser.tabs.sendMessage(tab.id, { action: 'getBugSnapState' });
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
        browser.tabs.sendMessage(tab.id, {
          action: 'toggleBugSnap',
          enabled: newState,
          project: matchingProject
        });
        updateEnableButton(newState);
      });

      document.getElementById('viewBtn').addEventListener('click', () => {
        browser.tabs.create({ url: `http://localhost:3000/dashboard/projects/${matchingProject.id}` });
      });

      document.getElementById('reloadBtn').addEventListener('click', () => {
        browser.tabs.reload(tab.id);
        window.close();
      });
    } else {
      appDiv.innerHTML = `
        <div class="inactive">
          <div class="inactive-title">BugSnap</div>
          <div class="inactive-status">No project found for this website</div>
          <button class="primary" id="dashboardBtn">Go to Dashboard</button>
        </div>
      `;

      document.getElementById('dashboardBtn').addEventListener('click', () => {
        browser.tabs.create({ url: 'http://localhost:3000/dashboard' });
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
