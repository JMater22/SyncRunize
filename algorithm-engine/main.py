# algorithm_engine/main.py
from fastapi import FastAPI
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
import osmnx as ox
import networkx as nx
import pandas as pd
from scipy.spatial import cKDTree
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI()
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

### === Data Models === ###
class EmbedRequest(BaseModel):
    text1: str
    text2: str



class Report(BaseModel):
    id: int
    user_id: int
    incident_type: str   # <-- changed from `type`
    description: str
    lat: float
    lng: float
    reported_at: datetime
    agreement_score: Optional[float] = None

class ReportInput(BaseModel):
    report: Report
    neighbors: List[Report]

class RouteRequest(BaseModel):
    graph: Dict[str, List[Tuple[str, float, float]]]
    start: str
    end: str
    alpha: float

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
    total = 0
    for neighbor in neighbors:
        decay_t = time_decay(report.reported_at, neighbor.reported_at)
        decay_d = distance_decay(report.lat, report.lng, neighbor.lat, neighbor.lng)
        sim = semantic_similarity(report, neighbor)
        total += decay_t * decay_d * sim
    return total

### === Semantic Similarity === ###
sim_matrix = {
    # Crimes
    "robbery": {"snatching": 0.8, "theft": 0.7, "burglary": 0.65},
    "snatching": {"robbery": 0.8, "theft": 0.75},
    "assault": {"harassment": 0.6, "catcalling": 0.55},
    "harassment": {"catcalling": 0.65, "assault": 0.6},

    # User-reported hazards
    "pothole": {"road_damage": 0.85, "uneven_surface": 0.75},
    "flood": {"waterlogging": 0.8},
    "broken_light": {"poor_lighting": 0.9, "dark_area": 0.8},
    "stray_dog": {"animal_hazard": 0.85},

    # Traffic-related
    "congestion": {"traffic_jam": 0.9, "heavy_traffic": 0.85},
    "accident": {"collision": 0.9, "crash": 0.85},
    "speeding": {"reckless_driving": 0.8},
}

def semantic_similarity(r1, r2):
    # use incident_type field instead of type
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
    # Use 
    try:
        emb1 = encode_text_cached(text1)
        emb2 = encode_text_cached(text2)
        return float(1 - cosine(emb1, emb2))
    except Exception as e:
        print(f"SBERT similarity error: {e}")
        return 0.0  # fallback similarity

### === Trust Score === ###
def compute_trust(reports):
    alpha = sum(1 for r in reports if r.agreement_score and r.agreement_score >= 0.4)
    beta = sum(1 for r in reports if r.agreement_score and r.agreement_score < 0.4)
    return (alpha + 1) / (alpha + beta + 2)

