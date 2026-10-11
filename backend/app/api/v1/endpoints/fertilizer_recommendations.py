from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.schemas.schemas import FertilizerRecommendationRequest, FertilizerRecommendationResponse
from app.core.security import get_current_user, get_optional_current_user
from app.services.fertilizer_service import calculate_fertilizer_recommendation

router = APIRouter()


@router.post("/fertilizer-recommendations", response_model=FertilizerRecommendationResponse)
def generate_fertilizer_recommendation(
    data: FertilizerRecommendationRequest,
    current_user: Optional[models.User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes crop-specific fertilizer recommendation grounded in ICAR/TNAU standards.
    Converts land area, computes product bags & subsidized costs, and creates in-app schedule tasks.
    """
    res = calculate_fertilizer_recommendation(
        crop_name=data.crop_name,
        target_area=data.target_area,
        area_unit=data.area_unit,
        n_mg_kg=data.nitrogen_mg_kg,
        p_mg_kg=data.phosphorus_mg_kg,
        k_mg_kg=data.potassium_mg_kg,
        soil_ph=data.soil_ph,
        growth_stage=data.growth_stage,
        sowing_date=data.sowing_date
    )

    rec_id = None
    if current_user:
        # Save recommendation record
        rec_record = models.FertilizerRecommendation(
            user_id=current_user.id,
            farm_id=data.farm_id,
            soil_test_id=data.soil_test_id,
            crop_name=res["crop_name"],
            growth_stage=res["growth_stage"],
            target_area=data.target_area,
            area_unit=data.area_unit,
            nutrient_status=res["nutrient_status"],
            recommended_products=[p.model_dump() for p in res["recommended_products"]],
            total_estimated_cost=res["total_estimated_cost_inr"],
            safety_instructions=res["safety_instructions"],
            recommendation_source=res["recommendation_source"]
        )
        db.add(rec_record)
        db.commit()
        db.refresh(rec_record)
        rec_id = rec_record.id

        # Automatically populate upcoming schedule tasks for the farmer
        for split in res["split_schedule"]:
            sched = models.FertilizerSchedule(
                user_id=current_user.id,
                recommendation_id=rec_record.id,
                task_title=f"{data.crop_name} - {split.stage}",
                stage_name=split.stage,
                due_date=split.due_date,
                product_name=split.product_name,
                quantity_kg=split.quantity_kg,
                application_method=split.method,
                status="pending",
                notes=split.instructions
            )
            db.add(sched)
        db.commit()

    res["id"] = rec_id
    return res


@router.get("/fertilizer-recommendations", response_model=List[FertilizerRecommendationResponse])
def list_fertilizer_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all past fertilizer recommendations for the farmer."""
    records = db.query(models.FertilizerRecommendation).filter(
        models.FertilizerRecommendation.user_id == current_user.id
    ).order_by(models.FertilizerRecommendation.created_at.desc()).all()

    result = []
    for r in records:
        result.append(FertilizerRecommendationResponse(
            id=r.id,
            crop_name=r.crop_name,
            growth_stage=r.growth_stage,
            target_area=r.target_area,
            area_unit=r.area_unit,
            target_area_hectares=round(r.target_area * 0.404686 if r.area_unit == "acres" else r.target_area, 3),
            nutrient_status=r.nutrient_status,
            recommended_products=r.recommended_products,
            split_schedule=[],
            total_estimated_cost_inr=r.total_estimated_cost,
            price_source="Central Government Subsidized DBT Rates",
            safety_instructions=r.safety_instructions,
            recommendation_source=r.recommendation_source,
            assumptions="Historical record saved in farm database."
        ))
    return result
