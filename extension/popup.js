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
        chrome.tabs.create({ url: 'http://localhost:3000/login' });
      });
      return;
    }
    
    // Fetch projects
    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const projects = await response.json();
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
                <span>🔄</span>
                <span>Reload</span>
              </button>
            </div>
            <div class="project-name">${matchingProject.name}</div>
            <button class="primary" id="viewBtn">View on BugSnap</button>
            <div class="user-info">Logged in as ${userEmail || 'user@example.com'}</div>
          </div>
        `;
        
        document.getElementById('viewBtn').addEventListener('click', () => {
          chrome.tabs.create({ url: `http://localhost:3000/dashboard/projects/${matchingProject.id}` });
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
          chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
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