from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

class NodeBase(BaseModel):
    name: Optional[str] = None
    sector: Optional[Union[int, str]] = 1
    x: Optional[float] = 0.0
    y: Optional[float] = 0.0
    latitude: Optional[float] = 23.7485
    longitude: Optional[float] = 86.4195
    sensor_types: Optional[str] = "tilt_x,tilt_y,vibration,soil_moist,temperature,humidity,pressure"
    status: str = "normal" # normal / danger / warning / offline
    node_status: str = "ONLINE" # ONLINE / OFFLINE / DEGRADED

class NodeCreate(NodeBase):
    pass

class Node(NodeBase):
    id: str = Field(..., alias="_id") # e.g. "1", "2", "N-01"
    api_key: Optional[str] = None
    last_heartbeat: Optional[datetime] = None
    risk_score: Optional[float] = 0.0
    risk_level: Optional[str] = "NORMAL"
    readings: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True
        extra = "allow"
