from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CitizenReportBase(BaseModel):
    latitude: float
    longitude: float
    photo_url: str
    description: str

class CitizenReportCreate(CitizenReportBase):
    pass

class CitizenReport(CitizenReportBase):
    id: Optional[str] = Field(None, alias="_id")
    submitted_at: datetime
    status: str = "pending" # pending / confirmed / dismissed

    class Config:
        populate_by_name = True
