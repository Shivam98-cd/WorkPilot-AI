"""
WorkPilot AI - Production Deployment Guide
==========================================

This guide covers production deployment to various platforms.

PREREQUISITES:
--------------
✅ Domain name configured
✅ SSL certificate ready
✅ Firebase project in production mode
✅ All environment variables configured
✅ Code tested locally

OPTION 1: VERCEL + RAILWAY
---------------------------
Recommended for most teams. Easy, scalable, affordable.

FRONTEND (Vercel):
1. Push code to GitHub
2. Go to vercel.com → Import Project
3. Select frontend-auth directory
4. Configure:
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist
5. Add Environment Variables:
   VITE_FIREBASE_API_KEY=xxx
   VITE_FIREBASE_AUTH_DOMAIN=xxx
   VITE_FIREBASE_PROJECT_ID=xxx
   VITE_FIREBASE_STORAGE_BUCKET=xxx
   VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
   VITE_FIREBASE_APP_ID=xxx
   VITE_API_BASE_URL=https://your-api.railway.app/api/v1
6. Deploy
7. Custom Domain: Add your domain in settings

BACKEND (Railway):
1. Go to railway.app → New Project
2. Deploy from GitHub repo
3. Select backend directory
4. Add Environment Variables (all from .env)
5. Configure:
   - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   - Port: 8000
6. Deploy
7. Get deployment URL
8. Update ALLOWED_ORIGINS in backend .env

Cost: ~$5-20/month (scales automatically)

OPTION 2: AWS (ECS + S3 + CloudFront)
--------------------------------------
Best for enterprise with AWS infrastructure.

FRONTEND:
1. Build: npm run build
2. Upload dist/ to S3 bucket
3. Enable static website hosting
4. Configure CloudFront distribution
5. Add SSL certificate
6. Point domain to CloudFront

BACKEND:
1. Create Docker image
2. Push to ECR
3. Create ECS cluster
4. Create task definition
5. Create service with load balancer
6. Configure auto-scaling
7. Add RDS/DynamoDB if needed

Cost: ~$50-200/month (depends on usage)

OPTION 3: GOOGLE CLOUD (Cloud Run + Firebase Hosting)
------------------------------------------------------
Best if already using Firebase/GCP.

FRONTEND:
firebase init hosting
firebase deploy --only hosting

BACKEND:
gcloud run deploy workpilot-api \\
  --source . \\
  --platform managed \\
  --region us-central1 \\
  --allow-unauthenticated

Cost: ~$10-30/month (pay per use)

OPTION 4: DIGITALOCEAN APP PLATFORM
------------------------------------
Simple and developer-friendly.

1. Connect GitHub repository
2. Configure:
   - Frontend: Node.js, build command: npm run build
   - Backend: Python, run command: uvicorn main:app
3. Add environment variables
4. Deploy
5. Custom domain in settings

Cost: ~$12-25/month

OPTION 5: DOCKER COMPOSE (Self-Hosted)
---------------------------------------
For complete control on your own servers.

1. Set up VPS (DigitalOcean, Linode, etc.)
2. Install Docker and Docker Compose
3. Clone repository
4. Configure .env files
5. Run:
   docker-compose up -d

6. Set up nginx reverse proxy:
   - Frontend: your-domain.com → localhost:3000
   - Backend: api.your-domain.com → localhost:8000
7. Configure SSL with Let's Encrypt

Cost: ~$10-20/month (VPS)

SECURITY CHECKLIST:
-------------------
Before going live:

✅ Change JWT_SECRET_KEY to strong random value
✅ Set DEBUG=False in production
✅ Configure ALLOWED_ORIGINS to your domains only
✅ Enable HTTPS everywhere
✅ Set up Firebase security rules
✅ Configure rate limiting
✅ Enable audit logging
✅ Set up monitoring (Sentry/DataDog)
✅ Configure backups
✅ Review CORS settings
✅ Test authentication flows
✅ Run security scan
✅ Set up error tracking
✅ Configure CDN
✅ Test load performance

ENVIRONMENT VARIABLES:
----------------------
Production Backend (.env):

DEBUG=False
JWT_SECRET_KEY=<use 64-char random string>
ALLOWED_ORIGINS=https://workpilot.ai,https://www.workpilot.ai
FIREBASE_PROJECT_ID=<your-project>
# ... rest of Firebase credentials
REDIS_URL=<your-redis-url>
SMTP_HOST=<your-smtp>
SMTP_USER=<your-email>
SMTP_PASSWORD=<your-password>

Production Frontend (.env):

VITE_FIREBASE_API_KEY=<your-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-domain>
VITE_FIREBASE_PROJECT_ID=<your-project>
VITE_API_BASE_URL=https://api.workpilot.ai/api/v1

MONITORING:
-----------
Set up monitoring for:
- API response times
- Error rates
- Authentication failures
- Database queries
- Server resources
- User sessions
- Security events

Tools:
- Sentry (errors)
- DataDog (metrics)
- LogRocket (frontend)
- Firebase Analytics
- Grafana + Prometheus

CI/CD PIPELINE:
---------------
GitHub Actions example:

name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: railway up
        
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: vercel --prod

SCALING:
--------
As you grow:

1. Add Redis for:
   - Session storage
   - Rate limiting
   - Caching

2. Add CDN for:
   - Static assets
   - API responses (where appropriate)

3. Database optimization:
   - Add indexes
   - Query optimization
   - Connection pooling

4. Horizontal scaling:
   - Multiple backend instances
   - Load balancer
   - Auto-scaling rules

5. Monitoring & Alerts:
   - Set up alerts for errors
   - Monitor performance metrics
   - Track user behavior

BACKUP STRATEGY:
----------------
1. Firestore: Enable automated backups
2. User data: Daily exports
3. Configuration: Version control
4. Secrets: Secure vault (1Password, AWS Secrets Manager)

DISASTER RECOVERY:
------------------
1. Document recovery procedures
2. Test backup restoration
3. Have rollback plan
4. Monitor health endpoints
5. Set up status page

PERFORMANCE OPTIMIZATION:
-------------------------
1. Enable compression (gzip/brotli)
2. Minimize bundle size
3. Lazy load components
4. Optimize images
5. Use CDN for static assets
6. Cache API responses
7. Database query optimization
8. Connection pooling

COST OPTIMIZATION:
------------------
1. Monitor usage metrics
2. Set budget alerts
3. Optimize cold starts
4. Use spot instances where possible
5. Cache aggressively
6. Compress data
7. Clean up unused resources

COMPLIANCE:
-----------
If handling sensitive data:

✅ GDPR compliance
✅ SOC2 certification
✅ Data encryption at rest
✅ Data encryption in transit
✅ Regular security audits
✅ Privacy policy
✅ Terms of service
✅ Cookie consent
✅ Data retention policies
✅ Right to deletion

SUPPORT:
--------
Post-deployment:

1. Set up error tracking
2. Monitor user feedback
3. Track authentication issues
4. Review security logs
5. Performance monitoring
6. Uptime monitoring
7. Set up status page
"""

print(__doc__)
