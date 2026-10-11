from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.schemas.schemas import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("/fertilizer-schedules", response_model=List[ScheduleResponse])
def list_fertilizer_schedules(
    status_filter: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lists fertilizer reminder schedules for the farmer or permitted helper.
    Ordered by due date.
    """
    query = db.query(models.FertilizerSchedule)

    if current_user.role == "family_helper":
        perm_farmers = [
            p.farmer_id for p in db.query(models.FarmAccessPermission).filter(
                models.FarmAccessPermission.helper_id == current_user.id,
                models.FarmAccessPermission.is_active == True
            ).all()
        ]
        query = query.filter(
            (models.FertilizerSchedule.user_id == current_user.id) |
            (models.FertilizerSchedule.user_id.in_(perm_farmers))
        )
    else:
        query = query.filter(models.FertilizerSchedule.user_id == current_user.id)

    if status_filter:
        query = query.filter(models.FertilizerSchedule.status == status_filter)

    return query.order_by(models.FertilizerSchedule.due_date.asc()).all()


@router.post("/fertilizer-schedules", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule_task(
    data: ScheduleCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adds a custom fertilizer reminder task."""
    task = models.FertilizerSchedule(
        user_id=current_user.id,
        recommendation_id=data.recommendation_id,
        task_title=data.task_title,
        stage_name=data.stage_name,
        due_date=data.due_date,
        product_name=data.product_name,
        quantity_kg=data.quantity_kg,
        application_method=data.application_method,
        status="pending",
        notes=data.notes
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/fertilizer-schedules/{id}", response_model=ScheduleResponse)
def update_schedule_task(
    id: str,
    data: ScheduleUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates schedule task status (e.g., marks completed).
    Verifies user ownership or helper permissions.
    """
    task = db.query(models.FertilizerSchedule).filter(models.FertilizerSchedule.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule task not found")

    if task.user_id != current_user.id:
        perm = db.query(models.FarmAccessPermission).filter(
            models.FarmAccessPermission.farmer_id == task.user_id,
            models.FarmAccessPermission.helper_id == current_user.id,
            models.FarmAccessPermission.is_active == True
        ).first()
        if not perm:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if data.status:
        task.status = data.status
        if data.status == "completed":
            task.completed_at = datetime.utcnow()
        elif data.status == "pending":
            task.completed_at = None

    if data.notes is not None:
        task.notes = data.notes

    if data.due_date is not None:
        task.due_date = data.due_date

    db.commit()
    db.refresh(task)
    return task


@router.delete("/fertilizer-schedules/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_task(
    id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a schedule task."""
    task = db.query(models.FertilizerSchedule).filter(
        models.FertilizerSchedule.id == id,
        models.FertilizerSchedule.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule task not found or unauthorized")

    db.delete(task)
    db.commit()
    return None
