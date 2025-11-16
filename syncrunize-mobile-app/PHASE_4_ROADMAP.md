# Phase 4: Routes & Run Tracking - ROADMAP 📋

## Overview
Phase 4 focuses on integrating the core running features: real-time GPS tracking, route management, hazard reporting, and guided running. This phase connects the mobile app's tracking capabilities with the backend for data persistence and sharing.

---

## Current State Analysis

### Existing Run Tracking Features
The mobile app currently has:
1. **Run Tracking UI** - Pages for starting/tracking runs
2. **GPS Integration** - Basic Geolocation capabilities
3. **Route Display** - Map components for showing routes
4. **Mock Data** - Not yet connected to backend

**What's Missing**:
- Backend integration for saving completed runs
- Real-time route snapshots for posts
- Hazard reporting during runs
- Saved routes with guided running
- Offline route storage

---

## Phase 4 Tasks

### Task 4.1: Integrate Run Tracking with Backend ✅ NEXT
**Goal**: Save completed runs to backend with full route data

**Files to Modify**:
- `pages/Run-Tracker.tsx` or equivalent run tracking page
- `pages/Home.tsx` - Start run button
- `services/routes.ts` (already created in Phase 1)

**What to Implement**:

1. **Real-Time GPS Tracking**:
   - Use Capacitor Geolocation to track user position
   - Record coordinates, timestamps, speed, altitude
   - Calculate distance, duration, pace in real-time
   - Display live stats during run

2. **Route Snapshot Generation**:
   - Capture map screenshot when run completes
   - Use Mapbox/Google Maps Static API
   - Store snapshot URL for posts

3. **Save Completed Run**:
   - POST to `/api/routes/save` with:
     ```json
     {
       "route_name": "Morning Run",
       "distance_km": 5.2,
       "duration_seconds": 1800,
       "average_pace": "5:45/km",
       "estimated_calories": 350,
       "route_type": "run",
       "chosen_path": [{ lat: ..., lng: ... }],
       "description": "Great weather today!",
       "visibility": "public",
       "snapshot_url": "https://..."
     }
     ```

4. **Post-Run Flow**:
   - Summary screen with stats
   - Option to share to feed
   - Save to profile
   - Navigate to Community with new post

**API Endpoints**:
- `POST /api/routes/save` - Save completed run
- Uses `RoutesApi.saveRoute()` from services

**Dependencies**:
- `@capacitor/geolocation` - GPS tracking
- Mapbox GL JS or Google Maps - Map display and snapshots
- RoutesApi (✅ Already created)

---

### Task 4.2: Implement Hazard Reporting
**Goal**: Allow users to report hazards during runs and display them on the map

**Files to Modify**:
- `pages/Run-Tracker.tsx` - Add hazard report button during run
- `pages/Map.tsx` or equivalent - Display hazard markers
- Create `components/HazardReportModal.tsx`

**What to Implement**:

1. **Report Hazard During Run**:
   - Button in run tracker to report hazard
   - Modal with hazard type selection:
     - Pothole
     - Broken Glass
     - Construction
     - Aggressive Dog
     - Poor Lighting
     - Traffic
     - Flooding
     - Other
   - Optional description field
   - Capture current GPS location
   - Submit to backend

2. **Display Hazards on Map**:
   - Fetch nearby hazards: `GET /api/hazards/nearby?lat=...&lng=...&radius=5`
   - Show hazard markers on run tracker map
   - Different icons for different hazard types
   - Tap marker to see hazard details
   - Show hazard report date and user

3. **Hazard Verification**:
   - Users can confirm hazards still exist
   - Upvote system for hazard severity
   - Auto-expire hazards after 30 days (backend)

**API Endpoints**:
- `POST /api/hazards` - Report new hazard
  ```json
  {
    "hazard_type": "pothole",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "description": "Large pothole on sidewalk",
    "severity": "medium"
  }
  ```
- `GET /api/hazards/nearby` - Get hazards in area
- `POST /api/hazards/{hazardId}/verify` - Verify/upvote hazard

**Dependencies**:
- HazardsApi (✅ Already created)
- Geolocation for current position
- Map component for displaying markers

---

### Task 4.3: Add Saved Routes with Guided Running
**Goal**: Browse and save public routes, enable guided running with turn-by-turn

**Files to Modify**:
- Create `pages/Saved-Routes.tsx` or update existing
- Create `pages/Guided-Run.tsx`
- `pages/Run-Tracker.tsx` - Add guided mode

**What to Implement**:

