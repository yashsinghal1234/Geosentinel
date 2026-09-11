from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AlertBase(BaseModel):
    node_id: str
    alert_level: int
    message: str
    channels_sent: str # e.g. "siren,sms,dashboard"

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: Optional[str] = Field(None, alias="_id")
    dispatched_at: datetime
    resolved: bool = False
    false_alarm: bool = False
    resolved_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
