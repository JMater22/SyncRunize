# How Hazard Avoidance Works (Without Dijkstra)

## TL;DR

**Mapbox does the routing → Your engine picks the safest option**

- For **start-end routes** (`/route-osm`): Mapbox gives 1-3 paths → You score each based on hazards → Pick the safest
- For **circular routes** (`/route-distance`): Try 5 different loop directions → Score each → Pick the safest

This is **"soft avoidance"** - not graph-level like Dijkstra, but still effective.

---

## 1. Where Hazards Come From

On startup, all active hazards are loaded from Supabase:

```python
def load_hazards_background():
    response = supabase.table("hazard_reports").select("*").eq("status", "active").execute()
    hazards_cache = response.data
```

Each hazard has:
- `lat`, `lng` - location
- `severity_weight` - how dangerous (0 to 1)
- `trust_score` - how reliable the reporter (0 to 1)
- `agreement_score` - how many others agree (0 to 1)

---

## 2. How Routes Are Scored

`calculate_route_risk()` scores each route:

```python
For each segment of the route:
    For each hazard within 500m:
        # Calculate weighted risk using YOUR algorithms
        base_risk = severity * 300
        trust_multiplier = 0.5 + (trust * 0.5)
        agreement_multiplier = 0.5 + (agreement * 0.5)
        hazard_risk = base_risk * trust_multiplier * agreement_multiplier

        # Apply distance decay (closer = more risky)
        distance_decay = exp(-0.003 * distance_to_hazard)
        decayed_risk = hazard_risk * distance_decay

        # Add to total
        total_risk += decayed_risk * segment_length

risk_per_km = total_risk / total_distance
```

**Key parameters:**
- **500m influence radius** - hazards only affect nearby routes
- **Base risk: severity × 300** - makes hazards impactful
- **Distance decay: exp(-0.003 × dist)** - closer hazards weigh more
- **Trust & agreement multipliers** - low-trust hazards count less

---

## 3. Endpoint Routes (`/route-osm`) - NEW IMPROVED VERSION

### What happens:

1. **✨ NEW: Generate MULTIPLE route options using waypoints**
   ```python
   # Instead of just accepting Mapbox's 2-3 alternatives,
   # we proactively create MORE routes by using intermediate waypoints

   # Get direct routes (2-3 alternatives)
   direct_routes = mapbox.get_routes(start, end)

   # PLUS: Try 4 waypoint-based routes (north, south, east, west)
   # Forces Mapbox to explore different paths
   for direction in [north, south, east, west]:
       waypoint = calculate_midpoint_with_offset(start, end, direction)
       waypoint_route = mapbox.get_route(start -> waypoint -> end)

   # Total: Up to 7 different route options!
   ```

2. **Score each route**
   ```python
   for route in all_routes:  # Could be 5-7 routes now!
       risk_score = calculate_route_risk(route, hazards)
   ```

3. **✨ NEW: Threshold-based selection**
   ```python
   SAFE_RISK_THRESHOLD = 80

   safe_candidates = [r for r in routes if r["risk_per_km"] <= 80]

   if safe_candidates:
       # Pick safest among "safe enough" routes
       safest = min(safe_candidates, key=lambda x: x["risk_per_km"])
   else:
       # All routes are risky → pick least bad + show big warning
       safest = min(routes, key=lambda x: x["risk_per_km"])
       print("⚠️ ALL routes exceed safety threshold!")
   ```

### What you'll see in logs:

```
============================================================
🛣️  ROUTE GENERATION with Polygon Avoidance + Enhanced Scoring
============================================================
⚠️  Active hazards in cache: 15
   📍 Direct routes: 3 found
   🔄 Trying 4 waypoint-based routes...
      Waypoint 1: 920m  (north detour)
      Waypoint 2: 895m  (south detour)
      Waypoint 3: 910m  (east detour)
      Waypoint 4: 905m  (west detour)
   ✅ Total routes generated: 7

📍 Mapbox returned 7 route(s)

Route 1: (direct)
  Distance: 850m (0.85km)
  Risk Score: 125.50 per km  ← Risky!

Route 2: (direct)
  Distance: 880m (0.88km)
  Risk Score: 45.23 per km

Route 3: (direct)
  Distance: 870m (0.87km)
  Risk Score: 89.12 per km

Route 4: (waypoint north)
  Distance: 920m (0.92km)
  Risk Score: 12.15 per km  ← Safest!

Route 5: (waypoint south)
  Distance: 895m (0.90km)
  Risk Score: 78.50 per km

Route 6: (waypoint east)
  Distance: 910m (0.91km)
  Risk Score: 34.25 per km

Route 7: (waypoint west)
  Distance: 905m (0.91km)
  Risk Score: 56.80 per km

✅ Selected Route 4 (lowest risk: 12.15)
   4 safe route(s) found below threshold (80)
============================================================
```

