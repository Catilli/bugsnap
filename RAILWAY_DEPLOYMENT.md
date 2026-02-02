# Railway Deployment Guide

This guide will help you deploy the BugSnap API to Railway.

## Prerequisites

- Railway account ([sign up free](https://railway.app))
- PostgreSQL database (Railway provides one, or use Supabase)
- Git repository connected to Railway

## Steps

### 1. Create a New Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Choose **"Deploy from GitHub repo"**
4. Select your repository
5. Railway will automatically detect your workspace

### 2. Configure Build Settings

Railway should automatically detect the workspace structure. If not:

1. Go to **Settings** → **Build**
2. Set **Root Directory**: `apps/api`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`

### 3. Add Environment Variables

In the Railway dashboard, go to **Variables** and add:

```bash
# Database URL (if using Railway PostgreSQL, this is auto-provided)
DATABASE_URL=postgresql://postgres:password@host:port/database

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Node Environment
NODE_ENV=production

# Port (Railway provides this automatically, but you can set it)
PORT=3001

# CORS/Frontend URL (optional)
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 4. Add PostgreSQL Database (if needed)

**Option A: Use Railway PostgreSQL**
1. In your project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically set `DATABASE_URL` in your environment
3. Done! The database connection is automatic

**Option B: Use External Database (Supabase)**
1. Get your Supabase connection string (use the pooler URL ending with `:6543`)
2. Add it as `DATABASE_URL` in Railway variables
3. Make sure it's in this format:
   ```
   postgresql://postgres.[ref]:[password]@[host]:6543/postgres
   ```

### 5. Deploy

1. Railway will automatically deploy when you push to your main branch
2. Monitor the build logs in the **Deployments** tab
3. Once deployed, Railway will provide a URL like: `https://your-app.railway.app`

### 6. Important Notes

#### Build Process Changes

The build script has been updated to avoid running migrations during build:

**Before:**
```json
"build": "prisma generate && tsc && prisma migrate deploy"
```

**After:**
```json
"build": "prisma generate && tsc",
"start": "prisma migrate deploy && node dist/index.js"
```

**Why?** This ensures:
- Build step doesn't require database access (can run without DATABASE_URL)
- Migrations run when the app starts (when DATABASE_URL is available)
- More reliable deployments on platforms like Railway

#### Database Migrations

Migrations now run automatically when the app starts via the `start` command. This means:
- First deployment: Migrations will run and create all tables
- Subsequent deployments: Only new migrations will be applied
- No manual intervention needed

### 7. Verify Deployment

Test your API:

```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Should return:
# {
#   "status": "ok",
#   "database": "connected",
#   "timestamp": "..."
# }
```

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Solution:**
1. Make sure `DATABASE_URL` is added in Railway Variables
2. If using Railway PostgreSQL, ensure the database service is running
3. Redeploy after adding the variable

### Error: "Prisma schema validation failed"

**Solution:**
1. Check that your `DATABASE_URL` format is correct
2. Ensure the database server is accessible from Railway
3. Try connecting to the database manually using the connection string

### Build fails with TypeScript errors

**Solution:**
1. Run `npm run type-check` locally to find errors
2. Fix any TypeScript issues
3. Push changes and redeploy

### Database connection timeout

**Solution:**
1. If using Supabase, make sure you're using the **pooler connection string** (port 6543)
2. Check if your database has connection limits
3. Consider using connection pooling (Prisma includes this by default)

### Migrations fail on startup

**Solution:**
1. Check Railway logs for specific migration errors
2. Ensure migrations are valid by testing locally:
   ```bash
   cd apps/api
   npx prisma migrate deploy
   ```
3. If migrations are out of sync, you may need to reset the database (⚠️ this deletes data):
   ```bash
   npx prisma migrate reset
   ```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens | `long-random-string-here` |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `PORT` | ⚠️ Auto-set | Server port | `3001` (Railway sets this) |
| `FRONTEND_URL` | ❌ Optional | CORS config | `https://app.vercel.app` |

## Cost Estimate

Railway offers:
- **Free Tier**: $5 credit/month (~500 hours of runtime)
- **Developer Plan**: $5/month per service
- **PostgreSQL**: Included in plans

**Typical monthly cost:**
- API service: $5/month
- PostgreSQL: Included
- **Total: ~$5/month** (or free with credits)

## Next Steps

1. ✅ Deploy API to Railway
2. ✅ Add environment variables
3. ✅ Test API endpoints
4. ✅ Connect frontend to Railway API URL
5. ✅ Update extension to use Railway API URL

## Resources

- [Railway Documentation](https://docs.railway.app)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Railway CLI](https://docs.railway.app/develop/cli)

---

**Last Updated**: February 2, 2026
