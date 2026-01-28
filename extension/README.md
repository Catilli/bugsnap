# BugSnap Browser Extension

Visual bug tracking and task creation directly from your browser.

## 🚀 Installation (Development)

### Quick Install

1. **Clone or download this extension**
   ```bash
   cd extension
   ```

2. **Open Chrome and navigate to**
   ```
   chrome://extensions/
   ```

3. **Enable "Developer mode"** (toggle in the top right)

4. **Click "Load unpacked"**

5. **Select the `extension` folder** from this project

6. **The BugSnap icon should now appear** in your browser toolbar

## 🎯 How to Use

### First Time Setup

1. Click the BugSnap extension icon in your toolbar
2. Login with your BugSnap credentials:
   - Email: your BugSnap account email
   - Password: your BugSnap account password

### Creating Tasks

1. **Select a project** from the dropdown in the popup
2. Click **"Start Annotating"**
3. **Click any element** on the webpage to annotate
4. **Fill in the task form**:
   - Title (required)
   - Description (optional)
   - Priority level
5. Click **"Create Task"** to save

### Keyboard Shortcuts

- `Alt + B` - Toggle annotation mode (on/off)
- `Esc` - Cancel current annotation

## ⚙️ Configuration

### API Endpoint

By default, the extension connects to:
```
http://localhost:3001/api
```

To change this, edit [`background.js`](extension/background.js:2):
```javascript
const API_BASE = 'YOUR_API_URL_HERE';
```

## 🔧 Development

### File Structure

```
extension/
├── manifest.json      # Extension configuration
├── background.js      # Service worker (API, auth)
├── content.js         # Page interaction script
├── overlay.css        # Annotation styles
├── popup.html         # Extension popup UI
├── popup.js           # Popup functionality
├── assets/            # Icon files
└── README.md          # This file
```

### Making Changes

1. Edit files in the `extension/` directory
2. Go to `chrome://extensions/`
3. Click the refresh icon on the BugSnap extension
4. Test your changes

## 📦 Production Distribution

### Create Package

```bash
# Zip the extension folder
cd ..
zip -r bugsnap-extension.zip extension/ -x "*.md" "*.git*"
```

### Installation Options

#### Option 1: Load Unpacked (Development)
- Follow installation steps above

#### Option 2: Direct Install (.crx)
- Package as .crx file
- Distribute to team members
- Drag and drop onto chrome://extensions/

#### Option 3: Enterprise Deployment
- Deploy via Group Policy
- Use MDM solutions
- Custom installers

## 🐛 Troubleshooting

### Extension Not Loading

1. Check Developer mode is enabled
2. Reload the extension
3. Check console for errors

### Cannot Annotate Elements

1. Make sure you're logged in
2. Select a project
3. Click "Start Annotating"
4. Try refreshing the page

### Authentication Issues

1. Verify API endpoint is correct
2. Check network connectivity
3. Ensure BugSnap API is running
4. Check browser console for errors

## 📝 Features

✅ Element selection and highlighting
✅ Visual annotation overlays
✅ Screenshot capture
✅ Task creation
✅ Project integration
✅ Keyboard shortcuts
✅ Offline support (planned)

## 🔒 Security

- JWT token authentication
- Secure API communication
- Local storage encryption
- HTTPS required for production

## 📄 License

Part of the BugSnap project.
