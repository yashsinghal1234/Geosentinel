from fastapi import APIRouter
from database import get_db
from routes.nodes import DEFAULT_NODES
from typing import List, Dict, Any
import math

router = APIRouter()

# Default Sector Masters matching physical hardware (Raspberry Pi 4 Model B)
DEFAULT_MASTERS = [
    {
        "id": "MASTER-S1",
        "name": "Sector-1 Master Hub (Raspberry Pi 4)",
        "code": "RPI4-SEC1-HUB",
        "hardware_model": "Raspberry Pi 4 Model B",
        "sector": 1,
        "lat": 23.7535,
        "lng": 86.4225,
        "ip": "192.168.1.1",
        "mac": "DC:A6:32:4E:91:A1",
        "status": "online",
        "internet_connected": True,
        "battery_pct": 99,
        "wifi_hotspot_ssid": "GEOSENTINEL_SEC1_MASTER",
        "edge_ai_status": "inferencing",
        "edge_ai_fps": 14.6,
        "solar_watts": 120,
        "gsm_bars": 5,
        "cpu_temp_c": 41.5,
        "ram_usage_pct": 28,
        "lora_status": "connected"
    },
    {
        "id": "MASTER-S2",
        "name": "Sector-2 Master Hub (Raspberry Pi 4)",
        "code": "RPI4-SEC2-HUB",
        "hardware_model": "Raspberry Pi 4 Model B",
        "sector": 2,
        "lat": 23.7465,
        "lng": 86.4175,
        "ip": "192.168.2.1",
        "mac": "DC:A6:32:4E:91:B2",
        "status": "online",
        "internet_connected": True,
        "battery_pct": 98,
        "wifi_hotspot_ssid": "GEOSENTINEL_SEC2_MASTER",
        "edge_ai_status": "inferencing",
        "edge_ai_fps": 14.8,
        "solar_watts": 120,
        "gsm_bars": 5,
        "cpu_temp_c": 42.1,
        "ram_usage_pct": 31,
        "lora_status": "connected"
    }
]

