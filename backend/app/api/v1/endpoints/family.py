import random
import string
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database import models
from app.schemas.schemas import FamilyInviteCreate, FamilyInviteAccept, FamilyPermissionResponse
from app.core.security import get_current_user

router = APIRouter()


def generate_invite_code(length: int = 6) -> str:
    """Generates an uppercase readable 6-character authorization code."""
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # omit ambiguous I, 1, O, 0
    return "".join(random.choice(chars) for _ in range(length))


@router.post("/family/invite")
def create_family_invitation(
    data: FamilyInviteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Farmer creates an explicit invitation for a family member.
    Generates a secure 6-character code valid for 7 days.
    """
    code = generate_invite_code()
    # Check uniqueness
    while db.query(models.FamilyInvitation).filter(models.FamilyInvitation.invite_code == code).first():
        code = generate_invite_code()

    invitation = models.FamilyInvitation(
        farmer_id=current_user.id,
        invitee_phone=data.invitee_phone,
        invite_code=code,
        status="pending",
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return {
        "message": "Invitation created successfully",
        "invite_code": code,
        "invitee_phone": data.invitee_phone,
        "expires_at": invitation.expires_at.isoformat(),
        "instructions": "Share this 6-letter code with your son, daughter, or helper. Once entered in their dashboard, they can view your farm recommendations."
    }


@router.post("/family/accept")
def accept_family_invitation(
    data: FamilyInviteAccept,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Family helper enters code to gain explicit, authorized access to farmer records.
    """
    inv = db.query(models.FamilyInvitation).filter(
        models.FamilyInvitation.invite_code == data.invite_code.strip().upper(),
        models.FamilyInvitation.status == "pending"
    ).first()

    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired invitation code. Please request a new code from the farmer."
        )

    if datetime.utcnow() > inv.expires_at:
        inv.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation code has expired."
        )

    if inv.farmer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot accept your own invitation."
        )

    # Check existing permission
    existing_perm = db.query(models.FarmAccessPermission).filter(
        models.FarmAccessPermission.farmer_id == inv.farmer_id,
        models.FarmAccessPermission.helper_id == current_user.id
    ).first()

    if not existing_perm:
        perm = models.FarmAccessPermission(
            farmer_id=inv.farmer_id,
            helper_id=current_user.id,
            permission_level="read_only",
            is_active=True
        )
        db.add(perm)

    inv.status = "accepted"
    db.commit()

    farmer = db.query(models.User).filter(models.User.id == inv.farmer_id).first()
    farmer_name = farmer.full_name if farmer else "Farmer"

    return {
        "message": f"Successfully authorized! You now have access to {farmer_name}'s farm records.",
        "farmer_name": farmer_name,
        "permission_level": "read_only"
    }


@router.get("/family/farmers", response_model=List[FamilyPermissionResponse])
def list_authorized_farmers(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists farmers that the current family helper has been authorized to access."""
    perms = db.query(models.FarmAccessPermission).filter(
        models.FarmAccessPermission.helper_id == current_user.id,
        models.FarmAccessPermission.is_active == True
    ).all()

    result = []
    for p in perms:
        farmer = db.query(models.User).filter(models.User.id == p.farmer_id).first()
        result.append(FamilyPermissionResponse(
            id=p.id,
            farmer_id=p.farmer_id,
            farmer_name=farmer.full_name if farmer else "Unknown Farmer",
            farmer_phone=farmer.phone_number if farmer else None,
            permission_level=p.permission_level,
            is_active=p.is_active,
            created_at=p.created_at
        ))
    return result


@router.get("/family/helpers")
def list_farmer_helpers(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Farmer views all authorized helpers on their account."""
    perms = db.query(models.FarmAccessPermission).filter(
        models.FarmAccessPermission.farmer_id == current_user.id
    ).all()

    result = []
    for p in perms:
        helper = db.query(models.User).filter(models.User.id == p.helper_id).first()
        result.append({
            "permission_id": p.id,
            "helper_name": helper.full_name if helper else "Helper",
            "helper_email": helper.email if helper else "",
            "helper_phone": helper.phone_number if helper else "",
            "permission_level": p.permission_level,
            "is_active": p.is_active,
            "created_at": p.created_at.isoformat()
        })
    return {"helpers": result}


@router.delete("/family/helpers/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_helper_access(
    permission_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Farmer revokes access from a helper."""
    perm = db.query(models.FarmAccessPermission).filter(
        models.FarmAccessPermission.id == permission_id,
        models.FarmAccessPermission.farmer_id == current_user.id
    ).first()

    if not perm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission record not found or unauthorized")

    db.delete(perm)
    db.commit()
    return None
