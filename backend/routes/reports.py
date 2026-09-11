from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone
import math
import uuid
import logging

from database import get_db
from models.citizen_report import (
    CitizenReport, 
    CitizenReportCreate, 
    ReportReviewAction,
    ReportAnalyticsSummary
)
from services.websocket_manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()

# Default High-Definition SVG Fracture Patterns (Self-contained, reliable, never 404)
SVG_FRACTURE_SOIL = (
    "data:image/svg+xml;utf8,"
    "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>"
    "<rect width='100%' height='100%' fill='%2312151c'/>"
    "<path d='M30 40 Q 110 90, 160 140 T 260 210 T 370 260' stroke='%2338bdf8' stroke-width='4' fill='none'/>"
    "<path d='M160 140 Q 190 90, 240 70' stroke='%2338bdf8' stroke-width='2.5' fill='none' stroke-dasharray='4,2'/>"
    "<path d='M260 210 Q 290 240, 320 280' stroke='%230284c7' stroke-width='2' fill='none'/>"
    "<circle cx='160' cy='140' r='5' fill='%23ef4444'/>"
    "<text x='20' y='280' fill='%2394a3b8' font-family='sans-serif' font-size='12'>SOIL SHEAR FISSURE • SECTOR 4</text>"
    "</svg>"
)

SVG_FRACTURE_WALL = (
    "data:image/svg+xml;utf8,"
    "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>"
    "<rect width='100%' height='100%' fill='%231a141f'/>"
    "<path d='M60 20 L 120 110 L 90 180 L 150 280' stroke='%23f59e0b' stroke-width='5' fill='none'/>"
    "<path d='M120 110 L 220 130 L 310 160' stroke='%23f59e0b' stroke-width='3' fill='none'/>"
    "<circle cx='120' cy='110' r='6' fill='%23ef4444'/>"
    "<text x='20' y='280' fill='%23d8b4fe' font-family='sans-serif' font-size='12'>MASONRY WALL SEPARATION • SECTOR 3</text>"
    "</svg>"
)

SVG_FRACTURE_ROAD = (
    "data:image/svg+xml;utf8,"
    "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>"
    "<rect width='100%' height='100%' fill='%230f141a'/>"
    "<path d='M20 150 Q 140 140, 220 160 T 380 145' stroke='%23ef4444' stroke-width='6' fill='none'/>"
    "<path d='M220 160 Q 250 80, 290 30' stroke='%23f87171' stroke-width='3' fill='none'/>"
    "<circle cx='220' cy='160' r='6' fill='%23ef4444'/>"
    "<text x='20' y='280' fill='%23cbd5e1' font-family='sans-serif' font-size='12'>ROADWAY EMBANKMENT CRACK • SECTOR 2</text>"
    "</svg>"
)

# Seeded Initial Reports Cache
IN_MEMORY_REPORTS: List[dict] = [
    {
        "id": "CR-801",
        "reporter_name": "Manoj Kumar Soren",
        "phone": "+91 94311 88421",
        "zone": "Sector 4 (Village Slope)",
        "latitude": 23.7482,
        "longitude": 86.4215,
        "crack_width_estimate_mm": 9.0,
        "photo_url": SVG_FRACTURE_SOIL,
        "description": "Ground crack running across courtyard near primary school, expanded noticeably overnight.",
        "severity": "Moderate Shear Fissure",
        "status": "Corroborated & Approved",
        "submitted_at": "28 mins ago",
        "time_epoch": int(datetime.now(timezone.utc).timestamp() * 1000) - (28 * 60 * 1000),
        "reviewed_by": "DGMS Geologist Dr. K. Roy",
        "review_notes": "Corroborates with +1.8mm/hr displacement on SN-04 extensometer. Village advisory dispatched.",
        "nearest_sensor_id": "NODE-D",
        "nearest_sensor_distance_m": 145.0,
        "ai_corroboration_confidence": 94.2
    },
    {
        "id": "CR-802",
        "reporter_name": "Sujata Devi",
        "phone": "+91 98210 44299",
        "zone": "Sector 3 (Abandoned Gallery)",
        "latitude": 23.7462,
        "longitude": 86.4168,
        "crack_width_estimate_mm": 16.0,
        "photo_url": SVG_FRACTURE_WALL,
        "description": "Wall splitting along eastern foundation of pump house adjacent to old incline gallery.",
        "severity": "Severe Subsidence Crack",
        "status": "Corroborated & Approved",
        "submitted_at": "2 hours ago",
        "time_epoch": int(datetime.now(timezone.utc).timestamp() * 1000) - (120 * 60 * 1000),
        "reviewed_by": "Mine Safety Inspector T. Sen",
        "review_notes": "Adjacent to underground void SN-03; High strain shear zone verified.",
        "nearest_sensor_id": "NODE-C",
        "nearest_sensor_distance_m": 88.0,
        "ai_corroboration_confidence": 98.7
    },
    {
        "id": "CR-803",
        "reporter_name": "Rameshwar Mahato",
        "phone": "+91 91223 90812",
        "zone": "Sector 2 (Riverbank Overburden)",
        "latitude": 23.7521,
        "longitude": 86.4245,
        "crack_width_estimate_mm": 4.0,
        "photo_url": SVG_FRACTURE_ROAD,
        "description": "Superficial soil drying cracks observed on road embankment after blast cycle.",
        "severity": "Minor Surface Tension",
        "status": "Pending Review",
        "submitted_at": "4 hours ago",
        "time_epoch": int(datetime.now(timezone.utc).timestamp() * 1000) - (240 * 60 * 1000),
        "reviewed_by": None,
        "review_notes": None,
        "nearest_sensor_id": "NODE-B",
        "nearest_sensor_distance_m": 210.0,
        "ai_corroboration_confidence": 76.5
    }
]

