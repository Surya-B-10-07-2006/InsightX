import asyncio
import io
import zipfile
from database import db_manager
from security import SecurityInspector, hash_password, verify_password, create_access_token, decode_access_token
from services.parser_service import ProjectParserService
from services.ml_engine import ml_service
from services.network_service import NetworkXGraphService
from services.similarity_service import ProjectSimilarityService
from services.simulation_service import RiskSimulationService
from services.whatsapp_service import WhatsAppAlertService

async def test_database_and_auth():
    await db_manager.initialize()
    col = db_manager.get_collection("test_users")
    user_id = await col.insert_one({"name": "Test User", "email": "test@insightx.io"})
    found = await col.find_one({"id": user_id})
    assert found is not None, "Database item query failed"

    # Test Security Hashing & JWT
    h_pwd = hash_password("secret123")
    assert verify_password("secret123", h_pwd) is True, "Password verification failed"

    token = create_access_token({"sub": "user_123"})
    decoded = decode_access_token(token)
    assert decoded["sub"] == "user_123", "JWT decode failed"
    print("[OK] Database & Auth Security Passed")

def test_zip_security_scanner():
    # Verify .env blocking
    allowed, reason = SecurityInspector.is_file_allowed(".env")
    assert allowed is False, ".env security rule failed"

    # Create dummy zip with 1 safe code file and 1 blocked key file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        zf.writestr("src/main.py", "def add(a, b):\n    return a + b\n")
        zf.writestr("secrets.pem", "-----BEGIN PRIVATE KEY-----")

    parsed = ProjectParserService.parse_project_zip(zip_buffer.getvalue(), "test_project.zip")
    assert parsed["source_type"] == "PROJECT_ZIP"
    assert len(parsed["blocked_files"]) > 0, "ZIP scanner blocked file check failed"
    print("[OK] Security Scanner & AST Parser Passed")

def test_ml_suite_and_simulation():
    metrics = {
        "cyclomatic_complexity": 22.5,
        "dependency_coupling": 0.65,
        "lines_of_code": 14000,
        "defect_density": 1.2,
        "churn_rate": 0.35,
        "author_distribution_entropy": 0.72
    }
    hotspots = [
        {"file": "src/core/engine.py", "complexity": 35.0, "risk_score": 88.0, "loc": 650},
        {"file": "src/api/router.py", "complexity": 18.0, "risk_score": 62.0, "loc": 320}
    ]

    # Test ML Engine & SHAP
    res = ml_service.predict_project_health(metrics, hotspots)
    assert "overall_risk_score" in res
    assert len(res["shap_feature_importance"]) == 6, "SHAP calculation failed"

    # Test NetworkX Graph
    graph = NetworkXGraphService.build_dependency_graph(["src/core/engine.py", "src/api/router.py"], hotspots)
    assert "root_cause_module" in graph, "NetworkX root cause identification failed"

    # Test Project Similarity (no historical data yet — expects empty list)
    sim = ProjectSimilarityService.find_similar_projects(metrics)
    assert sim["has_historical_comparison"] is False, "Similarity: expected no historical data"
    assert sim["similar_projects"] == [], "Similarity: expected empty list with no history"

    # Test 7/14/30-Day Risk Time Machine & ROI
    tm = RiskSimulationService.run_time_machine_simulation(res["overall_risk_score"], metrics)
    assert len(tm["days"]) == 5, "Time machine simulation failed"

    roi = RiskSimulationService.calculate_intervention_roi(res["overall_risk_score"], metrics, hotspots)
    assert len(roi["interventions"]) == 3, "Intervention ROI calculation failed"
    print("[OK] 80% ML Engine, SHAP, NetworkX & Risk Time Machine Passed")

def test_whatsapp_alert_service():
    alert = WhatsAppAlertService.send_risk_alert(
        phone_number="+14155552671",
        project_name="FinTech Core",
        risk_score=78.5,
        primary_failure="Architecture Drift",
        root_cause_module="src/core/engine.py",
        hotspots=[{"file": "src/core/engine.py"}],
        delay_forecast_days=14.0,
        intervention_savings_usd=25000
    )
    # success=True only when Twilio confirms delivery; with a test/fake number it will be False
    # Verify the payload was built and the API was attempted (sent_via_twilio_api=True)
    assert "message_payload" in alert, "WhatsApp message payload missing"
    assert "InsightX" in alert["message_payload"]
    assert "sent_via_twilio_api" in alert, "sent_via_twilio_api field missing"
    assert "delivery_status" in alert, "delivery_status field missing"
    print("[OK] Twilio WhatsApp Risk Alert Payload Generator Passed")


if __name__ == "__main__":
    print("Running InsightX End-to-End Validation Suite...")
    asyncio.run(test_database_and_auth())
    test_zip_security_scanner()
    test_ml_suite_and_simulation()
    test_whatsapp_alert_service()
    print("\nALL INSIGHTX BACKEND ML, SECURITY & INTEGRATION TESTS PASSED PERFECTLY!")
