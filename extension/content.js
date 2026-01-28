// Content Script for page annotation
(function () {
  let isAnnotationMode = false;
  let selectedElement = null;
  let currentAnnotations = [];
  let overlay = null;
  let annotationForm = null;

  // Element highlighting styles
  const HIGHLIGHT_STYLE = `
    outline: 2px solid #6366f1 !important;
    outline-offset: 2px !important;
    background-color: rgba(99, 102, 241, 0.05) !important;
  `;

  const SELECTED_STYLE = `
    outline: 3px solid #ef4444 !important;
    outline-offset: 2px !important;
    background-color: rgba(239, 68, 68, 0.1) !important;
  `;

  // Toggle annotation mode
  function toggleAnnotationMode() {
    isAnnotationMode = !isAnnotationMode;

    if (isAnnotationMode) {
      activateAnnotationMode();
    } else {
      deactivateAnnotationMode();
    }
  }

  // Activate annotation mode
  function activateAnnotationMode() {
    console.log('Annotation mode activated');

    // Show floating button and toolbar
    showFloatingButton();
    showToolbar();

    // Change cursor
    document.body.style.cursor = 'crosshair';

    // Add event listeners
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);

    // Show notification
    showNotification('Annotation mode active - Click any element to annotate');
  }

  // Deactivate annotation mode
  function deactivateAnnotationMode() {
    console.log('Annotation mode deactivated');

    // Reset cursor
    document.body.style.cursor = '';

    // Remove event listeners
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);

    // Clear highlights
    if (selectedElement) {
      selectedElement.style.cssText = selectedElement.getAttribute('data-bugsnap-original-style') || '';
      selectedElement = null;
    }

    // Remove overlay
    if (overlay) {
      overlay.remove();
      overlay = null;
    }

    // Remove annotation form
    if (annotationForm) {
      annotationForm.remove();
      annotationForm = null;
    }

    // Remove floating button
    const floatingBtn = document.querySelector('.bugsnap-floating-btn');
    if (floatingBtn) {
      floatingBtn.remove();
    }

    // Remove toolbar
    const toolbar = document.querySelector('.bugsnap-toolbar');
    if (toolbar) {
      toolbar.remove();
    }

    isAnnotationMode = false;
  }

  // Handle mouse over
  function handleMouseOver(event) {
    if (!isAnnotationMode) return;

    const element = event.target;

    // Skip BugSnap elements
    if (element.classList.contains('bugsnap-overlay') ||
        element.closest('.bugsnap-overlay')) {
      return;
    }

   // Store original style
    if (!element.hasAttribute('data-bugsnap-original-style')) {
      element.setAttribute('data-bugsnap-original-style', element.style.cssText);
    }

    // Apply highlight
    element.style.cssText += HIGHLIGHT_STYLE;
  }

  // Handle mouse out
  function handleMouseOut(event) {
    if (!isAnnotationMode) return;

    const element = event.target;

    // Skip if this is the selected element
    if (element === selectedElement) return;

    // Restore original style
    const originalStyle = element.getAttribute('data-bugsnap-original-style');
    if (originalStyle !== null) {
      element.style.cssText = originalStyle;
      element.removeAttribute('data-bugsnap-original-style');
    }
  }

  // Handle element click
  function handleClick(event) {
    if (!isAnnotationMode) return;

    event.preventDefault();
    event.stopPropagation();

    const element = event.target;

    // Skip BugSnap elements
    if (element.classList.contains('bugsnap-overlay') ||
        element.closest('.bugsnap-overlay')) {
      return;
    }

    selectElement(element);
  }

  // Select element for annotation
  function selectElement(element) {
    // Remove previous selection
    if (selectedElement) {
      const originalStyle = selectedElement.getAttribute('data-bugsnap-original-style');
      if (originalStyle !== null) {
        selectedElement.style.cssText = originalStyle;
      }
    }

    // Select new element
    selectedElement = element;

    // Store original style
    if (!element.hasAttribute('data-bugsnap-original-style')) {
      element.setAttribute('data-bugsnap-original-style', element.style.cssText);
    }

    // Apply selected style
    element.style.cssText += SELECTED_STYLE;

    // Show annotation form
    showAnnotationForm(element);
  }

  // Show annotation form
  function showAnnotationForm(element) {
    // Remove existing form and backdrop
    if (annotationForm) {
      annotationForm.remove();
    }
    const existingBackdrop = document.querySelector('.bugsnap-backdrop');
    if (existingBackdrop) {
      existingBackdrop.remove();
    }

    const rect = element.getBoundingClientRect();

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'bugsnap-backdrop';
    document.body.appendChild(backdrop);

    // Create draggable form
    annotationForm = document.createElement('div');
    annotationForm.className = 'bugsnap-overlay bugsnap-annotation-modal';
    annotationForm.innerHTML = `
      <div class="bugsnap-modal-header">
        <div class="bugsnap-drag-handle">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="3" cy="4" r="1.5" fill="#9ca3af"/>
            <circle cx="8" cy="4" r="1.5" fill="#9ca3af"/>
            <circle cx="13" cy="4" r="1.5" fill="#9ca3af"/>
            <circle cx="3" cy="8" r="1.5" fill="#9ca3af"/>
            <circle cx="8" cy="8" r="1.5" fill="#9ca3af"/>
            <circle cx="13" cy="8" r="1.5" fill="#9ca3af"/>
          </svg>
          <span class="bugsnap-title-text">CREATE TASK</span>
        </div>
        <button class="bugsnap-close-btn">×</button>
      </div>
      <div class="bugsnap-modal-body">
        <div class="bugsnap-modal-left">
          <textarea class="bugsnap-description-input" placeholder="Add description" rows="8"></textarea>
          <div class="bugsnap-char-count">0 / 2000</div>
          <div class="bugsnap-screenshot-preview">
            <div class="bugsnap-screenshot-placeholder">
              <svg width="40" height="40" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <div class="bugsnap-screenshot-status">Screenshot will be captured</div>
            </div>
          </div>
        </div>
        <div class="bugsnap-modal-right">
          <input type="text" class="bugsnap-title-input" placeholder="Task title (required)" />
          <select class="bugsnap-select">
            <option value="">Assignee(s)</option>
          </select>
          <select class="bugsnap-priority-select bugsnap-select">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select class="bugsnap-select">
            <option value="">Backlog</option>
          </select>
          <input type="text" class="bugsnap-input" placeholder="Tag(s)" />
          <label class="bugsnap-checkbox-label">
            <input type="checkbox" class="bugsnap-checkbox" />
            Keep these settings
          </label>
        </div>
      </div>
      <div class="bugsnap-modal-footer">
        <button class="bugsnap-create-task-btn">Create task</button>
      </div>
    `;

    // Position modal  (centered)
    annotationForm.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      max-width: 90vw;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 2147483646;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    // Make draggable
    makeDraggable(annotationForm);

    // Add event listeners
    annotationForm.querySelector('.bugsnap-close-btn').addEventListener('click', () => {
      annotationForm.remove();
      backdrop.remove();
      annotationForm = null;
      deactivateAnnotationMode();
    });

    annotationForm.querySelector('.bugsnap-create-task-btn').addEventListener('click', () => {
      createTask(element);
    });

    // Character counter
    const descInput = annotationForm.querySelector('.bugsnap-description-input');
    const charCount = annotationForm.querySelector('.bugsnap-char-count');
    descInput.addEventListener('input', () => {
      const count = descInput.value.length;
      charCount.textContent = `${count} / 2000`;
      if (count > 2000) {
        charCount.style.color = '#ef4444';
      } else {
        charCount.style.color = '#6b7280';
      }
    });

    document.body.appendChild(annotationForm);

    // Focus title input
    annotationForm.querySelector('.bugsnap-title-input').focus();
  }

  // Make element draggable
  function makeDraggable(element) {
    const header = element.querySelector('.bugsnap-modal-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', dragStart);

    function dragStart(e) {
      if (e.target.closest('.bugsnap-close-btn')) return;

      isDragging = true;
      header.style.cursor = 'grabbing';

      const rect = element.getBoundingClientRect();
      initialX = e.clientX - rect.left;
      initialY = e.clientY - rect.top;

      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);
    }

    function drag(e) {
      if (!isDragging) return;

      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      element.style.left = currentX + 'px';
      element.style.top = currentY + 'px';
      element.style.transform = 'none';
    }

    function dragEnd() {
      isDragging = false;
      header.style.cursor = 'grab';

      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', dragEnd);
    }
  }

  // Create task from annotation
  async function createTask(element) {
    const titleInput = annotationForm.querySelector('.bugsnap-title-input');
    const descriptionInput = annotationForm.querySelector('.bugsnap-description-input');
    const prioritySelect = annotationForm.querySelector('.bugsnap-priority-select');

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const priority = prioritySelect.value;

    if (!title) {
      alert('Please enter a task title');
      titleInput.focus();
      return;
    }

    // Show loading state
    const createBtn = annotationForm.querySelector('.bugsnap-create-task-btn');
    const originalText = createBtn.textContent;
    createBtn.disabled = true;
    createBtn.textContent = 'Creating task...';

    try {
      // Capture screenshot
      showNotification('Capturing screenshot...', 'info');
      const screenshotData = await captureElementScreenshot(element);

      // Get active project
      const { projectId } = await chrome.runtime.sendMessage({
        action: 'GET_ACTIVE_PROJECT'
      });

      if (!projectId) {
        alert('No project found for this website. Please set up a project in the dashboard.');
        createBtn.disabled = false;
        createBtn.textContent = originalText;
        return;
      }

      // Create task with annotation
      const taskData = {
        projectId,
        title,
        description,
        priority,
        url: window.location.href,
        screenshotUrl: screenshotData,
        environmentData: {
          browser: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          element: {
            tagName: element.tagName,
            classList: Array.from(element.classList),
            id: element.id,
            xpath: getXPath(element)
          }
        }
      };

      const response = await chrome.runtime.sendMessage({
        action: 'CREATE_TASK',
        data: taskData
      });

      if (response.success) {
        showNotification('Task created successfully!', 'success');
        
        // Remove backdrop
        const backdrop = document.querySelector('.bugsnap-backdrop');
        if (backdrop) backdrop.remove();
        
        annotationForm.remove();
        annotationForm = null;
        deactivateAnnotationMode();
      } else {
        throw new Error(response.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task: ' + error.message);
      createBtn.disabled = false;
      createBtn.textContent = originalText;
    }
  }

  // Capture element screenshot
  async function captureElementScreenshot(element) {
    try {
      // Use chrome.tabs.captureVisibleTab for now
      const response = await chrome.runtime.sendMessage({ action: 'CAPTURE_TAB' });
      return response.dataUrl;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    }
  }

  // Get XPath of element
  function getXPath(element) {
    if (element.id !== '') {
      return `//*[@id="${element.id}"]`;
    }

    if (element === document.body) {
      return '/html/body';
    }

    let ix = 0;
    const siblings = element.parentNode?.childNodes || [];

    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
      }

      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }

    return '';
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'bugsnap-overlay bugsnap-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#10b981' : '#6366f1'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 2147483647;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TOGGLE_ANNOTATION_MODE') {
      toggleAnnotationMode();
      sendResponse({ success: true });
    }
    return true;
  });

  // Listen for extension icon click (via badge)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'ACTIVATE_ANNOTATION') {
      if (!isAnnotationMode) {
        toggleAnnotationMode();
      }
    }
  });

  // Show floating pencil button
  function showFloatingButton() {
    // Remove existing button
    const existingBtn = document.querySelector('.bugsnap-floating-btn');
    if (existingBtn) return;

    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'bugsnap-overlay bugsnap-floating-btn';
    floatingBtn.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    `;

    document.body.appendChild(floatingBtn);

    // Toggle toolbar on click
    floatingBtn.addEventListener('click', () => {
      const toolbar = document.querySelector('.bugsnap-toolbar');
      if (toolbar) {
        toolbar.classList.toggle('hidden');
      }
    });
  }

  // Show vertical toolbar
  function showToolbar() {
    // Remove existing toolbar
    const existingToolbar = document.querySelector('.bugsnap-toolbar');
    if (existingToolbar) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'bugsnap-overlay bugsnap-toolbar hidden';
    toolbar.innerHTML = `
      <button class="bugsnap-tool-btn" data-tool="select" title="Select">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="rectangle" title="Rectangle">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" strokeWidth="2" rx="2" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="arrow" title="Arrow">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17l9.2-9.2M17 17V7h-10" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="pen" title="Pen">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="text" title="Text">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="delete" title="Delete">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      <div class="bugsnap-toolbar-divider"></div>
      <button class="bugsnap-color-btn" style="background: #fbbf24;" data-color="#fbbf24" title="Color"></button>
      <button class="bugsnap-tool-btn bugsnap-save-btn" data-tool="save" title="Save">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn bugsnap-close-toolbar-btn" data-tool="close" title="Close">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div class="bugsnap-drag-dots">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="#9ca3af">
          <circle cx="3" cy="2" r="1.5"/>
          <circle cx="8" cy="2" r="1.5"/>
          <circle cx="13" cy="2" r="1.5"/>
          <circle cx="3" cy="6" r="1.5"/>
          <circle cx="8" cy="6" r="1.5"/>
          <circle cx="13" cy="6" r="1.5"/>
          <circle cx="3" cy="10" r="1.5"/>
          <circle cx="8" cy="10" r="1.5"/>
          <circle cx="13" cy="10" r="1.5"/>
        </svg>
      </div>
    `;

    document.body.appendChild(toolbar);

    // Add tool button handlers
    toolbar.querySelectorAll('.bugsnap-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        handleToolClick(tool);
      });
    });

    // Make toolbar draggable
    makeToolbarDraggable(toolbar);
  }

  // Handle tool clicks
  function handleToolClick(tool) {
    console.log('Tool selected:', tool);

    const toolbar = document.querySelector('.bugsnap-toolbar');
    
    // Remove active class from all buttons
    toolbar.querySelectorAll('.bugsnap-tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Handle specific tools
    switch (tool) {
      case 'close':
        deactivateAnnotationMode();
        break;
      case 'save':
        // Save annotations (placeholder)
        showNotification('Annotations saved', 'success');
        break;
      case 'delete':
        // Clear annotations selector  (placeholder)
        showNotification('Select annotation to delete', 'info');
        break;
      default:
        // Activate tool and mark as active
        const activeBtn = toolbar.querySelector(`[data-tool="${tool}"]`);
        if (activeBtn) {
          activeBtn.classList.add('active');
        }
        break;
    }
  }

  // Make toolbar draggable
  function makeToolbarDraggable(toolbar) {
    const dragHandle = toolbar.querySelector('.bugsnap-drag-dots');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    dragHandle.addEventListener('mousedown', dragStart);

    function dragStart(e) {
      isDragging = true;
      dragHandle.style.cursor = 'grabbing';

      const rect = toolbar.getBoundingClientRect();
      initialX = e.clientX - rect.left;
      initialY = e.clientY - rect.top;

      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);
    }

    function drag(e) {
      if (!isDragging) return;

      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      // Keep toolbar within viewport
      const maxX = window.innerWidth - toolbar.offsetWidth;
      const maxY = window.innerHeight - toolbar.offsetHeight;

      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));

      toolbar.style.left = currentX + 'px';
      toolbar.style.top = currentY + 'px';
    }

    function dragEnd() {
      isDragging = false;
      dragHandle.style.cursor = 'grab';

      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', dragEnd);
    }
  }

  // Listen for token sync from web app
  window.addEventListener('message', async (event) => {
    // Only accept messages from same origin or specific origins
    if (event.data.type === 'BUGSNAP_AUTH_TOKEN' && event.data.source === 'bugsnap-webapp') {
      const { token } = event.data;

      if (token) {
        // Send token to background script to store
        chrome.runtime.sendMessage({
          action: 'SYNC_TOKEN_FROM_WEBAPP',
          data: { token }
        });

        console.log('Token received from web app and synced to extension');
      }
    }

    // Handle logout sync from web app
    if (event.data.type === 'BUGSNAP_LOGOUT' && event.data.source === 'bugsnap-webapp') {
      // Send logout message to background script
      chrome.runtime.sendMessage({ action: 'LOGOUT' });
      console.log('Logout synced from web app to extension');
    }

    // Respond to ping from web app
    if (event.data.type === 'BUGSNAP_EXTENSION_PING' && event.data.source === 'bugsnap-webapp') {
      window.postMessage({
        type: 'BUGSNAP_EXTENSION_PONG',
        source: 'bugsnap-extension'
      }, '*');
    }

    // Respond to user info request
    if (event.data.type === 'BUGSNAP_GET_USER' && event.data.source === 'bugsnap-webapp') {
      const response = await chrome.runtime.sendMessage({ action: 'GET_USER_INFO' });

      window.postMessage({
        type: 'BUGSNAP_USER_DATA',
        source: 'bugsnap-extension',
        user: response.user || null
      }, '*');
    }
  });

  // Auto-show floating button if on a project website
  async function autoShowFloatingButton() {
    try {
      // Wait a bit for authentication to sync
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user is authenticated
      const authResponse = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
      console.log('Auth check:', authResponse);
      
      if (!authResponse.authenticated) {
        console.log('Not authenticated');
        return;
      }

      // Get all projects
      const projectsResponse = await chrome.runtime.sendMessage({ action: 'GET_PROJECTS' });
      console.log('Projects response:', projectsResponse);

      if (!projectsResponse.success || !projectsResponse.projects) {
        console.log('No projects found');
        return;
      }

      // Match current URL with projects
      const currentHostname = window.location.hostname;
      console.log('Current hostname:', currentHostname);

      const matchingProject = projectsResponse.projects.find(project => {
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
        console.log('Matching project found:', matchingProject.name);
        
        // Set active project
        await chrome.runtime.sendMessage({
          action: 'SET_ACTIVE_PROJECT',
          data: { projectId: matchingProject.id }
        });

        // Show floating button
        showFloatingButtonStandalone();
        showToolbarStandalone();
      } else {
        console.log('No matching project for this URL');
      }
    } catch (error) {
      console.error('Error auto-showing floating button:', error);
    }
  }

  // Show floating button (standalone, not part of annotation mode)
  function showFloatingButtonStandalone() {
    // Don't create if already exists
    if (document.querySelector('.bugsnap-floating-btn'))return;

    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'bugsnap-overlay bugsnap-floating-btn';
    floatingBtn.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    `;

    document.body.appendChild(floatingBtn);

    // Toggle toolbar on click
    floatingBtn.addEventListener('click', () => {
      const toolbar = document.querySelector('.bugsnap-toolbar');
      if (toolbar) {
        toolbar.classList.toggle('hidden');
      }
    });

    console.log('Floating button created and added to page');
  }

  // Show toolbar (standalone)
  function showToolbarStandalone() {
    // Don't create if already exists
    if (document.querySelector('.bugsnap-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'bugsnap-overlay bugsnap-toolbar hidden';
    toolbar.innerHTML = `
      <button class="bugsnap-tool-btn" data-tool="select" title="Select">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="rectangle" title="Rectangle">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" strokeWidth="2" rx="2" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="arrow" title="Arrow">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17l9.2-9.2M17 17V7h-10" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="pen" title="Pen">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="text" title="Text">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn" data-tool="delete" title="Delete">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      <div class="bugsnap-toolbar-divider"></div>
      <button class="bugsnap-color-btn" style="background: #fbbf24;" data-color="#fbbf24" title="Color"></button>
      <button class="bugsnap-tool-btn bugsnap-save-btn" data-tool="save" title="Save">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      </button>
      <button class="bugsnap-tool-btn bugsnap-close-toolbar-btn" data-tool="close" title="Close">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div class="bugsnap-drag-dots">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="#9ca3af">
          <circle cx="3" cy="2" r="1.5"/>
          <circle cx="8" cy="2" r="1.5"/>
          <circle cx="13" cy="2" r="1.5"/>
          <circle cx="3" cy="6" r="1.5"/>
          <circle cx="8" cy="6" r="1.5"/>
          <circle cx="13" cy="6" r="1.5"/>
          <circle cx="3" cy="10" r="1.5"/>
          <circle cx="8" cy="10" r="1.5"/>
          <circle cx="13" cy="10" r="1.5"/>
        </svg>
      </div>
    `;

    document.body.appendChild(toolbar);

    // Add tool button handlers
    toolbar.querySelectorAll('.bugsnap-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        handleToolClickStandalone(tool);
      });
    });

    // Make toolbar draggable
    makeToolbarDraggable(toolbar);

    console.log('Toolbar created and added to page');
  }

  // Handle tool clicks (standalone)
  function handleToolClickStandalone(tool) {
    console.log('Tool selected:', tool);

    const toolbar = document.querySelector('.bugsnap-toolbar');
    
    // Remove active class from all buttons
    toolbar.querySelectorAll('.bugsnap-tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Handle specific tools
    switch (tool) {
      case 'close':
        // Just hide the toolbar, keep the floating button
        toolbar.classList.add('hidden');
        break;
      case 'select':
        // Activate element selection mode
        const activeBtn = toolbar.querySelector(`[data-tool="${tool}"]`);
        if (activeBtn) {
          activeBtn.classList.add('active');
        }
        activateAnnotationMode();
        break;
      case 'save':
        showNotification('Annotations saved', 'success');
        break;
      case 'delete':
        showNotification('Select annotation to delete', 'info');
        break;
      default:
        // Activate tool
        const btn = toolbar.querySelector(`[data-tool="${tool}"]`);
        if (btn) {
          btn.classList.add('active');
        }
        break;
    }
  }

  // Check on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoShowFloatingButton);
  } else {
    autoShowFloatingButton();
  }

  console.log('BugSnap content script loaded');
})();