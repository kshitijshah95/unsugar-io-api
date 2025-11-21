# Unsugar API Deployment Guide

## Option 1: Deploy to Render (Recommended - Free Tier)

### Steps:

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Go to [Render.com](https://render.com)**
   - Sign up or log in
   - Click "New +" → "Web Service"

3. **Connect your repository**
   - Select your `unsugar-io-api` repository
   - Or paste the URL: `https://github.com/kshitijshah95/unsugar-io-api.git`

4. **Configure the service:**
   - **Name**: unsugar-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Add Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `3001` (or leave empty, Render provides its own)
   - `CORS_ORIGIN` = `https://your-frontend-url.netlify.app` (update after frontend deployment)

6. **Deploy!**
   - Click "Create Web Service"
   - Wait for deployment (2-5 minutes)
   - Copy your API URL (e.g., `https://unsugar-api.onrender.com`)

### Important Notes:
- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Upgrade to paid plan ($7/month) to avoid sleep

---

## Option 2: Deploy to Railway

### Steps:

1. **Go to [Railway.app](https://railway.app)**
   - Sign up or log in with GitHub

2. **New Project → Deploy from GitHub**
   - Select `unsugar-io-api` repository

3. **Configure:**
   - Railway auto-detects Node.js
   - Set environment variables:
     - `NODE_ENV` = `production`
     - `CORS_ORIGIN` = `https://your-frontend-url.netlify.app`

4. **Deploy**
   - Automatic deployment starts
   - Get your URL from Settings → Domains

### Pricing:
- $5 credit/month free
- Pay for what you use beyond that

---

## Option 3: Deploy to Heroku

### Steps:

1. **Install Heroku CLI** (if not installed)
   ```bash
   brew install heroku/brew/heroku
   ```

2. **Login and create app**
   ```bash
   cd /Users/kshitijshah/Desktop/Workspaces/unsugar-api
   heroku login
   heroku create unsugar-api
   ```

3. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://your-frontend-url.netlify.app
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Your API URL**: `https://unsugar-api.herokuapp.com`

### Pricing:
- No free tier (starts at $5/month)

---

## After Backend Deployment

1. **Copy your API URL** (e.g., `https://unsugar-api.onrender.com`)

2. **Update frontend environment variable**:
   - Update in Netlify: Site settings → Environment variables
   - Add: `VITE_API_BASE_URL` = `https://unsugar-api.onrender.com`

3. **Redeploy frontend** to use new API URL

4. **Test your live app!**

---

## Monitoring & Logs

### Render:
- Dashboard → Your Service → Logs

### Railway:
- Dashboard → Your Service → Deployments → View Logs

### Heroku:
```bash
heroku logs --tail
```

---

## Quick Deploy Commands

```bash
# Commit latest changes
cd /Users/kshitijshah/Desktop/Workspaces/unsugar-api
git add .
git commit -m "Production ready"
git push origin main
```

Then follow one of the deployment options above.
