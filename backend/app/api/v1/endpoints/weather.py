from typing import Optional
from fastapi import APIRouter, Query
from app.services.weather_service import get_weather_data
from app.schemas.schemas import WeatherResponse

router = APIRouter()


@router.get("/weather", response_model=WeatherResponse)
async def get_current_weather(
    lat: float = Query(16.5062, ge=-90, le=90, description="Latitude (default: Andhra Pradesh)"),
    lon: float = Query(80.6480, ge=-180, le=180, description="Longitude"),
    location_name: Optional[str] = Query("Andhra Pradesh / Telangana", description="District or Village name")
):
    """
    Retrieves real-time weather and agricultural spraying advisory.
    Uses in-memory cache and OpenWeather API without leaking secrets to frontend.
    """
    data = await get_weather_data(lat=lat, lon=lon, location_name=location_name)
    return data