### === Modified Dijkstra with Sidewalk Preference === ###
def safest_path_osm(G, origin_point, destination_point, alpha=0.5):
    """
    origin_point, destination_point = (lat, lng)
    Enhanced with sidewalk preference and road safety scoring
    """
    # Find nearest OSM nodes
    orig_node = ox.nearest_nodes(G, origin_point[1], origin_point[0])  # (lng, lat)
    dest_node = ox.nearest_nodes(G, destination_point[1], destination_point[0])

    # Custom weight: combine length, risk, and road safety factors
    def weight(u, v, d):
        length = d.get("length", 1.0) # physical road distance (meters)
        base_risk = d.get("risk", 0.2)  # crime/incident risk score

        # SIDEWALK PREFERENCE: Check if sidewalk exists
        sidewalk = d.get("sidewalk", "no")
        has_sidewalk = sidewalk in ["yes", "both", "left", "right", "separate"]

        # ROAD TYPE SAFETY: Penalize dangerous road types
        highway_type = d.get("highway", "residential")
        road_safety_penalty = 0

        # Safest to most dangerous
        if highway_type in ["footway", "pedestrian", "path", "cycleway"]:
            road_safety_penalty = 0  # Safest - dedicated paths
        elif highway_type in ["residential", "living_street"]:
            road_safety_penalty = 50 if not has_sidewalk else 10  # Safe if has sidewalk
        elif highway_type in ["tertiary", "unclassified", "service"]:
            road_safety_penalty = 100 if not has_sidewalk else 20
        elif highway_type in ["secondary", "secondary_link"]:
            road_safety_penalty = 200 if not has_sidewalk else 40  # Busier roads
        elif highway_type in ["primary", "primary_link", "trunk", "trunk_link"]:
            road_safety_penalty = 500 if not has_sidewalk else 80  # Major roads - avoid
        elif highway_type in ["motorway", "motorway_link"]:
            road_safety_penalty = 10000  # Highways - NEVER use

        # LIGHTING: Prefer well-lit paths (if data available)
        lit = d.get("lit", "no")
        lighting_penalty = 0 if lit == "yes" else 30

        # LANES: More lanes = more dangerous
        lanes = int(d.get("lanes", 1))
        lane_penalty = (lanes - 1) * 20

        # SPEED LIMIT: Higher speed = more dangerous
        maxspeed = d.get("maxspeed", "30")
        try:
            speed_val = int(str(maxspeed).replace(" kph", "").replace(" mph", "").split()[0])
            speed_penalty = max(0, (speed_val - 30) * 2)  # Penalty for speeds above 30kph
        except:
            speed_penalty = 0

        # TOTAL SAFETY SCORE
        safety_score = base_risk + road_safety_penalty + lighting_penalty + lane_penalty + speed_penalty

        # Apply sidewalk bonus (reduce safety score if sidewalk exists)
        if has_sidewalk:
            safety_score *= 0.5  # 50% safer with sidewalk

        # Combine distance and safety
        return (1 - alpha) * length + alpha * safety_score

    # Run shortest path
    try:
        path = nx.shortest_path(G, orig_node, dest_node, weight=weight)

        # Extract coordinates and road metadata
        coords = []
        route_metadata = []

        for i, node in enumerate(path):
            coords.append((G.nodes[node]["y"], G.nodes[node]["x"]))

            # Get edge metadata for safety warnings
            if i < len(path) - 1:
                next_node = path[i + 1]
                if G.has_edge(node, next_node):
                    edge_data = G[node][next_node]
                    if isinstance(edge_data, dict):
                        edge_info = edge_data
                    else:
                        edge_info = list(edge_data.values())[0]

                    route_metadata.append({
                        "highway": edge_info.get("highway", "unknown"),
                        "sidewalk": edge_info.get("sidewalk", "no"),
                        "lit": edge_info.get("lit", "no"),
                        "lanes": edge_info.get("lanes", 1),
                        "maxspeed": edge_info.get("maxspeed", "30"),
                        "length": edge_info.get("length", 0)
                    })

        return coords, route_metadata
    except nx.NetworkXNoPath:
        return [], []

