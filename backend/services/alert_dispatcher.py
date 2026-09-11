import logging
from config import settings
from datetime import datetime

logger = logging.getLogger(__name__)

async def dispatch_alert(node_id: str, alert_level: int, risk_score: float):
    """
    Mock implementation of an alert dispatcher.
    In real life, this calls Twilio, WhatsApp API, or hardware sirens.
    """
    message = f"ALERT Level {alert_level} for Node {node_id}! Risk Score: {risk_score:.2f}"
    channels = []
    
    if alert_level >= 3:
        channels.append("dashboard")
        logger.info(f"Dashboard push: {message}")
    
    if alert_level >= 4:
        channels.append("sms")
        logger.info(f"Sending SMS via API key {settings.SMS_API_KEY[:4]}...: {message}")
        
    if alert_level == 5:
        channels.append("siren")
        logger.info(f"TRIGGERING PHYSICAL SIREN FOR NODE {node_id}")

    # Return dispatch info to be saved in the database
    return {
        "node_id": node_id,
        "alert_level": alert_level,
        "message": message,
        "channels_sent": ",".join(channels),
        "dispatched_at": datetime.utcnow(),
        "resolved": False,
        "false_alarm": False
    }
