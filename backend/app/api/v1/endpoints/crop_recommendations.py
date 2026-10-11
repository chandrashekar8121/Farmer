from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.schemas.schemas import CropRecommendationRequest, CropRecommendationResponse
from app.core.security import get_current_user, get_optional_current_user
from app.services.ml_service import recommender

router = APIRouter()


@router.post("/crop-recommendations", response_model=CropRecommendationResponse)
def get_crop_recommendation(
    data: CropRecommendationRequest,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates AI crop recommendation using Random Forest model.
    Saves record to database if user is authenticated.
    """
    res = recommender.predict(
        n=data.nitrogen_mg_kg,
        p=data.phosphorus_mg_kg,
        k=data.potassium_mg_kg,
        ph=data.soil_ph,
        temperature=data.temperature or 25.0,
        humidity=data.humidity or 70.0,
        rainfall=data.rainfall or 120.0
    )

    rec_id = None
    if current_user:
        rec_model = models.CropRecommendation(
            user_id=current_user.id,
            farm_id=data.farm_id,
            soil_test_id=data.soil_test_id,
            predicted_crop=res["predicted_crop"],
            secondary_crops=res["secondary_crops"],
            confidence_score=res["confidence_score"],
            explanation=res["explanation"],
            seasonal_advisory=res["seasonal_advisory"],
            input_parameters=res["input_parameters"]
        )
        db.add(rec_model)
        db.commit()
        db.refresh(rec_model)
        rec_id = rec_model.id

    res["id"] = rec_id
    return res


@router.get("/crop-recommendations", response_model=List[CropRecommendationResponse])
def list_crop_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves saved crop recommendations history."""
    recs = db.query(models.CropRecommendation).filter(
        models.CropRecommendation.user_id == current_user.id
    ).order_by(models.CropRecommendation.created_at.desc()).all()

    result = []
    for r in recs:
        result.append(CropRecommendationResponse(
            id=r.id,
            predicted_crop=r.predicted_crop,
            secondary_crops=r.secondary_crops or [],
            confidence_score=r.confidence_score or 0.0,
            explanation=r.explanation,
            seasonal_advisory=r.seasonal_advisory or "",
            model_version="Random Forest v1.0",
            data_source="ICAR Agronomic Dataset",
            limitations="AI recommendation should be verified with local agronomic conditions.",
            input_parameters=r.input_parameters or {}
        ))
    return result