def distance_based_route(G, origin_point, target_distance_km, alpha=0.5):
    """
    Generate a circular route of approximately target_distance_km from origin_point
    Finds the safest route that returns to start with the target distance
    Enhanced with sidewalk preference and road safety scoring
    """
    orig_node = ox.nearest_nodes(G, origin_point[1], origin_point[0])  # (lng, lat)

    # Custom weight: same safety scoring as safest_path_osm
    def weight(u, v, d):
        length = d.get("length", 1.0)
        base_risk = d.get("risk", 0.2)

        # Sidewalk preference
        sidewalk = d.get("sidewalk", "no")
        has_sidewalk = sidewalk in ["yes", "both", "left", "right", "separate"]

        # Road type safety
        highway_type = d.get("highway", "residential")
        road_safety_penalty = 0

        if highway_type in ["footway", "pedestrian", "path", "cycleway"]:
            road_safety_penalty = 0
        elif highway_type in ["residential", "living_street"]:
            road_safety_penalty = 50 if not has_sidewalk else 10
        elif highway_type in ["tertiary", "unclassified", "service"]:
            road_safety_penalty = 100 if not has_sidewalk else 20
        elif highway_type in ["secondary", "secondary_link"]:
            road_safety_penalty = 200 if not has_sidewalk else 40
        elif highway_type in ["primary", "primary_link", "trunk", "trunk_link"]:
            road_safety_penalty = 500 if not has_sidewalk else 80
        elif highway_type in ["motorway", "motorway_link"]:
            road_safety_penalty = 10000

        # Lighting
        lit = d.get("lit", "no")
        lighting_penalty = 0 if lit == "yes" else 30

        # Lanes
        lanes = int(d.get("lanes", 1))
        lane_penalty = (lanes - 1) * 20

        # Speed limit
        maxspeed = d.get("maxspeed", "30")
        try:
            speed_val = int(str(maxspeed).replace(" kph", "").replace(" mph", "").split()[0])
            speed_penalty = max(0, (speed_val - 30) * 2)
        except:
            speed_penalty = 0

        safety_score = base_risk + road_safety_penalty + lighting_penalty + lane_penalty + speed_penalty

        if has_sidewalk:
            safety_score *= 0.5

        return (1 - alpha) * length + alpha * safety_score

    # Get all nodes within a reasonable radius
    target_meters = target_distance_km * 1000
    search_radius_meters = target_meters / 2  # Search in half the distance

    # Get nearby nodes
    nearby_nodes = []
    for node in G.nodes():
        node_lat = G.nodes[node]["y"]
        node_lng = G.nodes[node]["x"]

        # Calculate distance from origin
        R = 6371000  # Earth's radius in meters
        lat1, lng1 = origin_point
        lat2, lng2 = node_lat, node_lng

        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lng2 - lng1)
        a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
        distance = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        if search_radius_meters * 0.3 < distance < search_radius_meters * 1.2:
            nearby_nodes.append((node, distance))

    if not nearby_nodes:
        print("No nearby nodes found for distance-based routing")
        return []

    # Sort by how close they are to half the target distance
    nearby_nodes.sort(key=lambda x: abs(x[1] - search_radius_meters))

    # Try multiple turning points to find the best route
    best_route = None
    best_diff = float('inf')

    for turn_node, _ in nearby_nodes[:20]:  # Try top 20 candidates
        try:
            # Path from origin to turning point
            path_out = nx.shortest_path(G, orig_node, turn_node, weight=weight)
            # Path from turning point back to origin
            path_back = nx.shortest_path(G, turn_node, orig_node, weight=weight)

            # Calculate total distance
            total_distance = 0
            combined_path = path_out + path_back[1:]  # Avoid duplicate node

            for i in range(len(combined_path) - 1):
                u, v = combined_path[i], combined_path[i + 1]
                if G.has_edge(u, v):
                    edge_data = G[u][v]
                    if isinstance(edge_data, dict):
                        total_distance += edge_data.get('length', 0)
                    else:
                        # MultiDiGraph case
                        total_distance += list(edge_data.values())[0].get('length', 0)

            total_distance_km = total_distance / 1000
            diff = abs(total_distance_km - target_distance_km)

            # Keep track of the best route (closest to target distance)
            if diff < best_diff and diff < target_distance_km * 0.3:  # Within 30% of target
                best_diff = diff
                best_route = combined_path

                # If we found a very close match, use it
                if diff < target_distance_km * 0.1:  # Within 10%
                    break

        except nx.NetworkXNoPath:
            continue

    if best_route:
        # Extract coordinates and metadata
        coords = []
        route_metadata = []

        for i, node in enumerate(best_route):
            coords.append((G.nodes[node]["y"], G.nodes[node]["x"]))

            if i < len(best_route) - 1:
                next_node = best_route[i + 1]
                if G.has_edge(node, next_node):
                    edge_data = G[node][next_node]
                    if isinstance(edge_data, dict):
                        edge_info = edge_data
                    else:
                        edge_info = list(edge_data.values())[0]

                    route_metadata.append({
                        "highway": edge_info.get("highway", "unknown"),
                        "sidewalk": edge_info.get("sidewalk", "no"),
                        "lit": edge_info.get("lit", "no"),
                        "lanes": edge_info.get("lanes", 1),
                        "maxspeed": edge_info.get("maxspeed", "30"),
                        "length": edge_info.get("length", 0)
                    })

        return coords, route_metadata

    # Fallback: just make a simple out-and-back route
    print("Using fallback: out-and-back route")
    try:
        half_target = target_meters / 2
        fallback_node = nearby_nodes[0][0] if nearby_nodes else orig_node

        path_out = nx.shortest_path(G, orig_node, fallback_node, weight=weight)
        path_back = nx.shortest_path(G, fallback_node, orig_node, weight=weight)
        combined = path_out + path_back[1:]

        coords = []
        route_metadata = []

        for i, node in enumerate(combined):
            coords.append((G.nodes[node]["y"], G.nodes[node]["x"]))

            if i < len(combined) - 1:
                next_node = combined[i + 1]
                if G.has_edge(node, next_node):
                    edge_data = G[node][next_node]
                    if isinstance(edge_data, dict):
                        edge_info = edge_data
                    else:
                        edge_info = list(edge_data.values())[0]

                    route_metadata.append({
                        "highway": edge_info.get("highway", "unknown"),
                        "sidewalk": edge_info.get("sidewalk", "no"),
                        "lit": edge_info.get("lit", "no"),
                        "lanes": edge_info.get("lanes", 1),
                        "maxspeed": edge_info.get("maxspeed", "30"),
                        "length": edge_info.get("length", 0)
                    })

        return coords, route_metadata
    except:
        return [], []

