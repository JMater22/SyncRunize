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
app = FastAPI()
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

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

### === Modified Dijkstra === ###
def safest_path_osm(G, origin_point, destination_point, alpha=0.5):
    """
    origin_point, destination_point = (lat, lng)
    """
    # Find nearest OSM nodes
    orig_node = ox.nearest_nodes(G, origin_point[1], origin_point[0])  # (lng, lat)
    dest_node = ox.nearest_nodes(G, destination_point[1], destination_point[0])

    # Custom weight: combine length and risk
    def weight(u, v, d):
        length = d.get("length", 1.0) # physical road distance (meters)
        risk = d.get("risk", 0.2)  # TODO: link with reports/trust - safety risk score (0 = safe, higher = risky)
        return (1 - alpha) * length + alpha * risk

    # Run shortest path
    try:
        path = nx.shortest_path(G, orig_node, dest_node, weight=weight)
        coords = [(G.nodes[n]["y"], G.nodes[n]["x"]) for n in path]
        return coords
    except nx.NetworkXNoPath:
        return []

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

            # 🔥 Add risk instead of overwrite
            road_graph[u][v][k]["risk"] += risk_value

            if i % 100 == 0 or i == len(grouped) - 1:
                print(f"Processed {i+1}/{len(grouped)} ({(i+1)/len(grouped):.1%}) crime records")

        print("✅ Crime risk integrated into OSM graph")

    except Exception as e:
        print(f"⚠️ Failed to load crime data: {e}")

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
    coords = safest_path_osm(
        road_graph,
        (input.start.lat, input.start.lng),
        (input.end.lat, input.end.lng),
        input.alpha,
    )
    return {"coordinates": coords}

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