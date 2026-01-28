// Script to create placeholder icons
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];
const assetsDir = path.join(__dirname, 'assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// Create SVG icon for each size
sizes.forEach(size => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#6366f1" rx="${size * 0.15}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
        BS
      </text>
    </svg>
  `.trim();

  const filename = path.join(assetsDir, `icon-${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('\nPlaceholder icons created successfully!');
console.log('For production, replace these SVG files with PNG icons.');
