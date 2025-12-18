# algorithm_engine/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List, Optional, Dict, Tuple
from datetime import datetime
import numpy as np
from scipy.spatial.distance import cosine
import math
import requests
from fastapi.middleware.cors import CORSMiddleware
from functools import lru_cache
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import threading

# Load environment variables
load_dotenv()

app = FastAPI()
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Mapbox Configuration
MAPBOX_ACCESS_TOKEN = os.getenv("MAPBOX_ACCESS_TOKEN")
if not MAPBOX_ACCESS_TOKEN:
    print("[WARNING] MAPBOX_ACCESS_TOKEN not set in .env file!")

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global hazards cache
hazards_cache = []
hazards_lock = threading.Lock()

### === Data Models === ###
class EmbedRequest(BaseModel):
    text1: str
    text2: str

class Report(BaseModel):
    id: int
    user_id: int
    incident_type: str
    description: str
    lat: float
    lng: float
    reported_at: datetime
    agreement_score: Optional[float] = None

class ReportInput(BaseModel):
    report: Report
    neighbors: List[Report]

class Point(BaseModel):
    lat: float
    lng: float

class RouteInput(BaseModel):
    start: Point
    end: Point
    alpha: float = 0.5

class RouteDistanceInput(BaseModel):
    start: Point
    target_distance_km: float
    alpha: float = 0.5

### === Time & Distance Decay === ###
def time_decay(t1, t2):
    delta = abs((t1 - t2).total_seconds()) / 60  # in minutes
    return math.exp(-0.0005 * delta)

def distance_decay(lat1, lon1, lat2, lon2):
    R = 6371000  # meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return math.exp(-0.01 * (R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))))

### === Agreement Score === ###
def compute_agreement_score(report, neighbors):
    if not neighbors:
        return 0.1

    sorted_neighbors = sorted(neighbors, key=lambda n: n.reported_at, reverse=True)[:10]

    total = 0
    for neighbor in sorted_neighbors:
        decay_t = time_decay(report.reported_at, neighbor.reported_at)
        decay_d = distance_decay(report.lat, report.lng, neighbor.lat, neighbor.lng)
        sim = semantic_similarity(report, neighbor)
        total += decay_t * decay_d * sim
    return total

### === Semantic Similarity === ###
sim_matrix = {
    "robbery": {"snatching": 0.8, "theft": 0.7, "burglary": 0.65},
    "snatching": {"robbery": 0.8, "theft": 0.75},
    "assault": {"harassment": 0.6, "catcalling": 0.55},
    "harassment": {"catcalling": 0.65, "assault": 0.6},
    "pothole": {"road_damage": 0.85, "uneven_surface": 0.75},
    "flood": {"waterlogging": 0.8},
    "broken_light": {"poor_lighting": 0.9, "dark_area": 0.8},
    "stray_dog": {"animal_hazard": 0.85},
    "congestion": {"traffic_jam": 0.9, "heavy_traffic": 0.85},
    "accident": {"collision": 0.9, "crash": 0.85},
    "speeding": {"reckless_driving": 0.8},
}

def semantic_similarity(r1, r2):
    if r1.incident_type == r2.incident_type:
        return 1.0
    if r1.incident_type in sim_matrix and r2.incident_type in sim_matrix[r1.incident_type]:
        return sim_matrix[r1.incident_type][r2.incident_type]
    elif r2.incident_type in sim_matrix and r1.incident_type in sim_matrix[r2.incident_type]:
        return sim_matrix[r2.incident_type][r1.incident_type]
    else:
        return compute_sbert_similarity(r1.description, r2.description)

@lru_cache(maxsize=1000)
def encode_text_cached(text: str):
    return sbert_model.encode(text, convert_to_numpy=True)

def compute_sbert_similarity(text1, text2):
    try:
        emb1 = encode_text_cached(text1)
        emb2 = encode_text_cached(text2)
        return float(1 - cosine(emb1, emb2))
    except Exception as e:
        print(f"SBERT similarity error: {e}")
        return 0.0

### === Trust Score === ###
def compute_trust(reports):
    alpha = sum(1 for r in reports if r.agreement_score and r.agreement_score >= 0.4)
    beta = sum(1 for r in reports if r.agreement_score and r.agreement_score < 0.4)
    return (alpha + 1) / (alpha + beta + 2)