### === Safety Warnings Generator === ###
def generate_safety_warnings(route_metadata):
    """
    Analyze route metadata and generate safety warnings for runners
    """
    warnings = []
    total_distance = 0
    sidewalk_distance = 0
    no_sidewalk_segments = []
    high_speed_segments = []  # Track high-speed segments
    unlit_segments = []  # Track unlit segments
    has_motorway = False

    for i, segment in enumerate(route_metadata):
        length_km = segment["length"] / 1000
        total_distance += length_km

        highway = segment["highway"]
        sidewalk = segment["sidewalk"]
        has_sidewalk = sidewalk in ["yes", "both", "left", "right", "separate"]
        lit = segment["lit"]
        maxspeed = segment["maxspeed"]

        if has_sidewalk:
            sidewalk_distance += length_km

        # WARNING: Highway/Motorway (should never happen but safety check)
        if highway in ["motorway", "motorway_link"]:
            has_motorway = True

        # Track poor lighting segments
        if lit == "no" and length_km > 0.5:
            unlit_segments.append({
                "segment": i,
                "length_km": length_km
            })

        # Track high speed limit segments
        has_high_speed_warning = False
        try:
            speed = int(str(maxspeed).replace(" kph", "").replace(" mph", "").split()[0])
            if speed >= 60 and not has_sidewalk:
                high_speed_segments.append({
                    "segment": i,
                    "speed": speed,
                    "length_km": length_km
                })
                has_high_speed_warning = True
        except:
            pass

        # Track no sidewalk on busy road (only if not already high-speed)
        if not has_sidewalk and highway in ["primary", "secondary", "tertiary", "trunk"] and not has_high_speed_warning:
            no_sidewalk_segments.append({
                "segment": i,
                "highway": highway,
                "length_km": length_km
            })

    # Generate consolidated warnings

    # CRITICAL: Motorway warning
    if has_motorway:
        warnings.append({
            "type": "motorway",
            "severity": "critical",
            "message": "[DANGER] Motorway detected. Do NOT run here!",
            "advice": "Find an alternative route immediately. Running on motorways is illegal and extremely dangerous."
        })

    # HIGH: High-speed roads summary
    if high_speed_segments:
        total_high_speed = sum(seg["length_km"] for seg in high_speed_segments)
        max_speed = max(seg["speed"] for seg in high_speed_segments)
        warnings.append({
            "type": "high_speed_no_sidewalk",
            "severity": "high",
            "message": f"[WARNING] {total_high_speed:.2f}km of high-speed roads (up to {max_speed} kph) without sidewalks.",
            "advice": "Stay alert. Face traffic. Wear bright/reflective clothing for visibility."
        })

    # HIGH/MEDIUM: No sidewalk on busy roads summary
    elif no_sidewalk_segments:  # Only show if no high-speed warning
        total_no_sidewalk = sum(seg["length_km"] for seg in no_sidewalk_segments)
        warnings.append({
            "type": "route_summary_sidewalk",
            "severity": "high" if total_no_sidewalk > 1 else "medium",
            "message": f"[WARNING] {total_no_sidewalk:.2f}km ({(total_no_sidewalk/total_distance*100):.1f}%) without sidewalks.",
            "advice": "Always face oncoming traffic when running on roads without sidewalks."
        })

    # MEDIUM: Unlit roads summary
    if unlit_segments:
        total_unlit = sum(seg["length_km"] for seg in unlit_segments)
        warnings.append({
            "type": "poor_lighting",
            "severity": "medium",
            "message": f"[NIGHT] {total_unlit:.1f}km of unlit roads.",
            "advice": "Wear reflective gear and use a headlamp if running at night."
        })

    # Positive feedback
    if sidewalk_distance / total_distance > 0.8:
        warnings.insert(0, {
            "type": "route_summary_safe",
            "severity": "info",
            "message": f"[SAFE] Great! {(sidewalk_distance/total_distance*100):.0f}% of route has sidewalks.",
            "advice": "This is a safe route for running."
        })

    return {
        "warnings": warnings,
        "stats": {
            "total_distance_km": total_distance,
            "sidewalk_coverage": sidewalk_distance / total_distance if total_distance > 0 else 0,
            "has_critical_warnings": any(w["severity"] == "critical" for w in warnings)
        }
    }

