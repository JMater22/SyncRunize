# Route API Reference - Quick Guide

## Route Status Values

- `generated` - Temporary route during creation/exploration
- `saved` - Route saved for future use
- `completed` - Actual run activity

---

## Endpoints

### 1. Generate Route (Temporary)
**POST** `/api/routes/generate`

**Auth:** Required

**Use:** Creating routes on "Create Route" page

**Body:**
```json
{
  "start_lat": 15.4755,
  "start_lng": 120.5963,
  "end_lat": 15.4800,
  "end_lng": 120.6000,
  "chosen_path": [{"lat": 15.4755, "lng": 120.5963}, ...],
  "duration_seconds": 1800,
  "average_pace": 5.5,
  "route_name": "Morning Route"
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

---

### 2. Save Generated Route
**POST** `/api/routes/save/:routeId`

**Auth:** Required

**Use:** When user clicks "Save Route" button

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

---

### 3. Complete Run
**POST** `/api/routes/complete`

**Auth:** Required

**Use:** When user finishes an actual run

**Body:** Same as generate route

**Response:**
```json
{
  "message": "✅ Run completed successfully and challenges updated.",
  "route": {
    "route_id": 124,
    "route_status": "completed",
    ...
  },
  "challenges_updated": [
    {
      "challenge_id": 1,
      "progress_percent": 45.5,
      "completed": false
    }
  ]
}
```

---

### 4. Get My Routes
**GET** `/api/routes`

**Auth:** Required

**Query Parameters:**
- `limit` - Number of routes (default: 20)
- `offset` - Pagination offset (default: 0)
- `activities_only` - Only completed routes (default: false)
- `route_status` - Filter by status: `generated`, `saved`, or `completed`

**Examples:**
```javascript
// All my routes
GET /api/routes

// Only completed activities
GET /api/routes?activities_only=true

// Only generated routes
GET /api/routes?route_status=generated

// Only saved routes
GET /api/routes?route_status=saved
```

---

### 5. Get User Routes by ID
**GET** `/api/routes/user/:userId`

**Auth:** Not required

**Query Parameters:** Same as Get My Routes

**Examples:**
```javascript
// View user's activities
GET /api/routes/user/456?activities_only=true

// View user's saved routes
GET /api/routes/user/456?route_status=saved
```

---

### 6. Legacy: Create Route
**POST** `/api/routes`

**Auth:** Required

**Note:** Backward compatible - defaults to `route_status = 'completed'`

**Use:** Existing code that hasn't been updated yet

---

## Frontend Usage Examples

### For Activities View (Profile, ViewProfile, Activities pages)

```typescript
const response = await axios.get(
  `${import.meta.env.VITE_API_URL}/routes/user/${userId}`,
  {
    params: {
      activities_only: true // ✅ IMPORTANT: Filter to completed only
    }
  }
);
```

### For Create Route Page (Web)

```typescript
// 1. Generate route
const generateResponse = await axios.post(
  `${import.meta.env.VITE_API_URL}/routes/generate`,
  {
    start_lat, start_lng, end_lat, end_lng,
    chosen_path, duration_seconds, average_pace, route_name
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

const generatedRoute = generateResponse.data.route;

// 2. If user clicks "Save Route"
await axios.post(
  `${import.meta.env.VITE_API_URL}/routes/save/${generatedRoute.route_id}`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### For Run Completion (Mobile)

```typescript
// After user finishes run
await axios.post(
  `${import.meta.env.VITE_API_URL}/routes/complete`,
  {
    start_lat, start_lng, end_lat, end_lng,
    chosen_path, duration_seconds, average_pace,
    route_name, estimated_calories
  },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## Important Rules

### ✅ DO:
- Use `activities_only=true` for all activity/profile views
- Use `POST /api/routes/generate` for route creation pages
- Use `POST /api/routes/complete` for actual run completion
- Filter by `route_status` when showing specific types of routes

### ❌ DON'T:
- Show generated routes in activities view
- Update challenges when generating routes
- Forget to pass `activities_only` parameter in frontend

---

## Status Flow Diagram

```
Route Creation (Web):
User explores → generated → User saves → saved

Run Completion (Mobile):
User runs → completed (triggers challenges)

Activities View:
Only shows: route_status = 'completed'
```

---

## Need Help?

See full documentation: [ROUTE_STATUS_IMPLEMENTATION.md](ROUTE_STATUS_IMPLEMENTATION.md)
