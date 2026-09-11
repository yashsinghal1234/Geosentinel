from fastapi import APIRouter, Depends
from database import get_db
from routes.auth import get_current_user
from typing import Optional

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary():
    """
    Returns high-level mission-control summary metrics matching the Operator Dashboard:
    - Current Alert Level
    - Active Nodes count
    - Offline Nodes count
    - High-Risk Zones / Sectors distribution
    - Recent Alert Log records
    """
    db = get_db()
    nodes = await db.nodes.find().to_list(1000)
    
    total_nodes = len(nodes)
    active_count = 0
    offline_count = 0
    highest_alert_level = "Normal"
    max_risk = 0.0

    sector_risks = {1: [], 2: [], 3: [], 4: []}

    for n in nodes:
        status = str(n.get("status", "normal")).lower()
        node_status = str(n.get("node_status", "ONLINE")).upper()
        
        if node_status == "OFFLINE" or status == "offline":
            offline_count += 1
        else:
            active_count += 1

        r_score = float(n.get("risk_score", 0.0))
        if r_score > max_risk:
            max_risk = r_score

        sector = n.get("sector", 1)
        try:
            sec_num = int(sector)
            if sec_num not in sector_risks:
                sector_risks[sec_num] = []
            sector_risks[sec_num].append(r_score)
        except (ValueError, TypeError):
            pass

    if max_risk >= 80:
        highest_alert_level = "Critical"
    elif max_risk >= 60:
        highest_alert_level = "Warning"
    elif max_risk >= 40:
        highest_alert_level = "Advisory"
    elif max_risk >= 20:
        highest_alert_level = "Monitor"
    else:
        highest_alert_level = "Normal"

    # Zone bars computation
    zone_bars = []
    zone_names = {1: "Zone North (Sector 1)", 2: "Zone East (Sector 2)", 3: "Zone South (Sector 3)", 4: "Zone West (Sector 4)"}
    for s_id, scores in sector_risks.items():
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        zone_bars.append({
            "sector": s_id,
            "name": zone_names.get(s_id, f"Sector {s_id}"),
            "risk_score": avg_score
        })

    # Recent alerts
    recent_alerts = await db.alerts.find().sort("dispatched_at", -1).to_list(10)
    alert_records = []
    for a in recent_alerts:
        alert_records.append({
            "id": str(a.get("_id")),
            "node_id": a.get("node_id"),
            "level": a.get("alert_level"),
            "level_name": "Critical" if a.get("alert_level", 1) >= 5 else "Warning" if a.get("alert_level", 1) >= 4 else "Advisory",
            "message": a.get("message"),
            "dispatched_at": a.get("dispatched_at")
        })

    return {
        "current_alert_level": highest_alert_level,
        "highest_risk_score": max_risk,
        "active_nodes": active_count if active_count > 0 else total_nodes,
        "offline_nodes": offline_count,
        "total_nodes": total_nodes,
        "high_risk_zones": zone_bars,
        "alert_log": alert_records
    }

@router.get("/heatmap")
async def get_heatmap():
    """
    Returns spatial GIS & 2D Grid heatmap coordinates with rich telemetry for every node.
    """
    db = get_db()
    nodes = await db.nodes.find().to_list(1000)
    
    heatmap_data = []
    for node in nodes:
        latest_reading = await db.readings.find_one(
            {"node_id": str(node.get("_id", node.get("id")))},
            sort=[("timestamp", -1)]
        )
        
        r_dict = latest_reading or node.get("readings", {})
        risk_score = float(node.get("risk_score") or r_dict.get("risk_score", 0.0))
        
        heatmap_data.append({
            "node_id": str(node.get("_id", node.get("id"))),
            "name": node.get("name", f"Node {node.get('id')}"),
            "sector": node.get("sector", 1),
            "x": node.get("x", 0.0),
            "y": node.get("y", 0.0),
            "lat": node.get("latitude", 23.7485),
            "lng": node.get("longitude", 86.4195),
            "riskScore": risk_score,
            "riskLevel": node.get("risk_level", r_dict.get("risk_level", "NORMAL")),
            "anomalyScore": float(r_dict.get("anomaly_score", 0.0)),
            "tilt_x": float(r_dict.get("tilt_x", 0.0)),
            "tilt_y": float(r_dict.get("tilt_y", 0.0)),
            "acceleration": float(r_dict.get("acceleration", 9.8)),
            "vibration": float(r_dict.get("vibration", 0.0)),
            "soil_moist": float(r_dict.get("soil_moist", 20.0)),
            "temperature": float(r_dict.get("temperature", 20.0)),
            "humidity": float(r_dict.get("humidity", 60.0)),
            "pressure": float(r_dict.get("pressure", 1013.25)),
            "battery": float(r_dict.get("battery", 100.0)),
            "packet_loss": float(r_dict.get("packet_loss", 0.0)),
            "status": node.get("status", "normal"),
            "node_status": node.get("node_status", "ONLINE")
        })
        
    return heatmap_data

@router.get("/topology")
async def get_topology():
    """
    Returns node network topology for mission-control view.
    """
    db = get_db()
    nodes = await db.nodes.find().to_list(1000)
    
    topology_data = [
        {
            "id": str(node.get("_id", node.get("id"))),
            "name": node.get("name", f"Node {node.get('id')}"),
            "sector": node.get("sector", 1),
            "x": node.get("x", 0.0),
            "y": node.get("y", 0.0),
            "status": node.get("status", "normal"),
            "node_status": node.get("node_status", "ONLINE"),
            "risk_score": node.get("risk_score", 0.0),
            "risk_level": node.get("risk_level", "NORMAL"),
            "last_heartbeat": node.get("last_heartbeat")
        }
        for node in nodes
    ]
    return topology_data
