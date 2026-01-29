// BugSnap UI - Element tagging and screenshot capture
// This file creates the overlay UI elements using vanilla JavaScript

class BugSnapUI {
  constructor(project) {
    this.project = project;
    this.isTagging = false;
    this.selectedElement = null;
    this.screenshot = null;
    this.annotations = [];
    this.selectedAnnotationIndex = null;
    this.currentTool = 'rectangle';
    this.init();
  }

  init() {
    // Auto-start tagging mode on page load
    this.startTagging();
  }

  startTagging() {
    this.isTagging = true;
    this.hoveredElement = null;
    document.body.style.cursor = 'crosshair';
    
    // Add overlay
    const overlay = document.createElement('div');
    overlay.id = 'bugsnap-tagging-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.1);
      z-index: 999998;
      cursor: crosshair;
      pointer-events: none;
    `;
    document.body.appendChild(overlay);

    // Add hover listener for element highlighting
    this.hoverHandler = (e) => this.handleElementHover(e);
    document.addEventListener('mousemove', this.hoverHandler, true);

    // Add click listener
    this.tagClickHandler = (e) => this.handleElementTag(e);
    document.addEventListener('click', this.tagClickHandler, true);
  }

  handleElementHover(e) {
    if (!this.isTagging) return;

    // Remove previous highlight
    if (this.hoveredElement) {
      this.hoveredElement.style.outline = '';
      this.hoveredElement.style.outlineOffset = '';
    }

    // Highlight current element
    this.hoveredElement = e.target;
    this.hoveredElement.style.outline = '3px solid #3b82f6';
    this.hoveredElement.style.outlineOffset = '2px';
  }

  handleElementTag(e) {
    if (!this.isTagging) return;
    
    e.preventDefault();
    e.stopPropagation();

    this.selectedElement = e.target;
    this.isTagging = false;
    document.body.style.cursor = 'default';
    
    // Keep the highlight on selected element 
    this.selectedElement.style.outline = '3px solid #3b82f6';
    this.selectedElement.style.outlineOffset = '2px';
    
    // Remove overlay and listeners
    const overlay = document.getElementById('bugsnap-tagging-overlay');
    if (overlay) overlay.remove();
    document.removeEventListener('click', this.tagClickHandler, true);
    document.removeEventListener('mousemove', this.hoverHandler, true);

    // Capture screenshot after a brief delay to ensure highlight is rendered
    setTimeout(() => this.captureScreenshot(), 300);
  }

  async captureScreenshot() {
    try {
      console.log('[BugSnap UI] Requesting screenshot...');
      
      // Small delay to ensure element highlight is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use chrome.runtime.sendMessage to capture screenshot
      chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
        console.log('[BugSnap UI] Screenshot response:', response);
        
        if (chrome.runtime.lastError) {
          console.error('[BugSnap UI] Chrome runtime error:', chrome.runtime.lastError);
          alert('Failed to capture screenshot: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.screenshot) {
          console.log('[BugSnap UI] Screenshot captured successfully');
          this.screenshot = response.screenshot;
          this.showAnnotationModal();
        } else {
          console.error('[BugSnap UI] No screenshot in response');
          alert('Failed to capture screenshot - no image received');
        }
      });
    } catch (error) {
      console.error('[BugSnap UI] Screenshot error:', error);
      alert('Failed to capture screenshot: ' + error.message);
    }
  }

  showAnnotationModal() {
    // Disable page scrolling
    document.body.style.overflow = 'hidden';

    const modal = document.createElement('div');
    modal.id = 'bugsnap-annotation-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #1f2937;
      z-index: 9999999;
      display: flex;
    `;

    // Screenshot container (left side) - scrollable
    const screenshotContainer = document.createElement('div');
    screenshotContainer.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow: auto;
    `;

    screenshotContainer.innerHTML = `
      <div style="position: relative; max-width: 100%; max-height: 100%;">
        <img id="bugsnap-screenshot" src="${this.screenshot}" style="max-width: 100%; max-height: calc(100vh - 40px); display: block;">
        <canvas id="bugsnap-canvas" style="position: absolute; top: 0; left: 0; cursor: crosshair;"></canvas>
      </div>
    `;

    // Toolbar (right side) - minimalist design with color picker
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      width: 64px;
      background: #374151;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;
      gap: 20px;
    `;

    toolbar.innerHTML = `
      <!-- Cursor/Select Tool -->
      <button class="tool-btn" data-tool="cursor" style="
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 0;
        margin: 0;
      " title="Select">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>
      </button>

      <!-- Rectangle Tool -->
      <button class="tool-btn active" data-tool="rectangle" style="
        background: none;
        border: none;
        color: #3b82f6;
        cursor: pointer;
        padding: 0;
        margin: 0;
      " title="Rectangle">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
      </button>

      <!-- Pen Tool -->
      <button class="tool-btn" data-tool="pen" style="
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 0;
        margin: 0;
      " title="Pen">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      </button>

      <!-- Arrow Tool -->
      <button class="tool-btn" data-tool="arrow" style="
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 0;
        margin: 0;
      " title="Arrow">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>

      <!-- Text Tool -->
      <button class="tool-btn" data-tool="text" style="
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 0;
        margin: 0;
      " title="Text">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
      </button>

      <!-- Divider -->
      <div style="width: 40px; height: 1px; background: #4b5563;"></div>

      <!-- Color Selector -->
      <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
        <button class="color-btn" data-color="#ef4444" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid #fff;
          cursor: pointer;
        " title="Red"></button>
        <button class="color-btn" data-color="#3b82f6" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid transparent;
          cursor: pointer;
        " title="Blue"></button>
        <button class="color-btn" data-color="#10b981" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #10b981;
          border: 2px solid transparent;
          cursor: pointer;
        " title="Green"></button>
        <button class="color-btn" data-color="#f59e0b" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f59e0b;
          border: 2px solid transparent;
          cursor: pointer;
        " title="Yellow"></button>
        <button class="color-btn" data-color="#8b5cf6" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #8b5cf6;
          border: 2px solid transparent;
          cursor: pointer;
        " title="Purple"></button>
      </div>

      <!-- Spacer -->
      <div style="flex: 1;"></div>

      <!-- Delete Button -->
      <button id="bugsnap-delete-annotation" style="
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        padding: 0;
        margin: 0;
      " title="Delete Selected">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>

      <!-- Save Button (at bottom) -->
      <button id="bugsnap-save-annotation" style="
        background: none;
        border: none;
        color: #10b981;
        cursor: pointer;
        padding: 0;
        margin: 0;
      " title="Save & Continue">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h8"/></svg>
      </button>

      <!-- Close Button -->
      <button id="bugsnap-cancel-annotation" style="
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        padding: 0;
        margin: 0;
      " title="Close">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    `;

    modal.appendChild(screenshotContainer);
    modal.appendChild(toolbar);
    document.body.appendChild(modal);

    // Setup annotation canvas
    setTimeout(() => this.setupAnnotationCanvas(), 100);

    // Initialize selected color
    this.selectedColor = '#ef4444';

    // Setup toolbar buttons
    const toolButtons = toolbar.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
      btn.onclick = () => {
        toolButtons.forEach(b => b.style.color = '#9ca3af');
        btn.style.color = '#3b82f6';
        this.currentTool = btn.dataset.tool;
      };
    });

    // Setup color buttons
    const colorButtons = toolbar.querySelectorAll('.color-btn');
    colorButtons.forEach(btn => {
      btn.onclick = () => {
        colorButtons.forEach(b => b.style.border = '2px solid transparent');
        btn.style.border = '2px solid #fff';
        this.selectedColor = btn.dataset.color;
      };
    });

    // Setup save/cancel buttons
    document.getElementById('bugsnap-cancel-annotation').onclick = () => {
      document.body.style.overflow = ''; // Re-enable scrolling
      modal.remove();
      this.reset();
    };

    document.getElementById('bugsnap-save-annotation').onclick = () => {
      document.body.style.overflow = ''; // Re-enable scrolling
      modal.remove();
      this.showTaskForm();
    };

    this.currentTool = 'rectangle';
  }

  setupAnnotationCanvas() {
    const img = document.getElementById('bugsnap-screenshot');
    const canvas = document.getElementById('bugsnap-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.offsetWidth;
    canvas.height = img.offsetHeight;

    // Initialize annotations array instead of single annotation
    this.annotations = [];
    this.selectedAnnotationIndex = null;
    
    // Drawing state
    let isDrawing = false;
    let startX, startY;
    let currentPath = [];
    
    // Helper functions for drawing
    const drawRectangle = (x, y, width, height, style = {}) => {
      const color = style.color || this.selectedColor || '#ef4444';
      ctx.strokeStyle = style.strokeColor || color;
      ctx.lineWidth = style.lineWidth || 2;
      
      // Convert hex to rgba for fill
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.fillStyle = style.fillColor || `rgba(${r}, ${g}, ${b}, 0.1)`;
      
      if (style.fillColor !== 'none') {
        ctx.fillRect(x, y, width, height);
      }
      ctx.strokeRect(x, y, width, height);
    };

    const drawArrow = (fromX, fromY, toX, toY, style = {}) => {
      const headlen = 15; // arrow head length
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const color = style.color || this.selectedColor || '#ef4444';
      
      ctx.strokeStyle = style.strokeColor || color;
      ctx.lineWidth = style.lineWidth || 2;
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      
      // Draw arrow head
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    };

    const drawPen = (points, style = {}) => {
      if (points.length < 2) return;
      
      const color = style.color || this.selectedColor || '#ef4444';
      ctx.strokeStyle = style.strokeColor || color;
      ctx.lineWidth = style.lineWidth || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    };

    const drawText = (text, x, y, style = {}) => {
      const color = style.color || this.selectedColor || '#ef4444';
      ctx.font = style.font || '16px Arial';
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    const redrawAnnotations = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw all saved annotations
      this.annotations.forEach((ann, index) => {
        const isSelected = index === this.selectedAnnotationIndex;
        const style = {
          color: ann.color,
          strokeColor: isSelected && this.currentTool === 'cursor' ? '#3b82f6' : ann.color
        };
        
        switch (ann.type) {
          case 'rectangle':
            drawRectangle(ann.coordinates.x, ann.coordinates.y, ann.coordinates.width, ann.coordinates.height, style);
            break;
          case 'arrow':
            drawArrow(ann.coordinates.startX, ann.coordinates.startY, ann.coordinates.endX, ann.coordinates.endY, style);
            break;
          case 'pen':
            drawPen(ann.coordinates.points, style);
            break;
          case 'text':
            drawText(ann.content, ann.coordinates.x, ann.coordinates.y, style);
            break;
        }
        
        // Draw selection box for selected annotation
        if (isSelected && this.currentTool === 'cursor') {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          
          const bounds = this.getAnnotationBounds(ann);
          ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
          ctx.setLineDash([]);
        }
      });
    };

    // Get bounding box for annotation (for selection)
    this.getAnnotationBounds = (ann) => {
      switch(ann.type) {
        case 'rectangle':
          return {
            x: ann.coordinates.x,
            y: ann.coordinates.y,
            width: ann.coordinates.width,
            height: ann.coordinates.height
          };
        case 'arrow':
          return {
            x: Math.min(ann.coordinates.startX, ann.coordinates.endX),
            y: Math.min(ann.coordinates.startY, ann.coordinates.endY),
            width: Math.abs(ann.coordinates.endX - ann.coordinates.startX),
            height: Math.abs(ann.coordinates.endY - ann.coordinates.startY)
          };
        case 'pen':
          const xs = ann.coordinates.points.map(p => p.x);
          const ys = ann.coordinates.points.map(p => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        case 'text':
          // Approximate text bounds
          return {
            x: ann.coordinates.x,
            y: ann.coordinates.y - 16,
            width: ann.content.length * 8,
            height: 20
          };
      }
    };

    // Check if point is inside annotation
    const isPointInAnnotation = (x, y, ann) => {
      const bounds = this.getAnnotationBounds(ann);
      return x >= bounds.x && x <= bounds.x + bounds.width &&
             y >= bounds.y && y <= bounds.y + bounds.height;
    };

    // Handle text input
    const handleTextInput = (x, y) => {
      // Get the correct position relative to the screenshot container
      const rect = canvas.getBoundingClientRect();
      const containerRect = canvas.parentElement.getBoundingClientRect();
      
      const input = document.createElement('input');
      input.type = 'text';
      input.style.cssText = `
        position: absolute;
        left: ${rect.left - containerRect.left + x}px;
        top: ${rect.top - containerRect.top + y}px;
        border: 2px solid ${this.selectedColor};
        padding: 4px 8px;
        font-size: 16px;
        font-family: Arial;
        z-index: 10000000;
        background: white;
        color: #374151;
        min-width: 150px;
        border-radius: 4px;
      `;
      
      canvas.parentElement.appendChild(input);
      input.focus();
      
      const saveText = () => {
        if (input.value.trim()) {
          this.annotations.push({
            type: 'text',
            content: input.value.trim(),
            coordinates: { x, y: y + 5 }, // Adjust y slightly for better alignment
            color: this.selectedColor
          });
          redrawAnnotations();
        }
        input.remove();
      };
      
      input.onblur = saveText;
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveText();
        }
        if (e.key === 'Escape') {
          input.remove();
        }
      };
    };

    // Mouse events
    canvas.onmousedown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      switch(this.currentTool) {
        case 'cursor':
          // Select annotation
          this.selectedAnnotationIndex = this.annotations.findIndex(ann => isPointInAnnotation(x, y, ann));
          redrawAnnotations();
          break;
          
        case 'rectangle':
        case 'arrow':
          startX = x;
          startY = y;
          isDrawing = true;
          break;
          
        case 'pen':
          currentPath = [{ x, y }];
          isDrawing = true;
          break;
          
        case 'text':
          handleTextInput(x, y);
          break;
      }
    };

    canvas.onmousemove = (e) => {
      if (!isDrawing) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Redraw all saved annotations
      redrawAnnotations();
      
      // Draw current tool preview
      switch(this.currentTool) {
        case 'rectangle':
          drawRectangle(startX, startY, x - startX, y - startY);
          break;
          
        case 'arrow':
          drawArrow(startX, startY, x, y);
          break;
          
        case 'pen':
          currentPath.push({ x, y });
          drawPen(currentPath);
          break;
      }
    };

    canvas.onmouseup = (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Save annotation based on tool
      let annotation = null;
      
      switch(this.currentTool) {
        case 'rectangle':
          if (Math.abs(x - startX) > 5 && Math.abs(y - startY) > 5) {
            annotation = {
              type: 'rectangle',
              coordinates: {
                x: Math.min(startX, x),
                y: Math.min(startY, y),
                width: Math.abs(x - startX),
                height: Math.abs(y - startY)
              },
              color: this.selectedColor
            };
          }
          break;
          
        case 'arrow':
          if (Math.abs(x - startX) > 5 || Math.abs(y - startY) > 5) {
            annotation = {
              type: 'arrow',
              coordinates: {
                startX: startX,
                startY: startY,
                endX: x,
                endY: y
              },
              color: this.selectedColor
            };
          }
          break;
          
        case 'pen':
          if (currentPath.length > 1) {
            annotation = {
              type: 'pen',
              coordinates: {
                points: [...currentPath]
              },
              color: this.selectedColor
            };
          }
          currentPath = [];
          break;
      }
      
      if (annotation) {
        this.annotations.push(annotation);
        redrawAnnotations();
      }
    };

    // Setup delete button handler
    document.getElementById('bugsnap-delete-annotation').onclick = () => {
      if (this.selectedAnnotationIndex !== null && this.selectedAnnotationIndex >= 0) {
        this.annotations.splice(this.selectedAnnotationIndex, 1);
        this.selectedAnnotationIndex = null;
        redrawAnnotations();
      }
    };
  }

  async showTaskForm() {
    // First, fetch the next task number
    let nextTaskNumber = 1;
    try {
      chrome.storage.local.get(['token'], async (result) => {
        const token = result.token;
        
        const response = await fetch(`http://localhost:3001/api/projects/${this.project.id}/next-task-number`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          nextTaskNumber = data.nextTaskNumber;
        }
        
        // Now show the form with the correct task number
        this.showTaskFormWithNumber(nextTaskNumber);
      });
    } catch (error) {
      console.error('Failed to fetch next task number:', error);
      // Show form with default number if fetch fails
      this.showTaskFormWithNumber(nextTaskNumber);
    }
  }
  
  showTaskFormWithNumber(taskNumber) {
    const modal = document.createElement('div');
    modal.id = 'bugsnap-task-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    const form = document.createElement('div');
    form.style.cssText = `
      background: white;
      border-radius: 8px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    `;

    form.innerHTML = `
      <!-- Header with Task Number -->
      <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
        <h2 style="margin: 0; font-size: 15px; font-weight: 400; color: #9ca3af;">
          Task #${taskNumber}
        </h2>
        <button id="bugsnap-close-task" style="
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        ">×</button>
      </div>

      <!-- Main Content - Responsive -->
      <div id="bugsnap-task-content" style="padding: 20px;">
        <!-- Title -->
        <div style="margin-bottom: 12px;">
          <input id="bugsnap-task-title" type="text" placeholder="Task title (e.g., Button not working)" style="
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            font-family: inherit;
            color: #374151;
            box-sizing: border-box;
          ">
        </div>

        <!-- Description -->
        <div style="margin-bottom: 12px;">
          <textarea id="bugsnap-task-description" rows="5" placeholder="Add description" style="
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            resize: vertical;
            font-family: inherit;
            color: #374151;
            box-sizing: border-box;
            min-height: 100px;
          "></textarea>
        </div>

        <!-- Priority and Assignee row -->
        <div id="bugsnap-task-options" style="display: flex; gap: 12px; margin-bottom: 16px;">
          <select id="bugsnap-task-priority" style="
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            box-sizing: border-box;
          ">
            <option value="">Priority</option>
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          
          <select id="bugsnap-task-assignee" style="
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            box-sizing: border-box;
          ">
            <option value="">Assignee(s)</option>
          </select>
        </div>

        <!-- Create Button -->
        <button id="bugsnap-submit-task" style="
          width: 100%;
          padding: 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
          Create task
        </button>
      </div>

      <!-- Add responsive styles -->
      <style>
        @media (max-width: 480px) {
          #bugsnap-task-modal > div {
            width: 95% !important;
            margin: 0 10px;
          }
          #bugsnap-task-content {
            padding: 15px !important;
          }
          #bugsnap-task-options {
            flex-direction: column !important;
          }
        }
        @media (min-width: 768px) {
          #bugsnap-task-modal > div {
            max-width: 500px !important;
          }
        }
      </style>
    `;

    modal.appendChild(form);
    document.body.appendChild(modal);

    // Setup buttons
    document.getElementById('bugsnap-close-task').onclick = () => {
      modal.remove();
      this.reset();
    };

    document.getElementById('bugsnap-submit-task').onclick = () => {
      const title = document.getElementById('bugsnap-task-title').value;
      const description = document.getElementById('bugsnap-task-description').value;
      const assignee = document.getElementById('bugsnap-task-assignee').value;
      const priority = document.getElementById('bugsnap-task-priority').value;
      
      this.submitTask(title, description, assignee, priority);
    };
  }

  async submitTask(title, description, assignee, priority) {
    const submitBtn = document.getElementById('bugsnap-submit-task');
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    try {
      // Get token from Chrome storage
      chrome.storage.local.get(['token'], async (result) => {
        const token = result.token;
        const rect = this.selectedElement.getBoundingClientRect();

        const payload = {
          projectId: this.project.id,
          title: title || 'Untitled', // User's title, API will prepend task number
          description: description,
          url: window.location.href,
          screenshotUrl: this.screenshot,
          priority: priority || 'medium',
          assignedToId: assignee === 'current-user' ? undefined : assignee || undefined,
          environmentData: {
            browser: navigator.userAgent,
            os: navigator.platform,
            timestamp: new Date().toISOString(),
            selectedElement: {
              tagName: this.selectedElement.tagName,
              innerText: this.selectedElement.innerText?.substring(0, 100),
              boundingClientRect: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
              }
            }
          },
          annotations: this.annotations || []
        };

        const response = await fetch('http://localhost:3001/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          this.showSuccess();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create task');
        }
      });
    } catch (error) {
      console.error('Task creation error:', error);
      alert('Failed to create task: ' + error.message);
      submitBtn.textContent = 'Create Task';
      submitBtn.disabled = false;
    }
  }

  showSuccess() {
    const modal = document.getElementById('bugsnap-task-modal');
    if (modal) modal.remove();

    const success = document.createElement('div');
    success.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 9999999;
      font-size: 16px;
      font-weight: 500;
    `;
    success.textContent = '✓ Task created successfully!';
    document.body.appendChild(success);

    setTimeout(() => {
      success.remove();
      this.reset();
    }, 2000);
  }

  reset() {
    this.selectedElement = null;
    this.screenshot = null;
    this.annotations = [];
    this.selectedAnnotationIndex = null;
    this.isTagging = false;
  }
}

// Export for use in content script
window.BugSnapUI = BugSnapUI;