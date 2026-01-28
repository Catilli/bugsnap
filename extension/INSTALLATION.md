# BugSnap Extension Installation Guide

## 📦 Installation Methods

### Method 1: Load Unpacked (Recommended for Development)

This is the easiest way to install the extension without publishing to Chrome Web Store.

#### Step-by-Step Instructions:

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or click the three dots menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Look for "Developer mode" toggle in the top-right corner
   - Click to enable it

3. **Load the Extension**
   - Click the "Load unpacked" button (appears after enabling Developer mode)
   - Navigate to your BugSnap project folder
   - Select the `extension` folder
   - Click "Select Folder"

4. **Verify Installation**
   - You should see "BugSnap - Visual Bug Tracking" in your extensions list
   - The BugSnap icon should appear in your browser toolbar
   - If you don't see the icon, click the puzzle piece icon and pin BugSnap

### Method 2: Package and Install (.zip)

For distributing to team members:

1. **Create a ZIP archive**
   ```bash
   # From the project root
   cd extension
   zip -r ../bugsnap-extension.zip .
   ```

2. **Share the ZIP file** with team members

3. **Team members follow Method 1** using the unzipped folder

### Method 3: Chrome Web Store (For Public Release)

This would require:
1. Creating a developer account ($5 one-time fee)
2. Packaging the extension
3. Submitting for review
4. Waiting for approval (1-3 days)

## 🎯 First-Time Setup

After installation:

1. **Click the BugSnap icon** in your toolbar

2. **Login with credentials**
   - Email: Your BugSnap account email
   - Password: Your BugSnap password

3. **Select a project** from the dropdown

4. **Start annotating!**
   - Click "Start Annotating"
   - Click any element on the webpage
   - Create tasks directly from the browser

## ⚙️ Configuration

### Change API Endpoint

Edit [`background.js`](extension/background.js:2):

```javascript
const API_BASE = 'https://your-api-domain.com/api';
```

Then reload the extension from `chrome://extensions/`.

## 🔄 Updating the Extension

### After Making Changes:

1. **Save your changes** to extension files

2. **Reload the extension**
   - Go to `chrome://extensions/`
   - Find BugSnap extension
   - Click the refresh/reload icon (circular arrow)

3. **Test the changes** on a web page

### Alternative: Use Extension Reloader

Install "Extensions Reloader" from Chrome Web Store for one-click reload.

## 🐛 Troubleshooting

### Issue: Extension Icon Not Showing

**Solution:**
- Click the puzzle piece icon in Chrome toolbar
- Find "BugSnap - Visual Bug Tracking"
- Click the pin icon to show it permanently

### Issue: "Cannot read properties of undefined"

**Solution:**
- The API might not be reachable
- Check that localhost:3001 is running
- Verify API_BASE URL in background.js

### Issue: "Unauthorized" Error

**Solution:**
- Re-login in the extension popup
- Check that your BugSnap account is active
- Verify network connectivity

### Issue: Cannot Annotate Elements

**Solution:**
- Make sure annotation mode is activated
- Check that you're logged in
- Select a project before annotating
- Try refreshing the web page
- Check browser console for errors

### Issue: Screenshots Not Capturing

**Solution:**
- Grant extension permission to capture screen
- Check that activeTab permission is enabled
- Some websites block screenshot capture

## 🔐 Permissions Explained

The extension requires these permissions:

- **activeTab**: To interact with the current webpage
- **storage**: To save your credentials and settings
- **scripting**: To inject annotation overlays
- **tabs**: To capture screenshots
- **host_permissions**: To work on all websites

## 📊 Testing the Extension

### Basic Test Flow:

1. **Install extension** using Method 1
2. **Login** with your BugSnap credentials
3. **Open any website** (e.g., `http://example.com`)
4. **Click BugSnap icon**
5. **Select a project**
6. **Click "Start Annotating"**
7. **Click any element** on the page
8. **Fill in task details**
9. **Click "Create Task"**
10. **Check your BugSnap dashboard** for the new task

### Expected Behavior:

- ✅ Elements highlight on hover (blue outline)
- ✅ Selected element shows red outline
- ✅ Annotation form appears near element
- ✅ Task created with screenshot
- ✅ Task visible in dashboard

## 🚀 Distribution to Team

### For Small Teams:

1. **Share the extension folder**
   - Via Google Drive
   - Via GitHub repository
   - Via company file server

2. **Provide installation instructions**
   - Link to this INSTALLATION.md
   - Include screenshots
   - Create video tutorial

3. **Provide support**
   - Set up Slack channel
   - Create FAQ document

### For Large Organizations:

1. **Package the extension**
2. **Use Enterprise deployment**
   - Group Policy (Windows)
   - MDM solutions (Intuit, Jamf)
   - Custom installers

## 📝 Next Steps After Installation

1. **Test the extension** on various websites
2. **Report any issues** to the development team
3. **Customize settings** in chrome://extensions/ → BugSnap → Details
4. **Share feedback** for improvements

## 💡 Tips for Power Users

### Keyboard Shortcuts:
- `Alt + B` - Toggle annotation mode (configurable)

### Multiple Projects:
- Switch projects anytime from the popup
- Each task is associated with the selected project

### Workflow Integration:
- Use with your existing bug tracking process
- Create tasks directly from client websites
- Share screenshots instantly

## 🆘 Support

If you need help:
1. Check this installation guide
2. Review the [main README](README.md)
3. Contact the development team
4. Check browser console for error messages

---

**Need more help?** Open the browser console (`F12`) and check for BugSnap-related error messages.
