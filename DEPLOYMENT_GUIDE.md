# BugSnap Deployment Guide - Vercel Production

This guide will help you deploy BugSnap to production using Vercel for the frontend and a suitable hosting service for the backend API.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Setup](#database-setup)
4. [Backend Deployment (API)](#backend-deployment-api)
5. [Frontend Deployment (Web)](#frontend-deployment-web)
6. [Extension Configuration](#extension-configuration)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment Steps](#post-deployment-steps)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] A Vercel account ([sign up free](https://vercel.com/signup))
- [ ] A PostgreSQL database (recommended: Supabase, Neon, or Railway)
- [ ] Node.js 18+ installed locally
- [ ] Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Domain name (optional, for custom domain)

---

## Architecture Overview

BugSnap is a monorepo with the following structure:

```
bugsnap/
├── apps/
│   ├── web/          # Next.js frontend (deploy to Vercel)
│   └── api/          # Fastify backend (deploy to Railway/Render/Fly.io)
├── packages/
│   └── shared/       # Shared TypeScript types
└── extension/         # Chrome extension (publish to Chrome Web Store)
```

### Deployment Strategy

- **Frontend (apps/web)**: Deploy to Vercel
- **Backend (apps/api)**: Deploy to Railway, Render, or Fly.io
- **Database**: PostgreSQL (Supabase, Neon, or Railway)
- **Extension**: Publish to Chrome Web Store

---

## Database Setup

### Option 1: Supabase (Recommended)

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name (e.g., `bugsnap-prod`)
   - Set a strong password
   - Choose a region close to your users
   - Click "Create new project"

2. **Get database credentials**
   - Go to Project Settings → Database
   - Copy the **Connection String**
   - Format: `postgresql://postgres:[password]@[host]:[port]/postgres`

3. **Run migrations**
   ```bash
   # Set DATABASE_URL environment variable
   export DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"

   # Push schema to production database
   cd apps/api
   npx prisma db push
   ```

### Option 2: Neon

1. **Create a Neon project**
   - Go to [neon.tech](https://neon.tech)
   - Click "Create a project"
   - Choose PostgreSQL
   - Copy the connection string

2. **Run migrations**
   ```bash
   export DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   cd apps/api
   npx prisma db push
   ```

### Option 3: Railway

1. **Create a Railway project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Provision PostgreSQL"
   - Copy the connection string

---

## Backend Deployment (API)

### Option 1: Railway (Recommended)

1. **Prepare the API for deployment**

   Create a `vercel.json` file in the root directory:

   ```json
   {
     "buildCommand": "cd apps/api && npm install",
     "outputDirectory": "apps/api/dist",
     "framework": null
   }
   ```

2. **Create a `Dockerfile` for Railway**

   Create `apps/api/Dockerfile`:

   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   # Copy package files
   COPY package*.json ./
   COPY apps/api/package*.json ./apps/api/
   COPY packages/shared/package*.json ./packages/shared/

   # Install dependencies
   RUN npm ci

   # Copy source files
   COPY apps/api ./apps/api
   COPY packages/shared ./packages/shared

   # Build the API
   RUN npm run build:api

   # Expose port
   EXPOSE 3001

   # Start the server
   CMD ["npm", "run", "start:api"]
   ```

3. **Deploy to Railway**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Initialize Railway project
   railway init

   # Add PostgreSQL database
   railway add postgresql

   # Deploy
   railway up
   ```

4. **Set environment variables in Railway**

   Go to your Railway project → Variables and add:

   ```
   DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=3001
   NODE_ENV=production
   ```

5. **Get your API URL**

   Railway will provide a URL like: `https://bugsnap-api-production.up.railway.app`

### Option 2: Render

1. **Create a `Dockerfile`** (same as above)

2. **Deploy to Render**

   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your Git repository
   - Set:
     - **Name**: `bugsnap-api`
     - **Environment**: `Docker`
     - **Docker Context**: `/apps/api`
     - **Dockerfile Path**: `Dockerfile`
   - Add environment variables (same as Railway)
   - Click "Create Web Service"

3. **Get your API URL**

   Render will provide a URL like: `https://bugsnap-api.onrender.com`

### Option 3: Fly.io

1. **Install Fly CLI**

   ```bash
   npm install -g flyctl
   flyctl auth signup
   ```

2. **Create `fly.toml` in `apps/api`**

   ```toml
   app = "bugsnap-api"
   primary_region = "iad"

   [build]
   dockerfile = "Dockerfile"

   [env]
   PORT = "3001"

   [http_service]
   internal_port = 3001
   force_https = true
   auto_stop_machines = true
   auto_start_machines = true
   min_machines_running = 0
   processes = ["app"]
   ```

3. **Deploy**

   ```bash
   cd apps/api
   flyctl launch
   flyctl deploy
   ```

---

## Frontend Deployment (Web)

### Deploy to Vercel

1. **Push your code to Git**

   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Deploy to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Configure:
     - **Framework Preset**: Next.js
     - **Root Directory**: `./apps/web`
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`
   - Click "Deploy"

3. **Set environment variables in Vercel**

   Go to Project Settings → Environment Variables and add:

   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.com
   ```

4. **Get your frontend URL**

   Vercel will provide a URL like: `https://bugsnap-web.vercel.app`

### Configure Custom Domain (Optional)

1. In Vercel, go to Project Settings → Domains
2. Add your custom domain (e.g., `bugsnap.yourdomain.com`)
3. Update your DNS records as instructed by Vercel

---

## Extension Configuration

### Update Extension for Production

1. **Update `extension/manifest.json`**

   ```json
   {
     "manifest_version": 3,
     "name": "BugSnap",
     "version": "1.0",
     "description": "Capture and report issues on web pages",
     "permissions": [
       "activeTab",
       "scripting",
       "storage"
     ],
     "externally_connectable": {
       "matches": [
         "https://your-frontend-url.com/*",
         "https://your-api-url.com/*"
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

2. **Update `extension/bugsnap-ui.js`**

   Find and replace `http://localhost:3001` with your production API URL:

   ```javascript
   // Line 713
   const response = await fetch(`https://your-api-url.com/api/projects/${this.project.id}/next-task-number`, {
     method: 'GET',
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });

   // Line 938
   const response = await fetch('https://your-api-url.com/api/tasks', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify(payload)
   });
   ```

3. **Update `apps/api/src/index.ts` CORS configuration**

   Update the CORS origin to allow your production frontend:

   ```javascript
   fastify.register(cors, {
     origin: (origin, callback) => {
       if (!origin) {
         return callback(null, true);
       }
       
       // Allow production frontend
       if (origin.includes('your-frontend-url.com')) {
         return callback(null, true);
       }
       
       // Allow chrome-extension:// origins
       if (origin.startsWith('chrome-extension://')) {
         return callback(null, true);
       }
       
       return callback(null, true);
     },
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization'],
     exposedHeaders: ['Content-Type', 'Authorization'],
     preflightContinue: false,
     optionsSuccessStatus: 204,
   });
   ```

### Publish Extension to Chrome Web Store

1. **Package the extension**

   ```bash
   cd extension
   zip -r bugsnap-extension.zip . -x "*.git*" "*.DS_Store"
   ```

2. **Submit to Chrome Web Store**

   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click "Add new item"
   - Upload `bugsnap-extension.zip`
   - Fill in store listing details:
     - Name: BugSnap
     - Description: Capture and report issues on web pages with screenshots and annotations
     - Category: Productivity
     - Screenshots: Add screenshots of the extension in action
   - Set pricing: Free
   - Submit for review

3. **Wait for approval**

   Review typically takes 1-3 business days.

---

## Environment Variables

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@host:5432/dbname` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-change-this-in-production` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Production API URL | `https://bugsnap-api-production.up.railway.app` |

---

## Post-Deployment Steps

### 1. Test the Application

1. **Test frontend**
   - Visit your Vercel URL
   - Try logging in
   - Create a project
   - Create a task

2. **Test API**
   ```bash
   curl https://your-api-url.com/health
   ```

3. **Test extension**
   - Install the extension (load unpacked for testing)
   - Navigate to a website
   - Try capturing a screenshot and creating a task

### 2. Set Up Monitoring

- **Vercel Analytics**: Automatically enabled for frontend
- **Railway/Render Logs**: Check logs in your dashboard
- **Error Tracking**: Consider adding Sentry or similar service

### 3. Configure Domain (Optional)

- Update DNS records for custom domain
- Configure SSL certificates (automatic on Vercel/Railway/Render)

### 4. Set Up Backups

- Configure automated database backups (Supabase/Railway/Neon)
- Test backup restoration

---

## Troubleshooting

### Issue: CORS Errors

**Problem**: Extension can't connect to API

**Solution**:
1. Check CORS configuration in `apps/api/src/index.ts`
2. Ensure your production domain is in the allowed origins
3. Verify API is accessible: `curl https://your-api-url.com/health`

### Issue: Database Connection Failed

**Problem**: API can't connect to database

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check database is running
3. Ensure SSL is enabled for remote databases
4. Check firewall rules allow connections

### Issue: Build Failures

**Problem**: Deployment fails during build

**Solution**:
1. Check build logs for specific errors
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript compilation passes locally
4. Check for environment variable references

### Issue: Extension Not Loading

**Problem**: Extension doesn't load on websites

**Solution**:
1. Check browser console for errors
2. Verify `manifest.json` is valid
3. Ensure content scripts are properly configured
4. Check for CSP (Content Security Policy) issues

### Issue: Large File Uploads Fail

**Problem**: Screenshots fail to upload

**Solution**:
1. Verify `bodyLimit` is set in Fastify config (should be 50MB)
2. Check if hosting service has file size limits
3. Consider using object storage (S3, Cloudinary) for large files

---

## Security Checklist

- [ ] Change default JWT secret
- [ ] Enable HTTPS everywhere
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Add input validation
- [ ] Enable CORS only for trusted domains
- [ ] Set up monitoring and alerts
- [ ] Review and update dependencies regularly
- [ ] Add error tracking (Sentry, LogRocket)
- [ ] Implement proper logging

---

## Cost Estimates

### Monthly Costs (Approximate)

| Service | Free Tier | Paid Tier |
|---------|-----------|------------|
| Vercel (Frontend) | Free | $20/month |
| Railway (API + DB) | $5/month | $20/month |
| Render (API) | Free | $7/month |
| Supabase (DB) | Free | $25/month |
| Neon (DB) | Free | $19/month |
| Chrome Web Store | $5 (one-time) | - |

**Total (Free Tier)**: $0-5/month
**Total (Paid Tier)**: $50-100/month

---

## Next Steps

1. ✅ Deploy database
2. ✅ Deploy backend API
3. ✅ Deploy frontend to Vercel
4. ✅ Update extension configuration
5. ✅ Test all functionality
6. ✅ Publish extension to Chrome Web Store
7. ✅ Set up monitoring and backups
8. ✅ Configure custom domain (optional)

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review deployment logs
3. Check service status pages
4. Search GitHub issues
5. Contact support for the respective service

---

**Last Updated**: January 2026
**Version**: 1.0.0
