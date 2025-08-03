# Road 2 Royalty - Backend Deployment Instructions

## Option 1: GitHub + Railway (Recommended)

1. **Create GitHub Repository:**
   - Go to https://github.com
   - Click "+" → "New repository"
   - Name: `road2royalty-fantasy-football`
   - Make it **Public**
   - Don't initialize with README
   - Click "Create repository"

2. **Copy the repository URL** (looks like: https://github.com/YOUR_USERNAME/road2royalty-fantasy-football.git)

3. **Tell Cascade the URL** - I'll push your code and deploy automatically!

## Option 2: Direct Railway Deploy

1. **Go to:** https://railway.app
2. **Sign up** with GitHub
3. **Click "Deploy from GitHub repo"**
4. **Upload your `backend` folder directly**

## Your Backend Files Are Ready:
- ✅ `main.py` - Your FastAPI application
- ✅ `requirements.txt` - Dependencies (fastapi, uvicorn, pytz)
- ✅ `Procfile` - Railway deployment config
- ✅ `railway.toml` - Railway settings

## After Deployment:
1. **Copy your Railway backend URL** (like: https://your-app.railway.app)
2. **Give it to Cascade** - I'll update your frontend automatically
3. **Share the final URL** with your league members!

## Current Status:
- Frontend: https://road2royalty-fantasy-football.windsurf.build
- Backend: Ready to deploy (all files prepared)
- Data: Real league data, draft countdown, payment tracking
