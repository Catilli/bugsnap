# Component Breakdown

## 1. Content Script (`content/`)

### Purpose
Injects functionality into web pages for element selection and visual annotation overlay.

### Key Files
- `content.js` - Main content script logic
- `overlay.css` - Visual styles for annotations
- `selector.js` - Element selection utilities

### Core Classes

#### ElementSelector
```javascript
class ElementSelector {
  constructor() {
    this.selectedElement = null;
    this.overlay = new AnnotationOverlay();
    this.isActive = false;
    this.currentTool = 'select';
  }

  // Activate selection mode
  activate() {
    this.isActive = true;
    this.attachEventListeners();
    this.showToolbar();
  }

  // Deactivate selection mode
  deactivate() {
    this.isActive = false;
    this.removeEventListeners();
    this.hideToolbar();
  }

  // Handle mouse hover for element highlighting
  handleMouseOver(event) {
    if (!this.isActive) return;

    const element = event.target;
    this.highlightElement(element);
    this.showElementInfo(element);
  }

  // Handle element selection
  handleClick(event) {
    if (!this.isActive) return;

    event.preventDefault();
    event.stopPropagation();

    const element = event.target;
    this.selectElement(element);
  }

  // Select and annotate element
  selectElement(element) {
    this.selectedElement = element;
    this.overlay.showAnnotationForm(element);
  }

  // Change current annotation tool
  setTool(tool) {
    this.currentTool = tool;
    this.updateCursor();
  }
}
```

#### AnnotationOverlay
```javascript
class AnnotationOverlay {
  constructor() {
    this.overlay = null;
    this.toolbar = null;
    this.currentAnnotation = null;
    this.annotations = [];
  }

  // Show visual overlay on selected element
  showOverlay(element) {
    const rect = element.getBoundingClientRect();
    this.overlay = this.createOverlayElement(rect);
    document.body.appendChild(this.overlay);
  }

  // Create overlay DOM element
  createOverlayElement(rect) {
    const overlay = document.createElement('div');
    overlay.className = 'bugsnap-element-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top - 2}px;
      left: ${rect.left - 2}px;
      width: ${rect.width + 4}px;
      height: ${rect.height + 4}px;
      border: 2px solid #ef4444;
      background: rgba(239, 68, 68, 0.1);
      z-index: 999999;
      pointer-events: none;
      border-radius: 4px;
    `;

    return overlay;
  }

  // Show floating annotation toolbar
  showToolbar(element) {
    const rect = element.getBoundingClientRect();
    this.toolbar = this.createToolbarElement(rect);
    document.body.appendChild(this.toolbar);
  }

  // Create annotation tools toolbar
  createToolbarElement(rect) {
    const toolbar = document.createElement('div');
    toolbar.className = 'bugsnap-annotation-toolbar';
    toolbar.innerHTML = `
      <button data-tool="text">T</button>
      <button data-tool="arrow">→</button>
      <button data-tool="rectangle">▭</button>
      <button data-tool="highlight">🖍️</button>
      <button data-tool="cancel">✕</button>
    `;

    toolbar.style.cssText = `
      position: fixed;
      top: ${rect.top - 50}px;
      left: ${rect.left}px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 4px;
      z-index: 1000000;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    `;

    return toolbar;
  }

  // Show annotation form
  showAnnotationForm(element) {
    const form = this.createAnnotationForm(element);
    document.body.appendChild(form);
  }

  // Create annotation input form
  createAnnotationForm(element) {
    const form = document.createElement('div');
    form.className = 'bugsnap-annotation-form';
    form.innerHTML = `
      <div class="bugsnap-form-header">
        <h3>Add Annotation</h3>
        <button class="bugsnap-close-btn">×</button>
      </div>
      <div class="bugsnap-form-body">
        <textarea placeholder="Describe the issue..." rows="3"></textarea>
        <div class="bugsnap-form-actions">
          <button class="bugsnap-cancel-btn">Cancel</button>
          <button class="bugsnap-save-btn">Save Annotation</button>
        </div>
      </div>
    `;

    return form;
  }
}
```

#### ScreenshotCapture
```javascript
class ScreenshotCapture {
  static async captureElement(element) {
    try {
      // Use html2canvas for element screenshot
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        scale: Math.min(window.devicePixelRatio, 2), // Limit scale for performance
        width: element.offsetWidth,
        height: element.offsetHeight,
        backgroundColor: '#ffffff'
      });

