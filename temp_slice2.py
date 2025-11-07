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
    coords, metadata, distance_info = distance_based_route(
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
        "safety": safety_analysis,
        "distance_info": distance_info
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
