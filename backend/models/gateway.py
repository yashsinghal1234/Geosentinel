from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class GatewayTelemetry(BaseModel):
    gateway_id: str = Field("GW-01", alias="gatewayId")
    mac: Optional[str] = "E4:5F:01:9A:82:1C"
    battery_pct: Optional[float] = Field(92.0, alias="batteryPct")
    solar_watts: Optional[float] = Field(4.8, alias="solarWatts")
    gsm_bars: Optional[int] = Field(4, alias="gsmBars")
    cpu_temp_c: Optional[float] = Field(42.0, alias="cpuTempC")
    ram_usage_pct: Optional[float] = Field(35.0, alias="ramUsagePct")
    internet_connected: Optional[bool] = Field(True, alias="internetConnected")
    wifi_hotspot_ssid: Optional[str] = Field("GeoSentinel-RescueNet-AP", alias="wifiHotspotSsid")
    local_siren_active: Optional[bool] = Field(False, alias="localSirenActive")
    buffer_count: Optional[int] = Field(0, alias="storeAndForwardBufferCount")
    last_sync_time: Optional[datetime] = None

    class Config:
        populate_by_name = True
        extra = "allow"

class GatewaySyncPayload(BaseModel):
    gateway_id: Optional[str] = Field("GW-01", alias="gatewayId")
    gateway_mac: Optional[str] = Field(None, alias="gatewayMac")
    gateway_telemetry: Optional[GatewayTelemetry] = Field(None, alias="gatewayTelemetry")
    packets: List[Dict[str, Any]] = []

    class Config:
        populate_by_name = True
        extra = "allow"
