# Google Maps Setup Guide

## Overview
This guide will help you set up Google Maps integration for the Create Route feature in SyncRunize.

---

## Step 1: Get Google Maps API Key

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create or Select a Project
- Click on the project dropdown (top left)
- Create a new project or select an existing one
- Name it something like "SyncRunize" or "Running-App"

### 1.3 Enable Required APIs
Go to "APIs & Services" > "Library" and enable these APIs:

1. **Maps JavaScript API** (for interactive maps)
2. **Places API** (for location search/autocomplete)
3. **Maps Static API** (for route snapshots)
4. **Geocoding API** (optional, for address lookup)

### 1.4 Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key (it will look like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX`)

### 1.5 Restrict API Key (Recommended for Production)
1. Click on your API key to edit it
2. Under "Application restrictions":
   - For **development**: Choose "None"
   - For **production**: Choose "HTTP referrers" and add your domain

3. Under "API restrictions":
   - Select "Restrict key"
   - Check only the APIs you enabled above

---

## Step 2: Configure Environment Variables

### 2.1 Frontend Configuration

Create or update `.env` file in `syncrunize-react/`:

```env
# Google Maps API Key (Frontend)
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE

# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Algorithm Engine URL (if different)
VITE_ALGORITHM_ENGINE_URL=http://localhost:8000
```

**Replace `YOUR_API_KEY_HERE` with your actual Google Maps API key.**

### 2.2 Backend Configuration

Create or update `.env` file in `backend/`:

```env
# Google Maps API Key (Backend - for snapshots)
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE

# Map Snapshot Provider: 'google', 'osm', or 'maptiler'
MAP_SNAPSHOT_PROVIDER=google

# Database and other configs...
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

**Important:** Use the **SAME** API key for both frontend and backend.

---

## Step 3: Verify Installation

### 3.1 Check Package Installation

The required package should already be installed. Verify:

```bash
cd syncrunize-react
npm list @react-google-maps/api
```

You should see: `@react-google-maps/api@2.x.x`

If not installed:
```bash
npm install @react-google-maps/api
```

### 3.2 Verify Backend Setup

The backend already has Google Maps Static API support built-in at:
- File: `backend/utils/map_snapshot.js`
- No additional packages needed!

---

## Step 4: Start Your Services

### 4.1 Start Algorithm Engine (Port 8000)
```bash
cd algorithm-engine
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4.2 Start Backend (Port 5000)
```bash
cd backend
npm start
```

### 4.3 Start Frontend (Port 3000 or 5173)
```bash
cd syncrunize-react
npm run dev
```

---

## Step 5: Test the Create Route Feature

### 5.1 Navigate to Create Route Page
1. Open your web app: `http://localhost:5173` (or your dev server port)
2. Login to your account
3. Navigate to Routes > "Create New Route"

### 5.2 Test Functionality

**Option 1: Search for Locations**
1. Click on "Search starting location" input
2. Type a place name (e.g., "Tarlac City Hall")
3. Select from dropdown
4. Repeat for destination
5. Click "Generate Safe Route"

**Option 2: Pin on Map**
1. Click "Pin on map" button for start point
2. Click anywhere on the map to set start point
3. Click "Pin on map" button for end point
4. Click on map to set end point
5. Click "Generate Safe Route"

**Option 3: Mix Both Methods**
- Use search for start point
- Use pin for end point (or vice versa)

### 5.3 Verify Route Generation

After clicking "Generate Safe Route":
1. ✅ Loading spinner should appear
2. ✅ Algorithm engine processes the request
3. ✅ Blue path appears on the map
4. ✅ Route info card shows distance and risk score
5. ✅ "Save Route" and "Cancel" buttons appear

### 5.4 Test Save/Cancel

**Save Route:**
- Click "Save Route" button
- Should see success toast
- Redirects to Routes page
- Route appears in saved routes (NOT in activities)

**Cancel:**
- Click "Cancel" button
- Map clears
- Form resets

---

## Step 6: Verify Route Snapshots (Backend)

### 6.1 Check Snapshot Generation

When routes are created, the backend generates snapshot URLs.

**With Google Maps Static API:**
- URLs look like: `https://maps.googleapis.com/maps/api/staticmap?...`

**With OSM (fallback):**
- URLs look like: `https://tile.openstreetmap.org/...`

### 6.2 View in Database

Check `user_routes` table:
```sql
SELECT route_id, route_name, route_status, snapshot_url
FROM user_routes
WHERE route_status = 'generated'
ORDER BY created_at DESC
LIMIT 5;
```

The `snapshot_url` should contain your Google Maps Static API URL.

---

## Troubleshooting

### Issue 1: Map Not Loading

**Symptoms:** Blank gray area where map should be

