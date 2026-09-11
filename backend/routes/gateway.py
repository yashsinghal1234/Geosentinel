from fastapi import APIRouter, Depends, HTTPException, status, Request
from database import get_db
from models.gateway import GatewayTelemetry, GatewaySyncPayload
from middleware.api_key_auth import verify_ingest_auth
from routes.ingest import process_single_reading
from services.websocket_manager import manager
from datetime import datetime
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/sync")
@router.post("/sync/")
async def sync_gateway_store_and_forward(
    payload: GatewaySyncPayload,
    auth_info: dict = Depends(verify_ingest_auth)
):
    """
    Store-and-Forward synchronization endpoint.
    Called when an edge gateway reconnects to WAN / Cloud and flushes its local packet buffer.
    """
    db = get_db()
    gw_id = payload.gateway_id or "GW-01"
    processed = []

    for pkt in payload.packets:
        res = await process_single_reading(db, pkt, default_gateway=gw_id)
        processed.append(res)

    # If gateway attached its own telemetry during sync, update it
    if payload.gateway_telemetry:
        tel_dict = payload.gateway_telemetry.model_dump()
        tel_dict["last_sync_time"] = datetime.utcnow()
        await db.gateway_telemetry.update_one(
            {"gateway_id": gw_id},
            {"$set": tel_dict},
            upsert=True
        )

    # Broadcast gateway sync event
    await manager.broadcast({
        "type": "gateway_sync_complete",
        "gateway_id": gw_id,
        "synced_packets_count": len(processed),
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "status": "synced",
        "gateway_id": gw_id,
        "packets_processed": len(processed),
        "results": processed
    }


@router.post("/telemetry")
@router.post("/telemetry/")
async def update_gateway_telemetry(
    telemetry: GatewayTelemetry,
    auth_info: dict = Depends(verify_ingest_auth)
):
    """
    Updates the hardware health & status metrics of the Edge Gateway appliance.
    (Battery %, Solar charging watts, GSM signal bars, CPU temp, RAM usage, local siren state).
    """
    db = get_db()
    gw_dict = telemetry.model_dump()
    gw_dict["last_heartbeat"] = datetime.utcnow()

    await db.gateway_telemetry.update_one(
        {"gateway_id": telemetry.gateway_id},
        {"$set": gw_dict},
        upsert=True
    )

    # Broadcast gateway telemetry update
    await manager.broadcast({
        "type": "gateway_telemetry_update",
        "gateway": gw_dict,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {"status": "ok", "gateway_id": telemetry.gateway_id}


@router.get("/status")
@router.get("/status/")
async def get_gateway_status():
    """
    Returns the latest status of all active edge gateways.
    """
    db = get_db()
    gateways = await db.gateway_telemetry.find().to_list(50)
    
    if not gateways:
        # Return sensible default if none yet registered
        return [{
            "gateway_id": "GW-01",
            "mac": "E4:5F:01:9A:82:1C",
            "battery_pct": 92.0,
            "solar_watts": 4.8,
            "gsm_bars": 4,
            "cpu_temp_c": 42.0,
            "ram_usage_pct": 35.0,
            "internet_connected": True,
            "wifi_hotspot_ssid": "GeoSentinel-RescueNet-AP",
            "local_siren_active": False,
            "buffer_count": 0,
            "status": "online"
        }]

    # Clean Mongo IDs
    for gw in gateways:
        if "_id" in gw:
            gw["_id"] = str(gw["_id"])

    return gateways