### === FastAPI Endpoint Examples === ###
@app.on_event("startup")
def load_graph():
    global road_graph
    print("Downloading OSM graph for Tarlac...")
    road_graph = ox.graph_from_place("Tarlac, Philippines", network_type="walk")

    # STEP 1: initialize edges
    for u, v, d in road_graph.edges(data=True):
        d["risk"] = 0.0

    # STEP 2: Load police crime data
    try:
        crime_df = pd.read_excel("incident_reports.xlsx")  # <-- put your Excel filename here
        crime_df.columns = [c.lower() for c in crime_df.columns]  # normalize column names

        # STEP 3: Use only relevant columns
        crime_df = crime_df[["lat", "lng", "incidenttype", "dateencoded"]].dropna()

        # STEP 3.1: Clean incident type values
        crime_df["incidenttype"] = (
            crime_df["incidenttype"]
            .str.replace(r"\(incident\)\s*", "", regex=True)  # remove "(Incident)"
            .str.strip()
            .str.lower()
        )

        # STEP 4: Group incidents by location + type
        grouped = crime_df.groupby(["lat", "lng", "incidenttype"]).size().reset_index(name="count")

        # STEP 5: Define severity weights (based only on incidents in your dataset)
        severity_weights = {
            "assault": 1.0,
            "physical injury": 1.0,
            "homicide": 1.0,
            "murder": 1.0,
            "rape": 1.0,

            # Property crimes → 0.7
            "robbery": 0.7,
            "theft": 0.7,
            "snatching": 0.7,
            "carnapping": 0.7,
            "burglary": 0.7,
        }

        # STEP 5.5: Build a KDTree of edge midpoints
        edge_coords, edge_keys = [], []
        for u, v, k, d in road_graph.edges(keys=True, data=True):
            x1, y1 = road_graph.nodes[u]["x"], road_graph.nodes[u]["y"]
            x2, y2 = road_graph.nodes[v]["x"], road_graph.nodes[v]["y"]
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            edge_coords.append((mx, my))
            edge_keys.append((u, v, k))
        edge_tree = cKDTree(np.array(edge_coords))

        # STEP 6: Assign risks to edges (optimized)
        for i, row in grouped.iterrows():
            lat, lng, ctype, count = row["lat"], row["lng"], row["incidenttype"], row["count"]

            # Frequency risk category
            if count >= 6:
                freq_weight = 7   # High crime
            elif 3 <= count <= 5:
                freq_weight = 3   # Medium crime
            else:
                freq_weight = 0   # Low crime (safe)

            severity = severity_weights.get(ctype, 0.5)
            risk_value = (freq_weight * severity) * 50

            dist, idx = edge_tree.query((lng, lat))  # lng = x, lat = y
            u, v, k = edge_keys[idx]

            # Add risk instead of overwrite
            road_graph[u][v][k]["risk"] += risk_value

            if i % 100 == 0 or i == len(grouped) - 1:
                print(f"Processed {i+1}/{len(grouped)} ({(i+1)/len(grouped):.1%}) crime records")

        print("[OK] Crime risk integrated into OSM graph")

    except Exception as e:
        print(f"[WARNING] Failed to load crime data: {e}")

    # STEP 7: Load user-reported hazards from Supabase
    try:
        print("Fetching hazards from Supabase...")
        response = supabase.table("hazard_reports").select("*").eq("status", "active").execute()
        hazards = response.data

        if hazards and len(hazards) > 0:
            print(f"Found {len(hazards)} active hazards")

            # Process each hazard
            for i, hazard in enumerate(hazards):
                lat = hazard.get("lat")
                lng = hazard.get("lng")
                incident_type = hazard.get("incident_type", "unknown")
                severity_weight = hazard.get("severity_weight", 0.5)
                trust_score = hazard.get("trust_score", 0.5)
                agreement_score = hazard.get("agreement_score", 0.5)

                if lat is None or lng is None:
                    continue

                # Calculate risk value based on hazard properties
                # Higher severity, trust, and agreement = higher risk
                base_hazard_risk = severity_weight * 100  # Base risk from severity (0-100)
                trust_multiplier = 0.5 + (trust_score * 0.5)  # 0.5 to 1.0
                agreement_multiplier = 0.5 + (agreement_score * 0.5)  # 0.5 to 1.0

                # Final risk value for this hazard
                hazard_risk_value = base_hazard_risk * trust_multiplier * agreement_multiplier

                # Find nearest edge using KDTree
                dist, idx = edge_tree.query((lng, lat))  # lng = x, lat = y
                u, v, k = edge_keys[idx]

                # Add hazard risk to edge (accumulate with crime risk)
                road_graph[u][v][k]["risk"] += hazard_risk_value

                # Also add risk to nearby edges (within 50 meters)
                nearby_indices = edge_tree.query_ball_point((lng, lat), r=0.0005)  # ~50 meters
                for nearby_idx in nearby_indices:
                    if nearby_idx != idx:  # Skip the closest edge (already processed)
                        u_n, v_n, k_n = edge_keys[nearby_idx]
                        # Reduce risk for nearby edges (50% of main risk)
                        road_graph[u_n][v_n][k_n]["risk"] += hazard_risk_value * 0.5

                if (i + 1) % 50 == 0 or i == len(hazards) - 1:
                    print(f"Processed {i+1}/{len(hazards)} ({(i+1)/len(hazards):.1%}) hazard reports")

            print("[OK] Hazard risk integrated into OSM graph")
        else:
            print("[WARNING] No active hazards found in database")

    except Exception as e:
        print(f"[WARNING] Failed to load hazard data: {e}")
        import traceback
        traceback.print_exc()

    print(f"Graph ready: {len(road_graph.nodes)} nodes, {len(road_graph.edges)} edges")
 
