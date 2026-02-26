# Deployment Setup Guide

Complete guide for deploying the dating app to production.

## Platforms

- **Backend**: Render.com
- **Frontend**: Vercel
- **Database**: MongoDB Atlas
- **Cache**: Redis (Upstash or similar)
- **Storage**: AWS S3 / Cloudinary

## Quick Start

1. **Backend Setup** (Render)
   - Create new Web Service
   - Connect GitHub repository
   - Set environment variables (see [Environment Variables](../ENVIRONMENT_VARIABLES.md))
   - Deploy

2. **Frontend Setup** (Vercel)
   - Import GitHub repository
   - Configure build settings
   - Set environment variables
   - Deploy

## Environment Variables

See [Environment Variables Reference](../ENVIRONMENT_VARIABLES.md) for complete list.

### Critical Variables

**Backend (Render)**:

- `NODE_ENV=production`
- `JWT_SECRET` (64+ chars)
- `JWT_REFRESH_SECRET` (64+ chars, different from JWT_SECRET)
- `MONGODB_URI` (MongoDB Atlas connection string)
- `FRONTEND_URL` (Vercel deployment URL)

**Frontend (Vercel)**:

- `EXPO_PUBLIC_API_URL` (Render backend URL)
- `EXPO_PUBLIC_WS_URL` (WebSocket URL, wss://)

## Deployment Steps

### Backend Deployment

1. **Generate Secrets**:

   ```bash
   node scripts/generate-jwt-secrets.js
   ```

2. **Validate Environment**:

   ```bash
   node scripts/validate-production-env.js
   ```

3. **Deploy to Render**:
   - Push to main branch (auto-deploys)
   - Or manually deploy from Render dashboard

### Frontend Deployment

1. **Build**:

   ```bash
   npm run web:build
   ```

2. **Deploy to Vercel**:
   - Push to main branch (auto-deploys)
   - Or use Vercel CLI: `vercel --prod`

## Health Checks

After deployment, verify:

- Backend: `https://your-backend.onrender.com/health`
- Frontend: `https://your-app.vercel.app`

## Troubleshooting

See [RENDER_VERCEL_SETUP.md](./RENDER_VERCEL_SETUP.md) for platform-specific issues.

---

**Related Docs**:

- [Environment Variables](../ENVIRONMENT_VARIABLES.md)
- [Production Checklist](../production/checklist.md)
