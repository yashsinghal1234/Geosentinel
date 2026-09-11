from fastapi import APIRouter
from database import get_db
from models.checkin import CheckinCreate
from datetime import datetime

router = APIRouter()

@router.post("/")
async def submit_checkin(checkin_in: CheckinCreate):
    db = get_db()
    
    checkin_dict = checkin_in.model_dump()
    checkin_dict["submitted_at"] = datetime.utcnow()
    
    await db.checkins.insert_one(checkin_dict)
    
    from services.websocket_manager import manager
    await manager.broadcast({
        "type": "new_checkin",
        "status": checkin_dict["status"],
        "alert_id": checkin_dict["alert_id"]
    })
    
    return {"status": "received"}
