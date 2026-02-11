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
    this.userEmail = null;
    this.recording = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordingStartTime = null;
    this.recordingTimerInterval = null;
    this.init();
  }

  init() {
    // Load reporter email from storage
    chrome.storage.local.get(['userEmail'], (result) => {
      this.userEmail = result.userEmail || null;
    });
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

  getCssSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    if (el.id) return '#' + CSS.escape(el.id);

    const parts = [];
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      if (current.id) {
        parts.unshift('#' + CSS.escape(current.id));
        break;
      }
      let tag = current.tagName.toLowerCase();
      // Add classes, filtering out bugsnap-injected ones
      const classes = Array.from(current.classList || [])
        .filter(c => !c.startsWith('bugsnap'))
        .map(c => '.' + CSS.escape(c))
        .join('');
      // nth-of-type for uniqueness among siblings
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(s => s.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          tag += classes + ':nth-of-type(' + index + ')';
        } else {
          tag += classes;
        }
      } else {
        tag += classes;
      }
      parts.unshift(tag);
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  handleElementTag(e) {
    if (!this.isTagging) return;

    e.preventDefault();
    e.stopPropagation();

    this.selectedElement = e.target;
    this.clickX = e.clientX;
    this.clickY = e.clientY;
    this.isTagging = false;
    document.body.style.cursor = 'default';
    
    // Keep the highlight on selected element
    this.selectedElement.style.outline = '3px solid #3b82f6';
    this.selectedElement.style.outlineOffset = '2px';

    // Add pin marker at click coordinates
    this.addPinMarker(e.clientX, e.clientY);

    // Remove overlay and listeners
    const overlay = document.getElementById('bugsnap-tagging-overlay');
    if (overlay) overlay.remove();
    document.removeEventListener('click', this.tagClickHandler, true);
    document.removeEventListener('mousemove', this.hoverHandler, true);

    // Capture screenshot after a brief delay to ensure highlight is rendered
    setTimeout(() => this.captureScreenshot(), 300);
  }

  addPinMarker(clickX, clickY) {
    // Remove any existing pin (ensure only one pin at a time)
    if (this.pinMarker) {
      this.pinMarker.remove();
      this.pinMarker = null;
    }

    const pin = document.createElement('div');
    pin.className = 'bugsnap-pin';
    pin.style.cssText = `
      position: fixed;
      top: ${clickY - 24}px;
      left: ${clickX - 4}px;
      width: 24px;
      height: 24px;
      background: #ef4444;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      z-index: 10000000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      pointer-events: none;
    `;
    const inner = document.createElement('div');
    inner.style.cssText = `
      width: 10px;
      height: 10px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    pin.appendChild(inner);
    document.body.appendChild(pin);
    this.pinMarker = pin;
  }

  async captureScreenshot() {
    try {
      // Small delay to ensure element highlight is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use chrome.runtime.sendMessage to capture screenshot
      chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
        if (chrome.runtime.lastError) {
          alert('Failed to capture screenshot: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (response && response.screenshot) {
          this.screenshot = response.screenshot;
          this.showAnnotationModal();
        } else {
          alert('Failed to capture screenshot - no image received');
        }
      });
    } catch (error) {
      alert('Failed to capture screenshot: ' + error.message);
    }
  }

  showAnnotationModal() {
    // Hide pin marker — it's already captured in the screenshot image,
    // no need to show the DOM element on top of the modal
    if (this.pinMarker) {
      this.pinMarker.style.display = 'none';
    }

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
      flex-direction: column;
    `;

    // Toolbar (top) - horizontal design
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
      height: 60px;
      background: white;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

    toolbar.innerHTML = `
      <!-- Select Tool -->
      <button class="tool-btn" data-tool="cursor" style="
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      " title="Select">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>
      </button>

      <!-- Pen Tool -->
      <button class="tool-btn" data-tool="pen" style="
        background: white;
        border: 1px solid #e5e7eb;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      " title="Pen">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      </button>

      <!-- Rectangle Tool -->
      <button class="tool-btn active" data-tool="rectangle" style="
        background: #3b82f6;
        border: 1px solid #3b82f6;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      " title="Rectangle">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
      </button>

      <!-- Highlighter Tool -->
      <button class="tool-btn" data-tool="highlighter" style="
        background: white;
        border: 1px solid #e5e7eb;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      " title="Highlighter">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><rect width="18" height="8" x="3" y="8" rx="1" fill="#6b7280" fill-opacity="0.3" stroke="none"/><rect width="18" height="8" x="3" y="8" rx="1"/></svg>
      </button>

      <!-- Arrow Tool -->
      <button class="tool-btn" data-tool="arrow" style="
        background: white;
        border: 1px solid #e5e7eb;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      " title="Arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>

      <!-- Text Tool -->
      <button class="tool-btn" data-tool="text" style="
        background: white;
        border: 1px solid #e5e7eb;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      " title="Text">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
      </button>

      <!-- Divider -->
      <div style="width: 1px; height: 24px; background: #e5e7eb; margin: 0 4px;"></div>

      <!-- Stroke Width -->
      <select id="bugsnap-stroke-width" style="
        padding: 6px 8px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        font-size: 13px;
        background: white;
        cursor: pointer;
        color: #374151;
      " title="Stroke Width">
        <option value="1">1px</option>
        <option value="2" selected>2px</option>
        <option value="3">3px</option>
        <option value="4">4px</option>
        <option value="5">5px</option>
      </select>

      <!-- Divider -->
      <div style="width: 1px; height: 24px; background: #e5e7eb; margin: 0 4px;"></div>

      <!-- Color Selector -->
      <div style="display: flex; gap: 6px; align-items: center;">
        <button class="color-btn" data-color="#ef4444" style="
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #ef4444;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 0 1px #e5e7eb;
        " title="Red"></button>
        <button class="color-btn" data-color="#3b82f6" style="
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #3b82f6;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 0 1px #e5e7eb;
        " title="Blue"></button>
        <button class="color-btn" data-color="#10b981" style="
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #10b981;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 0 1px #e5e7eb;
        " title="Green"></button>
        <button class="color-btn" data-color="#f59e0b" style="
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #f59e0b;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 0 1px #e5e7eb;
        " title="Yellow"></button>
        <button class="color-btn" data-color="#8b5cf6" style="
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #8b5cf6;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 0 1px #e5e7eb;
        " title="Purple"></button>
      </div>

      <!-- Divider -->
      <div style="width: 1px; height: 24px; background: #e5e7eb; margin: 0 4px;"></div>

      <!-- Undo -->
      <button id="bugsnap-undo" style="
        background: white;
        border: 1px solid #e5e7eb;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, border-color 0.2s;
      " title="Undo (Ctrl+Z)"
      onmouseover="this.style.background='#f3f4f6'; this.style.borderColor='#d1d5db'"
      onmouseout="this.style.background='white'; this.style.borderColor='#e5e7eb'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
      </button>

      <!-- Redo -->
      <button id="bugsnap-redo" style="
        background: white;
        border: 1px solid #e5e7eb;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, border-color 0.2s;
      " title="Redo (Ctrl+Y)"
      onmouseover="this.style.background='#f3f4f6'; this.style.borderColor='#d1d5db'"
      onmouseout="this.style.background='white'; this.style.borderColor='#e5e7eb'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/></svg>
      </button>

      <!-- Delete -->
      <button id="bugsnap-delete-annotation" style="
        background: white;
        border: 1px solid #e5e7eb;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      " title="Delete Selected">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>

      <!-- Divider -->
      <div style="width: 1px; height: 24px; background: #e5e7eb; margin: 0 4px;"></div>

      <!-- Record Screen Button -->
      <button id="bugsnap-record-btn" style="
        background: white;
        border: 1px solid #e5e7eb;
        color: #6b7280;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.2s;
      " title="Record Screen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="none"><circle cx="12" cy="12" r="7"/></svg>
        <span>Record</span>
      </button>

      <!-- Spacer -->
      <div style="flex: 1;"></div>

      <!-- Save as Task Button -->
      <button id="bugsnap-save-annotation" style="
        background: #10b981;
        border: 1px solid #10b981;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
      " title="Save as Task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h8"/></svg>
        <span>Save as Task</span>
      </button>

      <!-- Cancel Button -->
      <button id="bugsnap-cancel-annotation" style="
        background: white;
        border: 1px solid #e5e7eb;
        color: #6b7280;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
      " title="Cancel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        <span>Cancel</span>
      </button>
    `;

    // Screenshot container (below toolbar)
    const screenshotContainer = document.createElement('div');
    screenshotContainer.id = 'bugsnap-screenshot-container';
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
        <img id="bugsnap-screenshot" src="${this.screenshot}" style="max-width: 100%; max-height: calc(100vh - 100px); display: block;">
      </div>
    `;

    modal.appendChild(toolbar);
    modal.appendChild(screenshotContainer);
    document.body.appendChild(modal);

    // Initialize MarkMyImage annotation library
    setTimeout(() => {
      const screenshotDiv = screenshotContainer.querySelector('div');
      this.markMyImage = new MarkMyImage(screenshotDiv, {
        strokeColor: '#ef4444',
        strokeWidth: 2,
        fillColor: 'rgba(239, 68, 68, 0.1)',
        fontSize: 16,
        fontFamily: 'Arial'
      });
    }, 100);

    // Initialize selected color
    this.selectedColor = '#ef4444';

    // Setup toolbar buttons
    const toolButtons = toolbar.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
      btn.onclick = () => {
        // Update button styles
        toolButtons.forEach(b => {
          b.style.background = 'white';
          b.style.border = '1px solid #e5e7eb';
          const svg = b.querySelector('svg');
          if (svg) svg.setAttribute('stroke', '#6b7280');
        });
        btn.style.background = '#3b82f6';
        btn.style.border = '1px solid #3b82f6';
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('stroke', 'white');
        
        this.currentTool = btn.dataset.tool;
        if (this.markMyImage) {
          this.markMyImage.setTool(btn.dataset.tool);
        }
      };
    });

    // Setup color buttons
    const colorButtons = toolbar.querySelectorAll('.color-btn');
    colorButtons.forEach(btn => {
      btn.onclick = () => {
        colorButtons.forEach(b => b.style.border = '2px solid #fff');
        btn.style.border = '3px solid #3b82f6';
        this.selectedColor = btn.dataset.color;
        if (this.markMyImage) {
          this.markMyImage.setColor(btn.dataset.color);
        }
      };
    });

    // Setup stroke width selector
    document.getElementById('bugsnap-stroke-width').onchange = (e) => {
      if (this.markMyImage) {
        this.markMyImage.setStrokeWidth(parseInt(e.target.value));
      }
    };

    // Setup undo/redo buttons
    document.getElementById('bugsnap-undo').onclick = () => {
      if (this.markMyImage) {
        this.markMyImage.undo();
      }
    };

    document.getElementById('bugsnap-redo').onclick = () => {
      if (this.markMyImage) {
        this.markMyImage.redo();
      }
    };

    // Setup delete button
    document.getElementById('bugsnap-delete-annotation').onclick = () => {
      if (this.markMyImage) {
        this.markMyImage.deleteSelectedAnnotation();
      }
    };

    // Setup record button
    document.getElementById('bugsnap-record-btn').onclick = () => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    };

    // Setup save/cancel buttons
    document.getElementById('bugsnap-cancel-annotation').onclick = () => {
      document.body.style.overflow = ''; // Re-enable scrolling
      modal.remove();
      this.reset();
      this.startTagging();
    };

    document.getElementById('bugsnap-save-annotation').onclick = () => {
      // Keep the annotation modal open, just show task form
      this.showTaskForm();
    };

    this.currentTool = 'rectangle';
  }



  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'tab', frameRate: 30 },
        audio: false,
      });

      this.recordedChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        this.recording = new Blob(this.recordedChunks, { type: 'video/webm' });
        stream.getTracks().forEach((t) => t.stop());
        this.updateRecordButton(false);
        clearInterval(this.recordingTimerInterval);
      };

      // If user stops sharing via browser UI, handle gracefully
      stream.getVideoTracks()[0].onended = () => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.recordingStartTime = Date.now();
      this.updateRecordButton(true);

      // Update timer display
      this.recordingTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        const timerEl = document.getElementById('bugsnap-record-timer');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
      }, 1000);
    } catch (err) {
      // User cancelled the picker or permission denied
      console.log('Recording cancelled or failed:', err.message);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  updateRecordButton(isRecording) {
    const btn = document.getElementById('bugsnap-record-btn');
    if (!btn) return;

    // Clear existing children
    while (btn.firstChild) btn.removeChild(btn.firstChild);

    if (isRecording) {
      btn.style.background = '#fef2f2';
      btn.style.borderColor = '#ef4444';
      btn.style.color = '#ef4444';

      // Stop icon (square)
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', '#ef4444');
      svg.setAttribute('stroke-width', '2');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '6');
      rect.setAttribute('y', '6');
      rect.setAttribute('width', '12');
      rect.setAttribute('height', '12');
      rect.setAttribute('rx', '1');
      svg.appendChild(rect);
      btn.appendChild(svg);

      // Timer
      const timer = document.createElement('span');
      timer.id = 'bugsnap-record-timer';
      timer.style.fontVariantNumeric = 'tabular-nums';
      timer.textContent = '00:00';
      btn.appendChild(timer);

      // "Stop" label
      const label = document.createElement('span');
      label.textContent = 'Stop';
      btn.appendChild(label);
    } else {
      const hasRecording = !!this.recording;
      btn.style.background = hasRecording ? '#f0fdf4' : 'white';
      btn.style.borderColor = hasRecording ? '#22c55e' : '#e5e7eb';
      btn.style.color = hasRecording ? '#16a34a' : '#6b7280';

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');

      if (hasRecording) {
        // Checkmark icon
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#16a34a');
        svg.setAttribute('stroke-width', '2');
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14');
        svg.appendChild(path1);
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        path2.setAttribute('points', '22 4 12 14.01 9 11.01');
        svg.appendChild(path2);
      } else {
        // Red circle (record) icon
        svg.setAttribute('fill', '#ef4444');
        svg.setAttribute('stroke', 'none');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '12');
        circle.setAttribute('cy', '12');
        circle.setAttribute('r', '7');
        svg.appendChild(circle);
      }

      btn.appendChild(svg);
      const label = document.createElement('span');
      label.textContent = hasRecording ? 'Recorded' : 'Record';
      btn.appendChild(label);
    }
  }

  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data URL prefix to get raw base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async showTaskForm() {
    // First, fetch the next task number
    let nextTaskNumber = 1;
    try {
      chrome.storage.local.get(['token'], async (result) => {
        const token = result.token;
        
        // Send message to background script to fetch next task number (avoids CORS issues)
        chrome.runtime.sendMessage({ action: 'fetchNextTaskNumber', token, projectId: this.project.id }, (response) => {
          if (chrome.runtime.lastError) {
            this.showTaskFormWithNumber(nextTaskNumber);
            return;
          }

          if (response.error) {
            this.showTaskFormWithNumber(nextTaskNumber);
            return;
          }

          nextTaskNumber = response.nextTaskNumber;
          this.showTaskFormWithNumber(nextTaskNumber);
        });
      });
    } catch (error) {
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
      this.submitTask(title, description);
    };
  }

  async submitTask(title, description) {
    const submitBtn = document.getElementById('bugsnap-submit-task');
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    try {
      // Get token from Chrome storage
      chrome.storage.local.get(['token'], async (result) => {
        const token = result.token;
        const rect = this.selectedElement.getBoundingClientRect();

        // Get annotations from MarkMyImage library
        const annotations = this.markMyImage ? this.markMyImage.getAnnotations() : [];

        // Capture annotation canvas size for coordinate scaling in the frontend
        const screenshotImg = document.getElementById('bugsnap-screenshot');
        const annotationCanvasSize = screenshotImg
          ? { width: screenshotImg.clientWidth, height: screenshotImg.clientHeight }
          : null;

        const payload = {
          projectId: this.project.id,
          title: title || 'Untitled', // User's title, API will prepend task number
          description: description,
          url: window.location.href,
          screenshotUrl: this.screenshot,
          environmentData: {
            browser: navigator.userAgent,
            os: navigator.platform,
            timestamp: new Date().toISOString(),
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : (window.innerWidth <= 1024 ? 'tablet' : 'desktop'),
            reporterEmail: this.userEmail || undefined,
            annotationCanvasSize: annotationCanvasSize,
            selectedElement: {
              tagName: this.selectedElement.tagName,
              innerText: this.selectedElement.innerText?.substring(0, 100),
              cssSelector: this.getCssSelector(this.selectedElement),
              clickX: this.clickX,
              clickY: this.clickY,
              devicePixelRatio: window.devicePixelRatio || 1,
              boundingClientRect: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
              }
            }
          },
          annotations: annotations || []
        };

        // Send message to background script to create task (avoids CORS issues)
        chrome.runtime.sendMessage({ action: 'createTask', token, payload }, (response) => {
          if (chrome.runtime.lastError) {
            alert('Failed to create task: ' + chrome.runtime.lastError.message);
            submitBtn.textContent = 'Create Task';
            submitBtn.disabled = false;
            return;
          }

          if (response.error) {
            alert('Failed to create task: ' + response.error);
            submitBtn.textContent = 'Create Task';
            submitBtn.disabled = false;
            return;
          }

          // Upload screen recording as attachment if one was captured
          if (this.recording && response.task && response.task.id) {
            submitBtn.textContent = 'Uploading recording...';
            this.blobToBase64(this.recording).then((base64Data) => {
              chrome.runtime.sendMessage({
                action: 'uploadRecording',
                token,
                issueId: response.task.id,
                recordingBase64: base64Data,
              }, (uploadResponse) => {
                if (uploadResponse && uploadResponse.error) {
                  console.warn('Recording upload failed:', uploadResponse.error);
                }
                this.showSuccess();
              });
            });
          } else {
            this.showSuccess();
          }
        });
      });
    } catch (error) {
      alert('Failed to create task: ' + error.message);
      submitBtn.textContent = 'Create Task';
      submitBtn.disabled = false;
    }
  }

  showSuccess() {
    // Close task form modal
    const taskModal = document.getElementById('bugsnap-task-modal');
    if (taskModal) taskModal.remove();
    
    // Close annotation modal
    const annotationModal = document.getElementById('bugsnap-annotation-modal');
    if (annotationModal) {
      document.body.style.overflow = ''; // Re-enable scrolling
      annotationModal.remove();
    }

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
    // Remove highlight from selected element
    if (this.selectedElement) {
      this.selectedElement.style.outline = '';
      this.selectedElement.style.outlineOffset = '';
    }
    this.selectedElement = null;
    this.screenshot = null;
    this.annotations = [];
    this.selectedAnnotationIndex = null;
    this.isTagging = false;

    // Clean up recording state
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    this.mediaRecorder = null;
    this.recording = null;
    this.recordedChunks = [];
    if (this.recordingTimerInterval) {
      clearInterval(this.recordingTimerInterval);
      this.recordingTimerInterval = null;
    }
    this.recordingStartTime = null;

    // Remove pin marker
    if (this.pinMarker) {
      this.pinMarker.remove();
      this.pinMarker = null;
    }

    // Clean up MarkMyImage instance
    if (this.markMyImage) {
      this.markMyImage.destroy();
      this.markMyImage = null;
    }
  }
}

// Export for use in content script
window.BugSnapUI = BugSnapUI;