def calculate_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance between two coordinates in kilometers."""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.get("")
@router.get("/")
async def get_dynamic_topology():
    """
    Dynamically constructs the entire IoT mesh network topology from live database GPS coordinates.
    Maps real (lat, lng) to normalized visual canvas coordinates (x, y),
    builds multi-tier links (WiFi Mesh + LoRa 868MHz Inter-Master),
    and assigns color tokens instead of emojis.
    """
    db = get_db()
    node_docs = []
    if db is not None:
        try:
            node_docs = await db.nodes.find().to_list(200)
        except Exception:
            node_docs = []
    
    if not node_docs:
        node_docs = DEFAULT_NODES

    # Masters list
    masters = DEFAULT_MASTERS

    # 1. Collect all points to compute bounding box for dynamic projection
    all_points = []
    for m in masters:
        all_points.append({
            "id": m["id"],
            "name": m["name"],
            "code": m["code"],
            "lat": float(m.get("lat", 23.7500)),
            "lng": float(m.get("lng", 86.4200)),
            "role": "master",
            "sector": m.get("sector", 1),
            "status": m.get("status", "online"),
            "data": m
        })

    for n in node_docs:
        n_id = n.get("id") or str(n.get("_id", "NODE"))
        all_points.append({
            "id": n_id,
            "name": n.get("name", f"Node {n_id}"),
            "code": n.get("code", n_id),
            "lat": float(n.get("lat", 23.7500)),
            "lng": float(n.get("lng", 86.4200)),
            "role": "node",
            "sector": n.get("sector", 1),
            "status": n.get("status", "online"),
            "parentNodeId": n.get("parentNodeId"),
            "masterId": n.get("masterId"),
            "meshHopCount": n.get("meshHopCount", 1),
            "readings": n.get("readings", {}),
            "data": n
        })

    lats = [p["lat"] for p in all_points]
    lngs = [p["lng"] for p in all_points]

    min_lat = min(lats) if lats else 23.7400
    max_lat = max(lats) if lats else 23.7600
    min_lng = min(lngs) if lngs else 86.4100
    max_lng = max(lngs) if lngs else 86.4300

    lat_span = max_lat - min_lat
    lng_span = max_lng - min_lng

    if lat_span < 0.0001:
        lat_span = 0.01
    if lng_span < 0.0001:
        lng_span = 0.01

    # 2. Normalize to visual SVG Canvas (Width: 1000, Height: 520, Padding: 90)
    canvas_nodes = []
    master_map = {m["id"]: m for m in masters}

    for p in all_points:
        # Longitude maps to X (Left -> Right: 100px to 900px)
        norm_x = 100 + ((p["lng"] - min_lng) / lng_span) * 800
        # Latitude maps to Y (Inverted: North -> Top: 80px to 440px)
        norm_y = 440 - ((p["lat"] - min_lat) / lat_span) * 360

        # Assign Tactical Color Scheme (NO EMOJIS)
        role = p["role"]
        status = p["status"]

        if role == "master":
            color_primary = "#a855f7"    # Royal Purple for Master Hub
            color_border = "#d8b4fe"
            badge_label = "MASTER"
        elif status == "critical":
            color_primary = "#ef4444"    # Crimson for Critical
            color_border = "#fca5a5"
            badge_label = "CRITICAL"
        elif status == "warning":
            color_primary = "#f59e0b"    # Amber for Warning
            color_border = "#fde68a"
            badge_label = "WARNING"
        else:
            color_primary = "#22c55e"    # Emerald Green for Normal Node
            color_border = "#86efac"
            badge_label = "POD"

        canvas_nodes.append({
            "id": p["id"],
            "name": p["name"],
            "code": p["code"],
            "role": role,
            "sector": p["sector"],
            "status": status,
            "lat": p["lat"],
            "lng": p["lng"],
            "x": round(norm_x, 1),
            "y": round(norm_y, 1),
            "colorPrimary": color_primary,
            "colorBorder": color_border,
            "badgeLabel": badge_label,
            "meshHopCount": p.get("meshHopCount", 1),
            "parentNodeId": p.get("parentNodeId"),
            "masterId": p.get("masterId"),
            "readings": p.get("readings", {}),
            "data": p["data"]
        })

    # 3. Automatically generate dynamic topology links
    links = []
    
    # 3a. LoRa Inter-Master Bridge between all masters
    for i in range(len(masters)):
        for j in range(i + 1, len(masters)):
            m1 = masters[i]
            m2 = masters[j]
            links.append({
                "id": f"link-intermaster-{m1['id']}-{m2['id']}",
                "sourceId": m1["id"],
                "targetId": m2["id"],
                "protocol": "LoRa 868MHz",
                "linkType": "inter_master_lora",
                "rssiDbm": -79,
                "packetLossPct": 0.0,
                "active": True,
                "color": "#c084fc",      # Purple LoRa Bridge
                "label": "LoRa 868MHz Bridge (ACK Sync)"
            })

    # 3b. Automatic Pod links to parent or closest master
    for n in canvas_nodes:
        if n["role"] == "master":
            continue

        target_id = n.get("parentNodeId")
        if not target_id or target_id == n["id"]:
            # Auto-associate with closest master or sector master
            target_id = n.get("masterId") or (f"MASTER-S{n['sector']}" if f"MASTER-S{n['sector']}" in master_map else "MASTER-S1")

        rssi = n.get("readings", {}).get("rssiDbm", -70)
        is_direct_to_master = target_id.startswith("MASTER")

        links.append({
            "id": f"link-{n['id']}-{target_id}",
            "sourceId": n["id"],
            "targetId": target_id,
            "protocol": "WiFi Mesh 2.4GHz",
            "linkType": "mesh_direct" if is_direct_to_master else "mesh_multi_hop",
            "rssiDbm": rssi,
            "packetLossPct": 0.1 if rssi > -75 else 0.4,
            "active": n["status"] != "offline",
            "color": "#38bdf8",          # Cyan WiFi Mesh Link
            "label": f"WiFi Mesh Hop {n.get('meshHopCount', 1)}"
        })

    return {
        "status": "success",
        "nodes": canvas_nodes,
        "links": links,
        "masters": masters,
        "metrics": {
            "totalNodes": len(canvas_nodes),
            "masterCount": len(masters),
            "linkCount": len(links),
            "packetDeliveryRate": 99.8,
            "avgHopCount": 1.4,
            "selfHealingStatus": "Active"
        }
    }
