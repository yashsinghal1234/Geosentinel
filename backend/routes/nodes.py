from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from database import get_db
from models.node import Node, NodeCreate
from routes.auth import get_current_user
import uuid

router = APIRouter()

DEFAULT_NODES: List[Dict[str, Any]] = [
    {
        "id": "NODE-A",
        "name": "Node A (Sector 1 High Ridge)",
        "code": "ESP32-S3-S1-A",
        "type": "multi_sensor_node",
        "hardwareModel": "ESP32-S3 (BNO085 + BME280 + Soil Moisture)",
        "zone": "Sector 1 (North Overburden Slope)",
        "sector": 1,
        "lat": 23.7530,
        "lng": 86.4215,
        "elevationMeters": 235,
        "meshHopCount": 1,
        "parentNodeId": "MASTER-S1",
        "masterId": "MASTER-S1",
        "status": "online",
        "readings": {
            "tiltDeg": 1.42,
            "rollDeg": 1.15,
            "pitchDeg": 1.42,
            "yawDeg": 14.5,
            "vibrationMmS": 0.8,
            "accelG": 0.998,
            "tempC": 27.4,
            "humidityPct": 62.0,
            "pressureHpa": 1011.2,
            "soilMoisturePct": 68.0,
            "crackWidthMm": 2.1,
            "gasPpm": 12,
            "rainfallMmHr": 4.2,
            "batteryPct": 96,
            "rssiDbm": -68,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.5,
            "tiltCriticalDeg": 6.0,
            "vibrationWarningMmS": 5.0,
            "vibrationCriticalMmS": 12.0,
            "soilMoistureWarningPct": 75.0,
            "soilMoistureCriticalPct": 85.0,
            "crackWarningMm": 8.0,
            "crackCriticalMm": 18.0,
            "gasWarningPpm": 50,
            "gasCriticalPpm": 120,
        },
    },
    {
        "id": "NODE-B",
        "name": "Node B (Sector 1 Bench Creep)",
        "code": "ESP32-S3-S1-B",
        "type": "multi_sensor_node",
        "hardwareModel": "ESP32-S3 (BNO085 + BME280 + Soil Moisture)",
        "zone": "Sector 1 (North Overburden Slope)",
        "sector": 1,
        "lat": 23.7505,
        "lng": 86.4240,
        "elevationMeters": 224,
        "meshHopCount": 1,
        "parentNodeId": "MASTER-S1",
        "masterId": "MASTER-S1",
        "status": "warning",
        "readings": {
            "tiltDeg": 3.82,
            "rollDeg": 2.90,
            "pitchDeg": 3.82,
            "yawDeg": 22.0,
            "vibrationMmS": 2.4,
            "accelG": 1.042,
            "tempC": 28.1,
            "humidityPct": 71.0,
            "pressureHpa": 1009.5,
            "soilMoisturePct": 78.5,
            "crackWidthMm": 4.8,
            "gasPpm": 18,
            "rainfallMmHr": 4.2,
            "batteryPct": 91,
            "rssiDbm": -74,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.5,
            "tiltCriticalDeg": 6.0,
            "vibrationWarningMmS": 4.5,
            "vibrationCriticalMmS": 10.0,
            "soilMoistureWarningPct": 75.0,
            "soilMoistureCriticalPct": 85.0,
            "crackWarningMm": 8.0,
            "crackCriticalMm": 16.0,
            "gasWarningPpm": 40,
            "gasCriticalPpm": 100,
        },
    },
    {
        "id": "NODE-C",
        "name": "Node C (Sector 1 Perimeter)",
        "code": "ESP32-S3-S1-C",
        "type": "multi_sensor_node",
        "hardwareModel": "ESP32-S3 (BNO085 + BME280 + Soil Moisture)",
        "zone": "Sector 1 (North Overburden Slope)",
        "sector": 1,
        "lat": 23.7555,
        "lng": 86.4180,
        "elevationMeters": 240,
        "meshHopCount": 2,
        "parentNodeId": "NODE-A",
        "masterId": "MASTER-S1",
        "status": "online",
        "readings": {
            "tiltDeg": 0.85,
            "rollDeg": 0.60,
            "pitchDeg": 0.85,
            "yawDeg": 8.2,
            "vibrationMmS": 0.4,
            "accelG": 0.999,
            "tempC": 26.5,
            "humidityPct": 56.0,
            "pressureHpa": 1012.4,
            "soilMoisturePct": 42.0,
            "crackWidthMm": 0.5,
            "gasPpm": 8,
            "rainfallMmHr": 4.2,
            "batteryPct": 98,
            "rssiDbm": -82,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.5,
            "tiltCriticalDeg": 6.0,
            "vibrationWarningMmS": 5.0,
            "vibrationCriticalMmS": 12.0,
            "soilMoistureWarningPct": 75.0,
            "soilMoistureCriticalPct": 85.0,
            "crackWarningMm": 8.0,
            "crackCriticalMm": 18.0,
            "gasWarningPpm": 50,
            "gasCriticalPpm": 120,
        },
    },
    {
        "id": "NODE-X",
        "name": "Node X (Sector 2 Village Buffer)",
        "code": "ESP32-S3-S2-X",
        "type": "multi_sensor_node",
        "hardwareModel": "ESP32-S3 (BNO085 + BME280 + Soil Moisture)",
        "zone": "Sector 2 (East Highwall & Village Buffer)",
        "sector": 2,
        "lat": 23.7482,
        "lng": 86.4195,
        "elevationMeters": 228,
        "meshHopCount": 1,
        "parentNodeId": "MASTER-S2",
        "masterId": "MASTER-S2",
        "status": "critical",
        "readings": {
            "tiltDeg": 6.45,
            "rollDeg": 5.10,
            "pitchDeg": 6.45,
            "yawDeg": 38.4,
            "vibrationMmS": 5.8,
            "accelG": 1.185,
            "tempC": 29.5,
            "humidityPct": 84.0,
            "pressureHpa": 1004.2,
            "soilMoisturePct": 86.2,
            "crackWidthMm": 9.4,
            "gasPpm": 32,
            "rainfallMmHr": 4.2,
            "batteryPct": 88,
            "rssiDbm": -65,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.5,
            "tiltCriticalDeg": 6.0,
            "vibrationWarningMmS": 5.0,
            "vibrationCriticalMmS": 12.0,
            "soilMoistureWarningPct": 75.0,
            "soilMoistureCriticalPct": 85.0,
            "crackWarningMm": 8.0,
            "crackCriticalMm": 18.0,
            "gasWarningPpm": 50,
            "gasCriticalPpm": 120,
        },
    },
    {
        "id": "NODE-Y",
        "name": "Node Y (Sector 2 Highwall Edge)",
        "code": "ESP32-S3-S2-Y",
        "type": "multi_sensor_node",
        "hardwareModel": "ESP32-S3 (BNO085 + BME280 + Soil Moisture)",
        "zone": "Sector 2 (East Highwall & Village Buffer)",
        "sector": 2,
        "lat": 23.7455,
        "lng": 86.4160,
        "elevationMeters": 204,
        "meshHopCount": 1,
        "parentNodeId": "MASTER-S2",
        "masterId": "MASTER-S2",
        "status": "warning",
        "readings": {
            "tiltDeg": 4.15,
            "rollDeg": 3.40,
            "pitchDeg": 4.15,
            "yawDeg": 26.0,
            "vibrationMmS": 3.1,
            "accelG": 1.080,
            "tempC": 28.8,
            "humidityPct": 76.0,
            "pressureHpa": 1007.0,
            "soilMoisturePct": 79.8,
            "crackWidthMm": 6.2,
            "gasPpm": 26,
            "rainfallMmHr": 4.2,
            "batteryPct": 92,
            "rssiDbm": -72,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.0,
            "tiltCriticalDeg": 5.5,
            "vibrationWarningMmS": 4.0,
            "vibrationCriticalMmS": 9.0,
            "soilMoistureWarningPct": 75.0,
            "soilMoistureCriticalPct": 85.0,
            "crackWarningMm": 7.0,
            "crackCriticalMm": 15.0,
            "gasWarningPpm": 45,
            "gasCriticalPpm": 110,
        },
    },
    {
        "id": "NODE-Z",
        "name": "Node Z (Sector 2 Haul Route)",
        "code": "ESP32-S3-S2-Z",
        "type": "multi_sensor_node",
        "hardwareModel": "ESP32-S3 (BNO085 + BME280 + Soil Moisture)",
        "zone": "Sector 2 (East Highwall & Village Buffer)",
        "sector": 2,
        "lat": 23.7435,
        "lng": 86.4210,
        "elevationMeters": 218,
        "meshHopCount": 2,
        "parentNodeId": "NODE-Y",
        "masterId": "MASTER-S2",
        "status": "online",
        "readings": {
            "tiltDeg": 1.10,
            "rollDeg": 0.90,
            "pitchDeg": 1.10,
            "yawDeg": 12.0,
            "vibrationMmS": 1.2,
            "accelG": 1.005,
            "tempC": 27.2,
            "humidityPct": 60.0,
            "pressureHpa": 1011.0,
            "soilMoisturePct": 49.0,
            "crackWidthMm": 1.2,
            "gasPpm": 10,
            "rainfallMmHr": 4.2,
            "batteryPct": 97,
            "rssiDbm": -85,
            "lastHeartbeat": 1741600000000,
        },
        "thresholds": {
            "tiltWarningDeg": 3.0,
            "tiltCriticalDeg": 5.0,
            "vibrationWarningMmS": 3.5,
            "vibrationCriticalMmS": 8.0,
            "soilMoistureWarningPct": 75.0,
            "soilMoistureCriticalPct": 85.0,
            "crackWarningMm": 6.0,
            "crackCriticalMm": 14.0,
            "gasWarningPpm": 50,
            "gasCriticalPpm": 100,
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