**Solutions:**
1. Check API key in `.env` file
2. Verify `VITE_GOOGLE_MAPS_API_KEY` is set correctly
3. Check browser console for errors
4. Make sure Maps JavaScript API is enabled in Google Cloud Console

### Issue 2: "This page can't load Google Maps correctly"

**Cause:** API key restriction or billing issue

**Solutions:**
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click on your API key
3. Under "Application restrictions" > Select "None" (for testing)
4. Enable billing on your Google Cloud account (Google requires it, but free tier is generous)

### Issue 3: Autocomplete Not Working

**Symptoms:** Search box doesn't suggest places

**Solutions:**
1. Verify Places API is enabled
2. Check browser console for errors
3. Try typing more specific location names

### Issue 4: Route Generation Fails

**Symptoms:** "Failed to generate route" error

**Possible Causes:**
1. Algorithm engine not running (Port 8000)
2. Backend not running (Port 5000)
3. Start/end points too far apart (try closer points)
4. Start/end points outside Tarlac area (algorithm is configured for Tarlac)

**Solutions:**
```bash
# Check if algorithm engine is running
curl http://localhost:8000/

# Should return: {"message": "Algorithm microservice running!"}

# Check if backend is running
curl http://localhost:5000/api/health

# Test algorithm engine directly
curl -X POST http://localhost:8000/route-osm \
  -H "Content-Type: application/json" \
  -d '{
    "start": {"lat": 15.4755, "lng": 120.5963},
    "end": {"lat": 15.4800, "lng": 120.6000},
    "alpha": 0.5
  }'
```

### Issue 5: Route Snapshot Not Generated

**Symptoms:** `snapshot_url` is null in database

**Solutions:**
1. Check backend logs for snapshot generation errors
2. Verify `MAP_SNAPSHOT_PROVIDER` is set in backend `.env`
3. Verify `GOOGLE_MAPS_API_KEY` is set in backend `.env`
4. Check if chosen_path has coordinates

---

## API Key Billing & Quotas

### Free Tier (Monthly)

Google provides $200 free credit each month, which covers:

- **Maps JavaScript API:** 28,500 loads
- **Places API:** 2,833 requests
- **Maps Static API:** 28,500 requests

For a typical app, this is **more than enough** for development and moderate production use.

### Cost Monitoring

1. Go to Google Cloud Console
2. Navigate to "Billing" > "Reports"
3. Monitor your API usage

---

## Next Steps

Once Google Maps is working:

1. ✅ Test route generation with various locations
2. ✅ Verify saved routes appear in Routes page (not Activities)
3. ✅ Test on mobile (should work responsively)
4. ⏭️ Add distance calculation option (future enhancement)
5. ⏭️ Add route sharing features (future enhancement)

---

## Key Files Reference

### Frontend:
- Component: `syncrunize-react/src/components/Routes/CreateRouteMap.tsx`
- Styles: `syncrunize-react/src/components/Routes/CreateRouteMap.css`
- Environment: `syncrunize-react/.env`

### Backend:
- Snapshot Generator: `backend/utils/map_snapshot.js`
- Route Model: `backend/models/user_route_model.js`
- Route Controller: `backend/controllers/user_route_controller.js`
- Routes: `backend/routes/user_route_routes.js`
- Environment: `backend/.env`

### Algorithm Engine:
- Main: `algorithm-engine/main.py`
- Endpoint: `POST http://localhost:8000/route-osm`

---

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check backend logs
3. Check algorithm engine logs
4. Verify all environment variables are set
5. Ensure all services are running

---

## Alternative: Use OSM (No API Key Required)

If you want to test without Google Maps API key:

**Frontend `.env`:**
```env
# Leave empty or remove
# VITE_GOOGLE_MAPS_API_KEY=
```

**Backend `.env`:**
```env
# Use OSM for snapshots
MAP_SNAPSHOT_PROVIDER=osm
```

**Note:** OSM provides basic map tiles but:
- No place search/autocomplete
- Basic snapshot tiles (not as pretty)
- No marker labels
- Free and no restrictions

---

## Production Checklist

Before deploying to production:

- [ ] Restrict API key to your domain
- [ ] Enable only required APIs
- [ ] Set up billing alerts
- [ ] Monitor API usage
- [ ] Test all features thoroughly
- [ ] Configure CORS properly
- [ ] Use HTTPS
- [ ] Set environment variables on hosting platform

---

**You're all set!** 🎉

Your Create Route feature should now work with:
- ✅ Interactive Google Maps
- ✅ Place search/autocomplete
- ✅ Click-to-pin functionality
- ✅ Safe route generation with algorithm engine
- ✅ Save/Cancel actions
- ✅ Google Maps Static API for snapshots
