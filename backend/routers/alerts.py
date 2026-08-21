import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from routers.auth import get_current_user_id
from database import db_manager
from services.whatsapp_service import WhatsAppAlertService

logger = logging.getLogger("InsightX.Alerts")

router = APIRouter(prefix="/api/alerts", tags=["WhatsApp Risk Alerts"])

class WhatsAppAlertRequest(BaseModel):
    project_id: str
    phone_number_override: Optional[str] = None

@router.post("/whatsapp")
async def send_whatsapp_alert(
    req: WhatsAppAlertRequest,
    user_id: str = Depends(get_current_user_id)
):
    logger.info("WhatsApp alert request - user_id=%s project_id=%s", user_id, req.project_id)
    
    try:
        users_col = db_manager.get_collection("users")
        user = await users_col.find_one({"id": user_id})
        if not user:
            logger.error("User not found in database - user_id=%s", user_id)
            raise HTTPException(status_code=404, detail="User profile not found.")

        logger.info("User found - email=%s phone=%s", user.get("email"), user.get("phone_number"))

        preds_col = db_manager.get_collection("predictions")
        pred = await preds_col.find_one({"project_id": req.project_id})
        if not pred:
            logger.error("Prediction not found - project_id=%s", req.project_id)
            raise HTTPException(status_code=404, detail="Project ML analysis results not found.")

        logger.info("Prediction found - project_id=%s", req.project_id)

        target_phone = req.phone_number_override or user.get("phone_number")
        if not isinstance(target_phone, str) or len(target_phone.strip()) < 5:
            logger.warning("Invalid phone number - target_phone=%s user_phone=%s override=%s", 
                          target_phone, user.get("phone_number"), req.phone_number_override)
            raise HTTPException(
                status_code=400,
                detail="No verified WhatsApp phone number registered. Please update your phone number in Settings."
            )

        logger.info("Target phone validated - phone=%s", target_phone)

        try:
            # Normalize the complete document once. Optional ML fields receive
            # meaningful display defaults; only a missing/invalid document fails.
            alert_data = WhatsAppAlertService.validate_prediction_result(pred)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        
        logger.info("Calling WhatsApp service - project=%s risk_score=%s", 
                   alert_data["project_name"], alert_data["risk_score"])
        
        alert_result = WhatsAppAlertService.send_risk_alert(
            phone_number=target_phone,
            project_name=alert_data["project_name"],
            risk_score=alert_data["risk_score"],
            primary_failure=alert_data["primary_failure"],
            root_cause_module=alert_data["root_cause_module"],
            hotspots=alert_data["hotspots"],
            delay_forecast_days=alert_data["delay_forecast_days"],
            intervention_savings_usd=alert_data["intervention_savings_usd"],
            twilio_account_sid=user.get("twilio_account_sid"),
            twilio_auth_token=user.get("twilio_auth_token"),
            twilio_whatsapp_number=user.get("twilio_whatsapp_number"),
            metrics=alert_data["metrics"],
            failure_rankings=alert_data["failure_rankings"],
            burnout_score=alert_data["burnout_score"],
            ai_recommendations=alert_data["ai_recommendations"],
            model_confidence=alert_data["model_confidence"],
            source_type=alert_data["source_type"],
        )

        logger.info("WhatsApp service result - success=%s delivered=%s sid=%s", 
                   alert_result.get("success"), alert_result.get("delivered"), alert_result.get("message_sid"))

        # Determine real status from delivery confirmation
        real_status = (
            "DELIVERED"  if alert_result.get("delivered")
            else "SENT_PENDING" if alert_result.get("sent_via_twilio_api")
            else "FAILED"
        )

        alert_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "project_id": req.project_id,
            "phone_number": target_phone,
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
            "status": real_status,
            "delivery_status": alert_result.get("delivery_status"),
            "message_sid": alert_result.get("message_sid"),
            "error_detail": alert_result.get("error_detail"),
            "sandbox_note": alert_result.get("sandbox_note"),
        }
        alerts_col = db_manager.get_collection("alerts")
        await alerts_col.insert_one(alert_doc)
        logger.info("Alert logged to database - alert_id=%s status=%s", alert_doc["id"], real_status)

        return alert_result
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.exception("Unexpected error in WhatsApp alert endpoint - user_id=%s project_id=%s error=%s", 
                        user_id, req.project_id, str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while sending WhatsApp alert: {str(e)}"
        )
