from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.core.security import get_current_user

router = APIRouter()


@router.get("/history")
def get_farmer_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns unified chronological agricultural history for the farmer:
    Soil tests, Crop recommendations, Fertilizer recommendations, and task events.
    Enables comparison of nutrient trends over time.
    """
    # 1. Soil Tests
    soil_tests = db.query(models.SoilTest).filter(
        models.SoilTest.user_id == current_user.id
    ).order_by(models.SoilTest.created_at.desc()).all()

    # 2. Crop Recommendations
    crop_recs = db.query(models.CropRecommendation).filter(
        models.CropRecommendation.user_id == current_user.id
    ).order_by(models.CropRecommendation.created_at.desc()).all()

    # 3. Fertilizer Recommendations
    fert_recs = db.query(models.FertilizerRecommendation).filter(
        models.FertilizerRecommendation.user_id == current_user.id
    ).order_by(models.FertilizerRecommendation.created_at.desc()).all()

    # 4. Nutrient trend comparison dataset (chronological)
    chronological_tests = list(reversed(soil_tests))
    trends = [
        {
            "id": t.id,
            "date": t.sample_date.isoformat() if t.sample_date else t.created_at.strftime("%Y-%m-%d"),
            "nitrogen_mg_kg": t.nitrogen_mg_kg,
            "phosphorus_mg_kg": t.phosphorus_mg_kg,
            "potassium_mg_kg": t.potassium_mg_kg,
            "soil_ph": t.soil_ph,
            "lab_name": t.lab_name or "Self / Laboratory"
        }
        for t in chronological_tests
    ]

    return {
        "farmer_name": current_user.full_name,
        "total_soil_tests": len(soil_tests),
        "total_crop_recommendations": len(crop_recs),
        "total_fertilizer_recommendations": len(fert_recs),
        "nutrient_trends": trends,
        "soil_tests": [
            {
                "id": t.id,
                "date": t.sample_date.isoformat() if t.sample_date else t.created_at.strftime("%Y-%m-%d"),
                "nitrogen_mg_kg": t.nitrogen_mg_kg,
                "phosphorus_mg_kg": t.phosphorus_mg_kg,
                "potassium_mg_kg": t.potassium_mg_kg,
                "soil_ph": t.soil_ph,
                "lab_name": t.lab_name,
                "notes": t.notes,
                "created_at": t.created_at.isoformat()
            }
            for t in soil_tests
        ],
        "crop_recommendations": [
            {
                "id": c.id,
                "predicted_crop": c.predicted_crop,
                "confidence_score": c.confidence_score,
                "explanation": c.explanation,
                "created_at": c.created_at.isoformat()
            }
            for c in crop_recs
        ],
        "fertilizer_recommendations": [
            {
                "id": f.id,
                "crop_name": f.crop_name,
                "target_area": f.target_area,
                "area_unit": f.area_unit,
                "growth_stage": f.growth_stage,
                "total_estimated_cost": f.total_estimated_cost,
                "recommended_products": f.recommended_products,
                "created_at": f.created_at.isoformat()
            }
            for f in fert_recs
        ]
    }
