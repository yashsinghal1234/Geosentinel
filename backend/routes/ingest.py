from fastapi import APIRouter, Depends, Request, HTTPException, status, UploadFile, File
from typing import Union, List, Dict, Any
from database import get_db
from models.reading import ReadingCreate, BatchIngestPayload
from middleware.api_key_auth import verify_ingest_auth
from services.risk_engine import calculate_risk_score, determine_alert_level
from services.weather_service import get_weather_risk_boost
from services.alert_dispatcher import dispatch_alert
from services.websocket_manager import manager
from datetime import datetime
import csv
import io
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

def clean_float(val: Any, default: float = 0.0) -> float:
    if val is None or val == "" or str(val).strip() == "":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def clean_int(val: Any, default: int = 1) -> int:
    if val is None or val == "" or str(val).strip() == "":
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default

async def process_single_reading(db, item: Dict[str, Any], default_gateway: str = "GW-01") -> Dict[str, Any]:
    """
    Processes and persists a single telemetry record matching the geotechnical sensor dataset schema:
    [timestamp, node_id, sector, x, y, tilt_x, tilt_y, acceleration, vibration, temperature, 
     humidity, pressure, soil_moist, battery, packet_loss, anomaly_score, risk_score, risk_level, node_status]
    """
    # 1. Identification & Spatial Coordinates
    raw_node_id = item.get("node_id") or item.get("nodeId") or item.get("id") or "1"
    node_id = str(raw_node_id).strip()
    sector = clean_int(item.get("sector"), 1)
    x = clean_float(item.get("x"), 0.0)
    y = clean_float(item.get("y"), 0.0)
    gateway_id = str(item.get("gateway_id") or item.get("gatewayId") or default_gateway)

    # 2. Geotechnical & Motion Sensors
    tilt_x = clean_float(item.get("tilt_x") or item.get("tiltX"))
    tilt_y = clean_float(item.get("tilt_y") or item.get("tiltY"))
    acceleration = clean_float(item.get("acceleration") or item.get("accel"), 9.80665)
    vibration = clean_float(item.get("vibration") or item.get("vibrationMmS"), 0.0)

    # 3. Environmental & Soil Sensors
    temperature = clean_float(item.get("temperature") or item.get("temperatu") or item.get("tempC"), 20.0)
    humidity = clean_float(item.get("humidity"), 60.0)
    pressure = clean_float(item.get("pressure"), 1013.25)
    soil_moist = clean_float(item.get("soil_moist") or item.get("soil_moisture"), 20.0)

    # 4. Device Health, Network & Edge AI
    battery = clean_float(item.get("battery") or item.get("batteryPct"), 100.0)
    packet_loss = clean_float(item.get("packet_loss") or item.get("packet_loss_rate"), 0.0)
    anomaly_score = clean_float(item.get("anomaly_score") or item.get("anomaly_s"), 0.0)
    node_status = str(item.get("node_status") or "ONLINE").strip().upper()

    # 5. Timestamp parsing
    raw_ts = item.get("timestamp") or item.get("timeEpoch")
    if isinstance(raw_ts, (int, float)):
        ts = datetime.utcfromtimestamp(raw_ts / 1000.0 if raw_ts > 1e11 else raw_ts)
    elif isinstance(raw_ts, str) and raw_ts != "#######" and raw_ts.strip():
        try:
            ts = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
        except Exception:
            ts = datetime.utcnow()
    else:
        ts = datetime.utcnow()

    # Convert local x, y into realistic mine site lat/lng offset
    # Base mine coordinate Jharia / Dhanbad Sector: 23.7485° N, 86.4195° E
    base_lat = 23.7485 + (y * 0.00005)
    base_lng = 86.4195 + (x * 0.00005)

    # 6. Find or auto-provision node
    node = await db.nodes.find_one({"_id": node_id})
    if not node:
        node = await db.nodes.find_one({"id": node_id})

    if not node:
        logger.info(f"Auto-registering Node #{node_id} (Sector {sector}, X={x}, Y={y})")
        node_doc = {
            "_id": node_id,
            "id": node_id,
            "name": f"Node #{node_id} (Sector {sector})",
            "sector": sector,
            "x": x,
            "y": y,
            "latitude": base_lat,
            "longitude": base_lng,
            "sensor_types": "tilt_x,tilt_y,acceleration,vibration,soil_moist,temperature,humidity,pressure",
            "api_key": f"ak_{uuid.uuid4().hex[:12]}",
            "gateway_id": gateway_id,
            "status": "normal",
            "node_status": node_status,
            "last_heartbeat": ts,
            "readings": {
                "tilt_x": tilt_x,
                "tilt_y": tilt_y,
                "acceleration": acceleration,
                "vibration": vibration,
                "temperature": temperature,
                "humidity": humidity,
                "pressure": pressure,
                "soil_moist": soil_moist,
                "battery": battery,
                "packet_loss": packet_loss,
                "anomaly_score": anomaly_score,
                "risk_score": 0.0,
                "risk_level": "NORMAL",
                "node_status": node_status,
                "lastHeartbeat": int(ts.timestamp() * 1000)
            }
        }
        await db.nodes.insert_one(node_doc)
        node = node_doc

    # 7. AI Risk Engine computation
    weather_boost = await get_weather_risk_boost(node.get("latitude", base_lat), node.get("longitude", base_lng))
    
    reading_calc_dict = {
        "tilt_x": tilt_x,
        "tilt_y": tilt_y,
        "acceleration": acceleration,
        "vibration": vibration,
        "soil_moist": soil_moist,
        "temperature": temperature,
        "humidity": humidity,
        "pressure": pressure,
        "packet_loss": packet_loss,
        "anomaly_score": anomaly_score,
        "risk_score": item.get("risk_score"),
        "risk_level": item.get("risk_level")
    }

    final_risk_score, final_risk_level, alert_lvl = calculate_risk_score(reading_calc_dict, weather_boost)

    # 8. Prepare reading document for storage
    reading_doc = {
        "node_id": node_id,
        "sector": sector,
        "x": x,
        "y": y,
        "gateway_id": gateway_id,
        "tilt_x": tilt_x,
        "tilt_y": tilt_y,
        "acceleration": acceleration,
        "vibration": vibration,
        "temperature": temperature,
        "humidity": humidity,
        "pressure": pressure,
        "soil_moist": soil_moist,
        "battery": battery,
        "packet_loss": packet_loss,
        "anomaly_score": anomaly_score,
        "risk_score": final_risk_score,
        "risk_level": final_risk_level,
        "alert_level": alert_lvl,
        "node_status": node_status,
        "timestamp": ts
    }
    await db.readings.insert_one(reading_doc)

    # 9. Update node document
    node_ui_status = "normal"
    if alert_lvl >= 4 or node_status in ["DANGER", "CRITICAL"]:
        node_ui_status = "danger"
    elif alert_lvl >= 2 or node_status in ["WARNING", "DEGRADED"]:
        node_ui_status = "warning"

    await db.nodes.update_one(
        {"_id": node["_id"]},
        {
            "$set": {
                "sector": sector,
                "x": x,
                "y": y,
                "status": node_ui_status,
                "node_status": node_status,
                "risk_score": final_risk_score,
                "risk_level": final_risk_level,
                "last_heartbeat": ts,
                "readings": {
                    "tilt_x": tilt_x,
                    "tilt_y": tilt_y,
                    "acceleration": acceleration,
                    "vibration": vibration,
                    "temperature": temperature,
                    "humidity": humidity,
                    "pressure": pressure,
                    "soil_moist": soil_moist,
                    "battery": battery,
                    "packet_loss": packet_loss,
                    "anomaly_score": anomaly_score,
                    "risk_score": final_risk_score,
                    "risk_level": final_risk_level,
                    "node_status": node_status,
                    "lastHeartbeat": int(ts.timestamp() * 1000)
                }
            }
        }
    )

    # 10. Dispatch alerts if high risk
    alert_info = None
    if alert_lvl >= 3:
        alert_info = await dispatch_alert(node_id, alert_lvl, final_risk_score)
        await db.alerts.insert_one(alert_info)

    # 11. Broadcast live WebSocket message
    await manager.broadcast({
        "type": "reading_update",
        "node_id": node_id,
        "sector": sector,
        "x": x,
        "y": y,
        "gateway_id": gateway_id,
        "risk_score": final_risk_score,
        "risk_level": final_risk_level,
        "alert_level": alert_lvl,
        "status": node_ui_status,
        "node_status": node_status,
        "telemetry": {
            "tilt_x": tilt_x,
            "tilt_y": tilt_y,
            "acceleration": acceleration,
            "vibration": vibration,
            "temperature": temperature,
            "humidity": humidity,
            "pressure": pressure,
            "soil_moist": soil_moist,
            "battery": battery,
            "packet_loss": packet_loss,
            "anomaly_score": anomaly_score
        },
        "timestamp": ts.isoformat()
    })

    return {
        "node_id": node_id,
        "sector": sector,
        "risk_score": final_risk_score,
        "risk_level": final_risk_level,
        "alert_level": alert_lvl,
        "node_status": node_status,
        "alert_dispatched": alert_info is not None
    }


