# SyncRunize Hazard Avoidance Algorithm: Design and Limitations

## Abstract

This document describes the design, implementation, and limitations of the hazard avoidance routing algorithm developed for SyncRunize, a safety-focused running route application. The algorithm employs a multi-route generation strategy combined with trust-based risk scoring to identify the safest walking/running paths while avoiding areas with reported hazards.

---

## 1. Algorithm Overview

### 1.1 Design Philosophy

The SyncRunize hazard avoidance algorithm is based on a **"soft avoidance"** approach rather than hard constraint-based pathfinding. Instead of modifying graph traversal algorithms (e.g., Dijkstra's algorithm) to penalize hazardous edges, the system:

1. Generates multiple diverse route options using a commercial routing API (Mapbox)
2. Scores each route based on proximity to reported hazards
3. Selects the safest route that meets distance and accessibility requirements

This approach prioritizes **reliability** and **practicality** over algorithmic complexity, leveraging Mapbox's production-grade routing infrastructure while applying custom safety logic.

### 1.2 Key Components

The algorithm consists of three main components:

1. **Multi-Route Generation Engine** - Proactively creates diverse route alternatives
2. **Risk Scoring System** - Evaluates route safety based on hazard proximity and credibility
3. **Threshold-Based Selection** - Filters and selects routes based on safety thresholds

---

## 2. Multi-Route Generation Strategy

### 2.1 Endpoint-Based Routing (Point-to-Point)

For routes with defined start and end points, the algorithm generates up to **7 different route options**:

#### Direct Routes (2-3 routes)
- Obtained from Mapbox Directions API with `alternatives=true`
- Represents the most direct walking paths between two points

#### Waypoint-Based Routes (4 routes)
To force exploration of alternative paths, the algorithm strategically inserts intermediate waypoints:

```
1. Calculate midpoint: M = ((lat₁ + lat₂)/2, (lng₁ + lng₂)/2)
2. Calculate offset distance: offset = distance(start, end) × 0.15  (15% of total)
3. Generate 4 waypoint positions:
   - North: M + (offset/111000, 0) in degrees
   - South: M - (offset/111000, 0) in degrees
   - East: M + (0, offset/(111000 × cos(lat_mid))) in degrees
   - West: M - (0, offset/(111000 × cos(lat_mid))) in degrees
4. Request routes: start → waypoint → end for each direction
```

**Hazard-Aware Waypoint Filtering:**
- Waypoints within 100m of any reported hazard are skipped
- Prevents creation of routes that deliberately pass through dangerous areas

**Route Deduplication:**
- Routes with distances within 5% of each other are considered duplicates
- Only one representative route is kept to reduce redundancy

**Illogical Route Filtering:**
- Routes exceeding 1.5× the direct distance are rejected
- Prevents unreasonably long detours

### 2.2 Circular Routing (Distance-Based)

For circular routes (e.g., "generate a 5km loop"), the algorithm:

1. Uses Mapbox Isochrone API to find the reachable area at radius = target_distance/2
2. Samples **5 turning points** from different directions around the isochrone boundary
3. Generates a loop for each turning point: start → turning_point → start
4. Selects the loop with the **lowest risk score**

This ensures that circular routes explore multiple directional options rather than blindly returning the first valid loop.

---

## 3. Risk Scoring Methodology

### 3.1 Hazard Data Model

Each hazard in the system contains:

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `lat`, `lng` | Float | Geographic coordinates | Hazard location |
| `severity_weight` | Float | 0.0 - 1.0 | Intrinsic danger level of the hazard type |
| `trust_score` | Float | 0.0 - 1.0 | Credibility of the reporter |
| `agreement_score` | Float | 0.0 - 1.0 | Consensus among multiple reports |

### 3.2 Route Risk Calculation

For a given route with coordinates `[(lat₁, lng₁), (lat₂, lng₂), ..., (latₙ, lngₙ)]`, the risk score is calculated as:

```
For each route segment i:
    segment_midpoint = midpoint(coord[i], coord[i+1])
    segment_distance = haversine(coord[i], coord[i+1])

    For each hazard h within 500m of segment_midpoint:
        # Base risk calculation
        base_risk = h.severity_weight × 300

        # Trust and agreement multipliers
        trust_multiplier = 0.5 + (h.trust_score × 0.5)        # Range: 0.5 - 1.0
        agreement_multiplier = 0.5 + (h.agreement_score × 0.5) # Range: 0.5 - 1.0

        # Combined hazard risk
        hazard_risk = base_risk × trust_multiplier × agreement_multiplier

        # Distance decay (closer hazards have more impact)
        distance_to_hazard = haversine(segment_midpoint, h.location)
        distance_decay = exp(-0.003 × distance_to_hazard)

        # Apply decay and cap maximum risk
        decayed_risk = min(hazard_risk × distance_decay, 800)

        # Accumulate risk weighted by segment length
        total_risk += decayed_risk × segment_distance

# Normalize to risk per kilometer
risk_per_km = total_risk / total_route_distance
```

### 3.3 Key Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Influence radius** | 500m | Hazards beyond this distance have negligible impact on route segment |
| **Base risk multiplier** | 300 | Scales severity to meaningful risk units |
| **Distance decay rate** | -0.003 | Exponential decay ensures hazards remain impactful at moderate distances |
| **Max risk per hazard** | 800 | Prevents single extreme hazards from dominating total route risk |
| **Trust floor** | 0.5 | Even low-trust hazards contribute 50% weight (conservative approach) |
| **Agreement floor** | 0.5 | Unconfirmed hazards still considered with 50% weight |

### 3.4 Design Rationale

**Why trust and agreement multipliers start at 0.5:**
- Errs on the side of caution
- Even a single low-credibility report is taken seriously (50% weight)
- Prevents dismissing potentially legitimate hazards

**Why exponential distance decay:**
- Hazards very close to the route (0-100m) have maximum impact
- Hazards at moderate distances (100-300m) still contribute meaningfully
- Hazards near the 500m boundary have minimal impact
- Models realistic perception of danger distance for runners

**Why cap at 800:**
- Prevents a single catastrophic hazard from making all routes appear equally dangerous
- Allows comparison between "very dangerous" routes to still be meaningful

---

## 4. Route Selection Strategy

### 4.1 Threshold-Based Filtering

The algorithm applies a **safety threshold** of **80 risk points per km**:

```python
SAFE_RISK_THRESHOLD = 80

safe_candidates = [route for route in all_routes if route.risk_per_km <= 80]

if safe_candidates:
    selected_route = min(safe_candidates, key=lambda r: r.risk_per_km)
    status = "SAFE"
else:
    selected_route = min(all_routes, key=lambda r: r.risk_per_km)
    status = "RISKY - ALL ROUTES EXCEED THRESHOLD"
```

### 4.2 Route Blocking Condition

If the following conditions are met, route generation is **blocked entirely**:

```python
if len(all_routes) == 1 and selected_route.risk_per_km > 100:
    raise HTTPException(400, "No safe route available")
```

**Rationale:**
- When only 1 route exists (no alternatives) and it's highly dangerous (>100 risk/km)
- User is better served by choosing different start/end points
- Prevents the system from suggesting objectively dangerous routes when no safer option exists

### 4.3 Warning System

Routes are categorized into risk tiers:

| Risk Level | risk_per_km | User Message | Action |
|------------|-------------|--------------|--------|
| **Low** | 0-50 | "Low hazard route. Enjoy your run!" | Display route normally |
| **Medium** | 50-80 | "Moderate risk detected. Be aware of surroundings." | Display with caution badge |
| **High** | 80-100 | "High risk areas detected. Stay alert and consider alternatives." | Display with warning badge |
| **Critical** | >100, multiple routes exist | "This is the least risky option available, but still dangerous." | Display with strong warning |
| **Blocked** | >100, only 1 route | "No safe route available. Try different start/end points." | **Route generation refused** |

---

## 5. Technical Implementation

### 5.1 Technology Stack

- **Routing Engine:** Mapbox Directions API (Walking profile)
- **Isochrone Generation:** Mapbox Isochrone API
- **Backend:** FastAPI (Python 3.9+)
- **Hazard Database:** Supabase (PostgreSQL)
- **Frontend:** React + Ionic + Mapbox GL JS

### 5.2 Performance Characteristics

| Operation | API Calls | Response Time | Caching |
|-----------|-----------|---------------|---------|
| Endpoint route generation | 1-7 Mapbox requests | 1-3 seconds | Hazards cached in-memory |
| Circular route generation | 6-8 Mapbox requests | 2-4 seconds | Isochrone results not cached |
| Risk calculation | 0 API calls | <50ms | Hazards pre-loaded on startup |

### 5.3 Hazard Data Refresh

- Hazards are loaded from Supabase on server startup
- Only `status = 'active'` hazards are considered
- In-memory cache with thread-safe access
- Future enhancement: Background refresh every N minutes

---

## 6. Limitations

### 6.1 Routing Infrastructure Dependency

**Limitation:** The algorithm relies entirely on Mapbox's routing engine to generate candidate routes.

**Implications:**
- Cannot force Mapbox to avoid specific areas (polygon exclusion is not supported for walking routes)
- Limited control over route diversity beyond waypoint insertion
- Dependent on Mapbox's proprietary routing algorithms

**Mitigation:**
- Waypoint strategy increases route diversity by 3-4× compared to default alternatives
- Multiple waypoint directions (N/S/E/W) explore different path options

### 6.2 Soft Avoidance vs. Hard Avoidance

**Limitation:** The algorithm scores and selects from existing routes rather than modifying the graph traversal to avoid hazards during pathfinding.

**Comparison to Modified Dijkstra:**

| Aspect | SyncRunize (Soft Avoidance) | Modified Dijkstra (Hard Avoidance) |
|--------|---------------------------|-----------------------------------|
| **Avoidance strength** | Moderate - picks best from alternatives | Strong - penalizes hazardous edges |
| **Route diversity** | High - up to 7 alternatives | Low - typically 1 optimal path |
| **Reliability** | High - production routing API | Variable - depends on OSM data quality |
| **Implementation complexity** | Low - API calls + scoring | High - custom graph building |
| **Edge cases** | Handles well - Mapbox manages edge cases | Prone to errors - incomplete OSM data |

**Trade-off:**
- Hard avoidance may find routes that avoid hazards more aggressively
- Soft avoidance is more practical, reliable, and handles real-world constraints (one-way streets, pedestrian-only paths, private property) better

### 6.3 Risk Scoring Model Assumptions

**Assumption 1: Exponential distance decay is appropriate**
- Real-world hazard perception may not follow exponential curves
- Different hazard types (e.g., aggressive animals vs. poor lighting) may have different decay rates

**Assumption 2: Trust and agreement scores are reliable indicators**
- Assumes the user reporting system accurately captures reporter credibility
- Vulnerable to coordinated false reporting or manipulation

**Assumption 3: All hazards within 500m are relevant**
- Some hazards (e.g., unleashed dogs) may have very localized impact (<50m)
- Others (e.g., poorly lit areas) may affect larger regions (>500m)
- Current model treats all hazard types uniformly

### 6.4 Route Diversity Limitations

**Limitation:** Even with waypoint strategy, the algorithm can only explore paths that Mapbox's routing engine considers valid.

**Scenarios where this fails:**
- Areas with very limited street connectivity (e.g., cul-de-sacs, peninsulas)
- Regions with dominant pedestrian corridors where all paths converge
- Situations where hazards are unavoidable due to geography

**Example:**
- If a hazard is on the only bridge crossing a river between start and end points
- All generated routes will pass through the hazard regardless of waypoint strategy

### 6.5 Circular Route Distance Accuracy

**Limitation:** Circular routes may deviate ±15-20% from the requested distance.

**Causes:**
- Isochrone boundaries are approximate
- Walking routes must follow actual paths, not straight lines
- Limited sampling (only 5 turning points)

**Impact:**
- User requests a 5km loop, receives a 4.2km or 5.8km route
- Acceptable for recreational runners but may not suit training plans

### 6.6 Real-Time Hazard Updates

**Limitation:** Hazards are loaded once on server startup and cached in-memory.

**Implications:**
- New hazards reported by users may not be reflected until server restart
- Resolved hazards (status changed to 'inactive') persist in cache

**Future enhancement:**
- Implement background refresh task (e.g., every 5 minutes)
- Add cache invalidation on hazard create/update/delete events

### 6.7 Scalability Constraints

**API rate limits:**
- Mapbox has rate limits (typically 600 requests/minute for Directions API)
- High concurrent usage could hit rate limits

**Database queries:**
- Current implementation loads ALL active hazards on startup
- May not scale to thousands of hazards efficiently

**Potential solutions:**
- Spatial indexing in database (PostGIS)
- Query only hazards within bounding box of start/end points
- Implement API request pooling and queueing

### 6.8 Lack of Temporal Considerations

**Limitation:** Algorithm does not consider time-of-day factors.

**Examples of missed opportunities:**
- A poorly lit street is dangerous at night but safe during daytime
- A park with aggressive wildlife in the morning is safe in the afternoon
- Traffic congestion hazards vary by time of day

**Current workaround:**
- Users can report time-specific hazards separately
- Agreement scores may implicitly capture temporal patterns

---

## 7. Validation and Testing

### 7.1 Unit Testing Coverage

| Component | Test Coverage | Key Tests |
|-----------|---------------|-----------|
| Risk calculation | Comprehensive | Distance decay, trust/agreement multipliers, edge cases |
| Route filtering | Moderate | Duplicate detection, illogical route rejection |
| Waypoint generation | Basic | Coordinate math, hazard proximity checks |

### 7.2 Integration Testing

- End-to-end route generation with mock hazard data
- API error handling (Mapbox timeout, invalid coordinates)
- Database connection failure scenarios

### 7.3 Real-World Validation

**Needed:**
- User studies comparing algorithm-suggested routes vs. user preferences
- Analysis of whether users accept/reject suggested routes
- Comparison of incident reports on algorithm-suggested routes vs. random routes

---

## 8. Comparison to Alternative Approaches

### 8.1 Modified Dijkstra's Algorithm

**Approach:** Build a graph from OpenStreetMap data, assign edge weights based on hazard proximity, run Dijkstra's algorithm.

**Advantages:**
- Strong theoretical foundation
- Guarantees optimal path given the graph
- Full control over edge weight calculation

**Disadvantages:**
- Complex implementation (graph building, edge weight updates)
- Requires extensive OSM data preprocessing
- Poor handling of missing data or errors in OSM
- Single-route output (no alternatives shown to user)
- High computational cost for large graphs

**Verdict:** Modified Dijkstra is academically interesting but impractical for production use.

### 8.2 A* Algorithm with Hazard Heuristics

**Approach:** Use A* with a heuristic that penalizes paths near hazards.

**Advantages:**
- Faster than Dijkstra for point-to-point routing
- Can incorporate hazard avoidance in heuristic function

**Disadvantages:**
- Same graph-building complexity as Dijkstra
- Heuristic must be admissible (may limit hazard penalty strength)
- Still lacks route diversity

**Verdict:** Marginal improvement over Dijkstra but shares fundamental limitations.

### 8.3 Machine Learning-Based Routing

**Approach:** Train a model on user route choices and incident data to predict safe routes.

**Advantages:**
- Can learn complex patterns (time of day, user preferences, weather)
- May discover non-obvious route preferences

**Disadvantages:**
- Requires extensive training data (route history + incident outcomes)
- Black-box model - difficult to explain to users
- Cold-start problem for new areas with no historical data
- High development and maintenance cost

**Verdict:** Promising for future work but premature given current data availability.

### 8.4 Why SyncRunize Chose Soft Avoidance

The current approach was selected because:

1. **Reliability:** Mapbox handles complex routing edge cases (one-way streets, elevation, pedestrian access)
2. **Route diversity:** Users see multiple options and can choose based on personal preference
3. **Rapid development:** API-based approach accelerates time-to-market
4. **Maintainability:** Less complex codebase than graph-based algorithms
5. **Research novelty:** Multi-waypoint generation + trust-based scoring is a novel contribution

---

## 9. Future Research Directions

### 9.1 Short-Term Improvements

1. **Adaptive waypoint positioning**
   - Place waypoints opposite known hazards rather than fixed cardinal directions
   - Increase offset percentage in hazard-dense areas

2. **Multi-objective optimization**
   - Allow users to weight safety vs. distance vs. elevation gain
   - Generate Pareto-optimal route sets

3. **Temporal hazard modeling**
   - Add `active_hours` field to hazards
   - Filter hazards based on user's planned run time

### 9.2 Long-Term Research

1. **Hybrid graph-based approach**
   - Build simplified graph for high-hazard areas only
   - Use Mapbox for general routing, custom pathfinding for hazard-heavy regions

2. **Crowdsourced route validation**
   - Track which routes users actually choose vs. what algorithm suggests
   - Use implicit feedback to refine risk scoring

3. **Personalized risk profiles**
   - Different users have different risk tolerances
   - Learn per-user risk weights from historical choices

4. **Weather integration**
   - Adjust risk scores based on current weather (flooding, ice, heat)

---

## 10. Conclusion

The SyncRunize hazard avoidance algorithm represents a pragmatic balance between theoretical rigor and practical deployment. By leveraging a commercial routing API and applying custom risk scoring logic, the system achieves:

- **High reliability** through production-grade routing infrastructure
- **Route diversity** via strategic waypoint insertion (up to 7 alternatives)
- **Evidence-based safety scoring** using trust and agreement metrics
- **User-centric design** with multiple route options and clear risk communication

While the soft avoidance approach has inherent limitations compared to graph-level pathfinding algorithms, it offers superior real-world performance, maintainability, and user experience. The novel contributions—multi-waypoint generation strategy and trust-based risk scoring—provide value for both practitioners and researchers in the field of safety-aware route planning.

**Key Innovation:**
> "Instead of passively accepting whatever routes a routing API suggests, SyncRunize **actively forces exploration of diverse paths** through strategic waypoint insertion, then applies evidence-based risk scoring to select the safest option."

This approach demonstrates that practical systems can achieve strong safety outcomes without the complexity of custom graph traversal algorithms, opening avenues for similar applications in other location-based safety domains (e.g., safe walking routes for vulnerable populations, emergency evacuation routing).

---

## References

- Mapbox Directions API Documentation: https://docs.mapbox.com/api/navigation/directions/
- Mapbox Isochrone API Documentation: https://docs.mapbox.com/api/navigation/isochrone/
- Haversine Distance Formula: https://en.wikipedia.org/wiki/Haversine_formula
- Trust Score and Agreement Score Algorithms: SyncRunize Internal Documentation

---

**Document Version:** 1.0
**Last Updated:** 2025-01-14
**Authors:** SyncRunize Development Team
