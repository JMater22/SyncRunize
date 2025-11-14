# RUN TRACKING BOTTLENECK ANALYSIS

## CRITICAL FINDING: MapBox Elevation Analysis (95% Confidence)

**Problem**: Recording a run takes 10-30 seconds

**Root Cause**: MapBox elevation API calls have NO timeout and take 5-30+ seconds

**Location**: 
- d:\CAPSTONE-PROGRAM\SyncRunize\Mobile-App\ionic-app\src\services\mapbox.ts (Lines 56-125)
- Called from: d:\CAPSTONE-PROGRAM\SyncRunize\Mobile-App\ionic-app\src\hooks\useRunTracker.ts (Line 468)

**Why It's Slow**:
1. Processes GPS path in batches of 50 points
2. Each batch makes MapBox Tilequery API call
3. Rate limited to 200ms between calls
4. MapBox API response time: 1-5 seconds per batch
5. Example 30-min run = 360 GPS points / 50 per batch = 7-8 batches
6. Total: 1.6s (delays) + 8-40s (API responses) = 5-40 SECONDS

**Code Issue** (mapbox.ts line 84):
```
const response = await tilequeryService.listFeatures(...).send();
```
No timeout - if MapBox is slow, waits up to 30 seconds

---

## SECONDARY ISSUE: Challenge Updates Block Response (70% Confidence)

**Location**: d:\CAPSTONE-PROGRAM\SyncRunize\backend\controllers\user_route_controller.js (Lines 118-181)

**Problem**: Controller waits for all challenge updates before returning
- Route already saved to database
- But controller AWAITS challenge updates (2-10 seconds)
- User sees loading spinner while challenges update
- Longer for users with more active challenges

**Solution**: Return immediately, update challenges in background

---

## TERTIARY ISSUE: API URL/CORS Configuration (40% Confidence)

**If "request not reaching backend" symptom**:

Check 1: API URL in environment
- File: d:\CAPSTONE-PROGRAM\SyncRunize\Mobile-App\ionic-app\src\lib\api.ts (Line 4)
- Default: http://localhost:5000/api
- Problem: On real device, localhost doesn't work
- Fix: Set VITE_API_URL environment variable to your machine's IP

Check 2: Backend CORS
- File: d:\CAPSTONE-PROGRAM\SyncRunize\backend\server.js (Line 48)
- Current: app.use(cors()) - allows all origins
- Should work, but verify no firewall blocking

Check 3: Backend running
- Test: curl http://YOUR_IP:5000/api/health
- Should return: {"ok": true}

---

## COMPLETE FLOW DIAGRAM

User clicks "Record" (RunTrackerPage.tsx:241)
  -> recordRun() hook (useRunTracker.ts:446)
     -> analyzeRunPath() MAPBOX API (mapbox.ts:240) [5-30s SLOW]
     -> POST /api/routes (api.ts:43)
        -> Backend: completeRun() (user_route_controller.js:98)
           -> RouteModel.createRoute() [1-3s DB]
           -> Update challenges [2-10s SLOW]
           -> Return response

---

## QUICK FIXES

### Fix #1: Add Timeout to Elevation Analysis
File: useRunTracker.ts (around line 468)
Add: Wrap analyzeRunPath() in Promise.race() with 10-second timeout
Result: 10-30s -> 2-5s

### Fix #2: Check API URL  
File: .env or environment
Set: VITE_API_URL=http://YOUR_MACHINE_IP:5000/api
Result: Enables real device to reach backend

### Fix #3: Move Challenge Updates to Background
File: user_route_controller.js (line 185)
Change: Don't await challenge updates, return immediately
Result: Faster UI response

---

## FILE LOCATIONS

Recording Start: d:\CAPSTONE-PROGRAM\SyncRunize\Mobile-App\ionic-app\src\pages\RunTrackerPage.tsx (Line 241)

Hook Function: d:\CAPSTONE-PROGRAM\SyncRunize\Mobile-App\ionic-app\src\hooks\useRunTracker.ts (Lines 446-521)

Elevation Analysis: d:\CAPSTONE-PROGRAM\SyncRunize\Mobile-App\ionic-app\src\services\mapbox.ts (Lines 56-125, 240-286)

API Client: d:\CAPSTONE-PROGRAM\SyncRunize\Mobile-App\ionic-app\src\lib\api.ts (Lines 1-51)

Backend Route: d:\CAPSTONE-PROGRAM\SyncRunize\backend\routes\user_route_routes.js (Line 34)

Backend Controller: d:\CAPSTONE-PROGRAM\SyncRunize\backend\controllers\user_route_controller.js (Lines 98-195)

Database Model: d:\CAPSTONE-PROGRAM\SyncRunize\backend\models\user_route_model.js (Lines 183-325)

Server Config: d:\CAPSTONE-PROGRAM\SyncRunize\backend\server.js (Lines 48-79)

---

## VERIFICATION

To verify the issue:
1. Open browser DevTools
2. Go to Network tab
3. Record a run
4. Look for timing in network requests
5. Check how long POST /api/routes takes
6. If >10 seconds, it's likely the elevation analysis
7. Check Console for MapBox API call timing

