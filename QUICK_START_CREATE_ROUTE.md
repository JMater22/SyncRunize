# Quick Start: Create Route Feature

## 🚀 Setup (5 minutes)

### 1. Add Google Maps API Key

**Frontend** (`syncrunize-react/.env`):
```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
VITE_API_URL=http://localhost:5000/api
```

**Backend** (`backend/.env`):
```env
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
MAP_SNAPSHOT_PROVIDER=google
```

Get your API key: https://console.cloud.google.com/
- Enable: Maps JavaScript API, Places API, Maps Static API

---

## 🏃 Start Services

```bash
# Terminal 1: Algorithm Engine (Port 8000)
cd algorithm-engine
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Backend (Port 5000)
cd backend
npm start

# Terminal 3: Frontend (Port 5173)
cd syncrunize-react
npm run dev
```

---

## ✨ How It Works

### User Flow (Web Version):

1. **Enter Route Details**
   - Optional: Enter route name
   - Set start point (search OR pin on map)
   - Set end point (search OR pin on map)

2. **Generate Safe Route**
   - Click "Generate Safe Route" button
   - Algorithm engine calculates safest path
   - Blue line appears on map
   - Shows distance and risk score

3. **Save or Cancel**
   - **Save Route**: Saves with `route_status = 'saved'`
   - **Cancel**: Discards the route

### Backend Flow:

```
User clicks "Generate Safe Route"
  ↓
Frontend → Algorithm Engine (/route-osm)
  ↓
Get safest path coordinates
  ↓
Frontend → Backend (POST /api/routes/generate)
  ↓
Save with route_status = 'generated'
  ↓
User clicks "Save Route"
  ↓
Frontend → Backend (POST /api/routes/save/:routeId)
  ↓
Update route_status = 'saved'
  ↓
Route appears in Saved Routes (NOT in Activities)
```

---

## 📍 Features Implemented

### ✅ Search Functionality
- Google Places Autocomplete
- Type location names
- Select from dropdown suggestions

### ✅ Pin Functionality
- Click "Pin on map" button
- Click anywhere on map
- Visual indicator shows pin mode

### ✅ Interactive Map
- Google Maps integration
- Roadmap / Satellite view
- Zoom and pan
- Fullscreen mode

### ✅ Safe Route Algorithm
- Calls algorithm engine at localhost:8000
- Uses OSM graph + risk data
- Displays path on map
- Shows distance and risk score

### ✅ Save/Cancel Actions
- **Web:** Save Route or Cancel
- **Mobile:** Use Route, Save Route, or Cancel (noted in UI)

### ✅ Route Status System
- `generated` = Temporary exploration
- `saved` = Saved for future use
- `completed` = Actual run (appears in Activities)

---

## 🎯 API Endpoints

### Generate Route (Temporary)
```javascript
POST /api/routes/generate
Headers: { Authorization: Bearer <token> }
Body: {
  start_lat, start_lng, end_lat, end_lng,
  chosen_path: [{lat, lng}, ...],
  route_name, duration_seconds, average_pace
}
Response: { route_id, route_status: 'generated', ... }
```

### Save Route
```javascript
POST /api/routes/save/:routeId
Headers: { Authorization: Bearer <token> }
Response: { route_status: 'saved', ... }
```

### Algorithm Engine
```javascript
POST http://localhost:8000/route-osm
Body: {
  start: {lat, lng},
  end: {lat, lng},
  alpha: 0.5
}
Response: { coordinates: [[lat, lng], ...] }
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not loading | Check `VITE_GOOGLE_MAPS_API_KEY` in `.env` |
| "Can't load Google Maps" | Enable billing in Google Cloud Console |
| Autocomplete not working | Enable Places API |
| Route generation fails | Check algorithm engine is running on port 8000 |
| "Please log in" error | Make sure you're logged in to the app |

---

## 📂 Key Files

### Frontend
- `syncrunize-react/src/components/Routes/CreateRouteMap.tsx` - Main component
- `syncrunize-react/src/components/Routes/CreateRouteMap.css` - Styles

### Backend
- `backend/controllers/user_route_controller.js` - Route logic
- `backend/models/user_route_model.js` - Database operations
- `backend/utils/map_snapshot.js` - Snapshot generation

### Algorithm
- `algorithm-engine/main.py` - Safe path algorithm

---

## 🔍 Testing Checklist

- [ ] Search for starting location works
- [ ] Search for destination works
- [ ] Pin on map for start point works
- [ ] Pin on map for end point works
- [ ] Generate route button works
- [ ] Blue path appears on map
- [ ] Route info shows correct data
- [ ] Save route works
- [ ] Saved route appears in Routes page
- [ ] Saved route does NOT appear in Activities
- [ ] Cancel route works
- [ ] Map view switches (Roadmap/Satellite)

---

## 🎨 UI Elements

### Sidebar (Left):
1. Route name input (optional)
2. Start point search + pin button
3. End point search + pin button
4. Distance unit selector (km/miles)
5. Generate button
6. Route info card (after generation)
7. Save / Cancel buttons

### Map (Right):
- Interactive Google Map
- Start marker (green, label "S")
- End marker (red, label "E")
- Route path (blue polyline)
- View switcher (Map/Satellite)
- Pin mode indicator (when active)

---

## 💡 Tips

1. **Testing:** Use locations in Tarlac, Philippines (algorithm is trained for this area)
2. **Distance:** Keep routes reasonable (1-10 km works best)
3. **API Key:** Use unrestricted key for development
4. **Snapshots:** Backend automatically generates route images
5. **Status:** Generated routes are temporary, save them to keep

---

## 📊 Route Status Explained

| Status | When | Appears In | Updates Challenges |
|--------|------|------------|-------------------|
| `generated` | User creates route | Nowhere (temporary) | ❌ No |
| `saved` | User saves route | Saved Routes | ❌ No |
| `completed` | User completes run | Activities | ✅ Yes |

---

## 🚀 Next Features to Add (Future)

- [ ] Distance-based route generation (start + distance)
- [ ] Elevation profile
- [ ] Route sharing
- [ ] Favorite locations
- [ ] Route history
- [ ] Weather integration
- [ ] Time-based safety (day vs night)

---

**Ready to test!** Open `http://localhost:5173` and navigate to **Routes > Create New Route**

For detailed setup: See [SETUP_GOOGLE_MAPS.md](SETUP_GOOGLE_MAPS.md)
For full implementation: See [ROUTE_STATUS_IMPLEMENTATION.md](ROUTE_STATUS_IMPLEMENTATION.md)
