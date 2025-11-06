# Hazard Reporting System Documentation

## Overview
The Hazard Reporting System allows users to report and view safety hazards (crime incidents, dangerous roads, etc.) on the map. Hazards are displayed as interactive markers that users can click to view detailed information in an Instagram-style modal.

## Features Implemented

### 1. Interactive Hazard Markers on Map
**Location**: [CreateRouteMap.tsx](syncrunize-react/src/components/Routes/CreateRouteMap.tsx:1039-1054)

- **Orange markers** display all active hazards in the current map view
- Markers are automatically fetched when the map loads or when the user pans/zooms
- Clicking a hazard marker opens a detailed view modal

**Implementation**:
```typescript
{hazards.map((hazard) => (
  <Marker
    key={hazard.report_id}
    position={{ lat: hazard.lat, lng: hazard.lng }}
    icon={{
      url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
      scaledSize: new google.maps.Size(32, 32)
    }}
    title={hazard.title}
    onClick={() => {
      setSelectedHazard(hazard);
      setShowHazardModal(true);
    }}
  />
))}
```

### 2. Instagram-Style Hazard Detail Modal
**Location**: [CreateRouteMap.tsx](syncrunize-react/src/components/Routes/CreateRouteMap.tsx:1082-1183)

The modal displays comprehensive hazard information with an Instagram-inspired design:

**Components**:
- **Header**: User avatar, username, report date, and close button
- **Image Section**: Full-width hazard photo (if provided)
- **Content Section**:
  - Hazard title
  - Incident type badge (color-coded by severity)
  - Description
  - Statistics (trust score, status, location)

**Design Features**:
- Clean, modern Instagram-like interface
- Smooth modal animations
- Responsive design (adapts to mobile/desktop)
- Extra margin to keep map visible in background
- Scroll-friendly for long descriptions

### 3. Database Schema

The system uses the following tables from your existing database:

#### **hazard_reports** (Main table)
```sql
- report_id: Serial primary key
- user_id: Foreign key to users table
- incident_type: Text (references incident_severity)
- title: Varchar(100) - Hazard title
- description: Text - Detailed description
- lat, lng: Double precision - Location coordinates
- image_url: Text - Path to uploaded hazard image
- reported_at: Timestamp - When hazard was reported
- trust_score: Double precision - Reliability score (0-1)
- agreement_score: Double precision - Consensus with nearby reports
- severity_weight: Double precision - How dangerous (0-1)
- status: Text - 'active', 'resolved', 'removed', 'pending'
```

#### **incident_severity** (Reference table)
```sql
- incident_type: Primary key
- severity_weight: Double precision
- description: Text
```

#### **official_incidents** (Excel crime data)
```sql
- incident_id: Serial primary key
- incident_type: Text
- lat, lng: Location
- date: Timestamp
- severity_weight: Double precision
- source: Text (default: 'excel_import')
```

#### **report_evaluations** (Optional - ML features)
```sql
- evaluation_id: Serial primary key
- report_id, neighbor_report_id: Foreign keys
- similarity_score, time_decay, distance_decay: Double precision
- Used for trust score calculation
```

#### **moderation_logs** (Optional - Admin features)
```sql
- log_id: Serial primary key
- report_id: Foreign key
- moderator_id: Foreign key to users
- action: Text (e.g., 'status_changed_to_resolved')
- reason: Text
- created_at: Timestamp
```

### 4. Backend API Endpoints

**Base URL**: `/api/hazards`

#### GET `/nearby`
Get hazards near a specific location

**Query Parameters**:
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `radius`: Search radius in km (default: 0.3)

**Response**:
```json
{
  "message": "✅ Nearby hazards with AI summaries generated.",
  "hazards": [
    {
      "report_id": 1,
      "title": "Broken sidewalk",
      "incident_type": "infrastructure",
      "description": "Large crack in sidewalk...",
      "lat": 15.4755,
      "lng": 120.5963,
      "image_url": "/uploads/hazards/123.jpg",
      "reported_at": "2025-01-05T10:30:00",
      "severity_weight": 0.4,
      "trust_score": 0.85,
      "status": "active",
      "users": {
        "username": "runner123",
        "profile_picture": "/uploads/profiles/pic.jpg"
      },
      "ai_summary": "AI-generated summary of hazard"
    }
  ],
  "ai_nearby_summary": "Overall safety summary for the area"
}
```

