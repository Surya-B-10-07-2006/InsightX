import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from database import db_manager
from security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone_number: str = Field(..., description="Verified phone number for WhatsApp alerts")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SettingsUpdateRequest(BaseModel):
    phone_number: Optional[str] = None
    groq_api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_whatsapp_number: Optional[str] = None
    github_token: Optional[str] = None

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")
    return payload["sub"]

@router.post("/signup")
async def signup(req: SignupRequest):
    users_col = db_manager.get_collection("users")
    existing = await users_col.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "_id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "password_hash": hash_password(req.password),
        "phone_number": req.phone_number,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await users_col.insert_one(user_doc)
    token = create_access_token({"sub": user_id, "email": req.email.lower()})

    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": req.name,
            "email": req.email.lower(),
            "phone_number": req.phone_number
        }
    }

@router.post("/login")
async def login(req: LoginRequest):
    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password credentials")

    token = create_access_token({"sub": user["id"], "email": user["email"]})

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone_number": user.get("phone_number", "")
        }
    }

@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user_id)):
    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=444, detail="User not found")
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "phone_number": user.get("phone_number", "")
    }

@router.put("/settings")
async def update_settings(req: SettingsUpdateRequest, user_id: str = Depends(get_current_user_id)):
    users_col = db_manager.get_collection("users")
    update_data = {}
    if req.phone_number:
        update_data["phone_number"] = req.phone_number
    if req.groq_api_key is not None:
        update_data["groq_api_key"] = req.groq_api_key
    if req.twilio_account_sid is not None:
        update_data["twilio_account_sid"] = req.twilio_account_sid
    if req.twilio_auth_token is not None:
        update_data["twilio_auth_token"] = req.twilio_auth_token
    if req.twilio_whatsapp_number is not None:
        update_data["twilio_whatsapp_number"] = req.twilio_whatsapp_number
    if req.github_token is not None:
        update_data["github_token"] = req.github_token

    if update_data:
        await users_col.update_one({"id": user_id}, {"$set": update_data})

    updated_user = await users_col.find_one({"id": user_id})
    return {
        "message": "Settings updated successfully",
        "user": {
            "id": updated_user["id"],
            "name": updated_user["name"],
            "email": updated_user["email"],
            "phone_number": updated_user.get("phone_number", "")
        }
    }
