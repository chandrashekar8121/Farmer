from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.schemas.schemas import UserRegister, UserLogin, Token, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.core.config import settings

router = APIRouter()


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(data: UserRegister, db: Session = Depends(get_db)):
    """Registers a new farmer or family helper account."""
    existing = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please login."
        )

    user = models.User(
        email=data.email.lower(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        phone_number=data.phone_number,
        language_preference=data.language_preference,
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically create a default farm for farmers
    if user.role == "farmer":
        default_farm = models.Farm(
            user_id=user.id,
            farm_name=f"{user.full_name}'s Farm (ప్రధాన పొలం)",
            land_area=2.0,
            area_unit="acres",
            soil_type="Clay Loam (నల్లరేగడి / ఎర్ర నేల)",
            state="Andhra Pradesh",
            district="Krishna",
            village="Main Village",
            irrigation_type="canal"
        )
        db.add(default_farm)
        db.commit()

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "role": user.role,
        "language_preference": user.language_preference
    }


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticates farmer or helper and returns JWT access token."""
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify and try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is deactivated")

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": user.full_name,
        "role": user.role,
        "language_preference": user.language_preference
    }


@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: models.User = Depends(get_current_user)):
    """Retrieves authenticated farmer's profile."""
    return current_user