1. **Browse Public Routes**:
   - List view of public routes from other users
   - Filter by distance, difficulty, location
   - Search by route name or location
   - Display route preview on map
   - Show route stats (distance, elevation, difficulty)
   - "Save Route" button

2. **Saved Routes Management**:
   - My Saved Routes list
   - View saved route details
   - Start guided run from saved route
   - Unsave route option

3. **Guided Running**:
   - Select saved route to start guided run
   - Display route path on map
   - Show current position along route
   - Turn-by-turn guidance (if route has waypoints)
   - Progress indicator (% complete, distance remaining)
   - Deviation alerts (if user goes off-route)
   - Complete guided run → Save as completed activity

4. **Route Recommendations**:
   - Suggest routes near user's location
   - Popular routes in area
   - Routes similar to user's preferences

**API Endpoints**:
- `GET /api/unsaved/public` - Get public routes
- `POST /api/saved-routes/save` - Save route for later
- `GET /api/saved-routes/user/{userId}` - Get user's saved routes
- `DELETE /api/saved-routes/{routeId}` - Unsave route
- `GET /api/routes/{routeId}` - Get route details for guidance

**Dependencies**:
- SavedRoutesApi (✅ Already created)
- RoutesApi (✅ Already created)
- Geolocation for position tracking
- Map routing library for turn-by-turn

---

## Implementation Order

### Step 1: Run Tracking (Task 4.1)
This is the foundation - users need to be able to save their runs.

```
Run Tracker Page
  ├─ Start Run → GPS tracking begins
  ├─ Live Stats → Distance, pace, duration update
  ├─ Complete Run → Generate route snapshot
  └─ Save to Backend
     ├─ RoutesApi.saveRoute()
     ├─ Option to share to feed (PostsApi.createPost())
     └─ Navigate to profile or feed
```

### Step 2: Hazard Reporting (Task 4.2)
Add safety features during runs.

```
Run Tracker Page
  └─ Report Hazard Button
     └─ HazardReportModal
        ├─ Select hazard type
        ├─ Add description
        ├─ Capture GPS location
        └─ HazardsApi.reportHazard()

Map Display
  └─ Load nearby hazards: HazardsApi.getNearbyHazards()
     └─ Display markers on map
        └─ Tap marker → Show hazard details
```

### Step 3: Saved Routes (Task 4.3)
Enable route discovery and guided running.

```
Saved Routes Page
  ├─ Browse Public Routes → RoutesApi.getPublicRoutes()
  ├─ Save Route → SavedRoutesApi.saveRoute()
  └─ My Saved Routes → SavedRoutesApi.getUserSavedRoutes()

Guided Run Page
  ├─ Select saved route
  ├─ Display route path on map
  ├─ Track user position along route
  ├─ Show progress and remaining distance
  └─ Complete → Save as completed activity
```

---

## Data Flow

### Saving a Completed Run
```
User completes run
  └─ Calculate final stats (distance, duration, pace, calories)
     └─ Generate route snapshot
        └─ RoutesApi.saveRoute()
           └─ POST /api/routes/save
              ├─ Success: Route saved with route_id
              ├─ Option: Share to feed
              │  └─ PostsApi.createPost(content, routeId)
              │     └─ POST /api/posts
              └─ Navigate to profile or feed
```

### Reporting a Hazard
```
User taps "Report Hazard" during run
  └─ Open HazardReportModal
     ├─ Get current GPS location
     ├─ User selects hazard type
     ├─ User adds description (optional)
     └─ HazardsApi.reportHazard()
        └─ POST /api/hazards
           ├─ Success: Show success toast
           ├─ Update map markers
           └─ Continue run
```

### Starting a Guided Run
```
User browses saved routes
  └─ Select a route
     └─ View route details
        └─ Tap "Start Guided Run"
           └─ Load route path coordinates
              └─ Start GPS tracking
                 ├─ Display route on map
                 ├─ Show user position
                 ├─ Calculate progress
                 └─ Turn-by-turn guidance (if waypoints exist)
```

---

## UI/UX Considerations

### Run Tracker UI
- **Live Stats Display**:
  - Large, readable font
  - Dark mode support
  - Color-coded pace (green = good, yellow = average, red = slow)
- **Map View**:
  - Full-screen option
  - Current position marker (blue dot)
  - Route path (blue line)
  - Hazard markers (red pins)
- **Controls**:
  - Pause/Resume button
  - Stop/Complete button
  - Report Hazard button (small, non-intrusive)
  - Audio cues (distance milestones, pace alerts)

