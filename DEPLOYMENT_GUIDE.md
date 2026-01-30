# BugSnap Deployment Guide - Production

This guide will help you deploy BugSnap to production using:
- **Database**: Supabase (PostgreSQL)
- **Backend API + Frontend**: Vercel
- **Extension**: Chrome Web Store

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [Vercel Deployment (Frontend + API)](#vercel-deployment-frontend--api)
5. [Extension Configuration](#extension-configuration)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] A Supabase account ([sign up free](https://supabase.com))
- [ ] A Vercel account ([sign up free](https://vercel.com/signup))
- [ ] Node.js 18+ installed locally
- [ ] Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Domain name (optional, for custom domain)

---

## Architecture Overview

```
┌─────────────────┐
│   Supabase      │
│   (PostgreSQL)  │
└────────┬────────┘
         │
         │ DATABASE_URL
         │
┌────────▼────────┐
│     Vercel      │
│  Frontend + API │
└─────────────────┘
         │
         │
┌────────▼────────┐
│   Extension     │
│  (Chrome Store) │
└─────────────────┘
```

---

## Database Setup (Supabase)

### Step 1: Create a Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and sign in
2. **Click "New Project"**
3. **Fill in project details**:
   - **Organization**: Select or create an organization
   - **Name**: `bugsnap-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose a region close to your users (e.g., `us-east-1`)
   - **Pricing Plan**: Free tier is sufficient to start
4. **Click "Create new project"**

### Step 2: Get Database Connection String

1. **Wait for project to finish setting up** (takes ~2 minutes)
2. **Go to Project Settings** → **Database**
3. **Scroll down to Connection String** → **URI**
4. **Copy the Connection String**:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
5. **Replace `[YOUR-PASSWORD]`** with the password you set earlier
6. **Save this connection string** - you'll need it for Vercel

### Step 3: Run Database Migrations

1. **Open your terminal** and navigate to your project:
   ```bash
   cd bugsnap
   ```

2. **Set the DATABASE_URL environment variable**:
   ```bash
   # Windows (CMD)
   set DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres

   # Windows (PowerShell)
   $env:DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"

   # Mac/Linux
   export DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
   ```

3. **Push the database schema**:
   ```bash
   cd apps/api
   npx prisma db push
   ```

4. **Verify the migration**:
   - Go to Supabase Dashboard → **Table Editor**
   - You should see tables: `users`, `projects`, `tasks`, `annotations`, `comments`, `project_members`

---

## Vercel Deployment (Frontend + API)

We'll deploy both the frontend and API to Vercel. The frontend will be a Next.js app, and the API will be deployed separately.

### Step 1: Prepare Your Repository

1. **Ensure `vercel.json` is committed**:
   ```bash
   git add vercel.json
   git commit -m "Add Vercel configuration for monorepo"
   git push origin main
   ```

2. **Verify `vercel.json` configuration**:
   - Check that the `ignoreCommand` uses proper git syntax
   - Ensure `--` separator is used between revisions and paths
   - Example: `"ignoreCommand": "git diff --quiet HEAD^ HEAD -- ./apps/web"`

### Step 2: Deploy Frontend to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New Project"**
3. **Import your Git repository**
4. **Configure project**:
   - **Project Name**: `bugsnap-web` (or your preferred name)
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: Leave empty (will use vercel.json)
   - **Output Directory**: Leave empty (will use vercel.json)
   - **Install Command**: Leave empty (will use vercel.json)

5. **Click "Deploy"** (don't add environment variables yet)

6. **Wait for deployment** (~2-3 minutes)

7. **Get your frontend URL**: Vercel will provide a URL like `https://bugsnap-web.vercel.app`

### Step 3: Deploy API to Vercel

1. **In Vercel dashboard**, click "Add New Project" again
2. **Import the same Git repository**
3. **Configure project**:
   - **Project Name**: `bugsnap-api` (or your preferred name)
   - **Framework Preset**: Other
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Click "Deploy"** (don't add environment variables yet)

5. **Wait for deployment** (~2-3 minutes)

6. **Get your API URL**: Vercel will provide a URL like `https://bugsnap-api.vercel.app`

### Step 4: Configure Environment Variables

**For Frontend (bugsnap-web)**:
1. Go to Project Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://bugsnap-api.vercel.app
   ```
3. Click "Save"
4. Redeploy the frontend

**For API (bugsnap-api)**:
1. Go to Project Settings → Environment Variables
2. Add:
   ```
   DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
   NODE_ENV=production
   ```
3. Click "Save"
4. Redeploy the API

**Important**: Generate a strong random string for `JWT_SECRET` (at least 32 characters)

### Step 5: Verify Deployments

**Test Frontend**:
```bash
curl https://bugsnap-web.vercel.app
```

**Test API**:
```bash
curl https://bugsnap-api.vercel.app/health
```

You should see:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-29T..."
}
```

### Step 6: Configure Custom Domains (Optional)

**For Frontend**:
1. Go to bugsnap-web project → Settings → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

**For API**:
1. Go to bugsnap-api project → Settings → Domains
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records:
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```

---

## Extension Configuration

### Step 1: Update Extension for Production

1. **Update `extension/manifest.json`**:
   ```json
   {
     "manifest_version": 3,
     "name": "BugSnap",
     "version": "1.0.0",
     "description": "Capture and report issues on web pages",
     "permissions": [
       "activeTab",
       "scripting",
       "storage"
     ],
     "externally_connectable": {
       "matches": [
         "https://bugsnap-web.vercel.app/*",
         "https://bugsnap-api.vercel.app/*"
       ]
     },
     "background": {
       "service_worker": "background.js"
     },
     "content_scripts": [
       {
         "matches": ["<all_urls>"],
         "js": ["content.js", "bugsnap-ui.js"],
         "run_at": "document_idle"
       }
     ],
     "web_accessible_resources": [
       {
         "resources": ["bugsnap-ui.js"],
         "matches": ["<all_urls>"]
       }
     ],
     "action": {
       "default_popup": "popup.html",
       "default_icon": {
         "16": "assets/icon-16.svg",
         "32": "assets/icon-32.svg",
         "48": "assets/icon-48.svg",
         "128": "assets/icon-128.svg"
       }
     },
     "icons": {
       "16": "assets/icon-16.svg",
       "32": "assets/icon-32.svg",
       "48": "assets/icon-48.svg",
       "128": "assets/icon-128.svg"
     }
   }
   ```

2. **Update `extension/bugsnap-ui.js`**:
   
   Find and replace `http://localhost:3001` with your Vercel API URL:

   ```javascript
   // Line ~713
   const response = await fetch(`https://bugsnap-api.vercel.app/api/projects/${this.project.id}/next-task-number`, {
     method: 'GET',
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });

   // Line ~938
   const response = await fetch('https://bugsnap-api.vercel.app/api/tasks', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify(payload)
   });
   ```

3. **Update `extension/popup.js`**:
   
   Find and replace API URLs with your Vercel API URL:

   ```javascript
   const API_URL = 'https://bugsnap-api.vercel.app';
   ```

### Step 2: Package the Extension

```bash
cd extension
zip -r bugsnap-extension.zip . -x "*.git*" "*.DS_Store" "node_modules/*"
```

Or on Windows:
```powershell
Compress-Archive -Path extension\* -DestinationPath bugsnap-extension.zip
```

### Step 3: Publish to Chrome Web Store

1. **Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)**
2. **Pay the one-time $5 developer fee** (if not already paid)
3. **Click "New Item"**
4. **Upload `bugsnap-extension.zip`**
5. **Fill in store listing**:
   - **Name**: BugSnap
   - **Summary**: Capture and report website issues with screenshots and annotations
   - **Description**: 
     ```
     BugSnap is a powerful bug reporting tool that helps teams capture, annotate, and manage website issues directly from the browser.

     Features:
     • Capture screenshots with one click
     • Annotate with rectangles, arrows, pen, and text
     • Automatic environment data collection
     • Seamless integration with your BugSnap dashboard
     • Task management and collaboration

     Perfect for:
     • Web developers
     • QA teams
     • Product managers
     • Design teams
     ```
   - **Category**: Productivity
   - **Language**: English
   - **Screenshots**: Add 3-5 screenshots showing the extension in action
   - **Icon**: Upload your icon (128x128)
   - **Privacy Policy**: Link to your privacy policy (required)

6. **Set pricing**: Free
7. **Submit for review**
8. **Wait for approval** (typically 1-3 business days)

---

## Post-Deployment Steps

### 1. Test the Complete Flow

1. **Test Frontend**:
   - Visit your Vercel URL (e.g., `https://bugsnap-web.vercel.app`)
   - Register a new account
   - Create a project
   - Create a task manually

2. **Test API**:
   ```bash
   curl https://bugsnap-api.vercel.app/health
   curl https://bugsnap-api.vercel.app/api
   ```

3. **Test Extension**:
   - Install the extension (load unpacked for testing)
   - Navigate to any website
   - Click the extension icon
   - Try capturing a screenshot and creating a task

### 2. Set Up Monitoring

**Vercel Analytics** (Automatic):
- Go to your Vercel projects → Analytics
- View page views, performance metrics, and errors
- Available for both frontend and API projects

**Vercel Logs**:
- Go to your Vercel projects → Deployments
- Click on a deployment to view logs
- Monitor for errors and performance issues

**Supabase Monitoring**:
- Go to Supabase Dashboard → Database
- Monitor database performance and queries
- Set up database backups (automatic on paid plans)

### 3. Configure Backups

**Supabase Backups**:
- Free tier: Daily backups (7-day retention)
- Pro tier: Point-in-time recovery
- Go to Project Settings → Database → Backups

**Application Backups**:
- Your code is backed up in Git
- Vercel keeps deployment history
- You can rollback to previous deployments anytime

### 4. Set Up Custom Domains (Optional)

**For Frontend**:
1. Go to bugsnap-web project → Settings → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

**For API**:
1. Go to bugsnap-api project → Settings → Domains
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records:
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```

---

## Troubleshooting

### Issue: Vercel Build Fails with Git Command Error

**Problem**: Build fails with error:
```
Command failed with exit code 128: git diff --quiet HEAD^ HEAD ./apps/web
fatal: ambiguous argument './apps/web': unknown revision or path not in the working tree.
```

**Solution**:
1. Open `vercel.json` in your project root
2. Locate the `ignoreCommand` line
3. Add `--` separator between revisions and paths:
   ```json
   "ignoreCommand": "git diff --quiet HEAD^ HEAD -- ./apps/web"
   ```
4. Commit and push the change:
   ```bash
   git add vercel.json
   git commit -m "Fix git command syntax in vercel.json"
   git push origin main
   ```
5. Redeploy in Vercel

**Why this happens**: Git interprets `./apps/web` as a revision instead of a path without the `--` separator. The `--` tells git that everything after it is a file path.

### Issue: Vercel Build Fails with "command exited (2)"

**Problem**: Deployment fails with API build errors or "command exited (2)"

**Solution**:

1. **For Frontend Deployment**:
   - Ensure `vercel.json` is committed to your repository
   - Verify Root Directory is `.` (root)
   - Leave Build Command, Output Directory, and Install Command empty
   - Vercel will use `vercel.json` configuration which builds only the web app

2. **For API Deployment**:
   - Set Root Directory to `apps/api`
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Check build logs** in Vercel dashboard for specific errors

4. **Test build locally**:
   ```bash
   # Test frontend build
   npm run build

   # Test API build
   cd apps/api
   npm run build
   ```

5. **Common issues**:
   - Missing dependencies: Check `package.json`
   - TypeScript errors: Run `npm run type-check`
   - Prisma errors: Ensure DATABASE_URL is set in environment variables

### Issue: CORS Errors

**Problem**: Extension or frontend can't connect to API

**Solution**:
1. Check CORS configuration in `apps/api/src/index.ts`
2. Ensure your production domains are allowed
3. Verify API is accessible: `curl https://your-api-url.vercel.app/health`
4. Check browser console for specific CORS errors
5. Update CORS to allow your Vercel domains:
   ```javascript
   origin: (origin, callback) => {
     if (!origin || 
         origin.includes('vercel.app') || 
         origin.startsWith('chrome-extension://')) {
       return callback(null, true);
     }
     return callback(null, true);
   }
   ```

### Issue: Database Connection Failed

**Problem**: API can't connect to Supabase

**Solution**:
1. Verify `DATABASE_URL` in Vercel environment variables
2. Check Supabase project is running (not paused)
3. Ensure connection string includes password
4. Use the **pooler connection string** (port 6543) for serverless environments
5. Test connection locally:
   ```bash
   export DATABASE_URL="your-connection-string"
   cd apps/api
   npx prisma db push
   ```

### Issue: API Timeout on Vercel

**Problem**: API requests timeout after 10 seconds

**Solution**:
1. **Upgrade to Vercel Pro** ($20/month) for 60-second timeout
2. **Optimize slow queries**:
   - Add database indexes
   - Use Prisma query optimization
   - Cache frequently accessed data
3. **Consider using Vercel Edge Functions** for faster response times

### Issue: Extension Not Loading

**Problem**: Extension doesn't load on websites

**Solution**:
1. Check browser console for errors
2. Verify `manifest.json` is valid
3. Ensure content scripts are properly configured
4. Check for CSP (Content Security Policy) issues
5. Test on different websites
6. Verify API URLs are correct in extension files

### Issue: Large File Uploads Fail

**Problem**: Screenshots fail to upload

**Solution**:
1. Verify `bodyLimit` is set in Fastify config (50MB)
2. **Vercel has a 4.5MB body size limit** on free tier, **50MB on Pro tier**
3. Consider using object storage (S3, Cloudinary) for large files:
   - Upload screenshots directly to Cloudinary
   - Store only the URL in the database
4. Compress screenshots before upload

---

## Security Checklist

- [ ] Changed default JWT secret to a strong random string
- [ ] Enabled HTTPS everywhere (automatic on Vercel)
- [ ] Set up database backups
- [ ] Configured CORS only for trusted domains
- [ ] Added input validation on all API endpoints
- [ ] Enabled rate limiting (consider adding)
- [ ] Set up monitoring and alerts
- [ ] Added error tracking (consider Sentry)
- [ ] Implemented proper logging
- [ ] Reviewed and updated dependencies regularly

---

## Cost Estimates

### Monthly Costs (Approximate)

| Service | Free Tier | Paid Tier | Notes |
|---------|-----------|------------|-------|
| **Supabase** | $0 (500MB DB, 2GB bandwidth) | $25/month (8GB DB, 50GB bandwidth) | Free tier sufficient for small teams |
| **Vercel (Frontend)** | $0 (100GB bandwidth) | $20/month (1TB bandwidth) | Free tier sufficient for most apps |
| **Vercel (API)** | $0 (100GB bandwidth, 10s timeout) | $20/month (1TB bandwidth, 60s timeout) | May need Pro for API |
| **Chrome Web Store** | $5 (one-time) | - | One-time developer fee |
| **Total** | **$5/month** | **$65/month** | Scales with usage |

**Recommendations**:
- Start with free tiers
- Upgrade Vercel to Pro if you need longer API timeouts
- Upgrade Supabase when you need more storage
- Consider using Cloudinary for image storage to reduce costs

---

## Important Notes for Vercel API Deployment

### Serverless Limitations

Vercel uses serverless functions, which have some limitations:

1. **Timeout Limits**:
   - Free tier: 10 seconds
   - Pro tier: 60 seconds
   - Enterprise: 900 seconds

2. **Body Size Limits**:
   - Free tier: 4.5MB
   - Pro tier: 50MB

3. **Cold Starts**:
   - Functions may take 1-2 seconds to start if not recently used
   - Consider using Vercel Edge Functions for faster cold starts

### Alternative: Keep API on Railway

If you encounter issues with Vercel's serverless limitations, you can:

1. Deploy only the frontend to Vercel
2. Deploy the API to Railway (better for long-running processes)
3. Railway offers:
   - No timeout limits
   - Larger body size limits
   - Always-on servers (no cold starts)
   - $5/month free credit

---

## Next Steps

1. ✅ Deploy database to Supabase
2. ✅ Deploy frontend to Vercel
3. ✅ Deploy API to Vercel
4. ✅ Configure environment variables
5. ✅ Update extension configuration
6. ✅ Test all functionality
7. ✅ Publish extension to Chrome Web Store
8. ✅ Set up monitoring and backups
9. ✅ Configure custom domains (optional)

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review deployment logs in Vercel dashboard
3. Check service status pages:
   - [Supabase Status](https://status.supabase.com)
   - [Vercel Status](https://www.vercel-status.com)
4. Search GitHub issues
5. Contact support for the respective service

---

**Last Updated**: January 30, 2026
**Version**: 1.1.0

**Changelog**:
- v1.1.0 (Jan 30, 2026): Added git command troubleshooting, updated vercel.json configuration guidance
- v1.0.0 (Jan 2026): Initial deployment guide