---

## 4. Circular Routes (`/route-distance`) - NEW IMPROVED VERSION

### OLD behavior:
- Generate ONE loop → label it as safe/risky
- No actual avoidance, just reporting

### ✨ NEW behavior:

1. **Sample 5 different turning points** from isochrone polygon
   ```python
   # Try loops in different directions (north, south, east, west, etc.)
   candidate_points = sample_from_isochrone(radius)[:5]
   ```

2. **Generate loop for each direction**
   ```python
   for turning_point in candidate_points:
       route = start → turning_point → start
       risk_score = calculate_route_risk(route, hazards)
   ```

3. **Pick the SAFEST loop**
   ```python
   safest_loop = min(loops, key=lambda x: x["risk_score"])
   ```

### What you'll see in logs:

```
🔄 Trying 5 different loop directions...
   Loop 1: 3120m, risk: 45.23 per km
   Loop 2: 3080m, risk: 12.15 per km  ← Safest!
   Loop 3: 3150m, risk: 78.50 per km
   Loop 4: 3090m, risk: 34.12 per km
   Loop 5: 3140m, risk: 156.32 per km
✅ Selected Loop 2 (lowest risk: 12.15)
```

---

## 5. What About Polygon Avoidance?

The code tries to send polygons to Mapbox:

```python
params["exclude"] = json.dumps(avoidance_polygons)
```

**Reality:** This is likely **ignored** by Mapbox because:
- `exclude` parameter doesn't support arbitrary polygons for walking routes
- If it fails, code automatically retries without it (graceful fallback)

**So actual avoidance happens via route scoring, not polygon exclusion.**

---

## 6. Comparison to Modified Dijkstra

| Feature | Modified Dijkstra | Current Approach |
|---------|------------------|------------------|
| **Routing** | Custom graph traversal | Mapbox Directions API |
| **Avoidance** | Hard (penalize edges) | Soft (score & select) |
| **Alternatives** | 1 route only | Up to 3 routes |
| **Complexity** | High (graph building, edge penalties) | Low (API calls + scoring) |
| **Errors** | Many (OSM data issues) | Minimal (Mapbox handles routing) |
| **Hazard scoring** | Same algorithm | ✅ Same algorithm |
| **Research value** | Higher (custom algorithm) | Good (novel scoring + selection) |

---

## 7. How to Strengthen Avoidance Further

### Option 1: Adjust the threshold
```python
SAFE_RISK_THRESHOLD = 50  # Stricter (currently 80)
```

### Option 2: Increase hazard influence
```python
# In calculate_route_risk():
if dist_to_hazard <= 800:  # Wider radius (currently 500m)
    base_risk = severity * 500  # Stronger impact (currently 300)
```

### Option 3: Try more loop candidates
```python
# In get_mapbox_circular_route():
candidate_points[:10]  # Try 10 directions (currently 5)
```

---

## 8. Summary

**Your hazard avoidance now works by:**

1. ✅ Loading hazards with trust/agreement/severity scores
2. ✅ **NEW:** Proactively generating MULTIPLE route options (not just accepting Mapbox's 2-3)
   - Direct routes from Mapbox (2-3 alternatives)
   - **PLUS** waypoint-based routes in 4 directions (north, south, east, west)
   - **Total: Up to 7 different route options for endpoint routes!**
3. ✅ Scoring each route based on proximity to hazards (using YOUR algorithms)
4. ✅ **NEW:** Applying safety threshold to refuse dangerous routes when safer options exist
5. ✅ **NEW:** For loops, trying 5 different turning points and picking the safest

**This is "soft avoidance"** but it's:
- ✅ Simpler than Dijkstra
- ✅ More reliable (Mapbox handles routing complexities)
- ✅ **More thorough** (generates more route options via waypoints)
- ✅ Still uses your trust/agreement scoring
- ✅ Still research-worthy (novel multi-route generation + safety selection)

**Key Innovation:** Instead of passively accepting whatever routes Mapbox suggests, we **actively force Mapbox to explore different paths** by inserting intermediate waypoints in various directions. This gives us more diversity in route options, increasing the chance of finding a safer path around hazards.

**The polygon stuff in the code?** It's there as an attempt, but likely ignored by Mapbox. The real work happens in `calculate_route_risk()` + multi-waypoint route generation + threshold-based selection logic.
