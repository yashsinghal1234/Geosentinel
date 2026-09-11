import httpx
from config import settings
import logging

logger = logging.getLogger(__name__)

async def get_weather_risk_boost(latitude: float, longitude: float) -> float:
    """
    Calls a weather API to get rainfall data and returns a risk boost factor.
    Heavy rain increases landslide/collapse risk.
    """
    if not settings.WEATHER_API_KEY:
        return 0.0
        
    try:
        # Mock weather API call - in reality use OpenWeatherMap etc.
        # url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={settings.WEATHER_API_KEY}"
        # async with httpx.AsyncClient() as client:
        #     response = await client.get(url)
        #     data = response.json()
        #     rain_1h = data.get('rain', {}).get('1h', 0)
        #     return min(rain_1h * 2.0, 20.0) # Max 20 points boost from weather
        
        # Mock logic
        return 5.0 # Simulated slight rain boost
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return 0.0
