from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import get_db
from models.alert import Alert
from routes.auth import get_current_user
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=List[Alert])
async def get_alerts(current_user = Depends(get_current_user)):
    db = get_db()
    alerts = await db.alerts.find().sort("dispatched_at", -1).to_list(1000)
    # Convert ObjectIds to strings if necessary
    for alert in alerts:
        if "_id" in alert and isinstance(alert["_id"], ObjectId):
            alert["_id"] = str(alert["_id"])
    return alerts

@router.post("/{alert_id}/cancel")
async def cancel_alert(alert_id: str, current_user = Depends(get_current_user)):
    db = get_db()
    try:
        obj_id = ObjectId(alert_id)
    except:
        obj_id = alert_id
        
    result = await db.alerts.update_one(
        {"_id": obj_id},
        {"$set": {"resolved": True, "resolved_at": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    from services.websocket_manager import manager
    await manager.broadcast({
        "type": "alert_cancelled",
        "alert_id": alert_id
    })
    return {"status": "cancelled"}

@router.post("/{alert_id}/mark-false")
async def mark_false_alarm(alert_id: str, current_user = Depends(get_current_user)):
    db = get_db()
    try:
        obj_id = ObjectId(alert_id)
    except:
        obj_id = alert_id
        
    result = await db.alerts.update_one(
        {"_id": obj_id},
        {"$set": {"false_alarm": True, "resolved": True, "resolved_at": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    return {"status": "marked_false"}
