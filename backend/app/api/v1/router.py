from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    crops,
    soil_tests,
    crop_recommendations,
    fertilizer_recommendations,
    schedules,
    weather,
    history,
    family,
    tts
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(crops.router, tags=["Crops"])
api_router.include_router(soil_tests.router, tags=["Soil Tests"])
api_router.include_router(crop_recommendations.router, tags=["Crop Recommendations"])
api_router.include_router(fertilizer_recommendations.router, tags=["Fertilizer Recommendations"])
api_router.include_router(schedules.router, tags=["Fertilizer Schedules"])
api_router.include_router(weather.router, tags=["Weather"])
api_router.include_router(history.router, tags=["History"])
api_router.include_router(family.router, tags=["Family Access"])
api_router.include_router(tts.router, tags=["TTS and Translation"])
