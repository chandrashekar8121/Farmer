import jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.database import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    # Check if Supabase JWT secret is configured
    jwt_secret = settings.SUPABASE_JWT_SECRET if settings.SUPABASE_JWT_SECRET else settings.SECRET_KEY
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[settings.ALGORITHM, "HS256"])
        return payload
    except jwt.PyJWTError:
        # Try fallback with default secret key
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM, "HS256"])
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials or token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )


def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    user_id: str = payload.get("sub") or payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    return user


def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[models.User]:
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub") or payload.get("user_id")
        if not user_id:
            return None
        return db.query(models.User).filter(models.User.id == user_id, models.User.is_active == True).first()
    except Exception:
        return None


def verify_farm_ownership_or_permission(farm_id: str, user: models.User, db: Session) -> models.Farm:
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    if farm.user_id == user.id:
        return farm

    # Check family helper permission
    perm = db.query(models.FarmAccessPermission).filter(
        models.FarmAccessPermission.farmer_id == farm.user_id,
        models.FarmAccessPermission.helper_id == user.id,
        models.FarmAccessPermission.is_active == True
    ).first()

    if not perm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not own this farm and lack helper authorization."
        )
    return farm
