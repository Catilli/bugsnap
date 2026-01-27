# How to Restart BugSnap Servers

## Problem
The API server is not responding correctly to requests, and the login is failing with a network error.

## Solution

Follow these steps **in order**:

### Step 1: Stop All Running Servers

1. In VSCode, find **Terminal 1** (API Server)
   - Press `Ctrl + C` to stop it
   
2. Find **Terminal 2** (Web App)
   - Press `Ctrl + C` to stop it

### Step 2: Clean Restart

3. In Terminal 1, run:
   ```bash
   cd apps/api && npm run dev
   ```
   - Wait until you see: `Server is listening on http://[::]:3001` or s`🚀 Server running on http://localhost:3001`

4. In Terminal 2 (or open a new terminal), run:
   ```bash
   cd apps/web && npm run dev
   ```
   - Wait until you see: `✓ Ready in [time]` and `Local: http://localhost:3000`

### Step 3: Test the Application

5. Open your browser and go to: http://localhost:3000/register

6. Create a new account:
   - Name: Test User
   - Email: test@example.com
   - Password: test1234

7. After registration, you should be redirected to the dashboard

##  Alternative: Use the Startup Script

If the manual process is too tedious, you can use the automated script:

1. Close all terminals in VSCode (Ctrl + C in each)
2. Double-click `start-dev.bat` in the project root folder
3. Two command windows will open automatically
4. Wait for both to show "Ready" messages
5. Go to http://localhost:3000

## Troubleshooting

### If API Server Shows Plugin Error:
- Make sure you ran `npm install` in the root directory after the package.json changes
- The @fastify/jwt version should be `^8.0.1` (not `^10.0.0`)

### If Web Server Shows 404 Errors:
- Make sure the server fully restarted (wait for "Ready" message)
- Clear your browser cache (Ctrl + Shift + Delete)
- Hard refresh the page (Ctrl + Shift + R)

### If Login Still Fails:
- Check Terminal 1 - API server should show incoming requests
- Check Terminal 2 - should not show 404 errors
- Verify `.env.local` in `apps/web` contains: `NEXT_PUBLIC_API_URL=http://localhost:3001`
