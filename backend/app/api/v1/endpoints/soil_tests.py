import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.schemas.schemas import SoilTestCreate, SoilTestResponse, UploadReportResponse
from app.core.security import get_current_user
from app.core.config import settings
from app.services.ocr_service import parse_soil_document

router = APIRouter()


@router.post("/soil-tests", response_model=SoilTestResponse, status_code=status.HTTP_201_CREATED)
def create_soil_test(
    data: SoilTestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Saves a verified soil test record.
    Rejects negative values or invalid pH (enforced by Pydantic schema).
    """
    # Verify farm ownership if farm_id supplied
    if data.farm_id:
        farm = db.query(models.Farm).filter(models.Farm.id == data.farm_id).first()
        if not farm:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified farm does not exist")
        if farm.user_id != current_user.id:
            # Check family helper permission
            perm = db.query(models.FarmAccessPermission).filter(
                models.FarmAccessPermission.farmer_id == farm.user_id,
                models.FarmAccessPermission.helper_id == current_user.id,
                models.FarmAccessPermission.is_active == True
            ).first()
            if not perm:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this farm")

    soil_test = models.SoilTest(
        user_id=current_user.id,
        farm_id=data.farm_id,
        report_id=data.report_id,
        sample_date=data.sample_date or None,
        nitrogen_mg_kg=data.nitrogen_mg_kg,
        phosphorus_mg_kg=data.phosphorus_mg_kg,
        potassium_mg_kg=data.potassium_mg_kg,
        soil_ph=data.soil_ph,
        organic_carbon_percent=data.organic_carbon_percent,
        electrical_conductivity_ds_m=data.electrical_conductivity_ds_m,
        lab_name=data.lab_name,
        notes=data.notes
    )
    db.add(soil_test)
    db.commit()
    db.refresh(soil_test)
    return soil_test


@router.post("/soil-tests/upload", response_model=UploadReportResponse)
async def upload_soil_report(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts PDF, PNG, or JPG soil test documents.
    Validates file type and size (< 5MB).
    Extracts N, P, K, pH via document parsing/OCR.
    Returns parsed values for farmer review and verification.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS and ext != ".txt":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{ext}'. Allowed formats: PDF, PNG, JPG."
        )

    content = await file.read()
    file_size = len(content)

    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 5 MB ({round(file_size / (1024*1024), 2)} MB received)."
        )

    # Secure file storage path (saved in server uploads directory without public web exposure)
    uploads_dir = os.path.join(os.getcwd(), "storage", "reports", current_user.id)
    os.makedirs(uploads_dir, exist_ok=True)
    stored_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(uploads_dir, stored_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Parse document
    extracted_data, extraction_status, message = parse_soil_document(content, file.filename)

    # Store report record in DB
    report_record = models.UploadedReport(
        user_id=current_user.id,
        file_name=file.filename,
        file_type=file.content_type or ext,
        file_size_bytes=file_size,
        storage_path=file_path,
        extracted_data=extracted_data,
        extraction_status=extraction_status,
        verified_by_user=False
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)

    return {
        "report_id": report_record.id,
        "file_name": file.filename,
        "file_type": report_record.file_type,
        "file_size_bytes": file_size,
        "extracted_data": extracted_data,
        "extraction_status": extraction_status,
        "message": message
    }


@router.get("/soil-tests", response_model=List[SoilTestResponse])
def list_soil_tests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists soil test history for the authenticated farmer or authorized helper."""
    if current_user.role == "family_helper":
        # Find permitted farmers
        perm_farmers = [
            p.farmer_id for p in db.query(models.FarmAccessPermission).filter(
                models.FarmAccessPermission.helper_id == current_user.id,
                models.FarmAccessPermission.is_active == True
            ).all()
        ]
        return db.query(models.SoilTest).filter(
            (models.SoilTest.user_id == current_user.id) | (models.SoilTest.user_id.in_(perm_farmers))
        ).order_by(models.SoilTest.created_at.desc()).all()

    return db.query(models.SoilTest).filter(
        models.SoilTest.user_id == current_user.id
    ).order_by(models.SoilTest.created_at.desc()).all()


@router.get("/soil-tests/{id}", response_model=SoilTestResponse)
def get_soil_test(
    id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves a single soil test with ownership enforcement."""
    test = db.query(models.SoilTest).filter(models.SoilTest.id == id).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Soil test not found")

    if test.user_id != current_user.id:
        perm = db.query(models.FarmAccessPermission).filter(
            models.FarmAccessPermission.farmer_id == test.user_id,
            models.FarmAccessPermission.helper_id == current_user.id,
            models.FarmAccessPermission.is_active == True
        ).first()
        if not perm:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

    return test


@router.delete("/soil-tests/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_soil_test(
    id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a soil test record owned by current user."""
    test = db.query(models.SoilTest).filter(
        models.SoilTest.id == id,
        models.SoilTest.user_id == current_user.id
    ).first()
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Soil test not found or unauthorized")

    db.delete(test)
    db.commit()
    return None
