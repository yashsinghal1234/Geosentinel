from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database import get_db
from models.citizen_report import CitizenReport, CitizenReportCreate
from routes.auth import get_current_user
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.post("/")
async def submit_report(report_in: CitizenReportCreate):
    db = get_db()
    report_dict = report_in.model_dump()
    report_dict["submitted_at"] = datetime.utcnow()
    report_dict["status"] = "pending"
    
    result = await db.citizen_reports.insert_one(report_dict)
    
    # Notify dashboard
    from services.websocket_manager import manager
    await manager.broadcast({
        "type": "new_citizen_report",
        "report_id": str(result.inserted_id)
    })
    
    return {"status": "success", "id": str(result.inserted_id)}

@router.get("/", response_model=List[CitizenReport])
async def get_pending_reports(current_user = Depends(get_current_user)):
    db = get_db()
    reports = await db.citizen_reports.find({"status": "pending"}).to_list(100)
    for report in reports:
        if "_id" in report and isinstance(report["_id"], ObjectId):
            report["_id"] = str(report["_id"])
    return reports

from pydantic import BaseModel

class ReviewAction(BaseModel):
    action: str # "confirm" or "dismiss"

@router.post("/{report_id}/review")
async def review_report(report_id: str, review: ReviewAction, current_user = Depends(get_current_user)):
    if review.action not in ["confirm", "dismiss"]:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    db = get_db()
    try:
        obj_id = ObjectId(report_id)
    except:
        obj_id = report_id
        
    result = await db.citizen_reports.update_one(
        {"_id": obj_id},
        {"$set": {"status": review.action + "ed"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return {"status": "success"}
