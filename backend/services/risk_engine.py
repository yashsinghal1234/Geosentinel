import math
from config import settings
from typing import Dict, Any, Tuple

def calculate_risk_score(reading_data: Dict[str, Any], weather_boost: float = 0.0) -> Tuple[float, str, int]:
    """
    Core AI/risk-scoring logic tailored for geotechnical slope monitoring telemetry.
    Calculates:
      - risk_score (0.0 to 100.0)
      - risk_level (NORMAL, MONITOR, ADVISORY, WARNING, CRITICAL)
      - alert_level (1 to 5)
    """
    # If the reading already contains an edge-computed risk_score, we can use it
    provided_risk = reading_data.get('risk_score')
    provided_risk_level = reading_data.get('risk_level')
    provided_anomaly = float(reading_data.get('anomaly_score') or reading_data.get('anomaly_s') or 0.0)

    # 1. Extract physical geotechnical parameters
    tilt_x = float(reading_data.get('tilt_x') or reading_data.get('tiltX') or 0.0)
    tilt_y = float(reading_data.get('tilt_y') or reading_data.get('tiltY') or 0.0)
    tilt_mag = math.sqrt(tilt_x**2 + tilt_y**2)
    
    # Fallback to single tilt value if provided
    if tilt_mag == 0 and 'tilt' in reading_data and reading_data['tilt'] is not None:
        tilt_mag = abs(float(reading_data['tilt']))

    vibration = float(reading_data.get('vibration') or reading_data.get('vibrationMmS') or 0.0)
    acceleration = float(reading_data.get('acceleration') or reading_data.get('accel') or 9.8)
    accel_delta = abs(acceleration - 9.80665)
    
    soil_moist = float(reading_data.get('soil_moist') or reading_data.get('soil_moisture') or 20.0)
    # Soil moisture saturation factor above 30% increases liquefaction risk
    soil_factor = max(0.0, (soil_moist - 25.0) * 0.8)

    packet_loss = float(reading_data.get('packet_loss') or reading_data.get('packet_loss_rate') or 0.0)
    network_penalty = packet_loss * 15.0 # High packet loss in disaster mesh adds risk

    # Anomaly component
    anomaly_factor = provided_anomaly * 1.5

    # Composite physical geotechnical score
    computed_score = (
        (tilt_mag * 50.0) +
        (vibration * 35.0) +
        (accel_delta * 12.0) +
        soil_factor +
        anomaly_factor +
        network_penalty +
        weather_boost
    )

    # If an edge-provided risk score exists, blend with computed heuristic
    if provided_risk is not None:
        try:
            p_val = float(provided_risk)
            # If provided score is in 0-10 range or 0-100 range, normalize
            if p_val <= 10.0 and p_val > 0.0:
                p_val = p_val * 10.0 # scale 0-10 to 0-100
            final_risk_score = round(max(p_val, computed_score), 2)
        except (ValueError, TypeError):
            final_risk_score = round(computed_score, 2)
    else:
        final_risk_score = round(computed_score, 2)

    # Cap between 0 and 100
    final_risk_score = min(max(final_risk_score, 0.0), 100.0)

    # Determine risk level string and alert level integer
    if provided_risk_level and str(provided_risk_level).upper() in ["NORMAL", "MONITOR", "ADVISORY", "WARNING", "CRITICAL"]:
        risk_level_str = str(provided_risk_level).upper()
        level_map = {"NORMAL": 1, "MONITOR": 2, "ADVISORY": 3, "WARNING": 4, "CRITICAL": 5}
        alert_lvl = level_map[risk_level_str]
    else:
        if final_risk_score >= settings.RISK_THRESHOLD_CRITICAL:
            risk_level_str = "CRITICAL"
            alert_lvl = 5
        elif final_risk_score >= settings.RISK_THRESHOLD_WARNING:
            risk_level_str = "WARNING"
            alert_lvl = 4
        elif final_risk_score >= settings.RISK_THRESHOLD_ADVISORY:
            risk_level_str = "ADVISORY"
            alert_lvl = 3
        elif final_risk_score >= 15.0:
            risk_level_str = "MONITOR"
            alert_lvl = 2
        else:
            risk_level_str = "NORMAL"
            alert_lvl = 1

    return final_risk_score, risk_level_str, alert_lvl

def determine_alert_level(risk_score: float) -> int:
    """Helper for backwards compatibility."""
    if risk_score >= settings.RISK_THRESHOLD_CRITICAL:
        return 5
    elif risk_score >= settings.RISK_THRESHOLD_WARNING:
        return 4
    elif risk_score >= settings.RISK_THRESHOLD_ADVISORY:
        return 3
    elif risk_score >= 15.0:
        return 2
    else:
        return 1
