// Script to package extension for distribution
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const extensionDir = __dirname;
const outputDir = path.join(__dirname, '..', 'apps', 'web', 'public');
const outputFile = path.join(outputDir, 'bugsnap-extension.zip');

// Use Windows PowerShell Compress-Archive command
try {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Files to include in the package
  const filesToInclude = [
    'manifest.json',
    'background.js',
    'content.js',
    'overlay.css',
    'popup.html',
    'popup.js',
    'assets'
  ];

  // Create temporary directory for packaging
  const tempDir = path.join(__dirname, 'temp-package');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Copy files to temp directory
   filesToInclude.forEach(file => {
    const source = path.join(extensionDir, file);
    const dest = path.join(tempDir, file);

    if (fs.existsSync(source)) {
      if (fs.statSync(source).isDirectory()) {
        // Copy directory
        execSync(`xcopy "${source}" "${dest}" /E /I /Y`, { stdio: 'inherit' });
      } else {
        // Copy file
        fs.copyFileSync(source, dest);
      }
    }
  });

  // Create ZIP using PowerShell
  const psCommand = `Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${outputFile}" -Force`;
  execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });

  // Clean up temp directory
  execSync(`rmdir /S /Q "${tempDir}"`, { stdio: 'inherit' });

  console.log(`✓ Extension packaged successfully: ${outputFile}`);
  console.log(`\nThe extension can now be downloaded from: /bugsnap-extension.zip`);
} catch (error) {
  console.error('Error packaging extension:', error);
  process.exit(1);
}