      return {
        dataUrl: canvas.toDataURL('image/png', 0.8),
        width: canvas.width,
        height: canvas.height
      };
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw new Error('Failed to capture screenshot');
    }
  }

  static async captureViewport() {
    // Capture visible viewport
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Use chrome.tabs.captureVisibleTab for better performance
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'CAPTURE_TAB' }, (response) => {
        resolve(response);
      });
    });
  }
}
```

## 2. Background Service Worker (`background/`)

### Purpose
Handles background tasks, API communication, and extension state management.

### Key Classes

#### AuthManager
```javascript
class AuthManager {
  constructor() {
    this.token = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  // Authenticate user
  async authenticate(credentials) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        await this.storeTokens(data);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Get valid token (refresh if needed)
  async getValidToken() {
    if (!this.token) return null;

    if (this.isTokenExpired()) {
      await this.refreshToken();
    }

    return this.token;
  }

  // Check if token is expired
  isTokenExpired() {
    return Date.now() >= this.tokenExpiry;
  }

  // Refresh access token
  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        await this.storeTokens(data);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // Clear tokens on refresh failure
    await this.clearTokens();
    return false;
  }

  // Store tokens securely
  async storeTokens(data) {
    this.token = data.token;
    this.refreshToken = data.refreshToken;
    this.tokenExpiry = Date.now() + (data.expiresIn * 1000);

    await chrome.storage.local.set({
      auth: {
        token: this.token,
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry
      }
    });
  }

  // Clear stored tokens
  async clearTokens() {
    this.token = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    await chrome.storage.local.remove(['auth']);
  }
}
```

#### ApiClient
```javascript
class ApiClient {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api'; // Configurable
    this.authManager = new AuthManager();
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const token = await this.authManager.getValidToken();

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const mergedOptions = { ...defaultOptions, ...options };

    if (mergedOptions.body && typeof mergedOptions.body === 'object') {
      mergedOptions.body = JSON.stringify(mergedOptions.body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, mergedOptions);

      if (response.status === 401) {
        // Token expired, try refresh
        const refreshed = await this.authManager.refreshToken();
        if (refreshed) {
          // Retry request with new token
          return this.request(endpoint, options);
        } else {
          throw new Error('Authentication failed');
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Project operations
  async getProjects() {
    const response = await this.request('/projects');
    return response.json();
  }

  // Task operations
  async createTask(taskData) {
    const response = await this.request('/tasks', {
      method: 'POST',
      body: taskData
    });
    return response.json();
  }

  async getTasks(projectId) {
    const response = await this.request(`/projects/${projectId}/tasks`);
    return response.json();
  }

  // Annotation operations
  async createAnnotation(annotationData) {
    const response = await this.request('/annotations', {
      method: 'POST',
      body: annotationData
    });
    return response.json();
  }
}
```

#### DataSync
```javascript
class DataSync {
  constructor() {
    this.apiClient = new ApiClient();
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
  }

  // Queue operation for sync
  async enqueue(operation) {
    this.syncQueue.push(operation);

    if (this.isOnline) {
      await this.processQueue();
    } else {
      await this.storeOffline(operation);
    }
  }

  // Process queued operations
  async processQueue() {
    while (this.syncQueue.length > 0) {
      const operation = this.syncQueue.shift();

      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error('Sync operation failed:', error);
        // Re-queue failed operations
        this.syncQueue.unshift(operation);
        break;
      }
    }
  }

  // Execute individual operation
  async executeOperation(operation) {
    switch (operation.type) {
      case 'CREATE_TASK':
        return this.apiClient.createTask(operation.data);
      case 'CREATE_ANNOTATION':
        return this.apiClient.createAnnotation(operation.data);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Store operation for offline sync
  async storeOffline(operation) {
    const offlineQueue = await this.getOfflineQueue();
    offlineQueue.push(operation);
    await chrome.storage.local.set({ offlineQueue });
  }

  // Get offline queue
  async getOfflineQueue() {
    const result = await chrome.storage.local.get('offlineQueue');
    return result.offlineQueue || [];
  }

  // Sync when back online
  async syncOfflineData() {
    const offlineQueue = await this.getOfflineQueue();

    for (const operation of offlineQueue) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error('Offline sync failed:', error);
        // Keep failed operations for retry
        return;
      }
    }

    // Clear successful operations
    await chrome.storage.local.remove('offlineQueue');
  }
}
```

## 3. Popup Interface (`popup/`)

### Purpose
Provides quick access to extension controls and project/task management.

### Key Components

#### ProjectSelector
```javascript
class ProjectSelector {
  constructor(container) {
    this.container = container;
    this.projects = [];
    this.selectedProject = null;
  }

  // Render project dropdown
  render() {
    const select = document.createElement('select');
    select.className = 'bugsnap-project-select';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Project';
    select.appendChild(defaultOption);

    // Add project options
    this.projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.selectedProject = e.target.value;
      this.onProjectChange(this.selectedProject);
    });

    this.container.appendChild(select);
  }