def calculate_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance formula"""
    R = 6371000  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def evaluate_severity(width_mm: float) -> str:
    if width_mm >= 30.0:
        return "Critical Evacuation Hazard"
    elif width_mm >= 15.0:
        return "Severe Subsidence Crack"
    elif width_mm >= 6.0:
        return "Moderate Shear Fissure"
    else:
        return "Minor Surface Tension"

# 1. GET ALL CITIZEN REPORTS (Public Feed with optional filtering)
@router.get("/", response_model=List[CitizenReport])
async def get_all_reports(
    status: Optional[str] = Query(None, description="Filter by status ('Pending Review', 'Corroborated & Approved', 'Dismissed')"),
    zone: Optional[str] = Query(None, description="Filter by mining sector or zone"),
    limit: int = Query(50, ge=1, le=200)
):
    """
    Public Endpoint: Get all citizen ground fissure reports.
    Works seamlessly with MongoDB Atlas or in-memory fallback.
    """
    db = get_db()
    if db is not None:
        try:
            query = {}
            if status:
                query["status"] = status
            if zone:
                query["zone"] = zone
            
            cursor = db.citizen_reports.find(query).sort("time_epoch", -1).limit(limit)
            reports_db = await cursor.to_list(length=limit)
            if reports_db and len(reports_db) > 0:
                result = []
                for r in reports_db:
                    r["id"] = r.get("id") or str(r.get("_id"))
                    result.append(CitizenReport(**r))
                return result
        except Exception as e:
            logger.warning(f"MongoDB query failed for citizen_reports: {e}. Falling back to in-memory cache.")

    # In-memory filtered fallback
    filtered = IN_MEMORY_REPORTS
    if status:
        filtered = [r for r in filtered if r["status"].lower() == status.lower()]
    if zone:
        filtered = [r for r in filtered if zone.lower() in r["zone"].lower()]
        
    return [CitizenReport(**r) for r in filtered[:limit]]


# 2. GET ANALYTICS SUMMARY
@router.get("/analytics/summary", response_model=ReportAnalyticsSummary)
async def get_reports_summary():
    """
    Summary metrics for reports triage dashboard.
    """
    all_reports = await get_all_reports(limit=200)
    total = len(all_reports)
    pending = sum(1 for r in all_reports if r.status == "Pending Review")
    approved = sum(1 for r in all_reports if "Corroborated" in r.status or "Approved" in r.status)
    dismissed = sum(1 for r in all_reports if "Dismissed" in r.status)
    critical = sum(1 for r in all_reports if r.crack_width_estimate_mm >= 15.0)
    avg_width = sum(r.crack_width_estimate_mm for r in all_reports) / max(total, 1)

    return ReportAnalyticsSummary(
        total_reports=total,
        pending_count=pending,
        approved_count=approved,
        dismissed_count=dismissed,
        avg_crack_width_mm=round(avg_width, 1),
        critical_fissures_count=critical
    )


# 3. SUBMIT NEW CITIZEN CRACK REPORT
@router.post("/", response_model=CitizenReport)
async def submit_crack_report(report_in: CitizenReportCreate):
    """
    Public Submission: Submit a new ground fissure observation.
    Calculates severity, auto-detects nearest sensor, and alerts operator via WebSocket.
    """
    next_id_num = 801 + len(IN_MEMORY_REPORTS)
    report_id = f"CR-{next_id_num}"
    
    # Calculate severity
    severity = report_in.severity or evaluate_severity(report_in.crack_width_estimate_mm)
    
    # Fallback photo if none provided
    photo = report_in.photo_url or report_in.photo_base64 or SVG_FRACTURE_SOIL

    # Calculate distance to nearest sensor node
    # Sector 1: 23.7535, 86.4225 (Node A)
    # Sector 2: 23.7510, 86.4210 (Node B)
    # Sector 3: 23.7460, 86.4170 (Node C)
    # Sector 4: 23.7440, 86.4230 (Node D)
    known_nodes = [
        {"id": "NODE-A", "lat": 23.7535, "lng": 86.4225},
        {"id": "NODE-B", "lat": 23.7510, "lng": 86.4210},
        {"id": "NODE-C", "lat": 23.7460, "lng": 86.4170},
        {"id": "NODE-D", "lat": 23.7440, "lng": 86.4230},
    ]
    
    nearest_node = "NODE-A"
    min_dist = float("inf")
    for n in known_nodes:
        d = calculate_distance_meters(report_in.latitude, report_in.longitude, n["lat"], n["lng"])
        if d < min_dist:
            min_dist = d
            nearest_node = n["id"]

    now_epoch = int(datetime.now(timezone.utc).timestamp() * 1000)

    report_dict = {
        "id": report_id,
        "reporter_name": report_in.reporter_name.strip() if report_in.reporter_name else "Anonymous Resident",
        "phone": report_in.phone.strip() if report_in.phone else "+91 94311 00000",
        "zone": report_in.zone,
        "latitude": report_in.latitude,
        "longitude": report_in.longitude,
        "crack_width_estimate_mm": report_in.crack_width_estimate_mm,
        "photo_url": photo,
        "description": report_in.description,
        "severity": severity,
        "status": "Pending Review",
        "submitted_at": "Just now",
        "time_epoch": now_epoch,
        "reviewed_by": None,
        "review_notes": None,
        "nearest_sensor_id": nearest_node,
        "nearest_sensor_distance_m": min_dist,
        "ai_corroboration_confidence": round(80.0 + (min_dist % 18), 1)
    }

    # Save to MongoDB Atlas if connected
    db = get_db()
    if db is not None:
        try:
            doc = dict(report_dict, _id=report_id)
            await db.citizen_reports.insert_one(doc)
        except Exception as e:
            logger.warning(f"MongoDB insert failed: {e}")

    # Prepend to in-memory list
    IN_MEMORY_REPORTS.insert(0, report_dict)

    # Real-time WebSocket Broadcast to Operators
    try:
        await manager.broadcast({
            "type": "new_citizen_report",
            "report": report_dict
        })
    except Exception as ws_err:
        logger.warning(f"WebSocket broadcast error: {ws_err}")

    return CitizenReport(**report_dict)


# 4. OPERATOR REVIEW & CORROBORATION
@router.post("/{report_id}/review", response_model=CitizenReport)
async def review_citizen_report(report_id: str, review: ReportReviewAction):
    """
    Operator Triage: Corroborate & escalate, or dismiss non-structural crack report.
    """
    target = None
    for r in IN_MEMORY_REPORTS:
        if r["id"] == report_id:
            target = r
            break

    if not target:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")

    if review.action in ["approve", "corroborate", "confirm"]:
        target["status"] = "Corroborated & Approved"
        target["reviewed_by"] = review.reviewed_by or "DGMS Mining Safety Inspector"
        target["review_notes"] = review.review_notes or "Corroborated with nearest IoT mesh tilt trend. Dispatched ground inspection."
    elif review.action in ["dismiss", "reject"]:
        target["status"] = "Dismissed (Non-critical)"
        target["reviewed_by"] = review.reviewed_by or "DGMS Mining Safety Inspector"
        target["review_notes"] = review.review_notes or "Dismissed: Superficial shrinkage crack without sub-surface shear."
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'dismiss'")

    # Update MongoDB
    db = get_db()
    if db is not None:
        try:
            await db.citizen_reports.update_one(
                {"id": report_id},
                {"$set": {
                    "status": target["status"],
                    "reviewed_by": target["reviewed_by"],
                    "review_notes": target["review_notes"]
                }}
            )
        except Exception as e:
            logger.warning(f"MongoDB update failed: {e}")

    # Broadcast review update
    try:
        await manager.broadcast({
            "type": "citizen_report_reviewed",
            "report_id": report_id,
            "status": target["status"],
            "reviewed_by": target["reviewed_by"]
        })
    except Exception:
        pass

    return CitizenReport(**target)
