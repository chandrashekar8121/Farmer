"""
Krishi Saathi - Weather Service with OpenWeather Integration
Includes in-memory cache, agricultural spraying advisories, and transparent fallbacks.
"""

import time
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

# In-memory cache: (lat, lon) -> (timestamp, data)
_CACHE: Dict[str, Any] = {}
CACHE_TTL_SECONDS = 600  # 10 minutes


def generate_spray_advisory(wind_speed_kmh: float, rain_mm: float, condition: str) -> str:
    """Generates practical advisory for elder farmers on chemical/fertilizer spraying."""
    if rain_mm > 2.0 or "rain" in condition.lower() or "thunderstorm" in condition.lower():
        return "⚠️ వాతావరణ హెచ్చరిక: వర్షం పడే అవకాశం ఉంది. ఎరువులు చల్లడం, క్రిమిసంహారక మందులు పిచికారీ చేయడం తాత్కాలికంగా ఆపండి (Do NOT spray: Rain will wash away nutrients)."
    elif wind_speed_kmh > 18.0:
        return "💨 గాలి తీవ్రత ఎక్కువ (Wind speed > 18 km/h). పిచికారీ చేస్తే ఎరువు పక్క పొలాలకు కొట్టుకుపోతుంది. గాలి తగ్గాక పిచికారీ చేయండి."
    elif wind_speed_kmh < 12.0:
        return "✅ అనుకూల వాతావరణం: ఎరువులు చల్లడానికి, పిచికారీ చేయడానికి అత్యుత్తమ సమయం (Favorable for fertilizer application & spraying)."
    else:
        return "ℹ️ మోస్తరు వాతావరణం: పిచికారీ జాగ్రత్తగా చేసుకోవచ్చు."


async def get_weather_data(lat: float = 16.5062, lon: float = 80.6480, location_name: str = "Vijayawada, Andhra Pradesh") -> Dict[str, Any]:
    """
    Fetches real-time weather and 3-day forecast from OpenWeather.
    If API key is missing or request fails, returns transparent status. Never fabricates live data.
    """
    api_key = settings.OPENWEATHER_API_KEY
    cache_key = f"{round(lat, 2)}_{round(lon, 2)}"

    # Check cache
    now = time.time()
    if cache_key in _CACHE:
        cached_ts, cached_payload = _CACHE[cache_key]
        if now - cached_ts < CACHE_TTL_SECONDS:
            return cached_payload

    if not api_key:
        return {
            "location": location_name,
            "state": "Andhra Pradesh / Telangana / India",
            "latitude": lat,
            "longitude": lon,
            "is_live": False,
            "data_source": "Offline Status",
            "current": {
                "temperature_c": 28.0,
                "feels_like_c": 30.0,
                "humidity_percent": 65,
                "wind_speed_kmh": 10.0,
                "condition": "Service Unavailable",
                "description": "Weather service API key is not configured.",
                "icon": "01d",
                "rainfall_mm": 0.0,
                "spray_advisory": "Weather service key not configured in backend environment. Please check local conditions manually before spraying."
            },
            "forecast": [],
            "notes": "OpenWeather API key (OPENWEATHER_API_KEY) has not been set in backend environment variables. Configure the free OpenWeather key to view real-time live satellite forecasts."
        }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"

            w_res = await client.get(weather_url)
            f_res = await client.get(forecast_url)

            if w_res.status_code != 200:
                return {
                    "location": location_name,
                    "state": "India",
                    "latitude": lat,
                    "longitude": lon,
                    "is_live": False,
                    "data_source": "OpenWeather API Error",
                    "current": {
                        "temperature_c": 0.0,
                        "feels_like_c": 0.0,
                        "humidity_percent": 0,
                        "wind_speed_kmh": 0.0,
                        "condition": "Error",
                        "description": f"OpenWeather responded with code {w_res.status_code}",
                        "icon": "01d",
                        "rainfall_mm": 0.0,
                        "spray_advisory": "Could not fetch current satellite weather observations."
                    },
                    "forecast": [],
                    "notes": f"OpenWeather service error: {w_res.text}"
                }

            w_data = w_res.json()
            f_data = f_res.json() if f_res.status_code == 200 else {}

            temp = w_data.get("main", {}).get("temp", 0.0)
            feels_like = w_data.get("main", {}).get("feels_like", 0.0)
            humidity = w_data.get("main", {}).get("humidity", 0)
            wind_speed = round(w_data.get("wind", {}).get("speed", 0.0) * 3.6, 1)  # m/s to km/h
            weather_list = w_data.get("weather", [{}])
            condition = weather_list[0].get("main", "Clear")
            desc = weather_list[0].get("description", "Clear sky").capitalize()
            icon = weather_list[0].get("icon", "01d")
            rain_mm = w_data.get("rain", {}).get("1h", 0.0)

            advisory = generate_spray_advisory(wind_speed, rain_mm, condition)

            # Process 5-day forecast (grouped by day)
            forecast_items = []
            if "list" in f_data:
                seen_dates = set()
                for item in f_data["list"]:
                    dt_txt = item.get("dt_txt", "").split(" ")[0]
                    if dt_txt not in seen_dates and len(forecast_items) < 4:
                        seen_dates.add(dt_txt)
                        main_f = item.get("main", {})
                        w_f = item.get("weather", [{}])[0]
                        pop = int(item.get("pop", 0) * 100)
                        forecast_items.append({
                            "date": dt_txt,
                            "temp_min_c": round(main_f.get("temp_min", temp), 1),
                            "temp_max_c": round(main_f.get("temp_max", temp), 1),
                            "condition": w_f.get("main", "Clear"),
                            "rain_probability_percent": pop
                        })

            payload = {
                "location": w_data.get("name", location_name),
                "state": "India",
                "latitude": lat,
                "longitude": lon,
                "is_live": True,
                "data_source": "OpenWeather API (Live Satellite Data)",
                "current": {
                    "temperature_c": temp,
                    "feels_like_c": feels_like,
                    "humidity_percent": humidity,
                    "wind_speed_kmh": wind_speed,
                    "condition": condition,
                    "description": desc,
                    "icon": icon,
                    "rainfall_mm": rain_mm,
                    "spray_advisory": advisory
                },
                "forecast": forecast_items,
                "notes": "Live meteorological measurements updated directly via OpenWeather."
            }

            _CACHE[cache_key] = (now, payload)
            return payload

    except Exception as e:
        return {
            "location": location_name,
            "state": "India",
            "latitude": lat,
            "longitude": lon,
            "is_live": False,
            "data_source": "Network Error",
            "current": {
                "temperature_c": 0.0,
                "feels_like_c": 0.0,
                "humidity_percent": 0,
                "wind_speed_kmh": 0.0,
                "condition": "Connection Failed",
                "description": "Network timeout connecting to weather satellite service.",
                "icon": "01d",
                "rainfall_mm": 0.0,
                "spray_advisory": "Could not connect to live weather server."
            },
            "forecast": [],
            "notes": f"Weather API error: {str(e)}"
        }
