# SyncRunize Project Setup Guide

Complete setup guide for teammates cloning the SyncRunize project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Mapbox Setup](#mapbox-setup)
3. [Supabase Setup](#supabase-setup)
4. [Project Structure](#project-structure)
5. [Installation Steps](#installation-steps)
6. [Environment Variables](#environment-variables)
7. [Running the Application](#running-the-application)
8. [Common Issues](#common-issues)

---

## Prerequisites

Install the following software before proceeding:

### Required Software

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| **Node.js** | 18.x or 20.x | https://nodejs.org/ | For backend and frontend development |
| **npm** | 9.x+ | (comes with Node.js) | Package manager for JavaScript |
| **Python** | 3.9+ | https://www.python.org/ | For algorithm engine |
| **pip** | Latest | (comes with Python) | Package manager for Python |
| **Git** | Latest | https://git-scm.com/ | Version control |

### Optional (for mobile development)

| Software | Purpose |
|----------|---------|
| **Android Studio** | For building Android app |
| **Xcode** | For building iOS app (macOS only) |
| **Java JDK 17** | Required for Android builds |

### Verify Installation

```bash
# Check Node.js version
node --version  # Should show v18.x or v20.x

# Check npm version
npm --version   # Should show 9.x+

# Check Python version
python --version  # Should show 3.9+

# Check pip version
pip --version
```

---

## Mapbox Setup

SyncRunize uses **Mapbox GL JS** for map rendering and routing.

### Step 1: Create Mapbox Account

1. Go to https://account.mapbox.com/auth/signup/
2. Sign up for a free account (no credit card required for development)
3. Confirm your email address

### Step 2: Get Access Token

1. After logging in, go to https://account.mapbox.com/access-tokens/
2. You'll see a **Default public token** already created
3. **Copy this token** - you'll need it for environment variables

**Token format:** `pk.eyJ1Ijoi...` (starts with `pk.`)

### Step 3: Create Token with Appropriate Scopes (Optional)

For production use, create a new token with these scopes:
- `styles:read`
- `fonts:read`
- `datasets:read`
- `navigation:read`

**For development, the default public token is sufficient.**

### Important Notes

- **Public tokens** (start with `pk.`) are safe to expose in frontend code
- **Secret tokens** (start with `sk.`) should NEVER be committed to Git
- Free tier includes:
  - 50,000 map loads per month
  - 100,000 geocoding requests
  - 100,000 routing requests

---

## Supabase Setup

SyncRunize uses **Supabase** for backend database, authentication, and storage.

### Step 1: Access Existing Project (Recommended)

If your team already has a Supabase project:

1. Ask your team lead for:
   - **Supabase Project URL**
   - **Anon/Public Key** (safe to commit)
   - **Service Role Key** (NEVER commit, only for backend)

2. Verify access at: https://supabase.com/dashboard/projects

### Step 2: Create New Project (If Starting Fresh)

1. Go to https://supabase.com/
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name:** SyncRunize
   - **Database Password:** (save this securely!)
   - **Region:** Choose closest to your location
5. Wait 2-3 minutes for project setup

### Step 3: Get Supabase Credentials

1. Go to Project Settings (gear icon) → API
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGci...`)
   - **service_role key** (starts with `eyJhbGci...`) - **Backend only!**

### Step 4: Database Schema

The database schema is already defined in Supabase. Main tables:

- `users` - User profiles and authentication
- `routes` - Saved running routes
- `hazard_reports` - User-reported hazards
- `run_activities` - Completed run tracking data
- `groups` - Running groups
- `notifications` - Push notifications

**If starting fresh, contact your team lead for SQL migration scripts.**

---

## Project Structure

```
SyncRunize/
├── algorithm-engine/          # Python FastAPI - Hazard avoidance routing
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── backend/                   # Node.js Express - Main API server
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── syncrunize-react/          # React Web App
│   ├── src/
│   ├── package.json
│   └── .env
│
└── Mobile-App/
    └── ionic-app/             # Ionic React Mobile App
        ├── src/
        ├── package.json
        └── .env
```

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/SyncRunize.git
cd SyncRunize
```

### 2. Install Algorithm Engine (Python)

```bash
cd algorithm-engine

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Go back to root
cd ..
```

**Dependencies installed:**
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `pydantic` - Data validation
- `sentence-transformers` - NLP embeddings
- `numpy`, `scipy` - Numerical computing
- `requests` - HTTP client
- `supabase` - Supabase Python client
- `python-dotenv` - Environment variables

### 3. Install Backend (Node.js)

```bash
cd backend

# Install dependencies
npm install

# Go back to root
cd ..
```

**Main dependencies:**
- `express` - Web framework
- `@supabase/supabase-js` - Supabase client
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `axios` - HTTP client
- `multer` - File uploads
- `firebase-admin` - Push notifications

### 4. Install Web App (React)

```bash
cd syncrunize-react

# Install dependencies
npm install

# Go back to root
cd ..
```

**Main dependencies:**
- `react`, `react-dom` - React framework
- `@ionic/react` - Ionic UI components
- `mapbox-gl` - Mapbox maps
- `@supabase/supabase-js` - Supabase client
- `axios` - HTTP client
- `react-router-dom` - Routing

### 5. Install Mobile App (Ionic)

```bash
cd Mobile-App/ionic-app

# Install dependencies
npm install

# Go back to root
cd ../..
```

**Main dependencies:**
- Same as Web App, plus:
- `@capacitor/core` - Native device features
- `@capacitor/android` - Android platform
- `@capacitor/ios` - iOS platform
- `@capacitor/geolocation` - GPS tracking
- `@capacitor/camera` - Photo uploads
- `@capacitor/push-notifications` - Push notifications

---

## Environment Variables

Create `.env` files in each directory with the following content:

### 1. `algorithm-engine/.env`

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-service-role-key-here

# Mapbox API Token
MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token-here
```

**Important:** Use **service_role** key (not anon key) for backend to access all hazards.

### 2. `backend/.env`

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Secret (generate random string)
JWT_SECRET=your-random-secret-here-use-long-string

# Server Configuration
PORT=5000
NODE_ENV=development

# Firebase Admin (for push notifications)
# Optional - only if using mobile push notifications
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### 3. `syncrunize-react/.env`

```env
# Map Providers
VITE_MAP_SNAPSHOT_PROVIDER=osm
VITE_GOOGLE_MAPS_API_KEY=optional-if-using-google-maps
VITE_MAPTILER_API_KEY=

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token-here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# API Endpoints (local development)
VITE_API_URL=http://localhost:5000/api
VITE_ALGO_ENGINE_URL=http://localhost:8000
```

### 4. `Mobile-App/ionic-app/.env`

```env
# Map Providers
VITE_MAP_SNAPSHOT_PROVIDER=osm
VITE_GOOGLE_MAPS_API_KEY=optional-if-using-google-maps
VITE_MAPTILER_API_KEY=

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token-here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# API Endpoints
# For physical device testing, use your computer's local IP
# For emulator/simulator, use localhost
VITE_API_URL=http://localhost:5000/api
# Example for physical device: VITE_API_URL=http://192.168.1.100:5000/api
```

**To find your local IP:**
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
# or
ip addr show
```

---

## Running the Application

You need to run **3 separate servers** for full functionality:

### Terminal 1: Algorithm Engine (Python)

```bash
cd algorithm-engine

# Activate virtual environment first
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Run server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
🌍 Loading active hazards from Supabase...
✅ Loaded 15 active hazards into cache
```

**Test:** Visit http://localhost:8000/health

### Terminal 2: Backend API (Node.js)

```bash
cd backend

# Run server
npm start
```

**Output:**
```
Server running on port 5000
Connected to Supabase
```

**Test:** Visit http://localhost:5000/api/health

### Terminal 3: Web App (React)

```bash
cd syncrunize-react

# Run development server
npm run dev
```

**Output:**
```
VITE v7.1.12  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

**Access:** Open http://localhost:5173 in your browser

### Terminal 4 (Optional): Mobile App

```bash
cd Mobile-App/ionic-app

# Run development server
npm run dev
```

Then:

**For browser testing:**
- Open http://localhost:5174 (or whatever port Vite assigns)

**For Android testing:**
```bash
# Build web assets
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# Then run from Android Studio
```

**For iOS testing (macOS only):**
```bash
# Build web assets
npm run build

# Sync with Capacitor
npx cap sync ios

# Open in Xcode
npx cap open ios

# Then run from Xcode
```

---

## Quick Start Summary

**One-time setup:**
```bash
# 1. Clone repository
git clone https://github.com/your-org/SyncRunize.git
cd SyncRunize

# 2. Setup algorithm engine
cd algorithm-engine
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cd ..

# 3. Setup backend
cd backend
npm install
cd ..

# 4. Setup web app
cd syncrunize-react
npm install
cd ..

# 5. Setup mobile app (optional)
cd Mobile-App/ionic-app
npm install
cd ../..

# 6. Configure .env files (see Environment Variables section)
```

**Every time you develop:**
```bash
# Terminal 1 - Algorithm Engine
cd algorithm-engine
venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Backend
cd backend
npm start

# Terminal 3 - Web App
cd syncrunize-react
npm run dev
```

---

## Common Issues

### Issue 1: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For Python
pip uninstall -r requirements.txt
pip install -r requirements.txt
```

### Issue 2: Port already in use

**Solution:**
```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux - Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Issue 3: CORS errors in browser

**Solution:**
- Verify `VITE_API_URL` in `.env` matches backend URL
- Ensure backend CORS is configured to allow frontend origin
- Check browser console for exact error

### Issue 4: Mapbox token errors

**Symptoms:**
- Maps don't load
- "Unauthorized" errors
- Blank map tiles

**Solution:**
1. Verify token starts with `pk.` (public token)
2. Check token is valid at https://account.mapbox.com/access-tokens/
3. Ensure `.env` file has `VITE_MAPBOX_ACCESS_TOKEN=pk.your-token`
4. Restart dev server after changing `.env`

### Issue 5: Supabase connection errors

**Solution:**
1. Verify Supabase URL is correct
2. Check anon key vs service_role key usage:
   - Frontend: Use `anon` key
   - Backend/Algorithm Engine: Use `service_role` key
3. Test connection at https://your-project.supabase.co

### Issue 6: Python virtual environment issues

**Windows:**
```bash
# If activation fails, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**macOS/Linux:**
```bash
# Ensure venv is created with correct Python
python3 -m venv venv
source venv/bin/activate
```

### Issue 7: Mobile app can't connect to backend

**Solution:**
1. Use computer's local IP instead of `localhost`:
   ```env
   VITE_API_URL=http://192.168.1.100:5000/api
   ```
2. Ensure phone/emulator is on same WiFi network
3. Check firewall allows connections on port 5000 and 8000

---

## Testing the Setup

### Test Algorithm Engine

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "mapbox_configured": true,
  "hazards_count": 15
}
```

### Test Backend

```bash
curl http://localhost:5000/api/health
```

### Test Route Generation

1. Open web app: http://localhost:5173
2. Log in or create account
3. Go to "Create Route" tab
4. Pin start and end points on map
5. Click "Generate Route"
6. Should see route with hazard warnings

---

## Additional Resources

- **Mapbox Documentation:** https://docs.mapbox.com/
- **Supabase Documentation:** https://supabase.com/docs
- **Ionic React Documentation:** https://ionicframework.com/docs/react
- **Capacitor Documentation:** https://capacitorjs.com/docs

---

## Team Communication

**When you encounter issues:**
1. Check this guide first
2. Search existing GitHub issues
3. Ask in team chat with:
   - Error message
   - Steps to reproduce
   - What you've already tried

**Before committing code:**
1. Never commit `.env` files
2. Test on your local machine
3. Update this guide if you discover new setup steps

---

**Document Version:** 1.0
**Last Updated:** 2025-01-14
