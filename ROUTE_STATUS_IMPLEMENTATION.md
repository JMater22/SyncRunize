# Route Status Implementation Guide

## Overview

This document explains the implementation of the route status system (Option A) which distinguishes between generated routes, saved routes, and completed runs.

## Database Changes

### New Column: `route_status`

Added to `user_routes` table with three possible values:
- `generated` - Temporary route created during exploration (not yet saved or run)
- `saved` - Route user wants to keep for future use
- `completed` - Actual run activity that counts toward challenges/statistics

### Migration File

Location: `backend/migrations/add_route_status.sql`

**Run this migration:**
```bash
psql -U your_user -d your_database -f backend/migrations/add_route_status.sql
```

**Important:** All existing routes will be marked as `completed` since they represent actual runs.

### Indexes Created

1. `idx_user_routes_status` - For efficient filtering by user and status
2. `idx_user_routes_completed` - Partial index for activities view (only completed routes)

## Backend API Changes

### New Endpoints

#### 1. Generate Route (POST `/api/routes/generate`)
Creates a route with `route_status = 'generated'`

**Use case:** User is creating/exploring routes on the Create Route page

**Request:**
```json
{
  "start_lat": 15.4755,
  "start_lng": 120.5963,
  "end_lat": 15.4800,
  "end_lng": 120.6000,
  "chosen_path": [...],
  "duration_seconds": 1800,
  "average_pace": 5.5,
  "route_name": "Morning Run Route"
}
```

**Response:**
```json
{
  "message": "✅ Route generated successfully",
  "route": {
    "route_id": 123,
    "route_status": "generated",
    ...
  }
}
```

#### 2. Save Generated Route (POST `/api/routes/save/:routeId`)
Updates route status from `generated` to `saved`

**Use case:** User clicks "Save Route" button on Create Route page

**Response:**
```json
{
  "message": "✅ Route saved successfully",
  "route": {
    "route_id": 123,
    "route_status": "saved",
    ...
  }
}
```

#### 3. Complete Run (POST `/api/routes/complete`)
Creates a route with `route_status = 'completed'` and updates challenges/badges

**Use case:** User finishes an actual run (mobile app)

**Request:** Same as generate route

**Response:**
```json
{
  "message": "✅ Run completed successfully and challenges updated.",
  "route": {
    "route_id": 124,
    "route_status": "completed",
    ...
  },
  "challenges_updated": [...]
}
```

### Updated Endpoints

#### GET `/api/routes` (authenticated user)
**New query parameters:**
- `activities_only=true` - Only return completed routes (for activities view)
- `route_status=generated|saved|completed` - Filter by specific status

**Examples:**
```javascript
// Get all my routes (all statuses)
GET /api/routes

// Get only completed activities
GET /api/routes?activities_only=true

// Get only generated routes
GET /api/routes?route_status=generated

// Get only saved routes
GET /api/routes?route_status=saved
```

#### GET `/api/routes/user/:userId`
**New query parameters:** Same as above

**Examples:**
```javascript
// View another user's activities (only shows completed)
GET /api/routes/user/456?activities_only=true
```

### Legacy Support

#### POST `/api/routes` (backward compatible)
Still works! Defaults to creating completed runs for backward compatibility.

## Frontend Changes

### Files Updated

1. **ViewProfile.tsx** - Line 295
2. **Profile.tsx** - Line 400
3. **Activities.tsx** - Line 87

All now include `activities_only: true` parameter when fetching routes for activity views.

### Example Usage

```typescript
// Fetch only completed activities
const response = await axios.get(
  `${import.meta.env.VITE_API_URL}/routes/user/${userId}`,
  {
    params: {
      limit: 20,
      offset: 0,
      activities_only: true // ✅ Only show completed runs
    }
  }
);
```

## Use Cases by Platform

### Web Application

**Create Route Page:**
1. User inputs start/end points
2. Call algorithm engine to get safest path
3. Call `POST /api/routes/generate` (status: `generated`)
4. Display route on map
5. Show two buttons:
   - "Cancel" - Discard route
   - "Save Route" - Call `POST /api/routes/save/:routeId` (status: `saved`)