@app.post("/agreement")
def get_agreement(input: ReportInput):
    score = compute_agreement_score(input.report, input.neighbors)
    return {"agreement_score": score}

@app.post("/trust")
def get_trust(reports: List[Report]):
    return {"trust_score": compute_trust(reports)}

@app.post("/route-osm")
def get_route_osm(input: RouteInput):
    """
    Generate safest route between two points with safety warnings
    """
    coords, metadata = safest_path_osm(
        road_graph,
        (input.start.lat, input.start.lng),
        (input.end.lat, input.end.lng),
        input.alpha,
    )

    # Generate safety warnings
    safety_analysis = generate_safety_warnings(metadata) if metadata else {
        "warnings": [],
        "stats": {"total_distance_km": 0, "sidewalk_coverage": 0, "has_critical_warnings": False}
    }

    return {
        "coordinates": coords,
        "metadata": metadata,
        "safety": safety_analysis
    }

@app.post("/route-distance")
def get_route_distance(input: RouteDistanceInput):
    """
    Generate a circular route of specified distance from a starting point
    Returns to the start with the safest path and safety warnings
    """
    coords, metadata = distance_based_route(
        road_graph,
        (input.start.lat, input.start.lng),
        input.target_distance_km,
        input.alpha,
    )

    # Generate safety warnings
    safety_analysis = generate_safety_warnings(metadata) if metadata else {
        "warnings": [],
        "stats": {"total_distance_km": 0, "sidewalk_coverage": 0, "has_critical_warnings": False}
    }

    return {
        "coordinates": coords,
        "metadata": metadata,
        "safety": safety_analysis
    }

@app.post("/sbert")
def get_computed_sbert(req: EmbedRequest):
    score = compute_sbert_similarity(req.text1, req.text2)
    return {"similarity_score"  : score}

@app.get("/")
def root():
    return {"message": "Algorithm microservice running!"}
@app.get("/debug-risks")
def debug_risks():
    risky_edges = [
        {"u": u, "v": v, "risk": d["risk"]}
        for u, v, d in road_graph.edges(data=True)
        if d.get("risk", 0) > 0
    ]
    return risky_edges[:20]  # return first 20 risky edges