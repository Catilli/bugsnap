# BugSnap Setup Guide

## ⚠️ Current Issue

The Fastify server is not starting in Terminal 3. Let's get it working!

## 🚀 Quick Start (Temporary Solution)

###Option 1: Use the Simple Server

```bash
# In a new terminal:
node apps/api/server.js
```

This will start a simple Node.js server on port 3001 that handles:
- Health check
- User registration (mock data)
- CORS headers

Then visit http://localhost:3000 and register!

## 🔧 Proper Solution (Full Fastify Server)

### Step 1: Check Terminal Visibility

In Cursor/VSCode:
1. Open the Terminal panel (View → Terminal or Ctrl+`)
2. You should see tabs for Terminal 1, 2, and 3
3. Click on Terminal 3 to see it output

### Step 2: Manually Start API Server

**Open a NEW terminal (Terminal → New Terminal) and run:**

```bash
npx tsx apps/api/src/index.ts
```

**You should see one of these:**

✅ **Success:**
```
🚀 Server running on http://localhost:3001
```

❌ **Database Error:**
```
P1001: Can't reach database server
```
→ Solution: Run migrations first (see Step 3)

❌ **Module Error:**
```
Cannot find module '@bugsnap/shared'
```
→ Solution: Run `npm install` from root

### Step 3: Create Database Tables

If you get a database connection error, run migrations:

```bash
cd apps/api
npx prisma migrate dev --name init
```

This creates all the tables in your Supabase database.

### Step 4: Verify Server is Running

Test the API:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","database":"connected","timestamp":"..."}
```

### Step 5: Test Registration

1. Go to http://localhost:3000/register
2. Fill in the form
3. Click "Create account"
4. You should see a success toast!

## 🐛 Troubleshooting

### Problem: "Cannot reach database"

**Solution 1: Check Supabase**
- Go to your Supabase dashboard
- Make sure project is not paused
- Wake it up if needed

**Solution 2: Use Connection Pooler**
In [`apps/api/.env`](apps/api/.env:9), use the pooler URL:
```
DATABASE_URL="postgresql://postgres.utfqodqmkgemswuhgkvk:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### Problem: "Module not found"

```bash
# Install dependencies
npm install

# Regenerate Prisma Client
cd apps/api
npx prisma generate
```

### Problem: "Port 3001 already in use"

```bash
# Windows: Find and kill process
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F

# Then restart server
```

### Problem: "FastifyError: Plugin version mismatch"

Already fixed! Just reinstall:
```bash
npm install
```

## ✅ Final Working Setup

**Terminal 1 - API Server:**
```bash
npx tsx apps/api/src/index.ts
```

**Terminal 2 - Web App:**
```bash
cd apps/web
npm run dev
```

**Browser:**
- Web App: http://localhost:3000
- API Health: http://localhost:3001/health

## 📝 What to Expect

When both servers are running:
1. Visit http://localhost:3000
2. Click "Get Started" to register
3. Fill the registration form
4. See success toast notification
5. Redirect to dashboard
6. Explore the app!

## 🎉 Success Indicators

✅ Terminal shows: "🚀 Server running on http://localhost:3001"
✅ Health check returns "ok"
✅ Registration works with toast notification
✅ Dashboard loads after login

If you're still having issues, please share the EXACT terminal output and I'll help debug further!