from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr, field_validator


# --- Auth & Profile Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Minimum 6 characters")
    full_name: str = Field(..., min_length=2, max_length=150)
    phone_number: Optional[str] = Field(None, pattern=r"^[0-9+ -]{7,15}$")
    language_preference: str = Field("en", pattern=r"^(en|te|hi)$")
    role: str = Field("farmer", pattern=r"^(farmer|family_helper)$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    full_name: str
    role: str
    language_preference: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str]
    language_preference: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Farm Schemas ---
class FarmCreate(BaseModel):
    farm_name: str = Field(..., min_length=1, max_length=120)
    land_area: float = Field(..., gt=0, description="Land area must be greater than 0")
    area_unit: str = Field("acres", pattern=r"^(acres|hectares|sq_meters)$")
    soil_type: str = Field(..., min_length=2, max_length=60)
    state: str = Field(..., min_length=2, max_length=80)
    district: str = Field(..., min_length=2, max_length=80)
    village: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    irrigation_type: str = Field("canal", max_length=60)


class FarmResponse(BaseModel):
    id: str
    user_id: str
    farm_name: str
    land_area: float
    area_unit: str
    soil_type: str
    state: str
    district: str
    village: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    irrigation_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Soil Test Schemas ---
class SoilTestCreate(BaseModel):
    farm_id: Optional[str] = None
    report_id: Optional[str] = None
    sample_date: Optional[date] = None
    nitrogen_mg_kg: float = Field(..., ge=0, le=2000, description="Nitrogen in mg/kg (ppm)")
    phosphorus_mg_kg: float = Field(..., ge=0, le=1000, description="Phosphorus in mg/kg (ppm)")
    potassium_mg_kg: float = Field(..., ge=0, le=2000, description="Potassium in mg/kg (ppm)")
    soil_ph: float = Field(..., ge=0.0, le=14.0, description="pH scale 0 to 14")
    organic_carbon_percent: Optional[float] = Field(None, ge=0.0, le=100.0)
    electrical_conductivity_ds_m: Optional[float] = Field(None, ge=0.0)
    lab_name: Optional[str] = Field(None, max_length=150)
    notes: Optional[str] = None


class SoilTestResponse(BaseModel):
    id: str
    user_id: str
    farm_id: Optional[str]
    report_id: Optional[str]
    sample_date: Optional[date]
    nitrogen_mg_kg: float
    phosphorus_mg_kg: float
    potassium_mg_kg: float
    soil_ph: float
    organic_carbon_percent: Optional[float]
    electrical_conductivity_ds_m: Optional[float]
    lab_name: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Report Upload Schemas ---
class UploadReportResponse(BaseModel):
    report_id: str
    file_name: str
    file_type: str
    file_size_bytes: int
    extracted_data: Dict[str, Any]
    extraction_status: str
    message: str


class VerifyReportRequest(BaseModel):
    nitrogen_mg_kg: float = Field(..., ge=0)
    phosphorus_mg_kg: float = Field(..., ge=0)
    potassium_mg_kg: float = Field(..., ge=0)
    soil_ph: float = Field(..., ge=0, le=14)
    farm_id: Optional[str] = None
    lab_name: Optional[str] = None


# --- Crop Recommendation Schemas ---
class CropRecommendationRequest(BaseModel):
    farm_id: Optional[str] = None
    soil_test_id: Optional[str] = None
    nitrogen_mg_kg: float = Field(..., ge=0, description="N in mg/kg")
    phosphorus_mg_kg: float = Field(..., ge=0, description="P in mg/kg")
    potassium_mg_kg: float = Field(..., ge=0, description="K in mg/kg")
    soil_ph: float = Field(..., ge=0, le=14, description="Soil pH")
    temperature: Optional[float] = Field(25.0, ge=-10, le=60, description="Celsius")
    humidity: Optional[float] = Field(70.0, ge=0, le=100, description="Percentage")
    rainfall: Optional[float] = Field(120.0, ge=0, le=3000, description="Annual / season mm")
    state: Optional[str] = None
    district: Optional[str] = None


