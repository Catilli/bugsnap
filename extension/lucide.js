// Lucide Icons v0.263.1 - Minimal version for BugSnap extension
// This is a simplified version of Lucide icons containing only the icons we need

const lucideIcons = {
  'refresh-cw': {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    paths: [
      'path',
      'path',
      'path',
      'path'
    ],
    d: [
      'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
      'M21 3v5h-5',
      'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
      'M8 16H3v5'
    ]
  }
};

function createIcons() {
  // Find all elements with data-lucide attribute
  const elements = document.querySelectorAll('[data-lucide]');
  
  elements.forEach(element => {
    const iconName = element.getAttribute('data-lucide');
    const icon = lucideIcons[iconName];
    
    if (icon) {
      // Create SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', element.getAttribute('width') || icon.width);
      svg.setAttribute('height', element.getAttribute('height') || icon.height);
      svg.setAttribute('viewBox', icon.viewBox);
      svg.setAttribute('fill', icon.fill);
      svg.setAttribute('stroke', icon.stroke);
      svg.setAttribute('stroke-width', icon['stroke-width']);
      svg.setAttribute('stroke-linecap', icon['stroke-linecap']);
      svg.setAttribute('stroke-linejoin', icon['stroke-linejoin']);
      
      // Add paths
      icon.d.forEach((d, index) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
      });
      
      // Replace the element with the SVG
      element.parentNode.replaceChild(svg, element);
    }
  });
}

// Export for use in popup
window.lucide = {
  createIcons
};