### === Haversine Distance === ###
def haversine(lat1, lng1, lat2, lng2):
    """Calculate distance between two points in meters"""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

### === Calculate Route Risk Score === ###
def calculate_route_risk(coordinates: List[Tuple[float, float]], hazards: List[dict]) -> float:
    """
    Calculate risk score for a route based on proximity to hazards
    Returns: risk per km (lower is safer)
    """
    if not coordinates or len(coordinates) < 2:
        return 0.0

    total_risk = 0.0
    total_distance = 0.0

    # Calculate distance and risk for each segment
    for i in range(len(coordinates) - 1):
        lat1, lng1 = coordinates[i]
        lat2, lng2 = coordinates[i + 1]

        # Segment distance
        segment_distance = haversine(lat1, lng1, lat2, lng2) / 1000  # km
        total_distance += segment_distance

        # Check hazards near this segment
        segment_midpoint = ((lat1 + lat2) / 2, (lng1 + lng2) / 2)

        for hazard in hazards:
            hazard_lat = hazard.get("lat")
            hazard_lng = hazard.get("lng")

            if hazard_lat is None or hazard_lng is None:
                continue

            # Distance from segment midpoint to hazard
            dist_to_hazard = haversine(segment_midpoint[0], segment_midpoint[1], hazard_lat, hazard_lng)

            # Only consider hazards within 500m of the route (increased from 250m)
            if dist_to_hazard <= 500:
                # Calculate hazard impact
                severity = hazard.get("severity_weight", 0.5)
                trust = hazard.get("trust_score", 0.5)
                agreement = hazard.get("agreement_score", 0.5)

                # Increased base risk multiplier from 100 to 300 for stronger impact
                base_risk = severity * 300

                # Solution 2: Uniform penalty - treat all hazards equally
                # Goal: Hazard awareness and avoidance regardless of trust/agreement
                trust_multiplier = 1.0
                agreement_multiplier = 1.0

                hazard_risk = base_risk * trust_multiplier * agreement_multiplier

                # Less aggressive distance decay (changed from -0.01 to -0.003)
                # This makes hazards remain impactful at greater distances
                distance_decay = math.exp(-0.003 * dist_to_hazard)
                decayed_risk = hazard_risk * distance_decay

                # Cap max risk per hazard (increased from 300 to 800)
                decayed_risk = min(decayed_risk, 800)

                total_risk += decayed_risk * segment_distance

    # Return risk per km
    return (total_risk / total_distance) if total_distance > 0 else 0.0

### === Create Avoidance Polygons from Hazards === ###
def create_avoidance_polygons(hazards: List[dict]) -> List[dict]:
    """
    Create circular polygons around hazards based on severity, trust, and agreement scores
    Uses your trust score and agreement score algorithms to determine avoidance radius
    """
    polygons = []

    for hazard in hazards:
        hazard_lat = hazard.get("lat")
        hazard_lng = hazard.get("lng")

        if hazard_lat is None or hazard_lng is None:
            continue

        # Calculate hazard impact using YOUR algorithms (trust score + agreement score)
        severity = hazard.get("severity_weight", 0.5)
        trust = hazard.get("trust_score", 0.5)
        agreement = hazard.get("agreement_score", 0.5)

        # Calculate composite score (0 to 1 scale) - same logic as risk calculation
        # Solution 2: Uniform penalty - treat all hazards equally
        # Goal: Hazard awareness and avoidance regardless of trust/agreement
        trust_multiplier = 1.0
        agreement_multiplier = 1.0
        composite_score = severity * trust_multiplier * agreement_multiplier

        # Determine avoidance radius based on composite score
        # Low severity/trust/agreement = small radius (50m)
        # High severity/trust/agreement = large radius (200m)
        min_radius = 50  # meters
        max_radius = 200  # meters
        avoidance_radius = min_radius + (composite_score * (max_radius - min_radius))

        # Create circular polygon (16-sided polygon approximating a circle)
        circle_points = []
        num_points = 16
        for i in range(num_points):
            angle = (2 * math.pi * i) / num_points

            # Calculate point on circle using geographic calculations
            # 1 degree latitude ≈ 111,000 meters
            # 1 degree longitude ≈ 111,000 * cos(latitude) meters
            lat_offset = (avoidance_radius / 111000) * math.cos(angle)
            lng_offset = (avoidance_radius / (111000 * math.cos(math.radians(hazard_lat)))) * math.sin(angle)

            point_lat = hazard_lat + lat_offset
            point_lng = hazard_lng + lng_offset
            circle_points.append([point_lng, point_lat])

        # Close the polygon (first point = last point)
        circle_points.append(circle_points[0])

        polygons.append({
            "type": "Polygon",
            "coordinates": [circle_points],  # Polygon needs array of rings
            "properties": {
                "radius": avoidance_radius,
                "composite_score": composite_score,
                "hazard_type": hazard.get("incident_type", "unknown"),
                "hazard_id": hazard.get("id")
            }
        })

    # Sort by composite score (highest first) - prioritize worst hazards
    polygons.sort(key=lambda p: p["properties"]["composite_score"], reverse=True)

    return polygons

