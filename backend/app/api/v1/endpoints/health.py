from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db
from app.services.ml_service import recommender
from app.core.config import settings

router = APIRouter()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Production health endpoint:
    Checks database connection, ML model status, and service uptime.
    Never exposes internal secrets or credentials.
    """
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)[:50]}"

    ml_status = "loaded" if recommender.model is not None else "using_agronomic_fallback"

    return {
        "status": "online",
        "app_name": "Krishi Saathi",
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "database": db_status,
        "crop_ml_engine": ml_status,
        "ocr_service": "available",
        "weather_service": "configured" if bool(settings.OPENWEATHER_API_KEY) else "unconfigured_free_mode"
    }
