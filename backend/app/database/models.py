import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Float, Integer, Text, DateTime, ForeignKey, Date, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(20), nullable=True)
    language_preference = Column(String(10), default="en")  # en, te, hi
    role = Column(String(30), default="farmer")  # farmer, family_helper, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")
    soil_tests = relationship("SoilTest", back_populates="user", cascade="all, delete-orphan")
    schedules = relationship("FertilizerSchedule", back_populates="user", cascade="all, delete-orphan")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    farm_name = Column(String(120), nullable=False)
    land_area = Column(Float, nullable=False)
    area_unit = Column(String(20), default="acres")  # acres, hectares, sq_meters
    soil_type = Column(String(60), nullable=False)
    state = Column(String(80), nullable=False)
    district = Column(String(80), nullable=False)
    village = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    irrigation_type = Column(String(60), default="canal")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="farms")
    soil_tests = relationship("SoilTest", back_populates="farm", cascade="all, delete-orphan")


class UploadedReport(Base):
    __tablename__ = "uploaded_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    storage_path = Column(Text, nullable=True)
    extracted_data = Column(JSON, default={})
    extraction_status = Column(String(40), default="success")  # success, partial, failed
    verified_by_user = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SoilTest(Base):
    __tablename__ = "soil_tests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=True, index=True)
    report_id = Column(String(36), ForeignKey("uploaded_reports.id"), nullable=True)
    sample_date = Column(Date, default=datetime.utcnow().date)
    nitrogen_mg_kg = Column(Float, nullable=False)
    phosphorus_mg_kg = Column(Float, nullable=False)
    potassium_mg_kg = Column(Float, nullable=False)
    soil_ph = Column(Float, nullable=False)
    organic_carbon_percent = Column(Float, nullable=True)
    electrical_conductivity_ds_m = Column(Float, nullable=True)
    lab_name = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="soil_tests")
    farm = relationship("Farm", back_populates="soil_tests")


class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=True)
    soil_test_id = Column(String(36), ForeignKey("soil_tests.id"), nullable=True)
    predicted_crop = Column(String(80), nullable=False)
    secondary_crops = Column(JSON, default=[])
    confidence_score = Column(Float, nullable=True)
    explanation = Column(Text, nullable=False)
    seasonal_advisory = Column(Text, nullable=True)
    input_parameters = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class FertilizerProduct(Base):
    __tablename__ = "fertilizer_products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_name = Column(String(120), unique=True, nullable=False)
    generic_name = Column(String(120), nullable=False)
    n_percent = Column(Float, default=0.0)
    p_percent = Column(Float, default=0.0)
    k_percent = Column(Float, default=0.0)
    other_nutrients = Column(String(120), nullable=True)
    bag_size_kg = Column(Float, default=50.0)
    standard_price_inr = Column(Float, nullable=False)
    is_subsidized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProductPrice(Base):
    __tablename__ = "product_prices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("fertilizer_products.id"), nullable=False)
    state = Column(String(80), default="ALL")
    price_inr = Column(Float, nullable=False)
    effective_date = Column(Date, default=datetime.utcnow().date)
    source_note = Column(String(255), default="Government Subsidized MRP")
    created_at = Column(DateTime, default=datetime.utcnow)


class FertilizerRecommendation(Base):
    __tablename__ = "fertilizer_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=True)
    soil_test_id = Column(String(36), ForeignKey("soil_tests.id"), nullable=True)
    crop_name = Column(String(80), nullable=False)
    growth_stage = Column(String(60), nullable=False)
    target_area = Column(Float, nullable=False)
    area_unit = Column(String(20), default="acres")
    nutrient_status = Column(JSON, nullable=False)
    recommended_products = Column(JSON, nullable=False)
    total_estimated_cost = Column(Float, default=0.0)
    safety_instructions = Column(Text, nullable=False)
    recommendation_source = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class FertilizerSchedule(Base):
    __tablename__ = "fertilizer_schedules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    recommendation_id = Column(String(36), ForeignKey("fertilizer_recommendations.id"), nullable=True)
    task_title = Column(String(150), nullable=False)
    stage_name = Column(String(80), nullable=False)
    due_date = Column(Date, nullable=False)
    product_name = Column(String(120), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    application_method = Column(String(120), default="Broadcasting")
    status = Column(String(30), default="pending")  # pending, completed, skipped
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="schedules")


class FamilyInvitation(Base):
    __tablename__ = "family_invitations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farmer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    invitee_phone = Column(String(20), nullable=False)
    invite_code = Column(String(12), unique=True, nullable=False)
    status = Column(String(30), default="pending")  # pending, accepted, rejected, expired
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class FarmAccessPermission(Base):
    __tablename__ = "farm_access_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farmer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    helper_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    permission_level = Column(String(40), default="read_only")  # read_only, manager
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
