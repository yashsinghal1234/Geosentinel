from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CheckinBase(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    status: str # safe / need_help
    alert_id: str # which alert this check-in responds to

class CheckinCreate(CheckinBase):
    pass

class Checkin(CheckinBase):
    id: Optional[str] = Field(None, alias="_id")
    submitted_at: datetime

    class Config:
        populate_by_name = True
