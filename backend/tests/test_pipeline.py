import pytest
from app.services.agent_workflow import execute_investigation
from app.services.url_analyzer import analyze_url_string
from app.services.fraud_detector import detect_fraud_indicators, extract_entities
from app.services.risk_engine import calculate_deterministic_risk_score, calculate_confidence_score

def test_obvious_scam_critical():
    """
    Test 1: Obvious Scam (Expect CRITICAL)
    Urgent KYC suspended message with OTP request and fake link.
    """
    scam_msg = (
        "URGENT: Your SBI bank account has been BLOCKED due to pending KYC verification. "
        "Update immediately within 24 hours at http://sbi-kyc-verify.top/login or your account "
        "will be permanently suspended. Share the OTP received to reactivate."
    )
    result = execute_investigation(content=scam_msg, source="SMS")
    
    assert result["risk_level"] == "CRITICAL"
    assert result["risk_score"] >= 76
    assert result["category"] in ["Bank/KYC Fraud", "Phishing"]
    assert len(result["indicators"]) >= 3
    # Verify credential request and threat indicators were detected
    indicator_names = [i["name"] for i in result["indicators"]]
    assert any("Credential" in name for name in indicator_names)
    assert any("Threat" in name or "Urgency" in name for name in indicator_names)
    # Calibrated language check
    assert "definitely a scam" not in result["final_summary"].lower()
    assert "100%" not in result["final_summary"]

def test_legitimate_bank_alert_low():
    """
    Test 2: Legitimate Bank Notification (Expect LOW)
    Normal transaction alert with no credential request or urgent threats.
    """
    legit_msg = (
        "Dear Customer, your A/C ending 4921 has been credited with INR 1,500.00 "
        "on 14-Sep-26 via UPI reference 628192019482. Available balance is INR 24,180.50. "
        "Never share your OTP or PIN with anyone."
    )
    result = execute_investigation(content=legit_msg, source="SMS")
    
    assert result["risk_level"] == "LOW"
    assert result["risk_score"] <= 25
    assert result["category"] in ["Legitimate", "Uncertain"]
    # Check calibrated language
    assert "100% safe" not in result["final_summary"].lower()

def test_ambiguous_payment_medium():
    """
    Test 3: Ambiguous Message (Expect MEDIUM or Uncertain)
    Vague payment reminder without explicit credential traps.
    """
    ambiguous_msg = "Kindly transfer the pending processing fee today so we can proceed with your file."
    result = execute_investigation(content=ambiguous_msg, source="WhatsApp")
    
    assert result["risk_level"] in ["LOW", "MEDIUM"]
    assert result["risk_score"] < 60
    assert result["confidence"] in ["LOW", "MEDIUM"]

def test_fake_domain_url_high():
    """
    Test 4: Fake-Domain URL Analysis (Expect HIGH / HIGH_RISK)
    String inspection without network fetch detects brand spoofing and suspicious TLD.
    """
    fake_url = "http://hdfc-netbanking-portal.top/verify-kyc"
    url_res = analyze_url_string(fake_url)
    
    assert url_res["brand_mismatch_flag"] is True
    assert url_res["spoofed_brand"] == "HDFC"
    assert url_res["is_suspicious_tld"] is True
    assert url_res["safety_verdict"] == "HIGH_RISK"
    assert len(url_res["risk_signals"]) >= 2

def test_content_without_url():
    """
    Test 5: Content with no URL (Should analyze content without error and skip URL step)
    """
    text_only = "Congratulations! You have won a cash prize of Rs 50,000. Pay registration fee immediately."
    result = execute_investigation(content=text_only, source="SMS")
    
    assert result["url_analysis"] is None
    assert result["risk_score"] > 25
    # Confirms url_analysis was skipped gracefully in step_history
    steps = result.get("step_history", [])
    url_step = next((s for s in steps if s["step"] == "url_analysis"), None)
    assert url_step is not None
    assert url_step["status"] == "skipped"

def test_safety_calibrated_language():
    """
    Test 6: Safety policy non-negotiables
    Must never state absolute certainty.
    """
    res_crit = execute_investigation(content="Share your bank OTP and password immediately to prevent arrest.")
    assert "definitely" not in res_crit["final_summary"].lower()
    assert "100%" not in res_crit["final_summary"]

    res_low = execute_investigation(content="Your salary of Rs 60000 has been credited.")
    assert "100% safe" not in res_low["final_summary"].lower()
    assert "completely safe" not in res_low["final_summary"].lower()
