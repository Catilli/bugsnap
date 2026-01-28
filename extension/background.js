// Background Service Worker for BugSnap Extension
const API_BASE = 'http://localhost:3001/api';

class AuthManager {
  constructor() {
    this.token = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  async initialize() {
    const result = await chrome.storage.local.get(['auth']);
    if (result.auth) {
      this.token = result.auth.token;
      this.refreshToken = result.auth.refreshToken;
      this.tokenExpiry = result.auth.tokenExpiry;
    }
  }

  async authenticate(email, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        await this.storeTokens(data.token, data.refreshToken, data.expiresIn);
        return { success: true, user: data.user };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Authentication failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async getValidToken() {
    if (!this.token) return null;

    // Check if token is expired
    if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
      // Token expired, try refresh
      await this.refresh();
    }

    return this.token;
  }

  async refresh() {
    // Implement token refresh logic
    console.log('Token refresh not implemented yet');
   }

  async storeTokens(token, refreshToken, expiresIn) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + (expiresIn * 1000);

    await chrome.storage.local.set({
      auth: {
        token: this.token,
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry
      }
    });
  }

  async clearTokens() {
    this.token = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    await chrome.storage.local.remove(['auth']);
  }

  async checkAuth() {
    const token = await this.getValidToken();
    return !!token;
  }
}

class ApiClient {
  constructor(authManager) {
    this.authManager = authManager;
  }

  async request(endpoint, options = {}) {
    const token = await this.authManager.getValidToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Clear tokens and notify user
        await this.authManager.clearTokens();
        throw new Error('Unauthorized');
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getProjects() {
    const response = await this.request('/projects');
    return response.json();
  }

  async getProject(projectId) {
    const response = await this.request(`/projects/${projectId}`);
    return response.json();
  }

  async createTask(taskData) {
    const response = await this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    return response.json();
  }

  async uploadScreenshot(imageData) {
    // Implement screenshot upload
    // For now, return a placeholder URL
    return `data:image/png;base64,${imageData}`;
  }
}

// Initialize managers
const authManager = new AuthManager();
const apiClient = new ApiClient(authManager);

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('BugSnap extension installed');
  await authManager.initialize();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  await authManager.initialize();
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.action) {
        case 'AUTHENTICATE':
          const authResult = await authManager.authenticate(
            message.data.email,
            message.data.password
          );
          sendResponse(authResult);
          break;

        case 'LOGOUT':
          await authManager.clearTokens();
          sendResponse({ success: true });
          break;

        case 'CHECK_AUTH':
          const isAuthenticated = await authManager.checkAuth();
          sendResponse({ authenticated: isAuthenticated });
          break;

        case 'GET_PROJECTS':
          const projects = await apiClient.getProjects();
          sendResponse({ success: true, projects });
          break;

        case 'GET_PROJECT':
          const project = await apiClient.getProject(message.data.projectId);
          sendResponse({ success: true, project });
          break;

        case 'CREATE_TASK':
          const task = await apiClient.createTask(message.data);
          sendResponse({ success: true, task });
          break;

        case 'SET_ACTIVE_PROJECT':
          await chrome.storage.local.set({ activeProject: message.data.projectId });
          sendResponse({ success: true });
          break;

        case 'GET_ACTIVE_PROJECT':
          const result = await chrome.storage.local.get(['activeProject']);
          sendResponse({ success: true, projectId: result.activeProject });
          break;

        case 'CAPTURE_TAB':
          chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            sendResponse({ success: true, dataUrl });
          });
          return true; // Required for async response

        case 'SYNC_TOKEN_FROM_WEBAPP':
          // Receive token from web app and store it
          const { token } = message.data;
          
          // Store the token
          await authManager.storeTokens(token, null, 3600); // Default 1 hour expiry

          // Fetch user info with the token
          try {
            const userResponse = await fetch(`${API_BASE}/auth/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              await chrome.storage.local.set({ user: userData });
              sendResponse({ success: true, message: 'Token synced successfully' });
            }
          } catch (error) {
            sendResponse({ success: false, error: 'Failed to fetch user data' });
          }
          break;

        case 'GET_USER_INFO':
          const userInfo = await chrome.storage.local.get(['user']);
          sendResponse({ success: true, user: userInfo.user || null });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Required for async sendResponse
});

// Keyboard command handler
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-annotation-mode') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_ANNOTATION_MODE' });
      }
    });
  }
});

// Auto-detect project when tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await detectAndSetProject(tab.url);
    }
  } catch (error) {
    console.error('Error on tab activation:', error);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await detectAndSetProject(tab.url);
  }
});

// Detect project by URL and set as active
async function detectAndSetProject(url) {
  try {
    const currentUrl = new URL(url);
    const currentHostname = currentUrl.hostname;

    // Get all projects
    const projects = await apiClient.getProjects();

    // Find matching project
    const matchingProject = projects.find(project => {
      if (!project.websiteUrl) return false;

      try {
        const projectUrl = new URL(project.websiteUrl);
        const projectHostname = projectUrl.hostname;

        return currentHostname === projectHostname ||
               currentHostname.endsWith(`.${projectHostname}`) ||
               projectHostname.endsWith(`.${currentHostname}`);
      } catch (e) {
        return false;
      }
    });

    if (matchingProject) {
      await chrome.storage.local.set({ activeProject: matchingProject.id });
    } else {
      await chrome.storage.local.remove('activeProject');
    }
  } catch (error) {
    // Ignore errors (user might not be authenticated)
  }
}