**Activities/Profile View:**
- Only shows routes with `route_status = 'completed'`
- Generated or saved routes are NOT displayed as activities

### Mobile Application

**Create Route Page:**
Same as web, but with three buttons:
1. "Use Route" - Start run with this route
2. "Save Route" - Save for later
3. "Cancel" - Discard

**During/After Run:**
- Call `POST /api/routes/complete` when run finishes
- This triggers challenge/badge updates

## Data Flow

### Route Generation Flow
```
User creates route
  ↓
POST /api/routes/generate
  ↓
route_status = 'generated'
  ↓
User clicks "Save Route"
  ↓
POST /api/routes/save/:routeId
  ↓
route_status = 'saved'
```

### Run Completion Flow
```
User finishes run
  ↓
POST /api/routes/complete
  ↓
route_status = 'completed'
  ↓
Update challenges & badges
  ↓
Show in activities view
```

## Database Schema Reference

```sql
-- user_routes table structure
CREATE TABLE user_routes (
  route_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  route_status VARCHAR(20) NOT NULL DEFAULT 'generated'
    CHECK (route_status IN ('generated', 'saved', 'completed')),
  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,
  end_lat DOUBLE PRECISION NOT NULL,
  end_lng DOUBLE PRECISION NOT NULL,
  chosen_path JSONB,
  distance_km DOUBLE PRECISION,
  route_name VARCHAR DEFAULT 'Unnamed Route',
  created_at TIMESTAMP DEFAULT NOW(),
  ...
);

-- saved_routes table (unchanged)
CREATE TABLE saved_routes (
  saved_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  route_id INTEGER REFERENCES user_routes(route_id),
  saved_at TIMESTAMP DEFAULT NOW(),
  note TEXT
);
```

## Important Notes

### Activities Filtering

**Always use `activities_only=true` when:**
- Displaying user activities/runs
- Showing activity history
- Calculating statistics
- Displaying on profile pages

**Why?** Generated routes are temporary explorations, not actual activities. Only completed runs should count as activities.

### Challenge/Badge Updates

**Only triggered on:** `route_status = 'completed'`

The `completeRun` endpoint updates challenges and awards badges. The `generateRoute` endpoint does NOT trigger these updates.

### Cleanup Strategy (Optional)

Consider adding a cleanup job to delete old generated routes:

```sql
-- Delete generated routes older than 7 days
DELETE FROM user_routes
WHERE route_status = 'generated'
  AND created_at < NOW() - INTERVAL '7 days';
```

## Testing Checklist

- [ ] Run database migration
- [ ] Verify existing routes are marked as `completed`
- [ ] Test route generation (should not appear in activities)
- [ ] Test saving generated route (should update status to `saved`)
- [ ] Test completing a run (should update challenges)
- [ ] Verify activities view only shows completed routes
- [ ] Test backward compatibility with existing `POST /api/routes`

## Troubleshooting

### Issue: Activities still showing generated routes

**Solution:** Ensure frontend is passing `activities_only: true` parameter

### Issue: Migration fails

**Solution:** Check if `route_status` column already exists. If so, skip to backfill step.

### Issue: Challenges not updating

**Solution:** Ensure you're using `POST /api/routes/complete` endpoint, not `POST /api/routes/generate`

## Next Steps (Future Enhancements)

1. **Google Maps Static API Migration**
   - Add `GOOGLE_MAPS_API_KEY` to `.env`
   - Set `MAP_SNAPSHOT_PROVIDER=google` in `.env`
   - No code changes needed!

2. **Route Creation UI**
   - Implement Google Places Autocomplete
   - Add map click-to-pin functionality
   - Integrate with algorithm engine
   - Add Save/Cancel buttons

3. **Cleanup Job**
   - Create cron job to delete old generated routes
   - Prevent database bloat from temporary routes

## Questions?

Refer to the implementation files:
- Database: `backend/migrations/add_route_status.sql`
- Model: `backend/models/user_route_model.js`
- Controller: `backend/controllers/user_route_controller.js`
- Routes: `backend/routes/user_route_routes.js`
