from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CitizenReportCreate(BaseModel):
    reporter_name: Optional[str] = Field("Anonymous Resident", description="Name of citizen or resident")
    phone: Optional[str] = Field("+91 94311 00000", description="Contact phone number")
    zone: str = Field("Sector 4 (Village Slope)", description="Mining sector or village boundary")
    latitude: float = Field(23.7480, description="GPS Latitude")
    longitude: float = Field(86.4200, description="GPS Longitude")
    crack_width_estimate_mm: float = Field(12.0, ge=0.5, le=500.0, description="Estimated crack aperture width in mm")
    photo_url: Optional[str] = Field(None, description="Image URL or pre-selected sample fracture")
    photo_base64: Optional[str] = Field(None, description="Base64 encoded photo image")
    description: str = Field(..., description="Observation description of the fissure")
    severity: Optional[str] = Field(None, description="Calculated severity (Minor / Moderate / Severe / Critical)")

class ReportReviewAction(BaseModel):
    action: str = Field(..., description="Action: 'approve', 'corroborate', 'dismiss', 'escalate'")
    review_notes: Optional[str] = Field(None, description="Geological justification or triage notes")
    reviewed_by: Optional[str] = Field("Mine Safety Inspector", description="Name/badge of reviewing official")

class CitizenReport(BaseModel):
    id: str = Field(..., description="Report ID e.g. CR-801")
    reporter_name: str
    phone: Optional[str] = None
    zone: str
    latitude: float
    longitude: float
    crack_width_estimate_mm: float
    photo_url: str
    description: str
    severity: str
    status: str = "Pending Review"  # "Pending Review" | "Corroborated & Approved" | "Dismissed (Non-critical)"
    submitted_at: str
    time_epoch: int
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    nearest_sensor_id: Optional[str] = None
    nearest_sensor_distance_m: Optional[float] = None
    ai_corroboration_confidence: Optional[float] = None

    class Config:
        populate_by_name = True

class ReportAnalyticsSummary(BaseModel):
    total_reports: int
    pending_count: int
    approved_count: int
    dismissed_count: int
    avg_crack_width_mm: float
    critical_fissures_count: int