class SecondaryCropItem(BaseModel):
    crop: str
    suitability: str
    confidence: float


class CropRecommendationResponse(BaseModel):
    id: Optional[str] = None
    predicted_crop: str
    secondary_crops: List[SecondaryCropItem] = []
    confidence_score: float
    explanation: str
    seasonal_advisory: str
    model_version: str
    data_source: str
    limitations: str
    input_parameters: Dict[str, Any]


# --- Fertilizer Recommendation Schemas ---
class FertilizerRecommendationRequest(BaseModel):
    farm_id: Optional[str] = None
    soil_test_id: Optional[str] = None
    crop_name: str = Field(..., min_length=2)
    growth_stage: str = Field("Basal (Land Preparation / Sowing)")
    target_area: float = Field(..., gt=0, description="Field area > 0")
    area_unit: str = Field("acres", pattern=r"^(acres|hectares|sq_meters)$")
    nitrogen_mg_kg: float = Field(..., ge=0)
    phosphorus_mg_kg: float = Field(..., ge=0)
    potassium_mg_kg: float = Field(..., ge=0)
    soil_ph: float = Field(..., ge=0, le=14)
    sowing_date: Optional[date] = None


class RecommendedProductItem(BaseModel):
    product_name: str
    generic_name: str
    quantity_kg: float
    bags: float
    bag_size_kg: float
    unit_price_inr: float
    subtotal_inr: float
    timing_stage: str
    application_method: str


class SplitScheduleItem(BaseModel):
    stage: str
    days_from_sowing: int
    due_date: Optional[date] = None
    product_name: str
    quantity_kg: float
    method: str
    instructions: str


class FertilizerRecommendationResponse(BaseModel):
    id: Optional[str] = None
    crop_name: str
    growth_stage: str
    target_area: float
    area_unit: str
    target_area_hectares: float
    nutrient_status: Dict[str, Any]
    recommended_products: List[RecommendedProductItem]
    split_schedule: List[SplitScheduleItem]
    total_estimated_cost_inr: float
    price_source: str
    safety_instructions: str
    recommendation_source: str
    assumptions: str


# --- Fertilizer Schedule Schemas ---
class ScheduleCreate(BaseModel):
    recommendation_id: Optional[str] = None
    task_title: str
    stage_name: str
    due_date: date
    product_name: str
    quantity_kg: float
    application_method: str
    notes: Optional[str] = None


class ScheduleUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern=r"^(pending|completed|skipped)$")
    notes: Optional[str] = None
    due_date: Optional[date] = None


class ScheduleResponse(BaseModel):
    id: str
    user_id: str
    recommendation_id: Optional[str]
    task_title: str
    stage_name: str
    due_date: date
    product_name: str
    quantity_kg: float
    application_method: str
    status: str
    completed_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Weather Schemas ---
class CurrentWeather(BaseModel):
    temperature_c: float
    feels_like_c: float
    humidity_percent: int
    wind_speed_kmh: float
    condition: str
    description: str
    icon: str
    rainfall_mm: float
    spray_advisory: str


class WeatherForecastItem(BaseModel):
    date: str
    temp_min_c: float
    temp_max_c: float
    condition: str
    rain_probability_percent: int


class WeatherResponse(BaseModel):
    location: str
    state: str
    latitude: float
    longitude: float
    is_live: bool
    data_source: str
    current: CurrentWeather
    forecast: List[WeatherForecastItem]
    notes: str


# --- Family & Helper Schemas ---
class FamilyInviteCreate(BaseModel):
    invitee_phone: str = Field(..., pattern=r"^[0-9+ -]{7,15}$")


class FamilyInviteAccept(BaseModel):
    invite_code: str = Field(..., min_length=4, max_length=12)


class FamilyPermissionResponse(BaseModel):
    id: str
    farmer_id: str
    farmer_name: str
    farmer_phone: Optional[str]
    permission_level: str
    is_active: bool
    created_at: datetime
