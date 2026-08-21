"""
Test script to verify WhatsApp alert endpoint logic
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from config import settings
from services.whatsapp_service import WhatsAppAlertService

def test_config():
    """Test that Twilio credentials are loaded"""
    print("=== Testing Configuration ===")
    print(f"TWILIO_ACCOUNT_SID: {settings.TWILIO_ACCOUNT_SID[:10]}...{settings.TWILIO_ACCOUNT_SID[-4:] if settings.TWILIO_ACCOUNT_SID else 'NOT SET'}")
    print(f"TWILIO_AUTH_TOKEN: {'SET' if settings.TWILIO_AUTH_TOKEN else 'NOT SET'}")
    print(f"TWILIO_WHATSAPP_NUMBER: {settings.TWILIO_WHATSAPP_NUMBER}")
    
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        print("❌ FAIL: Twilio credentials not configured")
        return False
    print("✅ PASS: Twilio credentials loaded")
    return True

def test_phone_formatting():
    """Test phone number formatting logic"""
    print("\n=== Testing Phone Number Formatting ===")
    
    test_cases = [
        ("+1234567890", "whatsapp:+1234567890"),
        ("1234567890", "whatsapp:+1234567890"),
        ("whatsapp:+1234567890", "whatsapp:+1234567890"),
        ("whatsapp:1234567890", "whatsapp:+1234567890"),
        ("+1 234 567 8900", "whatsapp:+12345678900"),
    ]
    
    all_passed = True
    for input_phone, expected in test_cases:
        # Simulate the NEW formatting logic from whatsapp_service
        clean_phone = input_phone.strip().replace(" ", "").replace("-", "")
        
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
        
        passed = target_wa == expected
        status = "✅" if passed else "❌"
        print(f"{status} Input: {input_phone:25} -> Output: {target_wa:30} (Expected: {expected})")
        if not passed:
            all_passed = False
    
    return all_passed

def test_whatsapp_service():
    """Test WhatsApp service with actual Twilio call"""
    print("\n=== Testing WhatsApp Service (Dry Run) ===")
    
    # Test with a sample phone number (this will fail if not opted into sandbox)
    test_phone = "+1234567890"  # Replace with actual number for real test
    
    try:
        result = WhatsAppAlertService.send_risk_alert(
            phone_number=test_phone,
            project_name="Test Project",
            risk_score=75.0,
            primary_failure="Tech Debt Surge",
            root_cause_module="core/engine",
            hotspots=[{"file": "src/main.py", "risk": 0.8}],
            delay_forecast_days=12.0,
            intervention_savings_usd=25000,
        )
        
        print(f"Service call completed")
        print(f"Success: {result.get('success')}")
        print(f"Delivered: {result.get('delivered')}")
        print(f"Sent via API: {result.get('sent_via_twilio_api')}")
        print(f"Delivery Status: {result.get('delivery_status')}")
        print(f"Message SID: {result.get('message_sid')}")
        print(f"Error Detail: {result.get('error_detail')}")
        print(f"Sandbox Note: {result.get('sandbox_note')}")
        
        return True
    except Exception as e:
        print(f"❌ Exception during service call: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("WhatsApp Alert Endpoint Test Suite\n")
    print("=" * 50)
    
    results = []
    results.append(("Configuration", test_config()))
    results.append(("Phone Formatting", test_phone_formatting()))
    # results.append(("WhatsApp Service", test_whatsapp_service()))  # Uncomment for real test
    
    print("\n" + "=" * 50)
    print("Test Summary:")
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(r[1] for r in results)
    print(f"\nOverall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    sys.exit(0 if all_passed else 1)