### Post-Run Summary
- **Stats Card**:
  - Distance (large)
  - Duration
  - Average Pace
  - Calories Burned
  - Elevation Gain (if available)
- **Map Snapshot**: Visual of completed route
- **Actions**:
  - Share to Feed (with caption input)
  - Save to Profile
  - View Detailed Stats
  - Start New Run

### Hazard Report Modal
- **Hazard Type Grid**: Icons for each hazard type
- **Description**: Optional text input
- **Location**: Auto-filled from GPS
- **Severity**: Low, Medium, High
- **Quick Submit**: One-tap to report

### Saved Routes UI
- **List View**:
  - Route card with thumbnail map
  - Distance and duration
  - Difficulty badge
  - Star icon (saved vs not saved)
- **Filters**:
  - Distance range slider
  - Route type (run, walk, cycle)
  - Difficulty (easy, moderate, hard)
  - Location proximity

---

## Backend Integration Summary

### Services Already Created (Phase 1)
✅ `RoutesApi` - All route CRUD operations
✅ `HazardsApi` - Hazard reporting and retrieval
✅ `SavedRoutesApi` - Save/unsave routes

### What's Ready to Use
```typescript
// Save completed run
await RoutesApi.saveRoute({
  route_name: "Morning Run",
  distance_km: 5.2,
  duration_seconds: 1800,
  average_pace: "5:45/km",
  estimated_calories: 350,
  route_type: "run",
  chosen_path: coordinates,
  visibility: "public",
  snapshot_url: snapshotUrl
});

// Report hazard
await HazardsApi.reportHazard({
  hazard_type: "pothole",
  latitude: currentLat,
  longitude: currentLng,
  description: "Large pothole",
  severity: "medium"
});

// Save route for later
await SavedRoutesApi.saveRoute(routeId);

// Get saved routes
const savedRoutes = await SavedRoutesApi.getUserSavedRoutes(userId);
```

---

## Testing Checklist

### Run Tracking
- [ ] GPS tracking starts/stops correctly
- [ ] Live stats update in real-time
- [ ] Distance calculation is accurate
- [ ] Pace is calculated correctly
- [ ] Route path displays on map
- [ ] Snapshot generates after run
- [ ] Run saves to backend
- [ ] Can share run to feed
- [ ] Run appears in profile activities

### Hazard Reporting
- [ ] Hazard button accessible during run
- [ ] Modal opens with hazard types
- [ ] GPS location captured correctly
- [ ] Hazard saves to backend
- [ ] Hazard appears on map
- [ ] Nearby hazards load on map
- [ ] Can view hazard details
- [ ] Hazards persist across sessions

### Saved Routes
- [ ] Public routes load from backend
- [ ] Can browse and filter routes
- [ ] Save route button works
- [ ] Saved routes appear in "My Routes"
- [ ] Can start guided run from saved route
- [ ] Guided run displays route path
- [ ] User position tracks correctly
- [ ] Progress updates in real-time
- [ ] Completion saves as activity

---

## Technical Considerations

### GPS Tracking
- **Battery Optimization**:
  - Use `enableHighAccuracy: false` when not in guided mode
  - Stop tracking when app is backgrounded
  - Batch location updates
- **Permission Handling**:
  - Request permissions before starting run
  - Show permission denied message
  - Provide link to settings

### Offline Support
- **Cache Routes**:
  - Store saved routes locally for offline access
  - Sync when connection available
- **Queue Hazards**:
  - Save hazard reports offline
  - Upload when connection restored

### Performance
- **Map Rendering**:
  - Limit number of hazard markers displayed
  - Cluster nearby hazards
  - Use vector tiles for better performance
- **Location Updates**:
  - Throttle updates to every 1-2 seconds
  - Don't update UI on every GPS ping

---

## Next Steps

After completing Phase 4, you'll have:
- ✅ Full run tracking with backend persistence
- ✅ Real-time GPS tracking and stats
- ✅ Hazard reporting for safer routes
- ✅ Saved routes with guided running
- ✅ Route sharing to community feed

**Then proceed to Phase 5: Challenges & Badges**

---

## Questions Before Starting?

Before we begin implementation, consider:
1. Which map provider are you using? (Mapbox, Google Maps, OpenStreetMap)
2. Do you have map API keys configured?
3. Should guided running have audio navigation?
4. Any specific hazard types to prioritize?

---

**Ready to start Task 4.1?** Just say **"Begin Task 4.1"** or **"Start implementing run tracking"**!
