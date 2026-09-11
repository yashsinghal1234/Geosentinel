from pydantic import BaseModel, Field
from typing import Optional, List, Any, Union
from datetime import datetime

class ReadingBase(BaseModel):
    timestamp: Optional[Union[datetime, str]] = None
    node_id: Optional[Union[str, int]] = Field(None, alias="nodeId")
    sector: Optional[Union[int, str]] = 1
    x: Optional[float] = 0.0
    y: Optional[float] = 0.0
    
    # Motion & Geotechnical
    tilt_x: Optional[float] = Field(0.0, alias="tiltX")
    tilt_y: Optional[float] = Field(0.0, alias="tiltY")
    acceleration: Optional[float] = Field(9.8, alias="accel")
    vibration: Optional[float] = Field(0.0, alias="vibrationMmS")
    
    # Environmental & Soil
    temperature: Optional[float] = Field(20.0, alias="temperatu")
    humidity: Optional[float] = 60.0
    pressure: Optional[float] = 1013.25
    soil_moist: Optional[float] = Field(25.0, alias="soil_moisture")
    
    # Device Health & Network
    battery: Optional[float] = Field(100.0, alias="batteryPct")
    packet_loss: Optional[float] = Field(0.0, alias="packet_loss_rate")
    rssi: Optional[float] = Field(-70.0, alias="rssiDbm")
    
    # AI / Analytics (computed or incoming)
    anomaly_score: Optional[float] = Field(0.0, alias="anomaly_s")
    risk_score: Optional[float] = None
    risk_level: Optional[str] = "NORMAL"
    node_status: Optional[str] = "ONLINE"
    
    # Legacy / Alternate sensor aliases
    tilt: Optional[float] = Field(None, alias="tiltDeg")
    gas_level: Optional[float] = Field(None, alias="gasPpm")
    crack_width: Optional[float] = Field(None, alias="crackWidthMm")
    rainfall: Optional[float] = Field(None, alias="rainfallMmHr")
    gateway_id: Optional[str] = Field("GW-01", alias="gatewayId")

    class Config:
        populate_by_name = True
        extra = "allow"

class ReadingCreate(ReadingBase):
    pass

class Reading(ReadingBase):
    id: Optional[str] = Field(None, alias="_id")
    timestamp: Optional[datetime] = None
    risk_score: float = 0.0
    risk_level: str = "NORMAL"
    alert_level: int = 1 # 1-5
    node_status: str = "ONLINE"

    class Config:
        populate_by_name = True

class BatchIngestPayload(BaseModel):
    gateway_id: Optional[str] = Field("GW-01", alias="gatewayId")
    packets: Optional[List[ReadingCreate]] = None
    readings: Optional[List[ReadingCreate]] = None
    api_key: Optional[str] = Field(None, alias="apiKey")

    class Config:
        populate_by_name = True
        extra = "allow"
