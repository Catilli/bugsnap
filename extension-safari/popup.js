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
      browser.tabs.create({ url: `${BUGSNAP_WEB_URL}/login` });
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
        browser.tabs.create({ url: `${BUGSNAP_WEB_URL}/dashboard/projects/${matchingProject.id}` });
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
        browser.tabs.create({ url: `${BUGSNAP_WEB_URL}/dashboard` });
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
