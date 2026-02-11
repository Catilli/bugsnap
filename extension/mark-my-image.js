// Mark My Image - Image Annotation Library
// A simplified version for BugSnap extension

class MarkMyImage {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      strokeColor: options.strokeColor || '#ef4444',
      strokeWidth: options.strokeWidth || 2,
      fillColor: options.fillColor || 'rgba(239, 68, 68, 0.1)',
      fontSize: options.fontSize || 16,
      fontFamily: options.fontFamily || 'Arial',
      // Text label background config
      textBackground: options.textBackground || 'rgba(0, 0, 0, 0.6)',
      textColor: options.textColor || '#ffffff',
      textPaddingX: options.textPaddingX ?? 6,
      textPaddingY: options.textPaddingY ?? 4,
      textBorderRadius: options.textBorderRadius ?? 4,
      ...options
    };
    
    this.annotations = [];
    this.selectedAnnotationIndex = null;
    this.currentTool = 'rectangle';
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.currentPath = [];
    this.history = [];
    this.historyIndex = -1;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    
    this.init();
  }
  
  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      cursor: crosshair;
    `;
    this.container.appendChild(this.canvas);
    
    // Get context
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.resize();
    
    // Add event listeners
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    // Add keyboard shortcuts
    this.keydownHandler = (e) => this.handleKeyDown(e);
    document.addEventListener('keydown', this.keydownHandler);
    
    // Handle resize
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.redraw();
  }
  
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    switch(this.currentTool) {
      case 'cursor':
        // Select annotation
        const clickedIndex = this.annotations.findIndex(ann => this.isPointInAnnotation(x, y, ann));
        if (clickedIndex >= 0) {
          this.selectedAnnotationIndex = clickedIndex;
          this.isDragging = true;
          this.dragStartX = x;
          this.dragStartY = y;
          
          // Calculate offset from annotation position
          const ann = this.annotations[clickedIndex];
          const bounds = this.getAnnotationBounds(ann);
          this.dragOffsetX = x - bounds.x;
          this.dragOffsetY = y - bounds.y;
        } else {
          this.selectedAnnotationIndex = null;
        }
        this.redraw();
        break;
        
      case 'rectangle':
      case 'arrow':
      case 'highlighter':
        this.startX = x;
        this.startY = y;
        this.isDrawing = true;
        break;
        
      case 'pen':
        this.currentPath = [{ x, y }];
        this.isDrawing = true;
        break;
        
      case 'text':
        this.handleTextInput(x, y);
        break;
    }
  }
  
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Handle dragging selected annotation
    if (this.isDragging && this.selectedAnnotationIndex !== null) {
      const ann = this.annotations[this.selectedAnnotationIndex];
      const deltaX = x - this.dragStartX;
      const deltaY = y - this.dragStartY;
      
      // Update annotation position based on type
      switch(ann.type) {
        case 'rectangle':
        case 'highlighter':
          ann.coordinates.x += deltaX;
          ann.coordinates.y += deltaY;
          break;
        case 'arrow':
          ann.coordinates.startX += deltaX;
          ann.coordinates.startY += deltaY;
          ann.coordinates.endX += deltaX;
          ann.coordinates.endY += deltaY;
          break;
        case 'pen':
          ann.coordinates.points = ann.coordinates.points.map(p => ({
            x: p.x + deltaX,
            y: p.y + deltaY
          }));
          break;
        case 'text':
          ann.coordinates.x += deltaX;
          ann.coordinates.y += deltaY;
          break;
      }
      
      this.dragStartX = x;
      this.dragStartY = y;
      this.redraw();
      return;
    }
    
    if (!this.isDrawing) return;
    
    // Redraw all saved annotations
    this.redraw();
    
    // Draw current tool preview
    switch(this.currentTool) {
      case 'rectangle':
        this.drawRectangle(this.startX, this.startY, x - this.startX, y - this.startY);
        break;

      case 'highlighter':
        this.drawHighlighter(this.startX, this.startY, x - this.startX, y - this.startY);
        break;

      case 'arrow':
        this.drawArrow(this.startX, this.startY, x, y);
        break;

      case 'pen':
        this.currentPath.push({ x, y });
        this.drawPen(this.currentPath);
        break;
    }
  }
  
  handleMouseUp(e) {
    // Handle end of dragging
    if (this.isDragging) {
      this.isDragging = false;
      if (this.selectedAnnotationIndex !== null) {
        this.saveToHistory();
      }
      return;
    }
    
    if (!this.isDrawing) return;
    this.isDrawing = false;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Save annotation based on tool
    let annotation = null;
    
    switch(this.currentTool) {
      case 'rectangle':
        if (Math.abs(x - this.startX) > 5 && Math.abs(y - this.startY) > 5) {
          annotation = {
            type: 'rectangle',
            coordinates: {
              x: Math.min(this.startX, x),
              y: Math.min(this.startY, y),
              width: Math.abs(x - this.startX),
              height: Math.abs(y - this.startY)
            },
            color: this.options.strokeColor
          };
        }
        break;

      case 'highlighter':
        if (Math.abs(x - this.startX) > 5 && Math.abs(y - this.startY) > 5) {
          annotation = {
            type: 'highlighter',
            coordinates: {
              x: Math.min(this.startX, x),
              y: Math.min(this.startY, y),
              width: Math.abs(x - this.startX),
              height: Math.abs(y - this.startY)
            },
            color: this.options.strokeColor
          };
        }
        break;

      case 'arrow':
        if (Math.abs(x - this.startX) > 5 || Math.abs(y - this.startY) > 5) {
          annotation = {
            type: 'arrow',
            coordinates: {
              startX: this.startX,
              startY: this.startY,
              endX: x,
              endY: y
            },
            color: this.options.strokeColor
          };
        }
        break;
        
      case 'pen':
        if (this.currentPath.length > 1) {
          annotation = {
            type: 'pen',
            coordinates: {
              points: [...this.currentPath]
            },
            color: this.options.strokeColor
          };
        }
        this.currentPath = [];
        break;
    }
    
    if (annotation) {
      this.annotations.push(annotation);
      this.saveToHistory();
      this.redraw();
    }
  }
  
  handleTextInput(x, y) {
    const input = document.createElement('input');
    input.type = 'text';
    
    // Get the correct position relative to the canvas
    const canvasRect = this.canvas.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    input.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      border: 2px solid ${this.options.strokeColor};
      padding: 4px 8px;
      font-size: ${this.options.fontSize}px;
      font-family: ${this.options.fontFamily};
      z-index: 10000001;
      background: white;
      color: #374151;
      min-width: 20px;
      max-width: 500px;
      border-radius: 4px;
      outline: none;
    `;
    
    // Auto-adjust width based on input
    const adjustWidth = () => {
      // Create a temporary span to measure text width
      const span = document.createElement('span');
      span.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: pre;
        font-size: ${this.options.fontSize}px;
        font-family: ${this.options.fontFamily};
        padding: 4px 8px;
      `;
      span.textContent = input.value || 'a'; // Minimum width for 1 character
      document.body.appendChild(span);
      input.style.width = (span.offsetWidth + 10) + 'px';
      document.body.removeChild(span);
    };
    
    this.container.appendChild(input);
    adjustWidth();
    setTimeout(() => input.focus(), 10);
    
    // Adjust width as user types
    input.oninput = adjustWidth;
    
    const saveText = () => {
      if (input.value.trim()) {
        this.annotations.push({
          type: 'text',
          content: input.value.trim(),
          coordinates: { x, y: y + 5 },
          color: this.options.strokeColor
        });
        this.saveToHistory();
        this.redraw();
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
  }
  
  drawRectangle(x, y, width, height, style = {}) {
    const color = style.color || this.options.strokeColor;
    this.ctx.strokeStyle = style.strokeColor || color;
    this.ctx.lineWidth = style.lineWidth || this.options.strokeWidth;
    
    // Convert hex to rgba for fill
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    this.ctx.fillStyle = style.fillColor || this.options.fillColor;
    
    if (style.fillColor !== 'none') {
      this.ctx.fillRect(x, y, width, height);
    }
    this.ctx.strokeRect(x, y, width, height);
  }
  
  drawHighlighter(x, y, width, height, style = {}) {
    const color = style.color || this.options.strokeColor;
    // Parse hex color for rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    this.ctx.fillRect(x, y, width, height);
    // No stroke for highlighter
  }

  drawArrow(fromX, fromY, toX, toY, style = {}) {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const color = style.color || this.options.strokeColor;
    
    this.ctx.strokeStyle = style.strokeColor || color;
    this.ctx.lineWidth = style.lineWidth || this.options.strokeWidth;
    
    // Draw line
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    
    // Draw arrow head
    this.ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    this.ctx.stroke();
  }
  
  drawPen(points, style = {}) {
    if (points.length < 2) return;
    
    const color = style.color || this.options.strokeColor;
    this.ctx.strokeStyle = style.strokeColor || color;
    this.ctx.lineWidth = style.lineWidth || this.options.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.stroke();
  }
  
  drawText(text, x, y, style = {}) {
    const font = style.font || `${this.options.fontSize}px ${this.options.fontFamily}`;
    this.ctx.font = font;

    const padX = this.options.textPaddingX;
    const padY = this.options.textPaddingY;
    const radius = this.options.textBorderRadius;

    // Measure text for background sizing
    const metrics = this.ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = this.options.fontSize;

    // Background rectangle positioned around the text baseline
    const bgX = x - padX;
    const bgY = y - textHeight - padY;
    const bgW = textWidth + padX * 2;
    const bgH = textHeight + padY * 2;

    // Draw rounded background pill
    this.ctx.fillStyle = this.options.textBackground;
    this.ctx.beginPath();
    this.ctx.moveTo(bgX + radius, bgY);
    this.ctx.lineTo(bgX + bgW - radius, bgY);
    this.ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + radius);
    this.ctx.lineTo(bgX + bgW, bgY + bgH - radius);
    this.ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - radius, bgY + bgH);
    this.ctx.lineTo(bgX + radius, bgY + bgH);
    this.ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - radius);
    this.ctx.lineTo(bgX, bgY + radius);
    this.ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
    this.ctx.closePath();
    this.ctx.fill();

    // Draw text in contrasting color
    this.ctx.fillStyle = this.options.textColor;
    this.ctx.fillText(text, x, y);
  }
  
  redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw all saved annotations
    this.annotations.forEach((ann, index) => {
      const isSelected = index === this.selectedAnnotationIndex;
      const style = {
        color: ann.color,
        strokeColor: isSelected && this.currentTool === 'cursor' ? '#3b82f6' : ann.color
      };
      
      switch (ann.type) {
        case 'rectangle':
          this.drawRectangle(ann.coordinates.x, ann.coordinates.y, ann.coordinates.width, ann.coordinates.height, style);
          break;
        case 'highlighter':
          this.drawHighlighter(ann.coordinates.x, ann.coordinates.y, ann.coordinates.width, ann.coordinates.height, style);
          break;
        case 'arrow':
          this.drawArrow(ann.coordinates.startX, ann.coordinates.startY, ann.coordinates.endX, ann.coordinates.endY, style);
          break;
        case 'pen':
          this.drawPen(ann.coordinates.points, style);
          break;
        case 'text':
          this.drawText(ann.content, ann.coordinates.x, ann.coordinates.y, style);
          break;
      }
      
      // Draw selection box for selected annotation
      if (isSelected && this.currentTool === 'cursor') {
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        const bounds = this.getAnnotationBounds(ann);
        this.ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
        this.ctx.setLineDash([]);
      }
    });
  }
  
  getAnnotationBounds(ann) {
    switch(ann.type) {
      case 'rectangle':
      case 'highlighter':
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
        this.ctx.font = `${this.options.fontSize}px ${this.options.fontFamily}`;
        const textW = this.ctx.measureText(ann.content).width;
        const padX2 = this.options.textPaddingX;
        const padY2 = this.options.textPaddingY;
        return {
          x: ann.coordinates.x - padX2,
          y: ann.coordinates.y - this.options.fontSize - padY2,
          width: textW + padX2 * 2,
          height: this.options.fontSize + padY2 * 2
        };
    }
  }
  
  isPointInAnnotation(x, y, ann) {
    const bounds = this.getAnnotationBounds(ann);
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }
  
  setTool(tool) {
    this.currentTool = tool;
  }
  
  setColor(color) {
    this.options.strokeColor = color;
  }
  
  setStrokeWidth(width) {
    this.options.strokeWidth = width;
  }
  
  setFontSize(size) {
    this.options.fontSize = size;
  }
  
  getAnnotations() {
    return this.annotations;
  }
  
  setAnnotations(annotations) {
    this.annotations = annotations;
    this.redraw();
  }
  
  clearAnnotations() {
    this.annotations = [];
    this.selectedAnnotationIndex = null;
    this.redraw();
  }
  
  deleteSelectedAnnotation() {
    if (this.selectedAnnotationIndex !== null && this.selectedAnnotationIndex >= 0) {
      this.annotations.splice(this.selectedAnnotationIndex, 1);
      this.selectedAnnotationIndex = null;
      this.saveToHistory();
      this.redraw();
    }
  }
  
  saveToHistory() {
    // Remove any history after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    // Save current state
    this.history.push(JSON.parse(JSON.stringify(this.annotations)));
    this.historyIndex++;
    // Limit history to 50 states
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }
  
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedAnnotationIndex = null;
      this.redraw();
    }
  }
  
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.selectedAnnotationIndex = null;
      this.redraw();
    }
  }
  
  canUndo() {
    return this.historyIndex > 0;
  }
  
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }
  
  handleKeyDown(e) {
    // Ignore if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Delete key - delete selected annotation
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.deleteSelectedAnnotation();
    }
    
    // Ctrl+Z - undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
    }
    
    // Ctrl+Y or Ctrl+Shift+Z - redo
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      this.redo();
    }
    
    // Ctrl+A - select all (not implemented yet, but can be added)
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      // Could implement "select all annotations" feature here
    }
  }
  
  destroy() {
    this.canvas.removeEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.removeEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.removeEventListener('mouseup', (e) => this.handleMouseUp(e));
    document.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('resize', () => this.resize());
    this.canvas.remove();
  }
}

// Export for use in extension
window.MarkMyImage = MarkMyImage;