  // Load projects from API
  async loadProjects() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'GET_PROJECTS'
      });

      this.projects = response.projects;
      this.render();
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  // Handle project selection
  onProjectChange(projectId) {
    chrome.runtime.sendMessage({
      action: 'SET_ACTIVE_PROJECT',
      data: { projectId }
    });
  }
}
```

#### TaskCreator
```javascript
class TaskCreator {
  constructor(container) {
    this.container = container;
    this.isVisible = false;
  }

  // Show task creation form
  show(annotations = []) {
    this.isVisible = true;
    const form = this.createForm(annotations);
    this.container.appendChild(form);
  }

  // Hide task creation form
  hide() {
    this.isVisible = false;
    const form = this.container.querySelector('.bugsnap-task-form');
    if (form) form.remove();
  }

  // Create task form
  createForm(annotations) {
    const form = document.createElement('div');
    form.className = 'bugsnap-task-form';
    form.innerHTML = `
      <div class="bugsnap-form-header">
        <h3>Create Task</h3>
        <button class="bugsnap-close-btn">×</button>
      </div>
      <div class="bugsnap-form-body">
        <input type="text" placeholder="Task title" class="bugsnap-title-input" />
        <textarea placeholder="Task description" rows="3" class="bugsnap-description-input"></textarea>
        <select class="bugsnap-priority-select">
          <option value="low">Low Priority</option>
          <option value="medium" selected>Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="critical">Critical</option>
        </select>
        <div class="bugsnap-annotations-preview">
          <p>${annotations.length} annotation(s) will be attached</p>
        </div>
        <div class="bugsnap-form-actions">
          <button class="bugsnap-cancel-btn">Cancel</button>
          <button class="bugsnap-create-btn">Create Task</button>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = form.querySelector('.bugsnap-close-btn');
    const cancelBtn = form.querySelector('.bugsnap-cancel-btn');
    const createBtn = form.querySelector('.bugsnap-create-btn');

    closeBtn.addEventListener('click', () => this.hide());
    cancelBtn.addEventListener('click', () => this.hide());
    createBtn.addEventListener('click', () => this.createTask());

    return form;
  }

  // Create task via API
  async createTask() {
    const title = this.container.querySelector('.bugsnap-title-input').value;
    const description = this.container.querySelector('.bugsnap-description-input').value;
    const priority = this.container.querySelector('.bugsnap-priority-select').value;

    if (!title.trim()) {
      alert('Task title is required');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'CREATE_TASK',
        data: {
          title: title.trim(),
          description: description.trim(),
          priority,
          // Annotations will be passed from content script
        }
      });

      if (response.success) {
        this.hide();
        // Show success message
      } else {
        alert('Failed to create task: ' + response.error);
      }
    } catch (error) {
      console.error('Task creation failed:', error);
      alert('Failed to create task');
    }
  }
}
```

## 4. Options Page (`options/`)

### Purpose
Extension configuration and advanced settings management.

### Key Components

#### SettingsManager
```javascript
class SettingsManager {
  constructor() {
    this.settings = {};
    this.defaults = {
      apiUrl: 'http://localhost:3001/api',
      theme: 'light',
      autoScreenshot: true,
      defaultProject: null,
      keyboardShortcuts: true
    };
  }

  // Load settings from storage
  async loadSettings() {
    const result = await chrome.storage.sync.get('settings');
    this.settings = { ...this.defaults, ...result.settings };
    return this.settings;
  }

  // Save settings to storage
  async saveSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    await chrome.storage.sync.set({ settings: this.settings });
  }

  // Reset to defaults
  async resetSettings() {
    await this.saveSettings(this.defaults);
  }

  // Get specific setting
  getSetting(key) {
    return this.settings[key];
  }

  // Set specific setting
  async setSetting(key, value) {
    await this.saveSettings({ [key]: value });
  }
}
```

#### AuthSettings
```javascript
class AuthSettings {
  constructor(container) {
    this.container = container;
    this.isAuthenticated = false;
  }

  // Render authentication settings
  async render() {
    const authStatus = await this.checkAuthStatus();

    if (authStatus.authenticated) {
      this.renderAuthenticatedView(authStatus.user);
    } else {
      this.renderLoginView();
    }
  }

  // Check current authentication status
  async checkAuthStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'CHECK_AUTH'
      });
      return response;
    } catch (error) {
      return { authenticated: false };
    }
  }

  // Render login form
  renderLoginView() {
    const form = document.createElement('div');
    form.className = 'bugsnap-auth-form';
    form.innerHTML = `
      <h3>Authentication</h3>
      <div class="bugsnap-form-group">
        <label>Email</label>
        <input type="email" class="bugsnap-email-input" />
      </div>
      <div class="bugsnap-form-group">
        <label>Password</label>
        <input type="password" class="bugsnap-password-input" />
      </div>
      <button class="bugsnap-login-btn">Login</button>
      <p class="bugsnap-auth-help">
        Login with your BugSnap account to start annotating.
      </p>
    `;

    const loginBtn = form.querySelector('.bugsnap-login-btn');
    loginBtn.addEventListener('click', () => this.login());

    this.container.appendChild(form);
  }

  // Render authenticated view
  renderAuthenticatedView(user) {
    const status = document.createElement('div');
    status.className = 'bugsnap-auth-status';
    status.innerHTML = `
      <h3>Authenticated</h3>
      <div class="bugsnap-user-info">
        <p><strong>${user.name}</strong></p>
        <p>${user.email}</p>
      </div>
      <button class="bugsnap-logout-btn">Logout</button>
    `;

    const logoutBtn = status.querySelector('.bugsnap-logout-btn');
    logoutBtn.addEventListener('click', () => this.logout());

    this.container.appendChild(status);
  }

  // Handle login
  async login() {
    const email = this.container.querySelector('.bugsnap-email-input').value;
    const password = this.container.querySelector('.bugsnap-password-input').value;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'AUTHENTICATE',
        data: { email, password }
      });

      if (response.success) {
        this.render();
      } else {
        alert('Login failed: ' + response.error);
      }
    } catch (error) {
      alert('Login failed');
    }
  }

  // Handle logout
  async logout() {
    try {
      await chrome.runtime.sendMessage({ action: 'LOGOUT' });
      this.render();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
```

## 5. Build System & Development Tools

### Webpack Configuration
```javascript
// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: process.env.NODE_ENV === 'development' ? 'cheap-module-source-map' : false,

  entry: {
    background: './src/background/background.js',
    content: './src/content/content.js',
    popup: './src/popup/popup.js',
    options: './src/options/options.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/assets', to: 'assets' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/options/options.html', to: 'options.html' }
      ]
    })
  ],

  resolve: {
    extensions: ['.js']
  }
};
```

### Development Scripts
```json
// package.json scripts
{
  "scripts": {
    "dev": "webpack --mode development --watch",
    "build": "webpack --mode production",
    "package": "npm run build && node scripts/package.js",
    "test": "jest",
    "lint": "eslint src/**/*.js"
  }
}
```

### Testing Setup
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage'
};
```

This component breakdown provides a comprehensive overview of the BugSnap extension architecture, with detailed implementations for each major component. The modular design allows for easy maintenance, testing, and feature additions.