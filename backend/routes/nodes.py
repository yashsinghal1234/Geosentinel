from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from database import get_db
from models.node import Node, NodeCreate
from routes.auth import get_current_user
import uuid

router = APIRouter()

DEFAULT_NODES: List[Dict[str, Any]] = [
    {
        "id": "SN-01",
        "name": "Sector 4 Ridge Inclinometer",
        "code": "TILT-S4-01",
        "type": "tiltmeter",
        "zone": "Sector 4 (Village Slope)",
        "lat": 23.7482,
        "lng": 86.4195,
        "elevationMeters": 228,
        "meshHopCount": 1,
        "parentNodeId": "GW-01",
        "status": "online",
        "readings": {
            "tiltDeg": 1.42,
            "vibrationMmS": 0.8,
            "crackWidthMm": 2.1,
            "gasPpm": 12,
            "rainfallMmHr": 4.2,
            "batteryPct": 94,
            "rssiDbm": -72,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.5,
            "tiltCriticalDeg": 6.0,
            "vibrationWarningMmS": 5.0,
            "vibrationCriticalMmS": 12.0,
            "crackWarningMm": 8.0,
            "crackCriticalMm": 18.0,
            "gasWarningPpm": 50,
            "gasCriticalPpm": 120,
        },
    },
    {
        "id": "SN-02",
        "name": "North Overburden Geophone",
        "code": "GEO-S2-02",
        "type": "geophone",
        "zone": "Sector 2 (Riverbank Overburden)",
        "lat": 23.7530,
        "lng": 86.4230,
        "elevationMeters": 215,
        "meshHopCount": 2,
        "parentNodeId": "MR-01",
        "status": "online",
        "readings": {
            "tiltDeg": 0.9,
            "vibrationMmS": 1.6,
            "crackWidthMm": 1.8,
            "gasPpm": 18,
            "rainfallMmHr": 4.2,
            "batteryPct": 88,
            "rssiDbm": -84,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.5,
            "tiltCriticalDeg": 6.0,
            "vibrationWarningMmS": 4.5,
            "vibrationCriticalMmS": 10.0,
            "crackWarningMm": 8.0,
            "crackCriticalMm": 16.0,
            "gasWarningPpm": 40,
            "gasCriticalPpm": 100,
        },
    },
    {
        "id": "SN-03",
        "name": "Abandoned Gallery Extensometer",
        "code": "EXT-S3-03",
        "type": "extensometer",
        "zone": "Sector 3 (Abandoned Gallery)",
        "lat": 23.7450,
        "lng": 86.4150,
        "elevationMeters": 198,
        "meshHopCount": 2,
        "parentNodeId": "MR-02",
        "status": "warning",
        "readings": {
            "tiltDeg": 1.85,
            "vibrationMmS": 1.2,
            "crackWidthMm": 4.6,
            "gasPpm": 34,
            "rainfallMmHr": 4.2,
            "batteryPct": 91,
            "rssiDbm": -78,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.0,
            "tiltCriticalDeg": 5.5,
            "vibrationWarningMmS": 4.0,
            "vibrationCriticalMmS": 9.0,
            "crackWarningMm": 7.0,
            "crackCriticalMm": 15.0,
            "gasWarningPpm": 45,
            "gasCriticalPpm": 110,
        },
    },
    {
        "id": "SN-04",
        "name": "Pit Floor Multi-Gas Node",
        "code": "GAS-S3-04",
        "type": "gas_multi",
        "zone": "Sector 3 (Open Pit Floor)",
        "lat": 23.7435,
        "lng": 86.4175,
        "elevationMeters": 172,
        "meshHopCount": 1,
        "parentNodeId": "GW-01",
        "status": "warning",
        "readings": {
            "tiltDeg": 0.4,
            "vibrationMmS": 0.3,
            "crackWidthMm": 0.5,
            "gasPpm": 48,
            "rainfallMmHr": 4.2,
            "batteryPct": 79,
            "rssiDbm": -89,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.0,
            "tiltCriticalDeg": 5.0,
            "vibrationWarningMmS": 3.5,
            "vibrationCriticalMmS": 8.0,
            "crackWarningMm": 6.0,
            "crackCriticalMm": 14.0,
            "gasWarningPpm": 50,
            "gasCriticalPpm": 100,
        },
    },
    {
        "id": "SN-05",
        "name": "Village School Extensometer",
        "code": "EXT-S4-05",
        "type": "extensometer",
        "zone": "Sector 4 (Village Slope)",
        "lat": 23.7495,
        "lng": 86.4215,
        "elevationMeters": 232,
        "meshHopCount": 1,
        "parentNodeId": "GW-01",
        "status": "warning",
        "readings": {
            "tiltDeg": 1.1,
            "vibrationMmS": 0.5,
            "crackWidthMm": 3.4,
            "gasPpm": 8,
            "rainfallMmHr": 4.2,
            "batteryPct": 96,
            "rssiDbm": -68,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.2,
            "tiltCriticalDeg": 5.5,
            "vibrationWarningMmS": 4.0,
            "vibrationCriticalMmS": 10.0,
            "crackWarningMm": 7.5,
            "crackCriticalMm": 16.0,
            "gasWarningPpm": 35,
            "gasCriticalPpm": 90,
        },
    },
    {
        "id": "SN-06",
        "name": "Open Cast Crest Geophone",
        "code": "GEO-S1-06",
        "type": "geophone",
        "zone": "Sector 1 (Open Cast Pit)",
        "lat": 23.7565,
        "lng": 86.4110,
        "elevationMeters": 245,
        "meshHopCount": 2,
        "parentNodeId": "MR-01",
        "status": "online",
        "readings": {
            "tiltDeg": 0.8,
            "vibrationMmS": 2.1,
            "crackWidthMm": 1.5,
            "gasPpm": 14,
            "rainfallMmHr": 4.2,
            "batteryPct": 84,
            "rssiDbm": -82,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 4.0,
            "tiltCriticalDeg": 7.0,
            "vibrationWarningMmS": 6.0,
            "vibrationCriticalMmS": 15.0,
            "crackWarningMm": 9.0,
            "crackCriticalMm": 20.0,
            "gasWarningPpm": 60,
            "gasCriticalPpm": 150,
        },
    },
    {
        "id": "SN-07",
        "name": "Riverbed Embankment Tilt",
        "code": "TILT-S2-07",
        "type": "tiltmeter",
        "zone": "Sector 2 (Riverbank Overburden)",
        "lat": 23.7542,
        "lng": 86.4265,
        "elevationMeters": 202,
        "meshHopCount": 3,
        "parentNodeId": "SN-02",
        "status": "online",
        "readings": {
            "tiltDeg": 1.7,
            "vibrationMmS": 1.1,
            "crackWidthMm": 2.9,
            "gasPpm": 10,
            "rainfallMmHr": 4.2,
            "batteryPct": 82,
            "rssiDbm": -91,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.0,
            "tiltCriticalDeg": 5.0,
            "vibrationWarningMmS": 3.5,
            "vibrationCriticalMmS": 8.5,
            "crackWarningMm": 6.5,
            "crackCriticalMm": 14.0,
            "gasWarningPpm": 40,
            "gasCriticalPpm": 100,
        },
    },
    {
        "id": "SN-08",
        "name": "Sector 4 Optical Rain Gauge",
        "code": "RAIN-S4-08",
        "type": "weather",
        "zone": "Sector 4 (Village Slope)",
        "lat": 23.7470,
        "lng": 86.4225,
        "elevationMeters": 224,
        "meshHopCount": 1,
        "parentNodeId": "GW-01",
        "status": "online",
        "readings": {
            "tiltDeg": 0.1,
            "vibrationMmS": 0.2,
            "crackWidthMm": 0.2,
            "gasPpm": 5,
            "rainfallMmHr": 4.2,
            "batteryPct": 99,
            "rssiDbm": -62,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 2.0,
            "tiltCriticalDeg": 4.0,
            "vibrationWarningMmS": 3.0,
            "vibrationCriticalMmS": 7.0,
            "crackWarningMm": 5.0,
            "crackCriticalMm": 10.0,
            "gasWarningPpm": 30,
            "gasCriticalPpm": 80,
        },
    },
]

@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
async def get_nodes():
    db = get_db()
    nodes = []
    if db is not None:
        nodes = await db.nodes.find().to_list(1000)
        for n in nodes:
            if "_id" in n:
                n["_id"] = str(n["_id"])
                
    if not nodes:
        nodes = DEFAULT_NODES
        
    return nodes

@router.post("", response_model=Dict[str, Any])
@router.post("/", response_model=Dict[str, Any])
async def register_node(node_in: NodeCreate, current_user = Depends(get_current_user)):
    db = get_db()
    
    node_id = f"N{str(uuid.uuid4())[:8].upper()}"
    api_key = f"ak_{uuid.uuid4().hex}"
    
    node_dict = node_in.model_dump()
    node_dict["_id"] = node_id
    node_dict["id"] = node_id
    node_dict["api_key"] = api_key
    node_dict["status"] = "normal"
    
    if db is not None:
        await db.nodes.insert_one(node_dict)
        created_node = await db.nodes.find_one({"_id": node_id})
        if created_node and "_id" in created_node:
            created_node["_id"] = str(created_node["_id"])
        return created_node or node_dict
    return node_dict
