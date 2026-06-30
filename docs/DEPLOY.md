# Deployment Guide — FearlessHealth

## Option A: Railway (Backend) + Vercel (Frontend) — Recommended

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — FearlessHealth"
git remote add origin https://github.com/YOUR_USERNAME/fearlesshealth
git push -u origin main
```

### Step 2 — Deploy Backend on Railway (Free)

1. Go to https://railway.app and sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your repo
4. Railway auto-detects Node.js — it will run `npm install && npm run build && npm start`
5. Go to **Variables** tab and add:

```
NODE_ENV=production
JWT_SECRET=your_long_random_secret_here
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
PORT=5000
```

6. Go to **Settings → Networking → Generate Domain**
7. Copy your Railway URL: `https://fearlesshealth.railway.app`

### Step 3 — Deploy Frontend on Vercel (Free)

1. Go to https://vercel.com and sign up with GitHub
2. Click **New Project → Import** your repo
3. Set **Root Directory** to `frontend`
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Add Environment Variable:
   ```
   VITE_API_URL=https://fearlesshealth.railway.app
   ```
7. Open `frontend/vercel.json` and replace `YOUR-RAILWAY-URL` with your actual Railway URL
8. Click Deploy

Your live URLs will be:
- **Frontend**: `https://fearlesshealth.vercel.app`
- **Backend**: `https://fearlesshealth.railway.app`

---

## Option B: Single deployment on Railway (Full-stack)

Build the frontend into the backend's static folder:

```bash
# In the root of the project
cd frontend && npm run build && cp -r dist ../frontend-dist
cd ..
```

Then in `railway.toml` the backend will serve the built frontend automatically
since `server.ts` serves `frontend/dist` in production mode.

---

## After Deployment

1. Visit your frontend URL — you should see the landing page
2. Test the demo: `https://your-app.vercel.app/demo`
3. Share the waitlist: `https://your-app.vercel.app/landing`
4. Your health check: `https://your-backend.railway.app/health`
