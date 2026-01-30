# BugSnap Deployment Checklist

Use this checklist to ensure you've completed all necessary steps for production deployment.

## Pre-Deployment Checklist

### Code Preparation
- [ ] All code is committed to Git
- [ ] All tests pass locally (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] No console errors in development
- [ ] Environment variables are documented
- [ ] `vercel.json` configuration is correct (check git command syntax)
- [ ] Build command works locally (`npm run build`)

### Security
- [ ] JWT_SECRET is changed from default
- [ ] Database password is strong
- [ ] CORS is configured for production domains only
- [ ] HTTPS is enforced everywhere
- [ ] Rate limiting is configured (if needed)

### Database
- [ ] Production database is created
- [ ] Database migrations are applied (`npx prisma db push`)
- [ ] Database backups are configured
- [ ] Database connection is tested

## Backend Deployment Checklist

### Railway (Recommended)
- [ ] Railway account is created
- [ ] Railway CLI is installed (`npm install -g @railway/cli`)
- [ ] Project is initialized (`railway init`)
- [ ] PostgreSQL database is added
- [ ] Environment variables are set:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `PORT=3001`
  - [ ] `NODE_ENV=production`
- [ ] Application is deployed (`railway up`)
- [ ] API is accessible (test with `curl https://your-api-url.com/health`)
- [ ] CORS allows production frontend domain

### Render (Alternative)
- [ ] Render account is created
- [ ] Git repository is connected
- [ ] Web Service is created
- [ ] Environment variables are set
- [ ] Application is deployed
- [ ] API is accessible

### Fly.io (Alternative)
- [ ] Fly.io account is created
- [ ] Fly CLI is installed (`npm install -g flyctl`)
- [ ] `fly.toml` is configured
- [ ] Application is deployed (`flyctl deploy`)
- [ ] API is accessible

## Frontend Deployment Checklist

### Vercel
- [ ] Vercel account is created
- [ ] Git repository is connected
- [ ] Project is imported
- [ ] Build configuration is correct:
  - [ ] Framework: Next.js
  - [ ] Root Directory: `./apps/web`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`
- [ ] Environment variables are set:
  - [ ] `NEXT_PUBLIC_API_URL=https://your-api-url.com`
- [ ] Application is deployed
- [ ] Frontend is accessible
- [ ] API calls work correctly

### Custom Domain (Optional)
- [ ] Custom domain is added in Vercel
- [ ] DNS records are updated
- [ ] SSL certificate is active
- [ ] Domain redirects work correctly

## Extension Deployment Checklist

### Configuration
- [ ] `extension/manifest.json` is updated with production URLs
- [ ] `extension/bugsnap-ui.js` API URLs are updated
- [ ] Extension is tested locally with production API
- [ ] Screenshots upload successfully
- [ ] Tasks are created successfully

### Chrome Web Store
- [ ] Developer account is created ($5 one-time fee)
- [ ] Extension is packaged (`zip -r bugsnap-extension.zip .`)
- [ ] Store listing is complete:
  - [ ] Name: BugSnap
  - [ ] Description is written
  - [ ] Screenshots are uploaded
  - [ ] Category is selected (Productivity)
  - [ ] Privacy policy URL is provided (if needed)
- [ ] Extension is submitted for review
- [ ] Review is approved

## Post-Deployment Checklist

### Testing
- [ ] User registration works
- [ ] User login works
- [ ] Project creation works
- [ ] Task creation works
- [ ] Screenshot upload works
- [ ] Annotations work
- [ ] Comments work
- [ ] Task status updates work
- [ ] Extension works on different websites
- [ ] Mobile responsiveness is tested

### Monitoring
- [ ] Error tracking is set up (Sentry, LogRocket, etc.)
- [ ] Analytics are configured (Vercel Analytics)
- [ ] Logs are monitored (Railway/Render logs)
- [ ] Database backups are verified
- [ ] Uptime monitoring is set up (Pingdom, UptimeRobot)

### Documentation
- [ ] README is updated with production URLs
- [ ] API documentation is available
- [ ] User guide is created
- [ ] Troubleshooting guide is available
- [ ] Contact information is provided

### Maintenance
- [ ] Update schedule is planned
- [ ] Backup restoration is tested
- [ ] Security audit is scheduled
- [ ] Performance monitoring is set up
- [ ] Cost monitoring is set up

## Quick Reference URLs

After deployment, keep these URLs handy:

- **Frontend URL**: `https://your-frontend-url.vercel.app`
- **API URL**: `https://your-api-url.up.railway.app`
- **Database URL**: `postgresql://...`
- **Extension ID**: `chrome-extension://...`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **Railway Dashboard**: `https://railway.app/dashboard`
- **Chrome Web Store**: `https://chrome.google.com/webstore/devconsole`

## Rollback Plan

If something goes wrong:

1. **Frontend Issues**
   - Check Vercel deployment logs
   - Rollback to previous deployment in Vercel dashboard
   - Verify environment variables
   - Check `vercel.json` configuration (ensure git commands use `--` separator)

2. **Backend Issues**
   - Check Railway/Render logs
   - Rollback to previous deployment
   - Verify database connection
   - Check environment variables

3. **Database Issues**
   - Restore from most recent backup
   - Verify connection string
   - Check database service status

4. **Extension Issues**
   - Uninstall and reinstall extension
   - Check browser console for errors
   - Verify API is accessible
   - Check CORS configuration

5. **Build Failures**
   - Check git command syntax in `vercel.json`
   - Ensure `--` separator is used between revisions and paths
   - Example: `git diff --quiet HEAD^ HEAD -- ./apps/web`
   - Verify all dependencies are installed
   - Run `npm run build` locally to test

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## Cost Tracking

Track your monthly costs:

| Service | Free Tier | Paid Tier | Current Cost |
|---------|-----------|------------|---------------|
| Vercel (Frontend) | $0 | $20/month | $0 |
| Railway (API + DB) | $5/month | $20/month | $0 |
| Render (API) | $0 | $7/month | $0 |
| Supabase (DB) | $0 | $25/month | $0 |
| Neon (DB) | $0 | $19/month | $0 |
| Chrome Web Store | $5 (one-time) | - | $0 |
| **Total** | **$5-10/month** | **$50-100/month** | **$0** |

---

**Last Updated**: January 30, 2026
**Version**: 1.1.0

**Changelog**:
- v1.1.0 (Jan 30, 2026): Added vercel.json configuration checks, git command troubleshooting
- v1.0.0 (Jan 2026): Initial deployment checklist