@router.post("")
@router.post("/")
@router.post("/telemetry")
async def ingest_reading(
    request: Request,
    auth_info: dict = Depends(verify_ingest_auth)
):
    """
    Main Gateway Ingestion Endpoint.
    Accepts:
      1. Single sensor reading JSON object
      2. JSON array of multiple sensor readings
      3. Wrapped Gateway batch payload { gateway_id: "GW-01", packets: [...] }
    """
    db = get_db()
    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON payload: {str(e)}"
        )

    results = []

    # Case A: Body is a list of packets
    if isinstance(body, list):
        for item in body:
            res = await process_single_reading(db, item)
            results.append(res)

    # Case B: Body is a gateway batch object containing 'packets' or 'readings'
    elif isinstance(body, dict) and ("packets" in body or "readings" in body):
        gw_id = body.get("gateway_id") or body.get("gatewayId") or "GW-01"
        packet_list = body.get("packets") or body.get("readings") or []
        for item in packet_list:
            res = await process_single_reading(db, item, default_gateway=gw_id)
            results.append(res)

    # Case C: Body is a single reading object
    elif isinstance(body, dict):
        res = await process_single_reading(db, body)
        results.append(res)

    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported payload format"
        )

    return {
        "status": "success",
        "processed_count": len(results),
        "results": results
    }


@router.post("/csv")
async def ingest_csv_data(
    file: UploadFile = File(...),
    auth_info: dict = Depends(verify_ingest_auth)
):
    """
    Direct CSV file ingestion endpoint.
    Upload a CSV containing the exact columns:
    [timestamp, node_id, sector, x, y, tilt_x, tilt_y, acceleration, vibration, temperature,
     humidity, pressure, soil_moist, battery, packet_loss, anomaly_score, risk_score, risk_level, node_status]
    """
    db = get_db()
    content = await file.read()
    decoded = content.decode('utf-8', errors='ignore')
    reader = csv.DictReader(io.StringIO(decoded))

    results = []
    for row in reader:
        # Strip keys and values
        clean_row = {k.strip(): v.strip() for k, v in row.items() if k}
        res = await process_single_reading(db, clean_row)
        results.append(res)

    return {
        "status": "success",
        "filename": file.filename,
        "rows_processed": len(results),
        "results": results
    }