### === Mapbox Directions API === ###
def get_mapbox_routes_with_waypoints(start: Point, end: Point, hazards: List[dict] = None) -> List[dict]:
    """
    Generate MULTIPLE route options by trying different waypoints between start and end
    This forces Mapbox to return diverse paths, then we pick the safest
    Waypoints are placed strategically to avoid known hazard locations
    """
    all_routes = []

    # 1. First, get default direct routes with alternatives
    direct_url = f"https://api.mapbox.com/directions/v5/mapbox/walking/{start.lng},{start.lat};{end.lng},{end.lat}"
    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "alternatives": "true",
        "geometries": "geojson",
        "overview": "full",
        "steps": "false"
    }

    try:
        response = requests.get(direct_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if "routes" in data and len(data["routes"]) > 0:
            for route in data["routes"]:
                route["route_type"] = "direct"
                all_routes.append(route)
            print(f"   📍 Direct routes: {len(data['routes'])} found")
    except Exception as e:
        print(f"   ⚠️  Direct route failed: {e}")

    # 2. Generate waypoint-based routes to explore different paths
    # Calculate intermediate waypoints in different directions
    mid_lat = (start.lat + end.lat) / 2
    mid_lng = (start.lng + end.lng) / 2

    # Calculate offset distance (15% of total distance for more variation)
    dist_between = haversine(start.lat, start.lng, end.lat, end.lng)
    offset = dist_between * 0.15  # 15% offset to create variation

    # Try 4 waypoints in different directions: north, south, east, west of midpoint
    waypoint_candidates = [
        ((offset / 111000, 0), "north"),
        ((-offset / 111000, 0), "south"),
        ((0, offset / (111000 * math.cos(math.radians(mid_lat)))), "east"),
        ((0, -offset / (111000 * math.cos(math.radians(mid_lat)))), "west")
    ]

    # Filter out waypoints that are too close to hazards
    safe_waypoints = []
    if hazards:
        for (lat_offset, lng_offset), direction in waypoint_candidates:
            waypoint_lat = mid_lat + lat_offset
            waypoint_lng = mid_lng + lng_offset

            # Check if this waypoint is too close to any hazard
            too_close_to_hazard = False
            for hazard in hazards:
                hazard_lat = hazard.get("lat")
                hazard_lng = hazard.get("lng")

                if hazard_lat and hazard_lng:
                    dist_to_hazard = haversine(waypoint_lat, waypoint_lng, hazard_lat, hazard_lng)
                    # Skip waypoints within 100m of a hazard
                    if dist_to_hazard < 100:
                        print(f"      {direction.capitalize()} waypoint: Too close to hazard ({dist_to_hazard:.0f}m), skipped")
                        too_close_to_hazard = True
                        break

            if not too_close_to_hazard:
                safe_waypoints.append(((lat_offset, lng_offset), direction))
    else:
        safe_waypoints = waypoint_candidates

    print(f"   🔄 Trying {len(safe_waypoints)} safe waypoint-based routes...")

    for ((lat_offset, lng_offset), direction) in safe_waypoints:
        waypoint_lat = mid_lat + lat_offset
        waypoint_lng = mid_lng + lng_offset

        # Request route: start -> waypoint -> end
        waypoint_url = f"https://api.mapbox.com/directions/v5/mapbox/walking/{start.lng},{start.lat};{waypoint_lng},{waypoint_lat};{end.lng},{end.lat}"

        try:
            response = requests.get(waypoint_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if "routes" in data and len(data["routes"]) > 0:
                route = data["routes"][0]  # Take first route from waypoint path
                route["route_type"] = f"waypoint_{direction}"
                all_routes.append(route)
                print(f"      {direction.capitalize()}: {route['distance']:.0f}m")
        except Exception as e:
            print(f"      {direction.capitalize()}: Failed")
            continue

    if not all_routes:
        raise HTTPException(status_code=404, detail="No routes found")

    # Filter out duplicate and illogical routes
    filtered_routes = []
    seen_distances = set()

    # Calculate direct distance for comparison
    direct_distance = haversine(start.lat, start.lng, end.lat, end.lng)
    max_acceptable_distance = direct_distance * 1.5  # Allow max 50% longer than direct

    for route in all_routes:
        route_distance = route["distance"]

        # Skip if too long (illogical detour)
        if route_distance > max_acceptable_distance:
            print(f"   ⚠️  Filtered out {route_distance:.0f}m route (>50% longer than direct {direct_distance:.0f}m)")
            continue

        # Skip near-duplicates (within 5% distance)
        is_duplicate = False
        for seen_dist in seen_distances:
            if abs(route_distance - seen_dist) / seen_dist < 0.05:  # Within 5%
                is_duplicate = True
                break

        if is_duplicate:
            print(f"   ⚠️  Filtered out duplicate {route_distance:.0f}m route")
            continue

        filtered_routes.append(route)
        seen_distances.add(route_distance)

    # If filtering removed everything, keep at least the direct routes
    if not filtered_routes:
        filtered_routes = [r for r in all_routes if r.get("route_type") == "direct"]

    print(f"   ✅ Total routes after filtering: {len(filtered_routes)} (removed {len(all_routes) - len(filtered_routes)} duplicates/illogical)")
    return filtered_routes

def get_mapbox_routes(start: Point, end: Point, hazards: List[dict] = None, alternatives: bool = True) -> List[dict]:
    """
    Get walking routes from Mapbox Directions API
    If hazards provided, uses waypoint strategy to generate multiple diverse routes
    Otherwise uses simple direct routing
    """
    # If we have hazards, use multi-waypoint strategy to find safest route
    if hazards and len(hazards) > 0:
        return get_mapbox_routes_with_waypoints(start, end)

    # Otherwise, simple direct routing with alternatives
    url = f"https://api.mapbox.com/directions/v5/mapbox/walking/{start.lng},{start.lat};{end.lng},{end.lat}"

    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "alternatives": "true" if alternatives else "false",
        "geometries": "geojson",
        "overview": "full",
        "steps": "false"
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if "routes" not in data or len(data["routes"]) == 0:
            raise HTTPException(status_code=404, detail="No routes found")

        return data["routes"]
    except requests.exceptions.RequestException as e:
        print(f"Mapbox API error: {e}")
        raise HTTPException(status_code=500, detail=f"Mapbox API error: {str(e)}")

def get_mapbox_circular_route(start: Point, target_distance_m: float, hazards: List[dict] = None) -> Optional[dict]:
    """
    Generate SAFEST circular walking route of approximately target_distance_m
    Samples multiple turning points from isochrone and picks the loop with lowest risk
    """
    # Find a point roughly target_distance/2 away
    radius_m = target_distance_m / 2

    # Use Mapbox Isochrone to find reachable area
    url = f"https://api.mapbox.com/isochrone/v1/mapbox/walking/{start.lng},{start.lat}"

    # Convert meters to minutes (assuming 5 km/h walking speed)
    contour_minutes = int((radius_m / 1000) / 5 * 60)
    contour_minutes = max(1, min(contour_minutes, 60))  # Clamp to 1-60 minutes

    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "contours_minutes": contour_minutes,
        "polygons": "true"
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if "features" not in data or len(data["features"]) == 0:
            return None

        # Get the isochrone polygon
        polygon = data["features"][0]
        coordinates = polygon["geometry"]["coordinates"][0]

        # Sample MULTIPLE turning points (not just one!)
        # Try different directions to find safest loop
        candidate_points = []
        for coord in coordinates[::10]:  # Sample every 10th point
            lng, lat = coord[0], coord[1]
            dist = haversine(start.lat, start.lng, lat, lng)
            dist_diff = abs(dist - radius_m)

            # Keep points within 20% of target radius
            if dist_diff <= (radius_m * 0.2):
                candidate_points.append({
                    "point": Point(lat=lat, lng=lng),
                    "distance_diff": dist_diff
                })

        if not candidate_points:
            return None

        # Limit to top 5 candidates (closest to target radius) to avoid too many API calls
        candidate_points.sort(key=lambda p: p["distance_diff"])
        candidate_points = candidate_points[:5]

        print(f"🔄 Trying {len(candidate_points)} different loop directions...")

        # Generate loop for each candidate turning point
        loop_candidates = []
        for idx, candidate in enumerate(candidate_points):
            turning_point = candidate["point"]

            # Get route from start -> turning point -> start
            loop_url = f"https://api.mapbox.com/directions/v5/mapbox/walking/{start.lng},{start.lat};{turning_point.lng},{turning_point.lat};{start.lng},{start.lat}"

            loop_params = {
                "access_token": MAPBOX_ACCESS_TOKEN,
                "geometries": "geojson",
                "overview": "full"
            }

            try:
                loop_response = requests.get(loop_url, params=loop_params, timeout=10)
                loop_response.raise_for_status()
                loop_data = loop_response.json()

                if "routes" in loop_data and len(loop_data["routes"]) > 0:
                    route = loop_data["routes"][0]

                    # Calculate risk for this loop if hazards provided
                    risk_score = 0.0
                    if hazards:
                        coords = route["geometry"]["coordinates"]
                        coords_latLng = [(coord[1], coord[0]) for coord in coords]
                        risk_score = calculate_route_risk(coords_latLng, hazards)

                    loop_candidates.append({
                        "route": route,
                        "risk_score": risk_score,
                        "turning_point_index": idx
                    })

                    print(f"   Loop {idx + 1}: {route['distance']:.0f}m, risk: {risk_score:.2f} per km")

            except Exception as e:
                print(f"   Loop {idx + 1}: Failed - {e}")
                continue

        if not loop_candidates:
            return None

        # Pick the SAFEST loop (lowest risk per km)
        safest_loop = min(loop_candidates, key=lambda x: x["risk_score"])
        print(f"✅ Selected Loop {safest_loop['turning_point_index'] + 1} (lowest risk: {safest_loop['risk_score']:.2f})")

        return safest_loop["route"]

    except Exception as e:
        print(f"Circular route generation error: {e}")
        return None

### === Route Generation === ###
@app.post("/route-osm")
def get_route_osm(input: RouteInput):
    """
    Generate safest route between two points using Mapbox
    """
    try:
        # Load current hazards
        with hazards_lock:
            current_hazards = hazards_cache.copy()

        print(f"\n{'='*60}")
        print(f"🛣️  ROUTE GENERATION with Polygon Avoidance + Enhanced Scoring")
        print(f"{'='*60}")
        print(f"⚠️  Active hazards in cache: {len(current_hazards)}")

        # Get alternative routes from Mapbox with hazard avoidance
        mapbox_routes = get_mapbox_routes(input.start, input.end, hazards=current_hazards, alternatives=True)

        print(f"📍 Mapbox returned {len(mapbox_routes)} route(s)")

        # Score each route
        scored_routes = []
        for idx, route in enumerate(mapbox_routes):
            # Extract coordinates from GeoJSON
            coords = route["geometry"]["coordinates"]
            # Mapbox returns [lng, lat], convert to (lat, lng)
            coords_latLng = [(coord[1], coord[0]) for coord in coords]

            # Calculate risk
            risk_score = calculate_route_risk(coords_latLng, current_hazards)

            scored_routes.append({
                "route": route,
                "coordinates": coords_latLng,
                "risk_per_km": risk_score,
                "distance_m": route["distance"],
                "duration_s": route["duration"]
            })

            print(f"\nRoute {idx + 1}:")
            print(f"  Distance: {route['distance']:.0f}m ({route['distance']/1000:.2f}km)")
            print(f"  Duration: {route['duration']:.0f}s ({route['duration']/60:.1f}min)")
            print(f"  Risk Score: {risk_score:.2f} per km")

        # Select safest route with threshold-based filtering
        # Refuse extremely risky routes if safer alternatives exist
        SAFE_RISK_THRESHOLD = 80  # routes above this are "risky"

        safe_candidates = [r for r in scored_routes if r["risk_per_km"] <= SAFE_RISK_THRESHOLD]

        if safe_candidates:
            # At least one "safe enough" route exists → pick the safest one
            safest = min(safe_candidates, key=lambda x: x["risk_per_km"])
            safest_idx = scored_routes.index(safest)
            print(f"\n✅ Selected Route {safest_idx + 1} (lowest risk: {safest['risk_per_km']:.2f})")
            print(f"   {len(safe_candidates)} safe route(s) found below threshold ({SAFE_RISK_THRESHOLD})")
        else:
            # All routes are risky → pick least bad and show big warning
            safest = min(scored_routes, key=lambda x: x["risk_per_km"])
            safest_idx = scored_routes.index(safest)
            print(f"\n⚠️  Selected Route {safest_idx + 1} (lowest risk: {safest['risk_per_km']:.2f})")
            print(f"   ALL routes exceed safety threshold ({SAFE_RISK_THRESHOLD})!")
            print(f"   This is the least risky option, but still dangerous.")

        print(f"{'='*60}\n")

        # BLOCK route generation if only 1 route exists and it's high risk
        # User should pick different start/end points instead
        if len(scored_routes) == 1 and safest["risk_per_km"] > 100:
            print(f"🚫 BLOCKING ROUTE GENERATION")
            print(f"   Only 1 route available with high risk ({safest['risk_per_km']:.2f} per km)")
            print(f"   No alternative paths exist to avoid hazards in this area.")
            print(f"   User should choose different start/end points.")
            print(f"{'='*60}\n")

            raise HTTPException(
                status_code=400,
                detail={
                    "error": "no_safe_route",
                    "title": "No Safe Route Available",
                    "message": "We couldn't find a safe running path between these locations.",
                    "reason": "The only available path passes through hazard areas.",
                    "risk_score": safest["risk_per_km"],
                    "alternatives_available": False
                }
            )

        # Generate simple safety warnings
        distance_km = safest["distance_m"] / 1000
        warnings = []

        if safest["risk_per_km"] > 100:
            # Check if alternatives exist
            advice = "Stay alert and consider alternative times or routes."
            if len(scored_routes) == 1:
                advice = "No alternative walking paths available. Consider choosing different start/end points or travel at a safer time."

            warnings.append({
                "type": "high_risk",
                "severity": "high",
                "message": f"[WARNING] This route passes through {int(safest['risk_per_km'])} risk points per km.",
                "advice": advice,
                "alternatives_available": len(scored_routes) > 1
            })
        elif safest["risk_per_km"] > 50:
            warnings.append({
                "type": "medium_risk",
                "severity": "medium",
                "message": f"[CAUTION] Moderate risk detected along this route.",
                "advice": "Be aware of your surroundings."
            })
        else:
            warnings.append({
                "type": "low_risk",
                "severity": "info",
                "message": "[SAFE] This route has low reported hazards.",
                "advice": "Enjoy your run!"
            })

        return {
            "coordinates": safest["coordinates"],
            "metadata": [{
                "length": safest["distance_m"],
                "duration": safest["duration_s"],
                "risk": safest["risk_per_km"]
            }],
            "safety": {
                "warnings": warnings,
                "stats": {
                    "total_distance_km": distance_km,
                    "has_critical_warnings": safest["risk_per_km"] > 100
                }
            }
        }

    except HTTPException:
        # Re-raise HTTPException without modification (preserves status code and detail)
        raise
    except Exception as e:
        print(f"Route generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/route-distance")
def get_route_distance(input: RouteDistanceInput):
    """
    Generate circular route of specified distance using Mapbox
    """
    try:
        target_distance_m = input.target_distance_km * 1000

        # Load current hazards
        with hazards_lock:
            current_hazards = hazards_cache.copy()

        # Generate SAFEST circular route (tries multiple loops, picks safest)
        route = get_mapbox_circular_route(input.start, target_distance_m, hazards=current_hazards)

        if not route:
            return {
                "coordinates": [],
                "metadata": [],
                "safety": {"warnings": [], "stats": {"total_distance_km": 0, "has_critical_warnings": False}},
                "distance_info": {
                    "distance_warning": True,
                    "requested_distance_km": input.target_distance_km,
                    "generated_distance_km": 0,
                    "reason_code": "no_loop_found",
                    "reason_message": "Could not generate a circular route from this location. Try a different starting point."
                }
            }

        # Extract coordinates
        coords = route["geometry"]["coordinates"]
        coords_latLng = [(coord[1], coord[0]) for coord in coords]

        # Load hazards and calculate risk
        with hazards_lock:
            current_hazards = hazards_cache.copy()

        risk_score = calculate_route_risk(coords_latLng, current_hazards)

        actual_distance_km = route["distance"] / 1000
        distance_diff = abs(actual_distance_km - input.target_distance_km)
        distance_warning = distance_diff > (input.target_distance_km * 0.15)

        # Generate warnings
        warnings = []
        if risk_score > 100:
            warnings.append({
                "type": "high_risk",
                "severity": "high",
                "message": "[WARNING] High risk areas detected on this route.",
                "advice": "Consider a different location or time."
            })
        elif risk_score > 50:
            warnings.append({
                "type": "medium_risk",
                "severity": "medium",
                "message": "[CAUTION] Moderate risk on parts of this route.",
                "advice": "Stay alert."
            })
        else:
            warnings.append({
                "type": "low_risk",
                "severity": "info",
                "message": "[SAFE] Low hazard route.",
                "advice": "Enjoy your run!"
            })

        return {
            "coordinates": coords_latLng,
            "metadata": [{
                "length": route["distance"],
                "duration": route["duration"],
                "risk": risk_score
            }],
            "safety": {
                "warnings": warnings,
                "stats": {
                    "total_distance_km": actual_distance_km,
                    "has_critical_warnings": risk_score > 100
                }
            },
            "distance_info": {
                "distance_warning": distance_warning,
                "requested_distance_km": input.target_distance_km,
                "generated_distance_km": actual_distance_km,
                "reason_code": "ok" if not distance_warning else "approx_loop",
                "reason_message": "Route generated successfully." if not distance_warning else f"Generated {actual_distance_km:.2f}km route (target: {input.target_distance_km:.2f}km)."
            }
        }

    except HTTPException:
        # Re-raise HTTPException without modification
        raise
    except Exception as e:
        print(f"Distance-based route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

### === Background Hazard Loading === ###
def load_hazards_background():
    """Load hazards from Supabase in background"""
    global hazards_cache

    try:
        print("[BG] Fetching hazards from Supabase...")
        response = supabase.table("hazard_reports").select("*").eq("status", "active").execute()
        hazards = response.data

        if hazards and len(hazards) > 0:
            print(f"[BG] Loaded {len(hazards)} active hazards into cache")
            with hazards_lock:
                hazards_cache = hazards
        else:
            print("[BG] No active hazards found")
            with hazards_lock:
                hazards_cache = []

    except Exception as e:
        print(f"[BG] WARNING: Failed to load hazards: {e}")
        import traceback
        traceback.print_exc()

@app.on_event("startup")
def startup():
    print("=" * 50)
    print("🚀 SyncRunize Algorithm Engine Starting...")
    print("=" * 50)

    if not MAPBOX_ACCESS_TOKEN:
        print("[ERROR] MAPBOX_ACCESS_TOKEN not found in environment!")
        print("Please add MAPBOX_ACCESS_TOKEN to your .env file")
    else:
        print(f"[OK] Mapbox token configured")

    # Load hazards in background
    print("[INFO] Starting background hazard loading...")
    threading.Thread(target=load_hazards_background, daemon=True).start()

    print("[READY] Algorithm engine ready to serve requests!")
    print("=" * 50)

### === Other Endpoints === ###
@app.post("/agreement")
def get_agreement(input: ReportInput):
    score = compute_agreement_score(input.report, input.neighbors)
    return {"agreement_score": score}

@app.post("/trust")
def get_trust(reports: List[Report]):
    return {"trust_score": compute_trust(reports)}

@app.post("/sbert")
def get_computed_sbert(req: EmbedRequest):
    score = compute_sbert_similarity(req.text1, req.text2)
    return {"similarity_score": score}

@app.get("/")
def root():
    return {
        "message": "SyncRunize Algorithm Engine (Mapbox Edition)",
        "status": "running",
        "engine": "mapbox",
        "hazards_loaded": len(hazards_cache)
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "mapbox_configured": bool(MAPBOX_ACCESS_TOKEN),
        "hazards_count": len(hazards_cache)
    }
