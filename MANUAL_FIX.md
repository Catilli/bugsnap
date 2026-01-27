# Manual Fix for Next.js Build Error

The `.next` folder is corrupted. Follow these steps carefully:

## Step 1: Stop All Servers

1. In VSCode, go to each terminal (Terminal 1, 2, 3)
2. Press **Ctrl + C** to stop each one
3. Wait for them to fully stop

## Step 2: Delete the .next Folder Manually

1. Open File Explorer (Windows Key + E)
2. Navigate to: `C:\Users\c47hi\OneDrive\Projects\React\bugsnap\apps\web`
3. Find the **`.next`** folder
4. **Right-click** on it and select **"Delete"**
5. If it won't delete, restart VSCode and try again

## Step 3: Start API Server

Open a NEW terminal in VSCode:
```bash
cd apps/api
npm run dev
```

Wait until you see: `🚀 Server running on http://localhost:3001`

## Step 4: Start Web Server

Open ANOTHER NEW terminal in VSCode:
```bash
cd apps/web
npm run dev
```

Wait until you see: `✓ Ready in [time]`

## Step 5: Test the App

1. Open your browser
2. Go to: http://localhost:3000
3. You should see the login page
4. Register a new account
5. Login and see the new dashboard

---

## If You Still Get Errors:

Try this complete clean:

```bash
# In the root directory
npm cache clean --force
cd apps/web
rmdir /s /q .next
rmdir /s /q node_modules
cd ../..
npm install
cd apps/api
npm run dev
# (Open new terminal)
cd apps/web
npm run dev
```