import time
import logging
import math
from typing import Dict, Any, Optional, List
from config import settings

logger = logging.getLogger("InsightX.WhatsApp")

# Delivery statuses Twilio considers terminal successes
_DELIVERED_STATUSES = {"delivered", "sent", "read"}
# Terminal failure statuses
_FAILED_STATUSES    = {"failed", "undelivered"}


class WhatsAppAlertService:
    """Twilio WhatsApp integration — sends detailed actionable risk alerts
    and verifies actual delivery status before reporting success."""

    @staticmethod
    def _number(value: Any, default: float = 0.0) -> float:
        """Return a finite number so message formatting never receives None."""
        try:
            number = float(value)
            return number if math.isfinite(number) else default
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _whole_number(value: Any, default: int = 0) -> int:
        return int(WhatsAppAlertService._number(value, float(default)))

    @staticmethod
    def _text(value: Any, default: str) -> str:
        if value is None:
            return default
        text = str(value).strip()
        return text or default

    @staticmethod
    def _mapping(value: Any) -> Dict[str, Any]:
        return value if isinstance(value, dict) else {}

    @staticmethod
    def _list(value: Any) -> List[Any]:
        return value if isinstance(value, list) else []

    @classmethod
    def validate_prediction_result(cls, prediction: Any) -> Dict[str, Any]:
        """Validate and normalize a stored prediction for WhatsApp rendering.

        A prediction document and recipient are the only required inputs. ML output
        fields are optional because older/incomplete results can still produce a
        useful alert with explicit defaults.
        """
        if not isinstance(prediction, dict):
            raise ValueError("Prediction result is missing or invalid.")

        ml = cls._mapping(prediction.get("ml_results"))
        graph = cls._mapping(prediction.get("network_graph"))
        roi = cls._mapping(prediction.get("intervention_roi"))
        forecasts = cls._mapping(ml.get("forecasts"))
        impact = cls._mapping(roi.get("aggregated_impact"))
        delay_values = cls._list(forecasts.get("predicted_delay_days"))
        hotspots = [
            {**item, "file": cls._text(item.get("file"), "N/A")}
            for item in cls._list(prediction.get("hotspots")) if isinstance(item, dict)
        ]
        failure_rankings = [
            item for item in cls._list(ml.get("failure_rankings")) if isinstance(item, dict)
        ]
        raw_recommendations = cls._list(
            cls._mapping(prediction.get("ai_explanations")).get("preventive_recommendations")
        )
        recommendations = [cls._text(item, "") for item in raw_recommendations if cls._text(item, "")]

        return {
            "project_name": cls._text(prediction.get("filename") or prediction.get("project_name"), "Unknown Project"),
            "risk_score": cls._number(ml.get("overall_risk_score")),
            "primary_failure": cls._text(ml.get("primary_failure_type"), "Unknown"),
            "root_cause_module": cls._text(graph.get("root_cause_module"), "Unknown"),
            "hotspots": hotspots,
            "delay_forecast_days": cls._number(delay_values[-1] if delay_values else None),
            "intervention_savings_usd": cls._whole_number(impact.get("total_estimated_savings_usd")),
            "metrics": cls._mapping(prediction.get("metrics")),
            "failure_rankings": failure_rankings,
            "burnout_score": cls._number(cls._mapping(ml.get("burnout_analysis")).get("burnout_risk_score")),
            "ai_recommendations": recommendations,
            "model_confidence": cls._number(ml.get("model_confidence")),
            "source_type": cls._text(prediction.get("source_type"), "Unknown"),
        }

    @staticmethod
    def _build_message(
        project_name: str,
        risk_score: float,
        primary_failure: str,
        root_cause_module: str,
        hotspots: list,
        delay_forecast_days: float,
        intervention_savings_usd: int,
        metrics: Dict[str, Any],
        failure_rankings: List[Dict[str, Any]],
        burnout_score: float,
        ai_recommendations: List[str],
        model_confidence: float = 0.0,
        source_type: str = "PROJECT_ZIP",
    ) -> str:
        # This method is used directly by integrations too, so normalize every
        # value before any f-string format specification is evaluated.
        project_name = WhatsAppAlertService._text(project_name, "Unknown Project")
        risk_score = WhatsAppAlertService._number(risk_score)
        primary_failure = WhatsAppAlertService._text(primary_failure, "Unknown")
        root_cause_module = WhatsAppAlertService._text(root_cause_module, "Unknown")
        delay_forecast_days = WhatsAppAlertService._number(delay_forecast_days)
        intervention_savings_usd = WhatsAppAlertService._whole_number(intervention_savings_usd)
        model_confidence = WhatsAppAlertService._number(model_confidence)
        hotspots = [item for item in WhatsAppAlertService._list(hotspots) if isinstance(item, dict)]
        failure_rankings = [item for item in WhatsAppAlertService._list(failure_rankings) if isinstance(item, dict)]
        ai_recommendations = [
            WhatsAppAlertService._text(item, "")
            for item in WhatsAppAlertService._list(ai_recommendations)
            if WhatsAppAlertService._text(item, "")
        ]
        risk_label = "CRITICAL" if risk_score >= 75 else "HIGH" if risk_score >= 50 else "MODERATE"
        risk_emoji = "🚨" if risk_score >= 75 else "⚠️" if risk_score >= 50 else "📊"
        
        hotspot_name = lambda item: WhatsAppAlertService._text(item.get("file"), "N/A").split("/")[-1]
        top_hotspot  = hotspot_name(hotspots[0]) if hotspots else "N/A"
        second_hotspot = hotspot_name(hotspots[1]) if len(hotspots) > 1 else None
        third_hotspot = hotspot_name(hotspots[2]) if len(hotspots) > 2 else None

        # Top 3 failure modes
        top_failures = [
            {
                **failure,
                "failure_type": WhatsAppAlertService._text(failure.get("failure_type"), "Unknown"),
                "probability": WhatsAppAlertService._number(failure.get("probability")),
                "severity": WhatsAppAlertService._text(failure.get("severity"), "N/A"),
            }
            for failure in failure_rankings[:3]
        ]
        failure_lines = "\n".join(
            f"  {i+1}. {f.get('failure_type','?')} — {f.get('probability','?')}% risk [{f.get('severity','?')}]"
            for i, f in enumerate(top_failures)
        )

        # Top 3 recommendations (strip to plain text, no markdown backticks)
        recs = ai_recommendations[:3] if ai_recommendations else [
            f"Refactor {root_cause_module.split('/')[-1]} to reduce coupling below 0.4",
            "Add automated tests for detected hotspot modules",
            "Enforce PR gates with complexity < 12",
        ]
        rec_lines = "\n".join(f"  ⚡ {i+1}. {r}" for i, r in enumerate(recs))

        # Hotspots section
        hotspot_lines = [f"  🔥 {top_hotspot}"]
        if second_hotspot:
            hotspot_lines.append(f"  🔥 {second_hotspot}")
        if third_hotspot:
            hotspot_lines.append(f"  🔥 {third_hotspot}")

        # Forecast section
        forecast_emoji = "📈" if delay_forecast_days > 10 else "📊"
        
        lines = [
            f"{risk_emoji} *InsightX — Project Intelligence Alert*",
            f"📁 {project_name}",
            "",
            f"🚨 *Risk Assessment*",
            f"  • Score: {risk_score}/100 ({risk_label})",
            f"  • Confidence: {model_confidence:.1f}%",
            f"  • Severity: {risk_label}",
            "",
            f"🎯 *Failure Prediction*",
            failure_lines if failure_lines else f"  • Primary: {primary_failure}",
            f"  • Affected Files: {len(hotspots)} hotspot(s)",
            "",
            f"🔥 *Hotspots*",
            "\n".join(hotspot_lines),
            "",
            f"📊 *Forecast*",
            f"  {forecast_emoji} 7-Day: +{delay_forecast_days * 0.3:.1f} days delay",
            f"  {forecast_emoji} 14-Day: +{delay_forecast_days * 0.6:.1f} days delay",
            f"  {forecast_emoji} 30-Day: +{delay_forecast_days:.1f} days delay",
            "",
            f"🛡️ *Compliance Status*",
            f"  • Code Quality: {'⚠️ Action Needed' if risk_score >= 50 else '✅ Within Thresholds'}",
            f"  • Technical Debt: {'🔴 Critical' if risk_score >= 75 else '🟡 Elevated' if risk_score >= 50 else '🟢 Managed'}",
            "",
            f"⚡ *Top Actions*",
            rec_lines,
            "",
            f"💰 *ROI Impact*",
            f"  • Estimated Savings: ${intervention_savings_usd:,}",
            f"  • Cost of Inaction: ${intervention_savings_usd * 2:,}",
            "",
            f"🤖 *AI Summary*",
            f"  {risk_label} risk detected in {project_name}. ",
            f"Primary concern: {primary_failure}. ",
            f"Immediate attention recommended for {len(hotspots)} hotspot(s).",
            "",
            f"📋 *Full Report & Dashboard*",
            f"  http://localhost:5173/dashboard",
            "",
            f"───",
            f"Generated by InsightX ML Platform",
        ]
        return "\n".join(lines)

    @staticmethod
    def _poll_delivery_status(
        client: Any,
        message_sid: str,
        max_wait_seconds: int = 12,
        poll_interval: float = 2.0,
    ) -> str:
        """Poll Twilio for terminal delivery status. Returns final status string."""
        elapsed = 0.0
        while elapsed < max_wait_seconds:
            try:
                msg = client.messages(message_sid).fetch()
                status = (msg.status or "").lower()
                if status in _DELIVERED_STATUSES or status in _FAILED_STATUSES:
                    if msg.error_code:
                        logger.warning(
                            "Twilio delivery status=%s error_code=%s to=%s",
                            status, msg.error_code, msg.to,
                        )
                    else:
                        logger.info(
                            "Twilio delivery confirmed status=%s SID=%s to=%s",
                            status, message_sid, msg.to,
                        )
                    return status
            except Exception as e:
                logger.warning("Twilio status poll error: %s", str(e))
                break
            time.sleep(poll_interval)
            elapsed += poll_interval
        # Non-terminal after timeout — return last known status
        try:
            return (client.messages(message_sid).fetch().status or "queued").lower()
        except Exception:
            return "queued"

    @staticmethod
    def send_risk_alert(
        phone_number: str,
        project_name: str,
        risk_score: float,
        primary_failure: str,
        root_cause_module: str,
        hotspots: list,
        delay_forecast_days: float,
        intervention_savings_usd: int,
        twilio_account_sid: Optional[str] = None,
        twilio_auth_token: Optional[str] = None,
        twilio_whatsapp_number: Optional[str] = None,
        metrics: Optional[Dict[str, Any]] = None,
        failure_rankings: Optional[List[Dict[str, Any]]] = None,
        burnout_score: float = 0.0,
        ai_recommendations: Optional[List[str]] = None,
        model_confidence: float = 0.0,
        source_type: str = "PROJECT_ZIP",
    ) -> Dict[str, Any]:
        if not isinstance(phone_number, str) or not phone_number.strip():
            raise ValueError("A recipient WhatsApp phone number is required.")
        metrics = WhatsAppAlertService._mapping(metrics)
        failure_rankings = WhatsAppAlertService._list(failure_rankings)
        ai_recommendations = WhatsAppAlertService._list(ai_recommendations)

        # Normalise phone to whatsapp:+E.164
        clean_phone = phone_number.strip().replace(" ", "").replace("-", "")
        
        # Handle existing whatsapp: prefix
        if clean_phone.startswith("whatsapp:"):
            target_wa = clean_phone
            # Ensure the number part has + prefix
            number_part = clean_phone.replace("whatsapp:", "")
            if not number_part.startswith("+"):
                target_wa = f"whatsapp:+{number_part}"
        else:
            # Add + if missing, then add whatsapp: prefix
            if not clean_phone.startswith("+"):
                clean_phone = "+" + clean_phone
            target_wa = f"whatsapp:{clean_phone}"

        # Resolve credentials — per-user DB values override .env
        sid         = (twilio_account_sid  or "").strip() or settings.TWILIO_ACCOUNT_SID
        token       = (twilio_auth_token   or "").strip() or settings.TWILIO_AUTH_TOKEN
        from_number = (twilio_whatsapp_number or "").strip() or settings.TWILIO_WHATSAPP_NUMBER

        message_body = WhatsAppAlertService._build_message(
            project_name, risk_score, primary_failure, root_cause_module,
            hotspots, delay_forecast_days, intervention_savings_usd,
            metrics, failure_rankings, burnout_score, ai_recommendations,
            model_confidence, source_type,
        )

        sent_via_api    = False
        delivered       = False
        message_sid: Optional[str] = None
        delivery_status: Optional[str] = None
        error_detail: Optional[str] = None
        sandbox_note: Optional[str] = None

        if not (sid and token):
            error_detail = (
                "Twilio credentials not configured. "
                "Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Settings or .env"
            )
            logger.warning("WhatsApp alert skipped — no Twilio credentials")
        else:
            try:
                from twilio.rest import Client

                client = Client(sid, token)
                msg = client.messages.create(
                    body=message_body,
                    from_=from_number,
                    to=target_wa,
                )
                message_sid = msg.sid
                logger.info("Twilio accepted message SID=%s to=%s — polling delivery", msg.sid, target_wa)

                # Poll for actual delivery confirmation
                delivery_status = WhatsAppAlertService._poll_delivery_status(client, msg.sid)
                sent_via_api = True

                if delivery_status in _DELIVERED_STATUSES:
                    delivered = True
                    logger.info("WhatsApp alert DELIVERED SID=%s status=%s", msg.sid, delivery_status)
                else:
                    # Fetch error details for logging
                    try:
                        fetched = client.messages(msg.sid).fetch()
                        err_code = fetched.error_code
                        err_msg  = fetched.error_message or ""
                    except Exception:
                        err_code, err_msg = None, ""

                    logger.warning(
                        "WhatsApp alert NOT delivered SID=%s status=%s error_code=%s error_msg=%s",
                        msg.sid, delivery_status, err_code, err_msg,
                    )

                    if err_code in (63015, 63016, 21608) or any(c in str(err_code) for c in ("63015", "63016", "21608")):
                        sandbox_note = (
                            "Twilio Sandbox opt-in required. "
                            f"From your recipient phone ({clean_phone}), send 'join <your-sandbox-keyword>' "
                            "to WhatsApp +14155238886, then retry dispatching. "
                            "Find your sandbox keyword at console.twilio.com > Messaging > Try it out > Send a WhatsApp message."
                        )
                        error_detail = f"Delivery failed (Twilio Error {err_code}): Recipient has not opted into the Twilio WhatsApp Sandbox."
                    elif err_code == 21211:
                        error_detail = f"Invalid phone number: {clean_phone}. Use E.164 format e.g. +14155552671"
                    elif err_code == 20003:
                        error_detail = "Twilio authentication failed. Verify credentials in Settings."
                    else:
                        error_detail = f"Delivery failed — status: {delivery_status}" + (f", error {err_code}: {err_msg}" if err_code else "")

            except Exception as e:
                err_str = str(e)
                error_detail = err_str
                logger.warning("Twilio API call failed: %s", err_str)

                if any(c in err_str for c in ("63015", "63016", "21608")):
                    sandbox_note = (
                        "Twilio Sandbox opt-in required. "
                        f"From your recipient phone ({clean_phone}), send 'join <your-sandbox-keyword>' "
                        "to WhatsApp +14155238886, then retry."
                    )
                    error_detail = "Twilio Error 63015: Recipient phone number has not joined the Twilio WhatsApp Sandbox."
                elif "21211" in err_str:
                    error_detail = f"Invalid phone number: {clean_phone}. Use E.164 format."
                elif "20003" in err_str:
                    error_detail = "Twilio authentication failed. Verify credentials."

        return {
            "success": delivered or (sent_via_api and delivery_status not in _FAILED_STATUSES),
            "delivered": delivered,
            "recipient_phone": clean_phone,
            "target_whatsapp": target_wa,
            "sent_via_twilio_api": sent_via_api,
            "delivery_status": delivery_status,
            "message_sid": message_sid,
            "status_note": (
                f"Alert delivered successfully (status: {delivery_status})" if delivered
                else sandbox_note if sandbox_note
                else error_detail or "Pending delivery confirmation"
            ),
            "sandbox_note": sandbox_note,
            "error_detail": error_detail if not delivered else None,
            "message_payload": message_body,
        }
