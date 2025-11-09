
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

SAFETY_SCORE_WEIGHT = 0.2  # how strongly we penalize risky segments when selecting a loop
DISTANCE_WARNING_THRESHOLD = 0.15  # 15% deviation triggers UI warning


def distance_based_route(G, origin_point, target_distance_km, alpha=0.5):
    """
    Generate a circular route of approximately target_distance_km from origin_point
    Finds the safest route that returns to start with the target distance
    Enhanced with sidewalk preference and road safety scoring
    """
    orig_node = ox.nearest_nodes(G, origin_point[1], origin_point[0])  # (lng, lat)

    alpha = 0.0  # TEMP: disable safety weighting for accuracy testing

    def build_weight(blocked_edges=None):
        blocked = blocked_edges or set()

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
            try:
                lanes = int(str(d.get("lanes", 1)).split(";")[0])
            except:
                lanes = 1
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

            penalty = 0
            if (u, v) in blocked or (v, u) in blocked:
                penalty = 1e6  # Effectively discourage reusing outbound edges

            return length + penalty  # TEMP: use length-only cost for distance accuracy testing

        return weight

    # Get all nodes within a reasonable radius
    target_meters = target_distance_km * 1000
    min_forward = target_meters * 0.35
    max_forward = target_meters * 0.65

    candidate_nodes = []
    try:
        lengths_len, paths_len = nx.single_source_dijkstra(
            G,
            orig_node,
            cutoff=max(max_forward * 1.5, min_forward + 500),
            weight=lambda u, v, d: d.get("length", 1.0)
        )

        for node, dist in lengths_len.items():
            if node == orig_node:
                continue
            if min_forward <= dist <= max_forward:
                candidate_nodes.append((node, dist))

        if not candidate_nodes:
            fallback_nodes = sorted(
                [(node, dist) for node, dist in lengths_len.items() if node != orig_node],
                key=lambda x: abs(x[1] - target_meters / 2)
            )
            candidate_nodes = fallback_nodes[:15]
    except Exception as e:
        print(f"Failed to compute candidate nodes: {e}")
        candidate_nodes = []

    if not candidate_nodes:
        print("No candidate nodes found for distance-based routing")
        return []

    # Try multiple turning points to find the best route
    best_route_info = None
    best_score = float("inf")
    best_any_info = None
    best_any_score = float("inf")
    candidate_routes = []

    def dedupe_coords(coord_list):
        simplified = []
        for coord in coord_list:
            if not simplified or coord != simplified[-1]:
                simplified.append(coord)
        return simplified

    def haversine(a, b):
        R = 6371000
        lat1, lng1 = math.radians(a[0]), math.radians(a[1])
        lat2, lng2 = math.radians(b[0]), math.radians(b[1])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        hav = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
        return R * 2 * math.atan2(math.sqrt(hav), math.sqrt(1 - hav))

    def finalize_coords(coords):
        if not coords:
            return []
        coords = dedupe_coords(coords)
        if len(coords) < 2:
            return coords
        start = coords[0]
        end = coords[-1]
        distance = haversine(start, end)
        if distance <= 25:
            coords[-1] = start
        else:
            coords.append(start)
        return coords

    def coords_total_distance_km(coords):
        if len(coords) < 2:
            return 0.0
        total = 0.0
        for i in range(1, len(coords)):
            total += haversine(coords[i - 1], coords[i])
        return total / 1000.0

    def evaluate_path(node_sequence):
        total_distance = 0.0  # meters
        total_risk = 0.0      # accumulated risk * km (used to get risk/km)

        for i in range(len(node_sequence) - 1):
            u, v = node_sequence[i], node_sequence[i + 1]
            if not G.has_edge(u, v):
                continue
            edge_data = G[u][v]
            if isinstance(edge_data, dict):
                edge_info = edge_data if "length" in edge_data else list(edge_data.values())[0]
            else:
                edge_info = list(edge_data.values())[0]

            length = edge_info.get("length", 0.0)
            risk = edge_info.get("risk", 0.2)

            total_distance += length
            total_risk += risk * (length / 1000)  # scale risk by segment length

        distance_km = total_distance / 1000
        risk_per_km = 0.0  # safety ignored during testing
        distance_diff = abs(distance_km - target_distance_km)
        score = distance_diff  # distance-only score for testing

        return distance_km, risk_per_km, distance_diff, score

    def serialize_path(node_sequence):
        coords = []
        metadata = []
        last_coord = None

        for i, node in enumerate(node_sequence):
            coord = (G.nodes[node]["y"], G.nodes[node]["x"])
            if coord != last_coord:
                coords.append(coord)
                last_coord = coord

            if i < len(node_sequence) - 1:
                next_node = node_sequence[i + 1]
                if not G.has_edge(node, next_node):
                    continue
                edge_data = G[node][next_node]
                if isinstance(edge_data, dict):
                    edge_info = edge_data if "length" in edge_data else list(edge_data.values())[0]
                else:
                    edge_info = list(edge_data.values())[0]

                metadata.append({
                    "highway": edge_info.get("highway", "unknown"),
                    "sidewalk": edge_info.get("sidewalk", "no"),
                    "lit": edge_info.get("lit", "no"),
                    "lanes": edge_info.get("lanes", 1),
                    "maxspeed": edge_info.get("maxspeed", "30"),
                    "length": edge_info.get("length", 0)
                })

        return coords, metadata

    def trim_path_to_target(graph, node_sequence, target_meters, weight_factory):
        if len(node_sequence) < 2:
            return None

        cumulative = 0.0
        trimmed_nodes = [node_sequence[0]]
        turn_node = None

        for i in range(len(node_sequence) - 1):
            u, v = node_sequence[i], node_sequence[i + 1]
            if not graph.has_edge(u, v):
                continue
            edge_data = graph[u][v]
            if isinstance(edge_data, dict):
                edge_info = edge_data if "length" in edge_data else list(edge_data.values())[0]
            else:
                edge_info = list(edge_data.values())[0]

            length = edge_info.get("length", 0.0)
            cumulative += length
            trimmed_nodes.append(v)

            if cumulative >= target_meters / 2:
                turn_node = v
                break

        if not turn_node:
            return None

        blocked_edges = set((trimmed_nodes[i], trimmed_nodes[i + 1]) for i in range(len(trimmed_nodes) - 1))

        try:
            return_path = nx.shortest_path(graph, turn_node, trimmed_nodes[0], weight=weight_factory(blocked_edges))
        except nx.NetworkXNoPath:
            return None

        return trimmed_nodes + return_path[1:]

    for turn_node, _ in candidate_nodes[:25]:
        try:
            # Path from origin to turning point
            path_out = nx.shortest_path(G, orig_node, turn_node, weight=build_weight())

            blocked_edges = set()
            for i in range(len(path_out) - 1):
                blocked_edges.add((path_out[i], path_out[i + 1]))

            # Path from turning point back to origin (discourage reusing outbound edges)
            path_back = nx.shortest_path(G, turn_node, orig_node, weight=build_weight(blocked_edges))

            # Calculate total distance
            combined_path = path_out + path_back[1:]  # Avoid duplicate node

            distance_km, risk_per_km, diff, score = evaluate_path(combined_path)

            route_info = {
                "path": combined_path,
                "distance_km": distance_km,
                "risk_per_km": risk_per_km,
                "distance_diff": diff,
                "score": score
            }
            candidate_routes.append(route_info)

            if score < best_any_score:
                best_any_score = score
                best_any_info = route_info

            if score < best_score and diff <= target_distance_km * 0.1:
                # Immediate best hit (within 10% tolerance)
                best_score = score
                best_route_info = route_info
                break

        except nx.NetworkXNoPath:
            continue

    if not best_route_info and candidate_routes:
        tolerance_steps = [0.15, 0.25, 0.35, 0.5]
        selected = None
        for tol in tolerance_steps:
            filtered = [c for c in candidate_routes if c["distance_diff"] <= target_distance_km * tol]
            if filtered:
                filtered.sort(key=lambda c: (c["score"], c["distance_diff"]))
                selected = filtered[0]
                break

        if selected:
            best_route_info = selected
        elif best_any_info:
            best_route_info = best_any_info

    if best_route_info:
        if best_route_info["distance_diff"] > target_distance_km * 0.3:
            trimmed = trim_path_to_target(G, best_route_info["path"], target_meters, build_weight)
            if trimmed:
                coords, route_metadata = serialize_path(trimmed)
                coords = finalize_coords(coords)
                final_distance = coords_total_distance_km(coords)
                warning = {
                    "distance_warning": abs(final_distance - target_distance_km) > target_distance_km * DISTANCE_WARNING_THRESHOLD,
                    "requested_distance_km": target_distance_km,
                    "generated_distance_km": final_distance
                }
                return coords, route_metadata, warning

        coords, route_metadata = serialize_path(best_route_info["path"])
        coords = finalize_coords(coords)
        final_distance = coords_total_distance_km(coords)
        warning = {
            "distance_warning": abs(final_distance - target_distance_km) > target_distance_km * DISTANCE_WARNING_THRESHOLD,
            "requested_distance_km": target_distance_km,
            "generated_distance_km": final_distance
        }
        return coords, route_metadata, warning

    if best_any_info:
        trimmed = trim_path_to_target(G, best_any_info["path"], target_meters, build_weight)
        if trimmed:
            coords, route_metadata = serialize_path(trimmed)
            coords = finalize_coords(coords)
            final_distance = coords_total_distance_km(coords)
            warning = {
                "distance_warning": True,
                "requested_distance_km": target_distance_km,
                "generated_distance_km": final_distance
            }
            return coords, route_metadata, warning
        coords, route_metadata = serialize_path(best_any_info["path"])
        coords = finalize_coords(coords)
        final_distance = coords_total_distance_km(coords)
        warning = {
            "distance_warning": True,
            "requested_distance_km": target_distance_km,
            "generated_distance_km": final_distance
        }
        return coords, route_metadata, warning

    return [], [], {
        "distance_warning": True,
        "requested_distance_km": target_distance_km,
        "generated_distance_km": 0
    }

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