#### POST `/` (Protected)
Create a new hazard report

**Headers**: `Authorization: Bearer <token>`

**Body** (multipart/form-data):
```json
{
  "incident_type": "crime",
  "title": "Hazard Title",
  "description": "Detailed description",
  "lat": 15.4755,
  "lng": 120.5963,
  "severity_weight": 0.7
}
```
Optional: Include `image` file in form data

**Response**:
```json
{
  "message": "✅ Hazard created successfully",
  "hazard": { /* hazard object */ },
  "ai_summary": "AI-generated safety summary"
}
```

#### GET `/my-hazards` (Protected)
Get all hazards reported by the authenticated user

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "✅ Your reported hazards loaded successfully.",
  "hazards": [ /* array of hazard objects */ ]
}
```

#### PUT `/:id` (Protected)
Update a hazard report (owner only)

**Headers**: `Authorization: Bearer <token>`

**Body** (multipart/form-data):
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "incident_type": "updated_type",
  "lat": 15.4760,
  "lng": 120.5970,
  "severity_weight": 0.6,
  "status": "resolved"
}
```
Optional: Include new `image` file

#### DELETE `/:id` (Protected)
Delete a hazard report (owner only)

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "message": "🗑️ Hazard deleted successfully.",
  "deleted_hazard": { /* deleted hazard object */ }
}
```

### 5. Frontend Components

#### CreateRouteMap Component Updates

**New State Variables**:
```typescript
const [hazards, setHazards] = useState<HazardReport[]>([]);
const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null);
const [showHazardModal, setShowHazardModal] = useState(false);
```

**New Interfaces**:
```typescript
interface HazardReport {
  report_id: number;
  title: string;
  incident_type: string;
  description: string;
  lat: number;
  lng: number;
  image_url: string | null;
  reported_at: string;
  severity_weight: number;
  trust_score: number;
  status: string;
  users?: {
    username: string;
    profile_picture: string | null;
  };
}
```

**New Functions**:
```typescript
// Fetch hazards in current map view
const fetchHazardsInView = useCallback(async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/hazards/nearby`,
    {
      params: {
        lat: map.getCenter()?.lat(),
        lng: map.getCenter()?.lng(),
        radius: 5
      }
    }
  );
  setHazards(response.data.hazards || []);
}, [map]);
```

### 6. CSS Styling

**Instagram-Style Modal** ([CreateRouteMap.css:781-1000](syncrunize-react/src/components/Routes/CreateRouteMap.css))

Key design elements:
- Modal size: 90% width, max 600px, 80vh height
- Image container: Max 400px height, contained fit
- User avatar: 40px circular
- Severity badges: Color-coded by severity weight (1-10)
  - Low (1-3): Green
  - Medium (4-6): Orange
  - High (7-10): Red
- Responsive: Full width on mobile, single-column stats

## User Workflow

### Viewing Hazards

1. **Open Create Route page**
2. **Map loads with hazards** displayed as orange markers
3. **Pan/zoom map** - hazards automatically update for visible area
4. **Click hazard marker** - Instagram-style modal opens
5. **View hazard details**:
   - See reporter's username and profile picture
   - View hazard photo (if available)
   - Read title and description
   - Check trust score, status, and location
6. **Close modal** - Click X button or tap outside

### Reporting Hazards (To Be Implemented)

1. User taps "Report Hazard" button
2. Tap location on map or use current location
3. Fill in form:
   - Select incident type
   - Enter title
   - Add description
   - Upload photo (optional)
   - Set severity
4. Submit report
5. Hazard appears on map for all users

## Integration with Route Safety Algorithm

### Current Implementation
- Hazards are displayed on the map but not yet integrated with route generation
- The algorithm currently uses Excel crime data from `official_incidents` table

### Planned Integration

**1. Add hazard data to route safety calculation**:

```python
# In main.py - modify weight function
def weight(u, v, d):
    # ... existing code ...

    # Get nearby hazards
    nearby_hazards = get_hazards_near_segment(u_lat, u_lng, v_lat, v_lng)

    hazard_penalty = 0
    for hazard in nearby_hazards:
        distance_to_hazard = calculate_distance(segment, hazard)
        if distance_to_hazard < 0.1:  # Within 100m
            hazard_penalty += hazard['severity_weight'] * 100

    safety_score += hazard_penalty
```

**2. Display hazards along generated route**:
- Fetch hazards near route coordinates
- Show warning icons on route path
- Include hazard count in safety warnings

**3. Route avoidance options**:
- Add user preference: "Avoid high-crime areas"
- Increase penalties for segments near hazards
- Suggest alternative routes if too many hazards

## Database Recommendations

### Tables to Keep
1. ✅ **hazard_reports** - Core user-reported hazards (KEEP)
2. ✅ **official_incidents** - Crime data from Excel (KEEP - used by algorithm)
3. ✅ **incident_severity** - Reference table (KEEP)

### Tables to Consider
4. ⚠️ **report_evaluations** - Used for ML similarity scoring
   - **Keep if**: You want to implement trust score calculation based on nearby reports
   - **Remove if**: You don't need consensus-based scoring

5. ⚠️ **moderation_logs** - Admin moderation tracking
   - **Keep if**: You plan to add admin/moderator features
   - **Remove if**: You don't need moderation history

### Recommendation
**Keep all tables** for now. They're properly indexed and don't impact performance. You can use them for future features:
- `report_evaluations`: Improve trust scores using ML
- `moderation_logs`: Add admin dashboard to review/remove hazards

## File Structure

```
backend/
├── models/
│   ├── hazard_model.js (existing)
│   └── hazard_report_model.js (new - additional functions)
├── controllers/
│   └── hazard_controller.js (existing)
├── routes/
│   └── hazard_routes.js (existing)
└── services/
    ├── hazard_service.js (trust/agreement calculation)
    └── ai_service.js (AI summaries)

syncrunize-react/
└── src/
    └── components/
        └── Routes/
            ├── CreateRouteMap.tsx (updated with hazards)
            └── CreateRouteMap.css (updated with modal styles)

algorithm-engine/
└── main.py (to be updated with hazard integration)
```

## Next Steps

### Immediate Priorities
1. ✅ **Display hazards on map** - DONE
2. ✅ **Instagram-style detail modal** - DONE
3. 🔄 **Add "Report Hazard" feature**
4. 🔄 **Integrate hazards with route algorithm**

### Future Enhancements
1. **Hazard Reporting Form**:
   - Add button to create new hazard
   - Camera integration for photos
   - Location picker

2. **Algorithm Integration**:
   - Fetch hazards along route
   - Add hazard warnings to safety analysis
   - Route avoidance based on hazards

3. **User Features**:
   - Edit/delete own hazards
   - Upvote/downvote hazards (affect trust score)
   - Filter hazards by type/severity

4. **Admin Features**:
   - Moderation dashboard
   - Verify/remove hazards
   - View moderation logs

5. **AI Enhancements**:
   - AI-generated safety summaries
   - Pattern detection (crime hotspots)
   - Predictive risk scoring

## Testing Checklist

- [ ] Hazards load when map opens
- [ ] Hazards update when panning map
- [ ] Orange markers appear at correct locations
- [ ] Clicking marker opens modal
- [ ] Modal displays all hazard information correctly
- [ ] Modal shows user avatar/username
- [ ] Modal shows hazard image (if exists)
- [ ] Severity badge has correct color
- [ ] Close button works
- [ ] Modal is responsive on mobile
- [ ] Multiple hazards can be viewed sequentially
- [ ] API endpoints return correct data
- [ ] Images load from backend correctly

## Environment Variables Required

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## API Integration Example

```typescript
// Fetch hazards near a location
const response = await axios.get(
  `${import.meta.env.VITE_API_URL}/hazards/nearby`,
  {
    params: {
      lat: 15.4755,
      lng: 120.5963,
      radius: 5
    }
  }
);

// Create a new hazard
const formData = new FormData();
formData.append('incident_type', 'crime');
formData.append('title', 'Unsafe area');
formData.append('description', 'Poor lighting');
formData.append('lat', '15.4755');
formData.append('lng', '120.5963');
formData.append('image', imageFile);

const response = await axios.post(
  `${import.meta.env.VITE_API_URL}/hazards`,
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

## Conclusion

The Hazard Reporting System is now fully integrated into the map interface, allowing users to:
- ✅ View reported hazards as interactive markers
- ✅ Click hazards to see detailed information in an Instagram-style modal
- ✅ See reporter information, photos, descriptions, and statistics

The system is built on your existing database schema and backend API, requiring minimal changes. The next phase will add hazard reporting functionality and integrate hazard data into the route safety algorithm for truly personalized, safe running routes.
